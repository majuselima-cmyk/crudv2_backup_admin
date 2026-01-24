/**
 * Manual trigger reward calculation (Force)
 * POST /api/admin/reward/calculate-now
 * Body: { force: true } - optional, defaults to false
 * 
 * Use this untuk manual trigger reward calculation tanpa menghiraukan interval
 */
import { createClient } from '@supabase/supabase-js'
import { calculateDailyReward } from '../../../utils/calculateDailyReward'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const forceCalculate = body.force === true // Force calculation regardless of interval

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

    // Use utility function dengan force flag
    const result = await calculateDailyReward(supabase, undefined, forceCalculate)

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: result.message || 'Gagal menghitung reward'
      })
    }

    return {
      success: true,
      message: result.message,
      data: {
        date: result.date,
        reward_percentage: result.reward_percentage,
        reward_interval_minutes: result.reward_interval_minutes,
        total_staking: result.total_staking,
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors,
        next_calculation: result.next_calculation,
        forced: forceCalculate
      }
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menghitung reward'
    })
  }
})
