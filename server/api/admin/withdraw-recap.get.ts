/**
 * Get withdraw recap data
 * GET /api/admin/withdraw-recap
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

    // Get coin settings
    const { data: coinSettings } = await supabase
      .from('coin_settings')
      .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
      .single()

    const pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5

    // Get all completed deposits for balance calculation
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount, coin_amount, member_id')
      .eq('status', 'completed')

    // Get all members with their types for coin price calculation
    const { data: members } = await supabase
      .from('members')
      .select('id, member_type')

    const memberTypeMap = new Map()
    if (members) {
      members.forEach(m => {
        memberTypeMap.set(m.id, m.member_type)
      })
    }

    // Calculate balance USDT
    let totalCoinDeposit = 0
    let totalBalanceUsdt = 0
    if (deposits) {
      deposits.forEach(deposit => {
        totalCoinDeposit += parseFloat(deposit.coin_amount || 0)
        totalBalanceUsdt += parseFloat(deposit.amount || 0)
      })
    }

    // Get bonus settings
    const { data: bonusSettings } = await supabase
      .from('bonus_settings')
      .select('referral_percentage, referral_balance_percentage, referral_coin_percentage, matching_level1_percentage, matching_level2_percentage, matching_level3_percentage')
      .single()

    const referralPercentage = parseFloat(bonusSettings?.referral_percentage) || 15
    const referralBalancePct = parseFloat(bonusSettings?.referral_balance_percentage) || 80
    const referralCoinPct = parseFloat(bonusSettings?.referral_coin_percentage) || 20
    const matchingLevel1Pct = parseFloat(bonusSettings?.matching_level1_percentage) || 10
    const matchingLevel2Pct = parseFloat(bonusSettings?.matching_level2_percentage) || 5
    const matchingLevel3Pct = parseFloat(bonusSettings?.matching_level3_percentage) || 3

    // Get all members with their referral relationships
    const { data: allMembers } = await supabase
      .from('members')
      .select('id, referred_by, member_type')

    // Build referral tree
    const referralMap = new Map() // member_id -> [downline_ids]
    if (allMembers) {
      allMembers.forEach(member => {
        if (member.referred_by) {
          if (!referralMap.has(member.referred_by)) {
            referralMap.set(member.referred_by, [])
          }
          referralMap.get(member.referred_by).push(member.id)
        }
      })
    }

    // Calculate total referral bonus 80% from all downline deposits
    let totalReferralBonus = 0
    let totalReferral80Usdt = 0
    let totalReferral20Coin = 0

    // Get all completed deposits (not just bonus deposits)
    const { data: allCompletedDeposits } = await supabase
      .from('deposits')
      .select('amount, member_id')
      .eq('status', 'completed')

    if (allCompletedDeposits && allMembers) {
      // For each member, calculate referral bonus from their downlines
      allMembers.forEach(member => {
        const downlineIds = referralMap.get(member.id) || []
        if (downlineIds.length > 0) {
          // Get deposits from downlines
          const downlineDeposits = allCompletedDeposits.filter(d => downlineIds.includes(d.member_id))
          if (downlineDeposits.length > 0) {
            // Calculate total referral bonus (referral_percentage% dari total deposit downline)
            const downlineTotalDeposit = downlineDeposits.reduce((sum, d) => sum + (parseFloat(d.amount || 0)), 0)
            const memberReferralBonus = downlineTotalDeposit * (referralPercentage / 100)
            totalReferralBonus += memberReferralBonus
          }
        }
      })
    }

    // Calculate 80% USDT and 20% Coin from total referral bonus
    totalReferral80Usdt = totalReferralBonus * (referralBalancePct / 100)
    const totalReferral20Usdt = totalReferralBonus * (referralCoinPct / 100)
    // Convert 20% USDT to coin (using average price)
    totalReferral20Coin = pricePerCoin > 0 ? totalReferral20Usdt / pricePerCoin : 0

    // Calculate total matching bonus 80% from all downline deposits (level 1, 2, 3)
    // Matching Level 1 = dari Level 2 Referral
    // Matching Level 2 = dari Level 3 Referral  
    // Matching Level 3 = dari Level 4 Referral
    let totalMatchingBonus = 0
    let totalMatchingCoin = 0

    if (allCompletedDeposits && allMembers) {
      // Collect all level 2, 3, 4 members (to avoid double counting)
      const allLevel2Members = new Set()
      const allLevel3Members = new Set()
      const allLevel4Members = new Set()

      allMembers.forEach(member => {
        const level1Downlines = referralMap.get(member.id) || []
        if (level1Downlines.length > 0) {
          // Level 2 (for matching level 1)
          level1Downlines.forEach(level1Id => {
            const level2 = referralMap.get(level1Id) || []
            level2.forEach(id => allLevel2Members.add(id))
          })

          // Level 3 (for matching level 2)
          level1Downlines.forEach(level1Id => {
            const level2 = referralMap.get(level1Id) || []
            level2.forEach(level2Id => {
              const level3 = referralMap.get(level2Id) || []
              level3.forEach(id => allLevel3Members.add(id))
            })
          })

          // Level 4 (for matching level 3)
          level1Downlines.forEach(level1Id => {
            const level2 = referralMap.get(level1Id) || []
            level2.forEach(level2Id => {
              const level3 = referralMap.get(level2Id) || []
              level3.forEach(level3Id => {
                const level4 = referralMap.get(level3Id) || []
                level4.forEach(id => allLevel4Members.add(id))
              })
            })
          })
        }
      })

      // Calculate matching bonus from each level
      // Level 2 deposits (for matching level 1)
      if (allLevel2Members.size > 0) {
        const level2Deposits = allCompletedDeposits.filter(d => allLevel2Members.has(d.member_id))
        const level2Total = level2Deposits.reduce((sum, d) => sum + (parseFloat(d.amount || 0)), 0)
        totalMatchingBonus += level2Total * (matchingLevel1Pct / 100)
      }

      // Level 3 deposits (for matching level 2)
      if (allLevel3Members.size > 0) {
        const level3Deposits = allCompletedDeposits.filter(d => allLevel3Members.has(d.member_id))
        const level3Total = level3Deposits.reduce((sum, d) => sum + (parseFloat(d.amount || 0)), 0)
        totalMatchingBonus += level3Total * (matchingLevel2Pct / 100)
      }

      // Level 4 deposits (for matching level 3)
      if (allLevel4Members.size > 0) {
        const level4Deposits = allCompletedDeposits.filter(d => allLevel4Members.has(d.member_id))
        const level4Total = level4Deposits.reduce((sum, d) => sum + (parseFloat(d.amount || 0)), 0)
        totalMatchingBonus += level4Total * (matchingLevel3Pct / 100)
      }
    }

    // Calculate matching bonus 80% USDT and 20% Coin
    const totalMatching80Usdt = totalMatchingBonus * (referralBalancePct / 100)
    const totalMatching20Usdt = totalMatchingBonus * (referralCoinPct / 100)
    totalMatchingCoin = pricePerCoin > 0 ? totalMatching20Usdt / pricePerCoin : 0

    // Get loyalty bonus from bonus deposits
    const { data: loyaltyDeposits } = await supabase
      .from('deposits')
      .select('amount, member_id')
      .eq('status', 'completed')
      .eq('payment_method', 'loyalty_bonus')

    let totalLoyaltyCoin = 0
    if (loyaltyDeposits) {
      loyaltyDeposits.forEach(bonus => {
        const memberType = memberTypeMap.get(bonus.member_id) || 'normal'
        const memberCoinPrice = memberType === 'vip' 
          ? (parseFloat(coinSettings?.vip_price_usdt) || pricePerCoin)
          : memberType === 'leader'
          ? (parseFloat(coinSettings?.leader_price_usdt) || pricePerCoin)
          : pricePerCoin

        const bonusAmount = parseFloat(bonus.amount || 0)
        totalLoyaltyCoin += memberCoinPrice > 0 ? bonusAmount / memberCoinPrice : 0
      })
    }

    // Calculate referral 80% coin (from USDT) - using average price
    const totalReferral80Coin = pricePerCoin > 0 ? totalReferral80Usdt / pricePerCoin : 0
    // totalReferral20Usdt already calculated above
    const totalMatchingUsdt = totalMatchingCoin * pricePerCoin
    const totalLoyaltyUsdt = totalLoyaltyCoin * pricePerCoin

    // Get bonus pasif (staking rewards)
    const { data: rewardHistory } = await supabase
      .from('reward_history')
      .select('reward_amount, bonus_type, member_id')
      .eq('status', 'paid')
      .in('bonus_type', ['staking_reward', 'multiplier_reward'])

    let totalStakingRewardCoin = 0
    let totalMultiplierRewardCoin = 0

    if (rewardHistory) {
      rewardHistory.forEach(reward => {
        const memberType = memberTypeMap.get(reward.member_id) || 'normal'
        const memberCoinPrice = memberType === 'vip' 
          ? (parseFloat(coinSettings?.vip_price_usdt) || pricePerCoin)
          : memberType === 'leader'
          ? (parseFloat(coinSettings?.leader_price_usdt) || pricePerCoin)
          : pricePerCoin

        const rewardAmount = parseFloat(reward.reward_amount || 0)
        const coinAmount = memberCoinPrice > 0 ? rewardAmount / memberCoinPrice : 0

        if (reward.bonus_type === 'staking_reward') {
          totalStakingRewardCoin += coinAmount
        } else if (reward.bonus_type === 'multiplier_reward') {
          totalMultiplierRewardCoin += coinAmount
        }
      })
    }

    const totalStakingRewardUsdt = totalStakingRewardCoin * pricePerCoin
    const totalMultiplierRewardUsdt = totalMultiplierRewardCoin * pricePerCoin

    return {
      success: true,
      data: {
        balance: {
          totalCoinDeposit,
          totalUsdt: totalBalanceUsdt
        },
        bonusAktif: {
          referral80Coin: totalReferral80Coin,
          referral80Usdt: totalReferral80Usdt,
          referral20Coin: totalReferral20Coin,
          referral20Usdt: totalReferral20Usdt,
          matchingCoin: totalMatchingCoin,
          matchingUsdt: totalMatchingUsdt,
          loyaltyCoin: totalLoyaltyCoin,
          loyaltyUsdt: totalLoyaltyUsdt,
          totalCoin: totalReferral20Coin + totalMatchingCoin + totalLoyaltyCoin,
          totalUsdt: totalReferral20Usdt + totalMatchingUsdt + totalLoyaltyUsdt
        },
        bonusPasif: {
          stakingRewardCoin: totalStakingRewardCoin,
          stakingRewardUsdt: totalStakingRewardUsdt,
          multiplierRewardCoin: totalMultiplierRewardCoin,
          multiplierRewardUsdt: totalMultiplierRewardUsdt,
          totalCoin: totalStakingRewardCoin + totalMultiplierRewardCoin,
          totalUsdt: totalStakingRewardUsdt + totalMultiplierRewardUsdt
        }
      }
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to fetch withdraw recap'
    })
  }
})
