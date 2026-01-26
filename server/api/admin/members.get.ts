/**
 * Get all members
 * GET /api/admin/members
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public?.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Supabase configuration is missing'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get query parameters for pagination
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    // Get all members (exclude password fields) with pagination
    const { data: members, error, count } = await supabase
      .from('members')
      .select('id, email, username, referral_code, member_type, status, bonus_aktif_withdraw_enabled, bonus_pasif_withdraw_enabled, created_at, updated_at, referred_by', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil data members'
      })
    }

    // Get bonus settings once for all members
    const { data: globalBonusSettings } = await supabase
      .from('bonus_settings')
      .select('*')
      .single()

    // Get coin settings once for all members (for coin name and code)
    const { data: globalCoinSettings } = await supabase
      .from('coin_settings')
      .select('coin_name, coin_code')
      .single()

    // Calculate total downline and deposit stats for each member
    const membersWithStats = await Promise.all(
      (members || []).map(async (member) => {
        // Count direct referrals (downline level 1)
        // Try by ID first, then by referral_code
        let downlineCount = 0
        
        // Method 1: Count by referred_by = member.id
        const { count: countById } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', member.id)
        
        if (countById !== null) {
          downlineCount = countById
        } else if (member.referral_code) {
          // Method 2: Count by referred_by = member.referral_code
          const { count: countByCode } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', member.referral_code)
          
          if (countByCode !== null) {
            downlineCount = countByCode
          }
        }
        
        // Calculate total deposit amount (completed deposits only)
        // Total deposit = SUM(amount) dari tabel deposits WHERE member_id = member.id AND status = 'completed'
        let totalBalance = 0
        let totalCoinFromDeposits = 0
        
        // Get completed deposits for this member
        const { data: completedDeposits, error: depositsError } = await supabase
          .from('deposits')
          .select('amount, coin_amount')
          .eq('member_id', member.id)
          .eq('status', 'completed')
        
        if (depositsError) {
          console.error(`Error fetching deposits for member ${member.id}:`, depositsError)
        } else if (completedDeposits && completedDeposits.length > 0) {
          // Calculate total USDT from deposits (sum of amount)
          totalBalance = completedDeposits.reduce((sum, deposit) => {
            const amount = parseFloat(String(deposit.amount || 0)) || 0
            return sum + amount
          }, 0)
          
          // Calculate total coin from deposits (sum of coin_amount)
          totalCoinFromDeposits = completedDeposits.reduce((sum, deposit) => {
            const coinAmount = parseFloat(String(deposit.coin_amount || 0)) || 0
            return sum + coinAmount
          }, 0)
        }
        
        // Calculate total withdraws (completed + pending, exclude rejected)
        let totalWithdraw = 0
        let totalWithdrawCoin = 0 // Total amount_coin dari withdraws
        let totalWithdrawBonusReferral = 0 // Total USDT withdraw dari bonus referral (withdraw_category = 'bonus_referral')
        const memberIdStr = String(member.id || '')
        const { data: allWithdraws, error: withdrawsError } = await supabase
          .from('withdraws')
          .select('id, member_id, amount, amount_coin, status, withdraw_category')
          .eq('member_id', member.id) // Filter langsung di query untuk efisiensi
        
        if (!withdrawsError && allWithdraws) {
          // Filter by status (completed or pending, exclude rejected)
          const validWithdraws = allWithdraws.filter(withdraw => {
            const status = String(withdraw.status || '').toLowerCase().trim()
            return status === 'completed' || status === 'pending'
          })
          
          totalWithdraw = validWithdraws.reduce((sum, withdraw) => {
            const amount = parseFloat(withdraw.amount) || 0
            return sum + amount
          }, 0)
          
          // Calculate total amount_coin from withdraws
          totalWithdrawCoin = validWithdraws.reduce((sum, withdraw) => {
            const coinAmount = parseFloat(withdraw.amount_coin || 0) || 0
            return sum + coinAmount
          }, 0)
          
          // Calculate total withdraw USDT dari bonus referral (withdraw_category = 'bonus_referral')
          totalWithdrawBonusReferral = validWithdraws
            .filter(withdraw => {
              const category = String(withdraw.withdraw_category || '').toLowerCase().trim()
              return category === 'bonus_referral'
            })
            .reduce((sum, withdraw) => {
              const amount = parseFloat(withdraw.amount) || 0
              return sum + amount
            }, 0)
        }
        
        // Get coin price for conversion (needed before calculating referral bonus coin)
        const { data: coinSettings } = await supabase
          .from('coin_settings')
          .select('coin_name, coin_code, normal_price_usdt, vip_price_usdt, leader_price_usdt')
          .single()
        
        let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
        if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
        } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
        }
        
        // Calculate referral bonus USDT (80%) and Coin (20%)
        let referralBonusUsdt = 0
        let referralBonusCoin = 0
        let totalReferralBonus = 0
        if (downlineCount > 0) {
          // Get bonus settings
          const bonusSetting = globalBonusSettings
          
          const referralPercentage = bonusSetting?.referral_percentage || 15.00
          const referralBalancePercentage = bonusSetting?.referral_balance_percentage || 80.00
          const referralCoinPercentage = bonusSetting?.referral_coin_percentage || 20.00
          
          // Get all downline IDs
          const { data: downlines } = await supabase
            .from('members')
            .select('id')
            .eq('referred_by', member.id)
          
          if (downlines && downlines.length > 0) {
            const downlineIds = downlines.map(d => d.id)
            
            // Get all completed deposits from downlines
            const { data: downlineDeposits } = await supabase
              .from('deposits')
              .select('amount')
              .in('member_id', downlineIds)
              .eq('status', 'completed')
            
            if (downlineDeposits && downlineDeposits.length > 0) {
              // Calculate total referral bonus (15% dari total deposit downline)
              totalReferralBonus = downlineDeposits.reduce((sum, deposit) => {
                const depositAmount = parseFloat(deposit.amount) || 0
                return sum + (depositAmount * referralPercentage / 100)
              }, 0)
              
              // Calculate USDT portion (80%)
              referralBonusUsdt = totalReferralBonus * (referralBalancePercentage / 100)
              
              // Calculate Coin portion (20%)
              const referralBonusCoinUsdt = totalReferralBonus * (referralCoinPercentage / 100)
              referralBonusCoin = pricePerCoin > 0 ? referralBonusCoinUsdt / pricePerCoin : 0
            }
          }
        }

        // --- MATCHING BONUS CALCULATION (Added for Total Coin Balance) ---
        // Calculate matching bonus for this member to add to coin balance
        let matchingBonusCoin = 0
        let matchingBonusUsdt = 0
        let matchingBonusLevel1 = 0
        let matchingBonusLevel2 = 0
        let matchingBonusLevel3 = 0
        
        // Get percentages from global settings
        const bonusSettingsFull = globalBonusSettings
          
        if (bonusSettingsFull) {
            const level1Pct = parseFloat(bonusSettingsFull.matching_level1_percentage || 10)
            const level2Pct = parseFloat(bonusSettingsFull.matching_level2_percentage || 5)
            const level3Pct = parseFloat(bonusSettingsFull.matching_level3_percentage || 3)
            
            const matchingLevels = [
              { level: 1, percentage: level1Pct },
              { level: 2, percentage: level2Pct },
              { level: 3, percentage: level3Pct }
            ]
            
            // We need downlines structure. We already have direct downlines (Level 1)
            // But for matching we need up to Level 4 downlines
            
            // This is recursive and might be slow for listing all members. 
            // Simplified approach: Only calculate if necessary or acceptable perf.
            // Given the requirement, we must calculate it.
            
            // Get Level 1 Downline IDs (already have this if downlineCount > 0)
            const { data: dl1 } = await supabase.from('members').select('id').eq('referred_by', member.id)
            let currentIds = (dl1 || []).map(d => d.id)
            
            let totalMatchingBonus = 0
            
            for (const level of matchingLevels) {
                if (currentIds.length === 0) break
                
                // Get next level downlines
                const { data: nextLevelMembers } = await supabase
                    .from('members')
                    .select('id')
                    .in('referred_by', currentIds)
                
                const nextIds = (nextLevelMembers || []).map(m => m.id)
                
                if (nextIds.length > 0) {
                    // Calculate deposits for this level
                    const { data: levelDeposits } = await supabase
                        .from('deposits')
                        .select('amount')
                        .in('member_id', nextIds)
                        .eq('status', 'completed')
                        
                    if (levelDeposits && levelDeposits.length > 0) {
                        const levelDepositSum = levelDeposits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
                        const levelBonus = levelDepositSum * (level.percentage / 100)
                        totalMatchingBonus += levelBonus
                        
                        // Store per level bonus
                        if (level.level === 1) {
                            matchingBonusLevel1 = levelBonus
                        } else if (level.level === 2) {
                            matchingBonusLevel2 = levelBonus
                        } else if (level.level === 3) {
                            matchingBonusLevel3 = levelBonus
                        }
                    }
                }
                
                currentIds = nextIds
            }
            
            // Calculate Coin Allocation for Matching Bonus (20%)
            const referralCoinPct = parseFloat(bonusSettingsFull.referral_coin_percentage || 20)
            const matchingCoinUsdt = totalMatchingBonus * (referralCoinPct / 100)
            matchingBonusCoin = pricePerCoin > 0 ? matchingCoinUsdt / pricePerCoin : 0
            
            // Calculate USDT Allocation for Matching Bonus (80%)
            const referralBalancePct = parseFloat(bonusSettingsFull.referral_balance_percentage || 80)
            matchingBonusUsdt = totalMatchingBonus * (referralBalancePct / 100)
        }
        
        // Saldo Coin = Coin dari deposit + bonus coin referral (20%) + bonus coin matching (20%)
        // Total coin = coin dari deposit + bonus coin
        const totalCoinWithBonus = totalCoinFromDeposits + referralBonusCoin + matchingBonusCoin
        
        // Total Balance = Hanya alokasi bonus referral USDT (80%) + Matching Bonus USDT (80%)
        // Bukan termasuk deposit member sendiri
        const totalBalanceValue = referralBonusUsdt + matchingBonusUsdt
        
        // Rumus: Remaining Balance USDT = Total Balance - withdraw (pending + completed)
        // Rejected withdraw TIDAK dihitung
        const remainingBalance = Math.max(0, totalBalanceValue - totalWithdraw)
        
        // Saldo Coin = Total Coin (coin dari deposit + bonus coin)
        let coinBalance = totalCoinWithBonus
        
        // Jika ingin menghitung dari remaining balance juga bisa:
        // if (coinSettings && remainingBalance > 0 && pricePerCoin > 0) {
        //   coinBalance = remainingBalance / pricePerCoin
        // }
        
        // Get member_coins data (staked coins, available coins)
        const { data: memberCoinsArray, error: coinsError } = await supabase
          .from('member_coins')
          .select('staked_coins, available_coins')
          .eq('member_id', member.id)
        
        const memberCoins = memberCoinsArray && memberCoinsArray.length > 0 ? memberCoinsArray[0] : null
        const stakedCoins = memberCoins?.staked_coins ? parseFloat(String(memberCoins.staked_coins)) : 0
        const availableCoins = memberCoins?.available_coins ? parseFloat(String(memberCoins.available_coins)) : 0
        
        // Calculate total coin yang di-staking (dari staking table dengan status active)
        let totalStakingCoin = 0
        const { data: activeStakings } = await supabase
          .from('staking')
          .select('coin_amount')
          .eq('member_id', member.id)
          .eq('status', 'active')
        
        if (activeStakings && activeStakings.length > 0) {
          totalStakingCoin = activeStakings.reduce((sum, staking) => {
            return sum + (parseFloat(String(staking.coin_amount || 0)) || 0)
          }, 0)
        }
        
        // Calculate total coin yang di-staking multiplier (dari bonus_multiplier_staking dengan status active)
        let totalStakingMultiplierCoin = 0
        const { data: activeMultiplierStakings } = await supabase
          .from('bonus_multiplier_staking')
          .select('coin_amount')
          .eq('member_id', member.id)
          .eq('status', 'active')
        
        if (activeMultiplierStakings && activeMultiplierStakings.length > 0) {
          totalStakingMultiplierCoin = activeMultiplierStakings.reduce((sum, staking) => {
            return sum + (parseFloat(String(staking.coin_amount || 0)) || 0)
          }, 0)
        }
        
        // Check if member has active staking
        const { count: activeStakingCount } = await supabase
          .from('staking')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .eq('status', 'active')
        
        // Calculate total reward from staking (paid rewards only)
        let totalStakingRewardPaid = 0
        const { data: memberStakings } = await supabase
          .from('staking')
          .select('id')
          .eq('member_id', member.id)
        
        if (memberStakings && memberStakings.length > 0) {
          const stakingIds = memberStakings.map(s => s.id)
          
          // Get all paid reward schedules from staking
          const { data: paidRewardSchedules } = await supabase
            .from('reward_schedules')
            .select('reward_amount')
            .in('staking_id', stakingIds)
            .eq('status', 'paid')
          
          if (paidRewardSchedules && paidRewardSchedules.length > 0) {
            totalStakingRewardPaid = paidRewardSchedules.reduce((sum, schedule) => {
              const amount = parseFloat(String(schedule.reward_amount || 0)) || 0
              return sum + amount
            }, 0)
          }
        }
        
        // Calculate total reward from staking multiplier (paid rewards only)
        // Dari tabel bonus_multiplier_schedules dengan status = 'paid'
        let totalStakingMultiplierRewardPaid = 0
        const { data: paidMultiplierSchedules } = await supabase
          .from('bonus_multiplier_schedules')
          .select('reward_amount')
          .eq('member_id', member.id)
          .eq('status', 'paid')
        
        if (paidMultiplierSchedules && paidMultiplierSchedules.length > 0) {
          totalStakingMultiplierRewardPaid = paidMultiplierSchedules.reduce((sum, schedule) => {
            const amount = parseFloat(String(schedule.reward_amount || 0)) || 0
            return sum + amount
          }, 0)
        }
        
        // Calculate loyalty bonus from reward_history
        // Get loyalty bonus from reward_history where bonus_type = 'loyalty'
        let loyaltyBonusUsdt = 0
        const { data: loyaltyRewards, error: loyaltyError } = await supabase
          .from('reward_history')
          .select('reward_amount')
          .eq('member_id', member.id)
          .eq('bonus_type', 'loyalty')
          .eq('status', 'paid')
        
        if (loyaltyError) {
          console.error(`Error fetching loyalty rewards for member ${member.id}:`, loyaltyError)
        }
        
        if (loyaltyRewards && loyaltyRewards.length > 0) {
          loyaltyBonusUsdt = loyaltyRewards.reduce((sum, reward) => {
            return sum + (parseFloat(reward.reward_amount || 0) || 0)
          }, 0)
        }
        
        // Convert loyalty bonus from USDT to Coin
        let loyaltyBonusCoin = pricePerCoin > 0 ? loyaltyBonusUsdt / pricePerCoin : 0
        
        // If no data in reward_history, calculate directly from multiplier rewards (fallback)
        if (loyaltyBonusCoin === 0) {
          // Get bonus settings for loyalty percentages
          const { data: bonusSettings } = await supabase
            .from('bonus_settings')
            .select('loyalty_percentage_level0, loyalty_percentage_level1, loyalty_percentage_level2')
            .single()
          
          const loyaltyLevel0 = parseFloat(bonusSettings?.loyalty_percentage_level0) || 10.00
          const loyaltyLevel1 = parseFloat(bonusSettings?.loyalty_percentage_level1) || 10.00
          const loyaltyLevel2 = parseFloat(bonusSettings?.loyalty_percentage_level2) || 0.50
          
          // Get all members for referral tree
          const { data: allMembers } = await supabase
            .from('members')
            .select('id, referred_by, referral_code')
            .order('created_at', { ascending: false })
          
          // Build referral tree
          const referralTree = new Map()
          if (allMembers) {
            for (const m of allMembers) {
              if (!referralTree.has(m.id)) {
                referralTree.set(m.id, [])
              }
              if (m.referred_by) {
                const referrer = allMembers.find(r => 
                  r.id === m.referred_by || r.referral_code === m.referred_by
                )
                if (referrer) {
                  const referrerId = referrer.id
                  if (!referralTree.has(referrerId)) {
                    referralTree.set(referrerId, [])
                  }
                  referralTree.get(referrerId).push(m.id)
                }
              }
            }
          }
          
          // Get all paid multiplier rewards
          const { data: allMultiplierRewards } = await supabase
            .from('bonus_multiplier_schedules')
            .select('member_id, reward_amount')
            .eq('status', 'paid')
          
          // Group multiplier rewards by member_id
          const memberTotalMultiplierReward = new Map()
          if (allMultiplierRewards) {
            for (const reward of allMultiplierRewards) {
              const current = memberTotalMultiplierReward.get(reward.member_id) || 0
              memberTotalMultiplierReward.set(reward.member_id, current + (parseFloat(reward.reward_amount || 0) || 0))
            }
          }
          
          // Function to get downlines at specific level
          const getDownlinesAtLevel = (memberId, targetLevel) => {
            if (targetLevel === 0) {
              return referralTree.get(memberId) || []
            }
            let currentLevel = 0
            let currentDownlines = referralTree.get(memberId) || []
            while (currentLevel < targetLevel && currentDownlines.length > 0) {
              const nextLevelDownlines = []
              for (const downlineId of currentDownlines) {
                const subDownlines = referralTree.get(downlineId) || []
                nextLevelDownlines.push(...subDownlines)
              }
              currentDownlines = nextLevelDownlines
              currentLevel++
            }
            return currentLevel === targetLevel ? currentDownlines : []
          }
          
          // Calculate loyalty bonus from downline multiplier rewards
          let totalLoyaltyBonusUsdt = 0
          
          // Level 0: Direct referrals (10%)
          const level0Downlines = getDownlinesAtLevel(member.id, 0)
          for (const downlineId of level0Downlines) {
            const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
            const loyaltyBonus = (downlineReward * loyaltyLevel0) / 100
            totalLoyaltyBonusUsdt += loyaltyBonus
          }
          
          // Level 1: Referrals dari level 0 (10%)
          const level1Downlines = getDownlinesAtLevel(member.id, 1)
          for (const downlineId of level1Downlines) {
            const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
            const loyaltyBonus = (downlineReward * loyaltyLevel1) / 100
            totalLoyaltyBonusUsdt += loyaltyBonus
          }
          
          // Level 2: Referrals dari level 1 (0.5%)
          const level2Downlines = getDownlinesAtLevel(member.id, 2)
          for (const downlineId of level2Downlines) {
            const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
            const loyaltyBonus = (downlineReward * loyaltyLevel2) / 100
            totalLoyaltyBonusUsdt += loyaltyBonus
          }
          
          // Level 3+: Referrals dari level 2+ (0.5%)
          let currentLevel = 3
          let maxLevel = 20
          while (currentLevel <= maxLevel) {
            const levelDownlines = getDownlinesAtLevel(member.id, currentLevel)
            if (levelDownlines.length === 0) {
              break
            }
            for (const downlineId of levelDownlines) {
              const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
              const loyaltyBonus = (downlineReward * loyaltyLevel2) / 100
              totalLoyaltyBonusUsdt += loyaltyBonus
            }
            currentLevel++
          }
          
          // Convert to coin
          loyaltyBonusCoin = pricePerCoin > 0 ? totalLoyaltyBonusUsdt / pricePerCoin : 0
          
          if (totalLoyaltyBonusUsdt > 0) {
            console.log(`Member ${member.username}: Calculated loyalty from multiplier rewards, USDT: ${totalLoyaltyBonusUsdt}, Coin: ${loyaltyBonusCoin}`)
          }
        }
        
        const loyaltyBonus = loyaltyBonusCoin
        
        // Debug logging
        if (loyaltyRewards && loyaltyRewards.length > 0) {
          console.log(`Member ${member.username} (${member.id}): Found ${loyaltyRewards.length} loyalty rewards, Total USDT: ${loyaltyBonusUsdt}, Total Coin: ${loyaltyBonusCoin}, PricePerCoin: ${pricePerCoin}`)
        }
        
        // Total Coin Pasif = referral bonus coin (20%) + matching bonus coin (20%) + loyalty bonus
        const totalCoinPasif = referralBonusCoin + matchingBonusCoin + loyaltyBonusCoin
        
        // Total Coin Aktif = staking reward paid (USDT) + staking multiplier reward paid (USDT) dikonversi ke coin
        // totalStakingRewardPaid dan totalStakingMultiplierRewardPaid sudah dalam USDT
        const totalCoinAktif = pricePerCoin > 0 
          ? (totalStakingRewardPaid / pricePerCoin) + (totalStakingMultiplierRewardPaid / pricePerCoin)
          : 0
        
        // Total Coin Member = coin depo + total coin pasif + total coin aktif
        const totalCoinMember = totalCoinFromDeposits + totalCoinPasif + totalCoinAktif
        
        return {
          ...member,
          total_downline: downlineCount || 0,
          total_deposit_usdt: totalBalance, // Total Deposit USDT = SUM(amount) dari tabel deposits WHERE member_id = member.id AND status = 'completed'
          referral_bonus_usdt: referralBonusUsdt, // Bonus Referral USDT (80% dari total referral bonus)
          referral_bonus_coin: referralBonusCoin, // Bonus Referral Coin (20% dari total referral bonus)
          matching_bonus_usdt: matchingBonusUsdt, // Bonus Matching USDT (80% dari total matching bonus)
          matching_bonus_coin: matchingBonusCoin, // Bonus Matching Coin (20% dari total matching bonus)
          total_balance: totalBalanceValue, // Total Balance Bonus = Hanya alokasi bonus referral USDT (80%) + Matching Bonus USDT (80%) - BUKAN dari deposit
          total_withdraw: totalWithdraw, // Total withdraw (completed + pending, exclude rejected)
          remaining_balance: remainingBalance, // Balance USDT = Total Balance Bonus - Withdraw (balance dari bonus saja, BUKAN dari deposit)
          total_coin_from_deposits: totalCoinFromDeposits, // Total Coin Deposit = SUM(coin_amount) dari tabel deposits WHERE member_id = member.id AND status = 'completed'
          coin_balance: coinBalance, // Saldo Coin = Total Coin (coin dari deposit + bonus coin)
          staked_coins: stakedCoins, // Coin yang di-stake
          active_staking_count: activeStakingCount || 0, // Jumlah active staking
          matching_bonus_level1: matchingBonusLevel1 || 0, // Matching bonus level 1
          matching_bonus_level2: matchingBonusLevel2 || 0, // Matching bonus level 2
          matching_bonus_level3: matchingBonusLevel3 || 0, // Matching bonus level 3
          total_matching_bonus: matchingBonusLevel1 + matchingBonusLevel2 + matchingBonusLevel3, // Total matching bonus
          staking_reward_paid: totalStakingRewardPaid, // Total reward dari staking yang sudah paid
          staking_multiplier_reward_paid: totalStakingMultiplierRewardPaid, // Total reward dari staking multiplier yang sudah paid
          loyalty_bonus: loyaltyBonus, // Total bonus loyalty dari reward_history
          total_staking_coin: totalStakingCoin, // Total coin yang di-staking (dari staking table dengan status active)
          total_staking_multiplier_coin: totalStakingMultiplierCoin, // Total coin yang di-staking multiplier (dari bonus_multiplier_staking dengan status active)
          free_coins: availableCoins, // Coin yang free/available (dari member_coins.available_coins) - lebih akurat dari perhitungan manual
          total_coin_member: totalCoinMember, // Total coin member = coin depo + total coin pasif + total coin aktif
          total_coin_pasif: totalCoinPasif, // Total coin pasif = referral bonus coin + matching bonus coin + loyalty bonus
          total_coin_aktif: totalCoinAktif, // Total coin aktif = (staking reward paid + staking multiplier reward paid) dikonversi ke coin
          withdraw_coin: totalWithdrawCoin, // Total coin yang sudah di-withdraw (SUM amount_coin dari tabel withdraws WHERE member_id = member.id AND status IN ('completed', 'pending'))
          convert_withdraw_usdt: totalWithdraw, // Total USDT dari withdraw (SUM amount dari tabel withdraws WHERE member_id = member.id AND status IN ('completed', 'pending'))
          withdraw_bonus_referral_usdt: totalWithdrawBonusReferral // Total USDT withdraw dari bonus referral (SUM amount dari tabel withdraws WHERE member_id = member.id AND withdraw_category = 'bonus_referral' AND status IN ('completed', 'pending'))
        }
      })
    )

    return {
      success: true,
      data: membersWithStats || [],
      count: count || 0,
      limit,
      offset,
      coin_info: {
        coin_name: globalCoinSettings?.coin_name || 'MyCoin',
        coin_code: globalCoinSettings?.coin_code || 'COIN',
        normal_price_usdt: parseFloat(globalCoinSettings?.normal_price_usdt) || 0.5,
        vip_price_usdt: parseFloat(globalCoinSettings?.vip_price_usdt) || 0.5,
        leader_price_usdt: parseFloat(globalCoinSettings?.leader_price_usdt) || 0.5
      }
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil data members'
    })
  }
})
