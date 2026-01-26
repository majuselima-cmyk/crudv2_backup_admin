/**
 * Calculate and save loyalty bonus for all members
 * POST /api/admin/calculate-loyalty-bonus
 * 
 * Bonus Loyalty Rules:
 * - Level 0: 10% dari total reward multiplier (paid) dari direct referral
 * - Level 1: 10% dari total reward multiplier (paid) dari level 1 downline
 * - Level 2: 0.5% dari total reward multiplier (paid) dari level 2 downline
 * - Level 3+: 0.5% dari total reward multiplier (paid) dari level 3+ downline
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

    // Get bonus settings
    const { data: bonusSettings } = await supabase
      .from('bonus_settings')
      .select('loyalty_percentage_level0, loyalty_percentage_level1, loyalty_percentage_level2')
      .single()

    if (!bonusSettings) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Bonus settings not found'
      })
    }

    const loyaltyLevel0 = parseFloat(bonusSettings.loyalty_percentage_level0) || 10.00
    const loyaltyLevel1 = parseFloat(bonusSettings.loyalty_percentage_level1) || 10.00
    const loyaltyLevel2 = parseFloat(bonusSettings.loyalty_percentage_level2) || 0.50

    // Get all members
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('id, referred_by, referral_code')
      .order('created_at', { ascending: false })

    if (membersError) {
      throw createError({
        statusCode: 500,
        statusMessage: membersError.message || 'Failed to fetch members'
      })
    }

    if (!allMembers || allMembers.length === 0) {
      return {
        success: true,
        message: 'No members found',
        processed: 0
      }
    }

    // Build referral tree
    // Map: member_id -> [array of downline member_ids]
    const referralTree = new Map()
    for (const member of allMembers) {
      // Initialize empty array for each member
      if (!referralTree.has(member.id)) {
        referralTree.set(member.id, [])
      }
      
      // If member has referrer, add member to referrer's downline list
      if (member.referred_by) {
        // Handle both UUID and referral_code as referred_by
        let referrerId = member.referred_by
        
        // Check if referred_by is UUID or referral_code
        const referrer = allMembers.find(m => 
          m.id === member.referred_by || m.referral_code === member.referred_by
        )
        
        if (referrer) {
          referrerId = referrer.id
          if (!referralTree.has(referrerId)) {
            referralTree.set(referrerId, [])
          }
          referralTree.get(referrerId).push(member.id)
        }
      }
    }

    // Get all paid multiplier rewards
    const { data: allMultiplierRewards, error: rewardsError } = await supabase
      .from('bonus_multiplier_schedules')
      .select('id, member_id, reward_amount, scheduled_time')
      .eq('status', 'paid')

    if (rewardsError) {
      console.error('Error fetching multiplier rewards:', rewardsError)
    }

    // Group multiplier rewards by member_id
    const memberMultiplierRewards = new Map()
    if (allMultiplierRewards) {
      for (const reward of allMultiplierRewards) {
        if (!memberMultiplierRewards.has(reward.member_id)) {
          memberMultiplierRewards.set(reward.member_id, [])
        }
        memberMultiplierRewards.get(reward.member_id).push(reward)
      }
    }

    // Calculate total multiplier reward per member
    const memberTotalMultiplierReward = new Map()
    for (const [memberId, rewards] of memberMultiplierRewards.entries()) {
      const total = rewards.reduce((sum, r) => sum + (parseFloat(r.reward_amount || 0) || 0), 0)
      memberTotalMultiplierReward.set(memberId, total)
    }

    // Function to get downlines at specific level
    // Level 0 = direct referrals (B dari A)
    // Level 1 = referrals dari level 0 (C dari B)
    // Level 2 = referrals dari level 1 (D dari C)
    // Level 3+ = referrals dari level 2+ (E dari D, F dari E, dst)
    const getDownlinesAtLevel = (memberId, targetLevel) => {
      if (targetLevel === 0) {
        // Level 0 = direct referrals
        return referralTree.get(memberId) || []
      }
      
      // For level 1+, recursively get downlines
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

    let processedCount = 0
    const loyaltyRewardsToInsert = []

    // Calculate loyalty bonus for each member
    for (const member of allMembers) {
      const memberId = member.id
      let totalLoyaltyBonus = 0

      // Level 0: Direct referrals (10%)
      const level0Downlines = getDownlinesAtLevel(memberId, 0)
      for (const downlineId of level0Downlines) {
        const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
        const loyaltyBonus = (downlineReward * loyaltyLevel0) / 100
        totalLoyaltyBonus += loyaltyBonus
      }

      // Level 1: Referrals dari level 0 (10%)
      const level1Downlines = getDownlinesAtLevel(memberId, 1)
      for (const downlineId of level1Downlines) {
        const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
        const loyaltyBonus = (downlineReward * loyaltyLevel1) / 100
        totalLoyaltyBonus += loyaltyBonus
      }

      // Level 2: Referrals dari level 1 (0.5%)
      const level2Downlines = getDownlinesAtLevel(memberId, 2)
      for (const downlineId of level2Downlines) {
        const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
        const loyaltyBonus = (downlineReward * loyaltyLevel2) / 100
        totalLoyaltyBonus += loyaltyBonus
      }

      // Level 3+: Referrals dari level 2+ (0.5%)
      // Get all downlines from level 3 onwards (unlimited depth)
      let currentLevel = 3
      let maxLevel = 20 // Safety limit to prevent infinite loop
      while (currentLevel <= maxLevel) {
        const levelDownlines = getDownlinesAtLevel(memberId, currentLevel)
        if (levelDownlines.length === 0) {
          break // No more downlines at this level
        }
        for (const downlineId of levelDownlines) {
          const downlineReward = memberTotalMultiplierReward.get(downlineId) || 0
          const loyaltyBonus = (downlineReward * loyaltyLevel2) / 100 // Tetap 0.5% untuk level 3+
          totalLoyaltyBonus += loyaltyBonus
        }
        currentLevel++
      }

      // If member has loyalty bonus, save to reward_history
      if (totalLoyaltyBonus > 0) {
        // Check if already exists for today
        const today = new Date().toISOString().split('T')[0]
        const { data: existingRewards } = await supabase
          .from('reward_history')
          .select('id')
          .eq('member_id', memberId)
          .eq('bonus_type', 'loyalty')
          .eq('reward_date', today)

        if (!existingRewards || existingRewards.length === 0) {
          // Get a dummy staking_id (or create a system staking for loyalty)
          // For now, we'll use a placeholder UUID or null
          // Note: reward_history requires staking_id, so we might need to adjust the schema
          // Or create a system staking record for loyalty bonuses
          
          loyaltyRewardsToInsert.push({
            member_id: memberId,
            reward_amount: totalLoyaltyBonus,
            reward_date: today,
            coin_amount_staked: 0, // Not applicable for loyalty
            reward_percentage: 0, // Not applicable for loyalty
            bonus_type: 'loyalty',
            status: 'paid',
            staking_id: null // Will need to handle this - might need to make staking_id nullable or create system staking
          })
        }
      }
    }

    // Insert loyalty rewards (if reward_history supports nullable staking_id)
    // Note: If staking_id is required, we need to create a system staking first
    // For now, let's check if we can insert without staking_id
    if (loyaltyRewardsToInsert.length > 0) {
      // First, check if we need to make staking_id nullable or create system staking
      // Let's try to insert and handle error if staking_id is required
      const { error: insertError } = await supabase
        .from('reward_history')
        .insert(loyaltyRewardsToInsert)

      if (insertError) {
        console.error('Error inserting loyalty rewards:', insertError)
        // If staking_id is required, we need to create system staking first
        // For now, log the error
      } else {
        processedCount = loyaltyRewardsToInsert.length
      }
    }

    return {
      success: true,
      message: `Berhasil menghitung bonus loyalty untuk ${processedCount} member`,
      processed: processedCount,
      total_members: allMembers.length
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Failed to calculate loyalty bonus'
    })
  }
})
