/**
 * Get bonus aktif report (Referral bonus) - Grouped by member
 * GET /api/admin/bonus-active-report
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
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

    // Get all members who received bonus (from bonus deposits)
    // Include referral_bonus and matching_bonus_level1, level2, level3
    let { data: bonusDeposits, error: bonusError } = await supabase
      .from('deposits')
      .select('id, member_id, amount, created_at, payment_method')
      .eq('status', 'completed')
      .in('payment_method', ['referral_bonus', 'matching_bonus_level1', 'matching_bonus_level2', 'matching_bonus_level3'])
      .order('created_at', { ascending: false })

    // If no results, try case-insensitive
    if ((!bonusDeposits || bonusDeposits.length === 0) && !bonusError) {
      const { data: allCompletedDeposits } = await supabase
        .from('deposits')
        .select('id, member_id, amount, created_at, payment_method')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
      
      bonusDeposits = (allCompletedDeposits || []).filter(dep => 
        dep.payment_method && (
          dep.payment_method.toLowerCase().includes('referral_bonus') || 
          dep.payment_method.toLowerCase().includes('referral bonus') ||
          dep.payment_method.toLowerCase().includes('matching_bonus') ||
          dep.payment_method.toLowerCase().includes('matching bonus')
        )
      )
    }

    if (bonusError) {
      console.error('Error fetching bonus deposits:', bonusError)
      // Don't throw error, just log it and continue with empty array
      bonusDeposits = []
    }

    console.log(`Found ${bonusDeposits?.length || 0} bonus deposits`)

    // Get bonus settings for referral percentage and matching bonus
    const { data: bonusSettings, error: bonusSettingsError } = await supabase
      .from('bonus_settings')
      .select('referral_percentage, referral_balance_percentage, referral_coin_percentage, matching_level1_percentage, matching_level2_percentage, matching_level3_percentage')
      .single()

    if (bonusSettingsError) {
      console.error('Error fetching bonus settings:', bonusSettingsError)
    }

    const referralPercentage = parseFloat(bonusSettings?.referral_percentage) || 15.00
    const referralBalancePercentage = parseFloat(bonusSettings?.referral_balance_percentage) || 80.00
    const referralCoinPercentage = parseFloat(bonusSettings?.referral_coin_percentage) || 20.00
    const matchingLevel1Percentage = parseFloat(bonusSettings?.matching_level1_percentage) || 10.00
    const matchingLevel2Percentage = parseFloat(bonusSettings?.matching_level2_percentage) || 5.00
    const matchingLevel3Percentage = parseFloat(bonusSettings?.matching_level3_percentage) || 2.00

    // Get coin settings for conversion
    const { data: coinSettings, error: coinSettingsError } = await supabase
      .from('coin_settings')
      .select('coin_name, coin_code, normal_price_usdt, vip_price_usdt, leader_price_usdt')
      .single()

    if (coinSettingsError) {
      console.error('Error fetching coin settings:', coinSettingsError)
    }

    // Get all members
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('id, email, username, member_type, referral_code, created_at')
      .order('created_at', { ascending: false })

    if (membersError) {
      throw createError({
        statusCode: 500,
        statusMessage: membersError.message || 'Failed to fetch members'
      })
    }

    // Create a map for quick member lookup
    const memberMap = new Map()
    if (allMembers) {
      for (const member of allMembers) {
        memberMap.set(member.id, member)
      }
    }

    // Get all deposits to calculate balance
    const { data: allDeposits, error: depositsError } = await supabase
      .from('deposits')
      .select('id, member_id, amount, status')
      .eq('status', 'completed')

    if (depositsError) {
      console.error('Error fetching deposits:', depositsError)
    }

    // Get all withdraws to calculate balance
    const { data: allWithdraws, error: withdrawsError } = await supabase
      .from('withdraws')
      .select('id, member_id, amount, status')
      .in('status', ['completed', 'pending'])

    if (withdrawsError) {
      console.error('Error fetching withdraws:', withdrawsError)
    }

    // Group bonus by member and calculate balance
    const memberBonusMap = new Map()

    // Initialize all members with zero bonus and calculate balance
    if (allMembers) {
      for (const member of allMembers) {
        // Calculate total balance: deposit completed - withdraw (completed + pending)
        // Note: bonus balance will be added later
        const memberDeposits = (allDeposits || []).filter(dep => 
          String(dep.member_id) === String(member.id) && dep.status === 'completed'
        )
        const totalDeposit = memberDeposits.reduce((sum, dep) => sum + parseFloat(dep.amount || 0), 0)

        const memberWithdraws = (allWithdraws || []).filter(wd => 
          String(wd.member_id) === String(member.id) && (wd.status === 'completed' || wd.status === 'pending')
        )
        const totalWithdraw = memberWithdraws.reduce((sum, wd) => sum + parseFloat(wd.amount || 0), 0)

        // Initial balance without bonus (bonus will be added later)
        const baseBalance = Math.max(0, totalDeposit - totalWithdraw)

        memberBonusMap.set(member.id, {
          member_id: member.id,
          member: member,
          total_deposit: totalDeposit, // Total deposit (completed)
          total_withdraw: totalWithdraw, // Total withdraw (pending + completed)
          total_balance: baseBalance, // Will be updated with bonus later
          total_bonus: 0, // Total referral bonus
          total_bonus_balance: 0, // Total referral bonus to balance (USDT 80%)
          total_bonus_coin: 0, // Total referral bonus to coin (Coin 20%)
          total_matching_level1: 0, // Total matching bonus level 1
          total_matching_level1_balance: 0, // Matching bonus level 1 to balance (USDT 80%)
          total_matching_level1_coin: 0, // Matching bonus level 1 to coin (Coin 20%)
          total_matching_level2: 0, // Total matching bonus level 2
          total_matching_level2_balance: 0, // Matching bonus level 2 to balance (USDT 80%)
          total_matching_level2_coin: 0, // Matching bonus level 2 to coin (Coin 20%)
          total_matching_level3: 0, // Total matching bonus level 3
          total_matching_level3_balance: 0, // Matching bonus level 3 to balance (USDT 80%)
          total_matching_level3_coin: 0, // Matching bonus level 3 to coin (Coin 20%)
          total_matching_balance: 0, // Total matching bonus to balance (all levels)
          total_matching_coin: 0, // Total matching bonus to coin (all levels)
          total_downline_count: 0,
          total_downline_deposit: 0,
          total_coin_balance: 0, // Will be calculated after total_balance is finalized
          _baseDeposit: totalDeposit, // Store for later comparison
          _baseWithdraw: totalWithdraw, // Store for later comparison
          transactions: []
        })
      }
    }

    // Process bonus deposits
    console.log('Processing bonus deposits...')
    for (const bonusDeposit of bonusDeposits || []) {
      const memberId = bonusDeposit.member_id
      const bonusAmount = parseFloat(bonusDeposit.amount) || 0
      const paymentMethod = bonusDeposit.payment_method || ''
      
      if (memberBonusMap.has(memberId)) {
        const memberBonus = memberBonusMap.get(memberId)
        const member = memberBonus.member
        
        // Get coin price for this member
        let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
        if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
        } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
        }
        
        // Check if it's referral bonus or matching bonus
        if (paymentMethod === 'referral_bonus' || paymentMethod.toLowerCase().includes('referral')) {
          // Calculate total bonus (bonus deposit is 80% of total, so total = bonus / 0.8)
          const totalBonus = bonusAmount / 0.8
          // Calculate coin: (totalBonus * 20%) / pricePerCoin (same as members.get.ts)
          const bonusCoinUsdt = totalBonus * (referralCoinPercentage / 100)
          const bonusCoin = pricePerCoin > 0 ? bonusCoinUsdt / pricePerCoin : 0

          memberBonus.total_bonus += totalBonus
          memberBonus.total_bonus_balance += bonusAmount
          memberBonus.total_bonus_coin += bonusCoin
          // Add bonus balance to total balance
          memberBonus.total_balance += bonusAmount
          memberBonus.transactions.push({
            id: bonusDeposit.id,
            created_at: bonusDeposit.created_at,
            bonus_balance: bonusAmount,
            bonus_coin: bonusCoin,
            total_bonus: totalBonus,
            bonus_type: 'referral'
          })
        } else if (paymentMethod.includes('matching_bonus_level1') || paymentMethod.includes('matching_bonus_level2') || paymentMethod.includes('matching_bonus_level3')) {
          // Matching bonus
          const level = paymentMethod.includes('level1') ? 1 : paymentMethod.includes('level2') ? 2 : 3
          const totalBonus = bonusAmount / 0.8
          // Calculate coin: (totalBonus * 20%) / pricePerCoin (same as members.get.ts)
          const bonusCoinUsdt = totalBonus * (referralCoinPercentage / 100)
          const bonusCoin = pricePerCoin > 0 ? bonusCoinUsdt / pricePerCoin : 0

          if (level === 1) {
            memberBonus.total_matching_level1 += totalBonus
            memberBonus.total_matching_level1_balance += bonusAmount
            memberBonus.total_matching_level1_coin += bonusCoin
          } else if (level === 2) {
            memberBonus.total_matching_level2 += totalBonus
            memberBonus.total_matching_level2_balance += bonusAmount
            memberBonus.total_matching_level2_coin += bonusCoin
          } else if (level === 3) {
            memberBonus.total_matching_level3 += totalBonus
            memberBonus.total_matching_level3_balance += bonusAmount
            memberBonus.total_matching_level3_coin += bonusCoin
          }

          memberBonus.total_matching_balance += bonusAmount
          memberBonus.total_matching_coin += bonusCoin
          // Add bonus balance to total balance
          memberBonus.total_balance += bonusAmount
          memberBonus.transactions.push({
            id: bonusDeposit.id,
            created_at: bonusDeposit.created_at,
            bonus_balance: bonusAmount,
            bonus_coin: bonusCoin,
            total_bonus: totalBonus,
            bonus_type: `matching_level${level}`,
            level: level
          })
        }
      }
    }

    // Count downlines who made deposits for each member
    // Get all completed deposits (excluding bonus deposits)
    const { data: completedDeposits, error: completedDepositsError } = await supabase
      .from('deposits')
      .select('id, member_id, amount, created_at')
      .eq('status', 'completed')
      .neq('payment_method', 'referral_bonus')

    if (completedDepositsError) {
      console.error('Error fetching completed deposits:', completedDepositsError)
    }

    // Count unique downlines per member
    for (const memberBonus of memberBonusMap.values()) {
      const memberId = memberBonus.member_id
      
      // Find members referred by this member
      // Try by ID first
      let { data: referredMembers } = await supabase
        .from('members')
        .select('id')
        .eq('referred_by', memberId)

      // If not found, try by referral_code
      if (!referredMembers || referredMembers.length === 0) {
        const memberBonusData = Array.from(memberBonusMap.values()).find(mb => mb.member_id === memberId)
        if (memberBonusData?.member?.referral_code) {
          const { data: referredByCode } = await supabase
            .from('members')
            .select('id')
            .eq('referred_by', memberBonusData.member.referral_code)
          
          if (referredByCode) {
            referredMembers = referredByCode
          }
        }
      }

      if (referredMembers && referredMembers.length > 0) {
        const referredMemberIds = referredMembers.map(m => m.id)
        
        // Count how many of these referred members made deposits
        const downlineDeposits = (completedDeposits || []).filter(dep => 
          referredMemberIds.includes(dep.member_id)
        )
        
        const uniqueDownlines = new Set(downlineDeposits.map(dep => dep.member_id))
        memberBonus.total_downline_count = uniqueDownlines.size
        
        // Calculate total deposit amount from downlines
        const totalDownlineDeposit = downlineDeposits.reduce((sum, dep) => 
          sum + parseFloat(dep.amount || 0), 0
        )
        memberBonus.total_downline_deposit = totalDownlineDeposit

        // Calculate bonus from downline deposits if bonus deposits don't exist
        // This ensures we show the correct bonus even if bonus deposits weren't created
        if (totalDownlineDeposit > 0 && memberBonus.total_bonus === 0) {
          // Get coin price for this member
          const member = memberBonus.member
          let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
          if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
            pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
          } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
            pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
          }
          
          // Calculate expected bonus: referralPercentage% of total downline deposit
          const expectedTotalBonus = (totalDownlineDeposit * referralPercentage) / 100
          const expectedBonusBalance = (expectedTotalBonus * referralBalancePercentage) / 100
          // Calculate coin: (expectedTotalBonus * 20%) / pricePerCoin (same as members.get.ts)
          const expectedBonusCoinUsdt = (expectedTotalBonus * referralCoinPercentage) / 100
          const expectedBonusCoin = pricePerCoin > 0 ? expectedBonusCoinUsdt / pricePerCoin : 0

          // Only add if we don't have bonus deposits (meaning bonus wasn't created yet)
          // But we still want to show what the bonus should be
          memberBonus.total_bonus = expectedTotalBonus
          memberBonus.total_bonus_balance = expectedBonusBalance
          memberBonus.total_bonus_coin = expectedBonusCoin
          // Add bonus balance to total balance (only if bonus wasn't already added from bonus deposits)
          if (memberBonus.total_balance === (memberBonus._baseDeposit - memberBonus._baseWithdraw)) {
            memberBonus.total_balance += expectedBonusBalance
          }

          // Add detail transactions from downline deposits
          for (const downlineDeposit of downlineDeposits) {
            const depositAmount = parseFloat(downlineDeposit.amount || 0)
            const depositBonus = (depositAmount * referralPercentage) / 100
            const depositBonusBalance = (depositBonus * referralBalancePercentage) / 100
            // Calculate coin: (depositBonus * 20%) / pricePerCoin (same as members.get.ts)
            const depositBonusCoinUsdt = (depositBonus * referralCoinPercentage) / 100
            const depositBonusCoin = pricePerCoin > 0 ? depositBonusCoinUsdt / pricePerCoin : 0

            const downlineMember = memberMap.get(downlineDeposit.member_id)

            memberBonus.transactions.push({
              id: `downline-${downlineDeposit.id}`,
              created_at: downlineDeposit.created_at,
              bonus_balance: depositBonusBalance,
              bonus_coin: depositBonusCoin,
              total_bonus: depositBonus,
              bonus_type: 'referral',
              downline_deposit_amount: depositAmount,
              downline_member_id: downlineDeposit.member_id,
              downline_member: downlineMember ? {
                username: downlineMember.username,
                email: downlineMember.email
              } : null
            })
          }
        }

        // Calculate matching bonus level 1, 2, 3 from downline deposits
        // Matching bonus Level 1 = downlines dari direct referrals (generasi kedua)
        // Matching bonus Level 2 = downlines dari level 1 matching (generasi ketiga)
        // Matching bonus Level 3 = downlines dari level 2 matching (generasi keempat)
        
        // Find level 1 matching downlines (downlines dari direct referrals)
        // Direct referrals = referredMemberIds (generasi pertama, dapat referral bonus)
        // Level 1 matching = downlines dari direct referrals (generasi kedua)
        const level1MatchingDownlineIds = []
        for (const directReferralId of referredMemberIds) {
          const { data: level1MatchingDownlines } = await supabase
            .from('members')
            .select('id')
            .eq('referred_by', directReferralId)
          
          if (level1MatchingDownlines && level1MatchingDownlines.length > 0) {
            level1MatchingDownlineIds.push(...level1MatchingDownlines.map(m => m.id))
          }
        }
        
        // Get deposits from level 1 matching downlines
        const level1MatchingDeposits = (completedDeposits || []).filter(dep => 
          level1MatchingDownlineIds.includes(dep.member_id)
        )
        const totalLevel1MatchingDeposit = level1MatchingDeposits.reduce((sum, dep) => 
          sum + parseFloat(dep.amount || 0), 0
        )

        // Calculate matching bonus level 1 if not already calculated from bonus deposits
        if (totalLevel1MatchingDeposit > 0 && memberBonus.total_matching_level1 === 0) {
          // Get coin price for this member
          const member = memberBonus.member
          let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
          if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
            pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
          } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
            pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
          }
          
          const matchingLevel1Total = (totalLevel1MatchingDeposit * matchingLevel1Percentage) / 100
          const matchingLevel1Balance = (matchingLevel1Total * referralBalancePercentage) / 100
          // Calculate coin: (matchingLevel1Total * 20%) / pricePerCoin (same as members.get.ts)
          const matchingLevel1CoinUsdt = (matchingLevel1Total * referralCoinPercentage) / 100
          const matchingLevel1Coin = pricePerCoin > 0 ? matchingLevel1CoinUsdt / pricePerCoin : 0

          memberBonus.total_matching_level1 = matchingLevel1Total
          memberBonus.total_matching_level1_balance = matchingLevel1Balance
          memberBonus.total_matching_level1_coin = matchingLevel1Coin
          memberBonus.total_matching_balance += matchingLevel1Balance
          memberBonus.total_matching_coin += matchingLevel1Coin
          
          // Add to total balance (matching bonus should be added to balance)
          memberBonus.total_balance += matchingLevel1Balance

          // Add detail transactions for matching level 1
          for (const level1Deposit of level1MatchingDeposits) {
            const depositAmount = parseFloat(level1Deposit.amount || 0)
            const matchingBonus = (depositAmount * matchingLevel1Percentage) / 100
            const matchingBonusBalance = (matchingBonus * referralBalancePercentage) / 100
            // Calculate coin: (matchingBonus * 20%) / pricePerCoin (same as members.get.ts)
            const matchingBonusCoinUsdt = (matchingBonus * referralCoinPercentage) / 100
            const matchingBonusCoin = pricePerCoin > 0 ? matchingBonusCoinUsdt / pricePerCoin : 0

            const downlineMember = memberMap.get(level1Deposit.member_id)

            memberBonus.transactions.push({
              id: `matching-l1-${level1Deposit.id}`,
              created_at: level1Deposit.created_at,
              bonus_balance: matchingBonusBalance,
              bonus_coin: matchingBonusCoin,
              total_bonus: matchingBonus,
              bonus_type: 'matching_level1',
              level: 1,
              downline_deposit_amount: depositAmount,
              downline_member_id: level1Deposit.member_id,
              downline_member: downlineMember ? {
                username: downlineMember.username,
                email: downlineMember.email
              } : null
            })
          }
        }

        // Calculate matching bonus level 2 and 3
        // Find level 2 matching downlines (downlines dari level 1 matching downlines)
        const level2MatchingDownlineIds = []
        for (const level1MatchingDownlineId of level1MatchingDownlineIds) {
          const { data: level2MatchingDownlines } = await supabase
            .from('members')
            .select('id')
            .eq('referred_by', level1MatchingDownlineId)
          
          if (level2MatchingDownlines && level2MatchingDownlines.length > 0) {
            level2MatchingDownlineIds.push(...level2MatchingDownlines.map(m => m.id))
          }
        }

        if (level2MatchingDownlineIds.length > 0) {
          const level2MatchingDeposits = (completedDeposits || []).filter(dep => 
            level2MatchingDownlineIds.includes(dep.member_id)
          )
          const totalLevel2MatchingDeposit = level2MatchingDeposits.reduce((sum, dep) => 
            sum + parseFloat(dep.amount || 0), 0
          )

          // Calculate matching bonus level 2
          if (totalLevel2MatchingDeposit > 0 && memberBonus.total_matching_level2 === 0) {
            // Get coin price for this member
            const member = memberBonus.member
            let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
            if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
              pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
            } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
              pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
            }
            
            const matchingLevel2Total = (totalLevel2MatchingDeposit * matchingLevel2Percentage) / 100
            const matchingLevel2Balance = (matchingLevel2Total * referralBalancePercentage) / 100
            // Calculate coin: (matchingLevel2Total * 20%) / pricePerCoin (same as members.get.ts)
            const matchingLevel2CoinUsdt = (matchingLevel2Total * referralCoinPercentage) / 100
            const matchingLevel2Coin = pricePerCoin > 0 ? matchingLevel2CoinUsdt / pricePerCoin : 0

            memberBonus.total_matching_level2 = matchingLevel2Total
            memberBonus.total_matching_level2_balance = matchingLevel2Balance
            memberBonus.total_matching_level2_coin = matchingLevel2Coin
            memberBonus.total_matching_balance += matchingLevel2Balance
            memberBonus.total_matching_coin += matchingLevel2Coin
            
            // Add to total balance
            memberBonus.total_balance += matchingLevel2Balance

            // Add detail transactions for matching level 2
            for (const level2Deposit of level2MatchingDeposits) {
              const depositAmount = parseFloat(level2Deposit.amount || 0)
              const matchingBonus = (depositAmount * matchingLevel2Percentage) / 100
              const matchingBonusBalance = (matchingBonus * referralBalancePercentage) / 100
              // Calculate coin: (matchingBonus * 20%) / pricePerCoin (same as members.get.ts)
              const matchingBonusCoinUsdt = (matchingBonus * referralCoinPercentage) / 100
              const matchingBonusCoin = pricePerCoin > 0 ? matchingBonusCoinUsdt / pricePerCoin : 0

              const downlineMember = memberMap.get(level2Deposit.member_id)

              memberBonus.transactions.push({
                id: `matching-l2-${level2Deposit.id}`,
                created_at: level2Deposit.created_at,
                bonus_balance: matchingBonusBalance,
                bonus_coin: matchingBonusCoin,
                total_bonus: matchingBonus,
                bonus_type: 'matching_level2',
                level: 2,
                downline_deposit_amount: depositAmount,
                downline_member_id: level2Deposit.member_id,
                downline_member: downlineMember ? {
                  username: downlineMember.username,
                  email: downlineMember.email
                } : null
              })
            }
          }

          // Find level 3 matching downlines (downlines dari level 2 matching downlines)
          const level3MatchingDownlineIds = []
          for (const level2MatchingDownlineId of level2MatchingDownlineIds) {
            const { data: level3MatchingDownlines } = await supabase
              .from('members')
              .select('id')
              .eq('referred_by', level2MatchingDownlineId)
            
            if (level3MatchingDownlines && level3MatchingDownlines.length > 0) {
              level3MatchingDownlineIds.push(...level3MatchingDownlines.map(m => m.id))
            }
          }

          if (level3MatchingDownlineIds.length > 0) {
            const level3MatchingDeposits = (completedDeposits || []).filter(dep => 
              level3MatchingDownlineIds.includes(dep.member_id)
            )
            const totalLevel3MatchingDeposit = level3MatchingDeposits.reduce((sum, dep) => 
              sum + parseFloat(dep.amount || 0), 0
            )

            // Calculate matching bonus level 3
            if (totalLevel3MatchingDeposit > 0 && memberBonus.total_matching_level3 === 0) {
              // Get coin price for this member
              const member = memberBonus.member
              let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
              if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
                pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
              } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
                pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
              }
              
              const matchingLevel3Total = (totalLevel3MatchingDeposit * matchingLevel3Percentage) / 100
              const matchingLevel3Balance = (matchingLevel3Total * referralBalancePercentage) / 100
              // Calculate coin: (matchingLevel3Total * 20%) / pricePerCoin (same as members.get.ts)
              const matchingLevel3CoinUsdt = (matchingLevel3Total * referralCoinPercentage) / 100
              const matchingLevel3Coin = pricePerCoin > 0 ? matchingLevel3CoinUsdt / pricePerCoin : 0

              memberBonus.total_matching_level3 = matchingLevel3Total
              memberBonus.total_matching_level3_balance = matchingLevel3Balance
              memberBonus.total_matching_level3_coin = matchingLevel3Coin
              memberBonus.total_matching_balance += matchingLevel3Balance
              memberBonus.total_matching_coin += matchingLevel3Coin
              
              // Add to total balance
              memberBonus.total_balance += matchingLevel3Balance

              // Add detail transactions for matching level 3
              for (const level3Deposit of level3MatchingDeposits) {
                const depositAmount = parseFloat(level3Deposit.amount || 0)
                const matchingBonus = (depositAmount * matchingLevel3Percentage) / 100
                const matchingBonusBalance = (matchingBonus * referralBalancePercentage) / 100
                // Calculate coin: (matchingBonus * 20%) / pricePerCoin (same as members.get.ts)
                const matchingBonusCoinUsdt = (matchingBonus * referralCoinPercentage) / 100
                const matchingBonusCoin = pricePerCoin > 0 ? matchingBonusCoinUsdt / pricePerCoin : 0

                const downlineMember = memberMap.get(level3Deposit.member_id)

                memberBonus.transactions.push({
                  id: `matching-l3-${level3Deposit.id}`,
                  created_at: level3Deposit.created_at,
                  bonus_balance: matchingBonusBalance,
                  bonus_coin: matchingBonusCoin,
                  total_bonus: matchingBonus,
                  bonus_type: 'matching_level3',
                  level: 3,
                  downline_deposit_amount: depositAmount,
                  downline_member_id: level3Deposit.member_id,
                  downline_member: downlineMember ? {
                    username: downlineMember.username,
                    email: downlineMember.email
                  } : null
                })
              }
            }
          }
        }
      }
    }

    // Calculate coin balance and bonus pasif for each member based on their total balance and member type
    for (const memberBonus of memberBonusMap.values()) {
      const member = memberBonus.member
      let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
      
      if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
        pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
      } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
        pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
      } else {
        pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
      }
      
      // Convert total balance USDT to coin
      if (pricePerCoin > 0) {
        memberBonus.total_coin_balance = memberBonus.total_balance / pricePerCoin
      } else {
        memberBonus.total_coin_balance = 0
      }

      // Calculate bonus pasif
      // USDT = referral bonus USDT (80%) + matching bonus USDT (80%)
      memberBonus.bonus_pasif_usdt = (memberBonus.total_bonus_balance || 0) + (memberBonus.total_matching_balance || 0)
      
      // Coin = referral bonus coin (20%) + matching bonus coin (20%)
      memberBonus.bonus_pasif_coin = (memberBonus.total_bonus_coin || 0) + (memberBonus.total_matching_coin || 0)
      
      // Calculate loyalty bonus from reward_history
      // Get loyalty bonus from reward_history where bonus_type = 'loyalty'
      const { data: loyaltyRewards, error: loyaltyError } = await supabase
        .from('reward_history')
        .select('id, reward_amount, reward_date, created_at')
        .eq('member_id', member.id)
        .eq('bonus_type', 'loyalty')
        .eq('status', 'paid')
        .order('reward_date', { ascending: false })
      
      if (loyaltyError) {
        console.error(`Error fetching loyalty rewards for member ${member.id}:`, loyaltyError)
      }
      
      const loyaltyBonusUsdt = (loyaltyRewards || []).reduce((sum, reward) => {
        return sum + (parseFloat(reward.reward_amount || 0) || 0)
      }, 0)
      
      // Convert loyalty bonus from USDT to Coin
      // pricePerCoin already defined above for this member
      const loyaltyBonusCoin = pricePerCoin > 0 ? loyaltyBonusUsdt / pricePerCoin : 0
      
      // Debug logging
      if (loyaltyRewards && loyaltyRewards.length > 0) {
        console.log(`Member ${member.username} (${member.id}): Found ${loyaltyRewards.length} loyalty rewards, Total USDT: ${loyaltyBonusUsdt}, Total Coin: ${loyaltyBonusCoin}, PricePerCoin: ${pricePerCoin}`)
      }
      
      memberBonus.bonus_pasif_loyalty = loyaltyBonusCoin || 0
      
      // Add loyalty rewards to transactions for detail view (convert to coin)
      if (loyaltyRewards && loyaltyRewards.length > 0) {
        for (const reward of loyaltyRewards) {
          const rewardUsdt = parseFloat(reward.reward_amount || 0)
          const rewardCoin = pricePerCoin > 0 ? rewardUsdt / pricePerCoin : 0
          memberBonus.transactions.push({
            id: reward.id,
            created_at: reward.created_at || reward.reward_date,
            reward_amount: rewardCoin, // Store as coin
            reward_amount_usdt: rewardUsdt, // Keep USDT for reference
            bonus_type: 'loyalty',
            reward_date: reward.reward_date
          })
        }
      }

      // Calculate loyalty bonus breakdown per downline level
      // Get bonus settings for loyalty percentages
      const { data: bonusSettings } = await supabase
        .from('bonus_settings')
        .select('loyalty_percentage_level0, loyalty_percentage_level1, loyalty_percentage_level2')
        .single()

      // Get loyalty percentages from bonus_settings
      // Level 0 = 10%, Level 1 = 10%, Level 2 = 0.5%, Level 3+ = 0.5%
      const loyaltyLevel0 = parseFloat(bonusSettings?.loyalty_percentage_level0) || 10.00
      const loyaltyLevel1 = parseFloat(bonusSettings?.loyalty_percentage_level1) || 10.00
      const loyaltyLevel2 = parseFloat(bonusSettings?.loyalty_percentage_level2) || 0.50
      
      // Ensure correct percentages (validate)
      if (loyaltyLevel0 !== 10.00) {
        console.warn(`Warning: loyalty_percentage_level0 is ${loyaltyLevel0}, expected 10.00`)
      }
      if (loyaltyLevel1 !== 10.00) {
        console.warn(`Warning: loyalty_percentage_level1 is ${loyaltyLevel1}, expected 10.00`)
      }
      if (loyaltyLevel2 !== 0.50) {
        console.warn(`Warning: loyalty_percentage_level2 is ${loyaltyLevel2}, expected 0.50`)
      }

      // Get all members for referral tree
      const { data: allMembers } = await supabase
        .from('members')
        .select('id, username, email, referred_by, referral_code')
        .order('created_at', { ascending: false })

      // Build referral tree
      const referralTree = new Map()
      const memberMap = new Map()
      if (allMembers) {
        for (const m of allMembers) {
          memberMap.set(m.id, m)
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

      // Calculate loyalty breakdown
      const loyaltyBreakdown = []
      let breakdownIndex = 1

      // Level 0: Direct referrals (10%)
      const level0Downlines = getDownlinesAtLevel(member.id, 0)
      for (const downlineId of level0Downlines) {
        const downlineMember = memberMap.get(downlineId)
          const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
          const loyaltyBonusUsdt = (downlineReward * loyaltyLevel0) / 100
          // Convert to coin using member's coin price
          const loyaltyBonusCoin = pricePerCoin > 0 ? loyaltyBonusUsdt / pricePerCoin : 0
          loyaltyBreakdown.push({
            index: breakdownIndex++,
            member_id: downlineId,
            member_username: downlineMember?.username || 'Unknown',
            member_email: downlineMember?.email || '',
            level: 0,
            percentage: loyaltyLevel0,
            multiplier_reward: downlineReward,
            loyalty_bonus: loyaltyBonusCoin // Store as coin
          })
      }

      // Level 1: Referrals dari level 0 (10%)
      const level1Downlines = getDownlinesAtLevel(member.id, 1)
      for (const downlineId of level1Downlines) {
        const downlineMember = memberMap.get(downlineId)
          const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
          const loyaltyBonusUsdt = (downlineReward * loyaltyLevel1) / 100
          // Convert to coin using member's coin price
          const loyaltyBonusCoin = pricePerCoin > 0 ? loyaltyBonusUsdt / pricePerCoin : 0
          loyaltyBreakdown.push({
            index: breakdownIndex++,
            member_id: downlineId,
            member_username: downlineMember?.username || 'Unknown',
            member_email: downlineMember?.email || '',
            level: 1,
            percentage: loyaltyLevel1,
            multiplier_reward: downlineReward,
            loyalty_bonus: loyaltyBonusCoin // Store as coin
          })
      }

      // Level 2: Referrals dari level 1 (0.5%)
      const level2Downlines = getDownlinesAtLevel(member.id, 2)
      for (const downlineId of level2Downlines) {
        const downlineMember = memberMap.get(downlineId)
          const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
          const loyaltyBonusUsdt = (downlineReward * loyaltyLevel2) / 100
          // Convert to coin using member's coin price
          const loyaltyBonusCoin = pricePerCoin > 0 ? loyaltyBonusUsdt / pricePerCoin : 0
          loyaltyBreakdown.push({
            index: breakdownIndex++,
            member_id: downlineId,
            member_username: downlineMember?.username || 'Unknown',
            member_email: downlineMember?.email || '',
            level: 2,
            percentage: loyaltyLevel2,
            multiplier_reward: downlineReward,
            loyalty_bonus: loyaltyBonusCoin // Store as coin
          })
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
          const downlineMember = memberMap.get(downlineId)
          const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
          const loyaltyBonusUsdt = (downlineReward * loyaltyLevel2) / 100
          // Convert to coin using member's coin price
          const loyaltyBonusCoin = pricePerCoin > 0 ? loyaltyBonusUsdt / pricePerCoin : 0
          loyaltyBreakdown.push({
            index: breakdownIndex++,
            member_id: downlineId,
            member_username: downlineMember?.username || 'Unknown',
            member_email: downlineMember?.email || '',
            level: currentLevel,
            percentage: loyaltyLevel2,
            multiplier_reward: downlineReward,
            loyalty_bonus: loyaltyBonusCoin // Store as coin
          })
        }
        currentLevel++
      }

      memberBonus.loyalty_breakdown = loyaltyBreakdown
      
      // If loyalty bonus from reward_history is 0 but we have breakdown data, calculate from breakdown
      if (memberBonus.bonus_pasif_loyalty === 0 && loyaltyBreakdown && loyaltyBreakdown.length > 0) {
        const totalFromBreakdown = loyaltyBreakdown.reduce((sum, bd) => {
          return sum + (parseFloat(bd.loyalty_bonus || 0) || 0)
        }, 0)
        if (totalFromBreakdown > 0) {
          console.log(`Member ${member.username}: Using breakdown total ${totalFromBreakdown} instead of reward_history`)
          memberBonus.bonus_pasif_loyalty = totalFromBreakdown
        }
      }
    }

    // Convert map to array - show ALL members, not just those with bonus
    // Sort by created_at descending (member terbaru di no 1)
    const bonusReport = Array.from(memberBonusMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.member?.created_at || 0).getTime()
        const dateB = new Date(b.member?.created_at || 0).getTime()
        return dateB - dateA // Terbaru di atas
      })

    // Calculate totals
    const totalReferralBonus = bonusReport.reduce((sum, mb) => sum + (mb.total_bonus || 0), 0)
    const totalMatchingLevel1 = bonusReport.reduce((sum, mb) => sum + (mb.total_matching_level1 || 0), 0)
    const totalMatchingLevel2 = bonusReport.reduce((sum, mb) => sum + (mb.total_matching_level2 || 0), 0)
    const totalMatchingLevel3 = bonusReport.reduce((sum, mb) => sum + (mb.total_matching_level3 || 0), 0)
    const totalBonusAll = totalReferralBonus + totalMatchingLevel1 + totalMatchingLevel2 + totalMatchingLevel3
    const totalMembers = bonusReport.length
    const totalBalanceAll = bonusReport.reduce((sum, mb) => sum + (mb.total_balance || 0), 0)

    return {
      success: true,
      data: bonusReport,
      summary: {
        total_bonus: totalBonusAll,
        total_referral_bonus: totalReferralBonus,
        total_matching_level1: totalMatchingLevel1,
        total_matching_level2: totalMatchingLevel2,
        total_matching_level3: totalMatchingLevel3,
        total_members: totalMembers,
        total_balance: totalBalanceAll
      },
      bonus_percentages: {
        referral_percentage: referralPercentage,
        matching_level1_percentage: matchingLevel1Percentage,
        matching_level2_percentage: matchingLevel2Percentage,
        matching_level3_percentage: matchingLevel3Percentage
      },
      coin_info: coinSettings ? {
        coin_name: coinSettings.coin_name,
        coin_code: coinSettings.coin_code
      } : null
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to fetch bonus report'
    })
  }
})

