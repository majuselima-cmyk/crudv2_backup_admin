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
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0
    const status = query.status as string // optional filter: active, unstaked, cancelled
    const memberId = query.member_id as string // optional filter by member

    // Build query
    let stakingQuery = supabase
      .from('staking')
      .select('*', { count: 'exact' })
      .order('staked_at', { ascending: false })
      .range(offset, offset + limit - 1)

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
          const { data: memberDataArray, error: memberError } = await supabase
            .from('members')
            .select('id, email, username, referral_code, member_type')
            .eq('id', staking.member_id)

          const memberData = memberDataArray && memberDataArray.length > 0 ? memberDataArray[0] : null

          if (memberError && memberError.code !== 'PGRST116') {
            console.error('[staking.get] Error fetching member:', memberError)
          }

          // Get member coins info
          const { data: memberCoinsArray, error: coinsError } = await supabase
            .from('member_coins')
            .select('total_coins, staked_coins, available_coins, coin_price, member_type')
            .eq('member_id', staking.member_id)

          const memberCoins = memberCoinsArray && memberCoinsArray.length > 0 ? memberCoinsArray[0] : null

          if (coinsError && coinsError.code !== 'PGRST116') {
            console.error('[staking.get] Error fetching member coins:', coinsError)
          }

          // Calculate total reward paid from reward_schedules (status = 'paid')
          let totalRewardEarned = 0
          let totalRewardPaid = 0
          let rewardCount = 0
          
          if (staking.id) {
            try {
              // Calculate total_reward_paid from reward_schedules (status = 'paid')
              // Ini adalah sumber utama untuk total reward yang sudah dibayar
              const { data: rewardSchedules, error: scheduleError } = await supabase
                .from('reward_schedules')
                .select('reward_amount, status')
                .eq('staking_id', staking.id)
                .eq('status', 'paid')

              if (scheduleError) {
                // Log error untuk debugging
                console.error('[staking.get] Error fetching reward schedules:', scheduleError)
              } else if (rewardSchedules && rewardSchedules.length > 0) {
                // Calculate total reward paid from reward_schedules
                totalRewardPaid = rewardSchedules.reduce((sum: number, schedule: any) => {
                  const amount = parseFloat(schedule.reward_amount) || 0
                  return sum + amount
                }, 0)
                // Use totalRewardPaid as totalRewardEarned since reward_history table is removed
                totalRewardEarned = totalRewardPaid
                rewardCount = rewardSchedules.length
                
                console.log(`[staking.get] Staking ${staking.id}: Found ${rewardSchedules.length} paid schedules, total: ${totalRewardPaid}`)
              }
            } catch (rewardQueryError: any) {
              console.error('[staking.get] Error querying reward data:', rewardQueryError)
            }
          }

          return {
            ...staking,
            member: memberData || null,
            member_coins: memberCoins || null,
            total_reward_earned: totalRewardEarned,
            total_reward_paid: totalRewardPaid,
            reward_count: rewardCount || 0
          }
        } catch (itemError) {
          console.error('[staking.get] Error processing staking item:', itemError)
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
    console.error('[staking.get] Error:', error)
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil data staking'
    })
  }
})

