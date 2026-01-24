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
        // Get ALL deposits first, then filter by member_id and status
        // This ensures we catch all deposits regardless of type mismatches
        type DepositRow = { id: string; member_id: string; amount: number | string; coin_amount?: number | string; status: string }
        let completedDeposits: DepositRow[] = []
        let allMemberDeposits: DepositRow[] = []
        let depositsError = null
        
        // Get ALL deposits from database (we'll filter in JavaScript)
        const { data: allDeposits, error: allDepositsError } = await supabase
          .from('deposits')
          .select('id, member_id, amount, coin_amount, status')
        
        if (allDepositsError) {
          depositsError = allDepositsError
          console.error(`Error fetching all deposits:`, allDepositsError)
        } else if (allDeposits) {
          // Filter by member_id (handle type conversion - UUID vs string)
          const memberIdStr = String(member.id || '')
          allMemberDeposits = allDeposits.filter(deposit => {
            const depositMemberId = String(deposit.member_id || '')
            const matches = depositMemberId === memberIdStr || 
                           depositMemberId === member.id ||
                           deposit.member_id === member.id
            return matches
          })
          
          // Filter by completed status (case insensitive, handle both "completed" and "selesai")
          completedDeposits = allMemberDeposits.filter(deposit => {
            const status = String(deposit.status || '').toLowerCase().trim()
            return status === 'completed' || status === 'selesai'
          })
        }
        
        let totalBalance = 0
        let totalCoinFromDeposits = 0
        
        if (depositsError) {
          console.error(`Error fetching deposits for member ${member.id}:`, depositsError)
        }
        
        if (!depositsError) {
          if (completedDeposits && completedDeposits.length > 0) {
            totalBalance = completedDeposits.reduce((sum, deposit) => {
              const amount = parseFloat(String(deposit.amount || 0)) || 0
              return sum + amount
            }, 0)
            
            totalCoinFromDeposits = completedDeposits.reduce((sum, deposit) => {
              const coinAmount = parseFloat(String(deposit.coin_amount || 0)) || 0
              return sum + coinAmount
            }, 0)
          }
        } else if (depositsError) {
          console.error(`Error fetching deposits for member ${member.id}:`, depositsError)
        }
        
        // Calculate total withdraws (completed + pending, exclude rejected)
        let totalWithdraw = 0
        const memberIdStr = String(member.id || '')
        const { data: allWithdraws, error: withdrawsError } = await supabase
          .from('withdraws')
          .select('id, member_id, amount, status')
        
        if (!withdrawsError && allWithdraws) {
          // Filter by member_id and status (completed or pending, exclude rejected)
          const validWithdraws = allWithdraws.filter(withdraw => {
            const withdrawMemberId = String(withdraw.member_id || '')
            const matches = withdrawMemberId === memberIdStr || 
                           withdrawMemberId === member.id ||
                           withdraw.member_id === member.id
            if (!matches) return false
            
            const status = String(withdraw.status || '').toLowerCase().trim()
            return status === 'completed' || status === 'pending'
          })
          
          totalWithdraw = validWithdraws.reduce((sum, withdraw) => {
            const amount = parseFloat(withdraw.amount) || 0
            return sum + amount
          }, 0)
        }
        
        // Get coin price for conversion (needed before calculating referral bonus coin)
        const { data: coinSettings } = await supabase
          .from('coin_settings')
          .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
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
                        totalMatchingBonus += levelDepositSum * (level.percentage / 100)
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
        
        // Get member_coins data (staked coins)
        const { data: memberCoinsArray, error: coinsError } = await supabase
          .from('member_coins')
          .select('staked_coins')
          .eq('member_id', member.id)
        
        const memberCoins = memberCoinsArray && memberCoinsArray.length > 0 ? memberCoinsArray[0] : null
        const stakedCoins = memberCoins?.staked_coins ? parseFloat(String(memberCoins.staked_coins)) : 0
        
        // Check if member has active staking
        const { count: activeStakingCount } = await supabase
          .from('staking')
          .select('*', { count: 'exact', head: true })
          .eq('member_id', member.id)
          .eq('status', 'active')
        
        return {
          ...member,
          total_downline: downlineCount || 0,
          total_balance: totalBalanceValue, // Total Balance = Hanya alokasi bonus referral USDT (80%)
          total_withdraw: totalWithdraw, // Total withdraw (completed + pending, exclude rejected)
          remaining_balance: remainingBalance, // Remaining Balance = Total Balance - Withdraw
          total_coin_from_deposits: totalCoinFromDeposits, // Total Coin Deposit = Hanya coin dari deposit (TIDAK termasuk bonus referral)
          coin_balance: coinBalance, // Saldo Coin = Total Coin (coin dari deposit + bonus coin)
          staked_coins: stakedCoins, // Coin yang di-stake
          active_staking_count: activeStakingCount || 0 // Jumlah active staking
        }
      })
    )

    return {
      success: true,
      data: membersWithStats || [],
      count: count || 0,
      limit,
      offset
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
