/**
 * Get all staking records
 * GET /api/admin/staking
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

    // Get query parameters
    const query = getQuery(event)
    // Increase default limit to 1000 to show more accounts, or use all if limit is 0
    const limitParam = query.limit as string
    const limit = limitParam === '0' || limitParam === 'all' ? null : (parseInt(limitParam) || 1000)
    const offset = parseInt(query.offset as string) || 0
    const status = query.status as string // optional filter: active, unstaked, cancelled
    const memberId = query.member_id as string // optional filter by member

    // Build query without join (to avoid relationship error)
    let stakingQuery = supabase
      .from('staking')
      .select('*', { count: 'exact' })
      .order('staked_at', { ascending: false })

    // Apply range only if limit is specified
    if (limit !== null) {
      stakingQuery = stakingQuery.range(offset, offset + limit - 1)
    }

    // Apply filters
    if (status) {
      stakingQuery = stakingQuery.eq('status', status)
    }
    if (memberId) {
      stakingQuery = stakingQuery.eq('member_id', memberId)
    }

    const { data: stakingRecords, error, count } = await stakingQuery

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil data staking'
      })
    }

    // Get member data and coins info for each staking
    const stakingWithDetails = await Promise.all(
      (stakingRecords || []).map(async (staking: any) => {
        try {
          // Get member info
          const { data: memberData } = await supabase
            .from('members')
            .select('id, email, username, referral_code, member_type')
            .eq('id', staking.member_id)
            .single()

          // Get member coins info
          const { data: memberCoins } = await supabase
            .from('member_coins')
            .select('total_coins, staked_coins, available_coins, coin_price, member_type')
            .eq('member_id', staking.member_id)
            .single()

          // Calculate total reward earned (sum from reward_history)
          const { data: rewardHistory, count: rewardCount } = await supabase
            .from('reward_history')
            .select('reward_amount, status', { count: 'exact' })
            .eq('staking_id', staking.id)

          let totalRewardEarned = 0
          let totalRewardPaid = 0
          if (rewardHistory) {
            totalRewardEarned = rewardHistory.reduce((sum: number, reward: any) => {
              return sum + (parseFloat(reward.reward_amount) || 0)
            }, 0)
            totalRewardPaid = rewardHistory
              .filter((r: any) => r.status === 'paid')
              .reduce((sum: number, reward: any) => {
                return sum + (parseFloat(reward.reward_amount) || 0)
              }, 0)
          }

          return {
            ...staking,
            member: memberData || null,
            member_coins: memberCoins || null,
            total_reward_earned: totalRewardEarned,
            total_reward_paid: totalRewardPaid,
            reward_count: rewardCount || 0
          }
        } catch (err: any) {
          // If error fetching member coins or reward, still return staking data
          console.error(`[staking.get] Error fetching details for staking ${staking.id}:`, err)
          return {
            ...staking,
            member: null,
            member_coins: null,
            total_reward_earned: 0,
            total_reward_paid: 0,
            reward_count: 0
          }
        }
      })
    )

    return {
      success: true,
      data: stakingWithDetails || [],
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
      statusMessage: error?.message || 'Gagal mengambil data staking'
    })
  }
})

