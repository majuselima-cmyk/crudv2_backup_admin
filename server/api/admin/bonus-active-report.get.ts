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
      .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
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
          total_bonus_balance: 0, // Total referral bonus to balance
          total_bonus_coin: 0, // Total referral bonus to coin
          total_matching_level1: 0, // Total matching bonus level 1
          total_matching_level2: 0, // Total matching bonus level 2
          total_matching_level3: 0, // Total matching bonus level 3
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
        
        // Check if it's referral bonus or matching bonus
        if (paymentMethod === 'referral_bonus' || paymentMethod.toLowerCase().includes('referral')) {
          // Calculate total bonus (bonus deposit is 80% of total, so total = bonus / 0.8)
          const totalBonus = bonusAmount / 0.8
          const bonusCoin = totalBonus * 0.2 // 20% converted to coin

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
          const bonusCoin = totalBonus * 0.2

          if (level === 1) {
            memberBonus.total_matching_level1 += totalBonus
          } else if (level === 2) {
            memberBonus.total_matching_level2 += totalBonus
          } else if (level === 3) {
            memberBonus.total_matching_level3 += totalBonus
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
          // Calculate expected bonus: referralPercentage% of total downline deposit
          const expectedTotalBonus = (totalDownlineDeposit * referralPercentage) / 100
          const expectedBonusBalance = (expectedTotalBonus * referralBalancePercentage) / 100
          const expectedBonusCoin = (expectedTotalBonus * referralCoinPercentage) / 100

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
            const depositBonusCoin = (depositBonus * referralCoinPercentage) / 100

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
          const matchingLevel1Total = (totalLevel1MatchingDeposit * matchingLevel1Percentage) / 100
          const matchingLevel1Balance = (matchingLevel1Total * referralBalancePercentage) / 100
          const matchingLevel1Coin = (matchingLevel1Total * referralCoinPercentage) / 100

          memberBonus.total_matching_level1 = matchingLevel1Total
          memberBonus.total_matching_balance += matchingLevel1Balance
          memberBonus.total_matching_coin += matchingLevel1Coin
          
          // Add to total balance (matching bonus should be added to balance)
          memberBonus.total_balance += matchingLevel1Balance

          // Add detail transactions for matching level 1
          for (const level1Deposit of level1MatchingDeposits) {
            const depositAmount = parseFloat(level1Deposit.amount || 0)
            const matchingBonus = (depositAmount * matchingLevel1Percentage) / 100
            const matchingBonusBalance = (matchingBonus * referralBalancePercentage) / 100
            const matchingBonusCoin = (matchingBonus * referralCoinPercentage) / 100

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
            const matchingLevel2Total = (totalLevel2MatchingDeposit * matchingLevel2Percentage) / 100
            const matchingLevel2Balance = (matchingLevel2Total * referralBalancePercentage) / 100
            const matchingLevel2Coin = (matchingLevel2Total * referralCoinPercentage) / 100

            memberBonus.total_matching_level2 = matchingLevel2Total
            memberBonus.total_matching_balance += matchingLevel2Balance
            memberBonus.total_matching_coin += matchingLevel2Coin
            
            // Add to total balance
            memberBonus.total_balance += matchingLevel2Balance

            // Add detail transactions for matching level 2
            for (const level2Deposit of level2MatchingDeposits) {
              const depositAmount = parseFloat(level2Deposit.amount || 0)
              const matchingBonus = (depositAmount * matchingLevel2Percentage) / 100
              const matchingBonusBalance = (matchingBonus * referralBalancePercentage) / 100
              const matchingBonusCoin = (matchingBonus * referralCoinPercentage) / 100

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
              const matchingLevel3Total = (totalLevel3MatchingDeposit * matchingLevel3Percentage) / 100
              const matchingLevel3Balance = (matchingLevel3Total * referralBalancePercentage) / 100
              const matchingLevel3Coin = (matchingLevel3Total * referralCoinPercentage) / 100

              memberBonus.total_matching_level3 = matchingLevel3Total
              memberBonus.total_matching_balance += matchingLevel3Balance
              memberBonus.total_matching_coin += matchingLevel3Coin
              
              // Add to total balance
              memberBonus.total_balance += matchingLevel3Balance

              // Add detail transactions for matching level 3
              for (const level3Deposit of level3MatchingDeposits) {
                const depositAmount = parseFloat(level3Deposit.amount || 0)
                const matchingBonus = (depositAmount * matchingLevel3Percentage) / 100
                const matchingBonusBalance = (matchingBonus * referralBalancePercentage) / 100
                const matchingBonusCoin = (matchingBonus * referralCoinPercentage) / 100

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

    // Calculate coin balance for each member based on their total balance and member type
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
    }

    // Convert map to array - show ALL members, not just those with bonus
    const bonusReport = Array.from(memberBonusMap.values())
      .sort((a, b) => b.total_bonus - a.total_bonus) // Sort by total bonus descending

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
      }
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

