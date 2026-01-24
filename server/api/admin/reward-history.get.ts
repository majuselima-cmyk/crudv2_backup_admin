/**
 * Get reward history
 * GET /api/admin/reward-history
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
    // Increase default limit to 1000 to show more records, or use all if limit is 0
    const limitParam = query.limit as string
    const limit = limitParam === '0' || limitParam === 'all' ? null : (parseInt(limitParam) || 1000)
    const offset = parseInt(query.offset as string) || 0
    const status = query.status as string // optional filter: pending, paid, cancelled
    const memberId = query.member_id as string // optional filter by member
    const stakingId = query.staking_id as string // optional filter by staking
    const startDate = query.start_date as string // optional filter: start date
    const endDate = query.end_date as string // optional filter: end date

    // Build query without join (to avoid relationship error)
    let rewardQuery = supabase
      .from('reward_history')
      .select('*', { count: 'exact' })
      .order('reward_date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply range only if limit is specified
    if (limit !== null) {
      rewardQuery = rewardQuery.range(offset, offset + limit - 1)
    }

    // Apply filters
    if (status) {
      rewardQuery = rewardQuery.eq('status', status)
    }
    if (memberId) {
      rewardQuery = rewardQuery.eq('member_id', memberId)
    }
    if (stakingId) {
      rewardQuery = rewardQuery.eq('staking_id', stakingId)
    }
    if (startDate) {
      rewardQuery = rewardQuery.gte('reward_date', startDate)
    }
    if (endDate) {
      rewardQuery = rewardQuery.lte('reward_date', endDate)
    }

    const { data: rewardHistory, error, count } = await rewardQuery

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil data reward history'
      })
    }

    // Get member and staking data for each reward
    const rewardHistoryWithDetails = await Promise.all(
      (rewardHistory || []).map(async (reward: any) => {
        try {
          // Get member info
          const { data: memberDataArray } = await supabase
            .from('members')
            .select('id, email, username, referral_code, member_type')
            .eq('id', reward.member_id)

          const memberData = memberDataArray && memberDataArray.length > 0 ? memberDataArray[0] : null

          // Get staking info
          const { data: stakingDataArray } = await supabase
            .from('staking')
            .select('id, coin_amount, reward_percentage, status, staked_at')
            .eq('id', reward.staking_id)

          const stakingData = stakingDataArray && stakingDataArray.length > 0 ? stakingDataArray[0] : null

          return {
            ...reward,
            member: memberData || null,
            staking: stakingData || null
          }
        } catch (err: any) {
          console.error(`[reward-history.get] Error fetching details for reward ${reward.id}:`, err)
          return {
            ...reward,
            member: null,
            staking: null
          }
        }
      })
    )

    // Calculate summary statistics
    const totalReward = (rewardHistoryWithDetails || []).reduce((sum: number, reward: any) => {
      return sum + (parseFloat(reward.reward_amount) || 0)
    }, 0)

    const totalPaid = (rewardHistoryWithDetails || [])
      .filter((r: any) => r.status === 'paid')
      .reduce((sum: number, reward: any) => {
        return sum + (parseFloat(reward.reward_amount) || 0)
      }, 0)

    const totalPending = (rewardHistoryWithDetails || [])
      .filter((r: any) => r.status === 'pending')
      .reduce((sum: number, reward: any) => {
        return sum + (parseFloat(reward.reward_amount) || 0)
      }, 0)

    return {
      success: true,
      data: rewardHistoryWithDetails || [],
      summary: {
        total_reward: totalReward,
        total_paid: totalPaid,
        total_pending: totalPending,
        count: count || 0
      },
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
      statusMessage: error?.message || 'Gagal mengambil data reward history'
    })
  }
})

