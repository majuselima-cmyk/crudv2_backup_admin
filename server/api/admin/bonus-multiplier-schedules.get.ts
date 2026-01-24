/**
 * Get all bonus multiplier schedules
 * GET /api/admin/bonus-multiplier-schedules
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
    const limit = parseInt(query.limit as string) || 1000
    const offset = parseInt(query.offset as string) || 0
    const multiplierStakingId = query.multiplier_staking_id as string // optional filter by multiplier staking
    const status = query.status as string // optional filter: pending, paid

    // Build query
    let schedulesQuery = supabase
      .from('bonus_multiplier_schedules')
      .select('*', { count: 'exact' })
      .order('scheduled_time', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (multiplierStakingId) {
      schedulesQuery = schedulesQuery.eq('multiplier_staking_id', multiplierStakingId)
    }
    if (status) {
      schedulesQuery = schedulesQuery.eq('status', status)
    }

    const { data: schedules, error, count } = await schedulesQuery

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil data bonus multiplier schedules'
      })
    }

    return {
      success: true,
      data: schedules || [],
      count: count || 0,
      limit,
      offset
    }
  } catch (error: any) {
    console.error('[bonus-multiplier-schedules.get] Error:', error)
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil data bonus multiplier schedules'
    })
  }
})

