/**
 * Get all bonus multiplier staking records
 * GET /api/admin/bonus-multiplier-staking
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
    const memberId = query.member_id as string // optional filter by member

    // Build query - try to select all columns including coin_amount
    // If coin_amount doesn't exist, we'll catch the error and retry without it
    let multiplierStakingQuery = supabase
      .from('bonus_multiplier_staking')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (memberId) {
      multiplierStakingQuery = multiplierStakingQuery.eq('member_id', memberId)
    }

    let { data: multiplierStakingRecords, error, count } = await multiplierStakingQuery

    // If error is about missing coin_amount column, retry without it
    // Supabase/PostgREST returns error code 42703 for undefined column
    if (error && (
      error.code === '42703' || 
      error.message?.includes('coin_amount') || 
      error.message?.includes('column') ||
      error.message?.includes('schema cache')
    )) {
      console.warn('[bonus-multiplier-staking.get] coin_amount column not found, retrying without it. Error:', error.message)
      // Retry query without coin_amount
      multiplierStakingQuery = supabase
        .from('bonus_multiplier_staking')
        .select('id, member_id, multiplier_bonus_base_percentage, reward_interval_minutes, multiplier_increment_period_minutes, started_at, status, created_at, updated_at', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (memberId) {
        multiplierStakingQuery = multiplierStakingQuery.eq('member_id', memberId)
      }

      const retryResult = await multiplierStakingQuery
      multiplierStakingRecords = retryResult.data
      error = retryResult.error
      count = retryResult.count

      // Add coin_amount as 0 for backward compatibility
      if (multiplierStakingRecords) {
        multiplierStakingRecords = multiplierStakingRecords.map((record: any) => ({
          ...record,
          coin_amount: 0 // Default value until migration is run
        }))
      }
    }

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil data bonus multiplier staking'
      })
    }

    // Get member data for each multiplier staking
    const multiplierStakingWithDetails = await Promise.all(
      (multiplierStakingRecords || []).map(async (staking: any) => {
        try {
          // Get member info
          const { data: memberDataArray, error: memberError } = await supabase
            .from('members')
            .select('id, email, username, referral_code, member_type')
            .eq('id', staking.member_id)

          const memberData = memberDataArray && memberDataArray.length > 0 ? memberDataArray[0] : null

          if (memberError && memberError.code !== 'PGRST116') {
            console.error('[bonus-multiplier-staking.get] Error fetching member:', memberError)
          }

          return {
            ...staking,
            member: memberData || null
          }
        } catch (itemError) {
          console.error('[bonus-multiplier-staking.get] Error processing multiplier staking item:', itemError)
          return {
            ...staking,
            member: null
          }
        }
      })
    )

    return {
      success: true,
      data: multiplierStakingWithDetails || [],
      count: count || 0,
      limit,
      offset
    }
  } catch (error: any) {
    console.error('[bonus-multiplier-staking.get] Error:', error)
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil data bonus multiplier staking'
    })
  }
})

