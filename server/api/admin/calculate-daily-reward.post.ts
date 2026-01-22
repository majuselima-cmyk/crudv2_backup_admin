/**
 * Calculate daily reward for all active staking (Manual trigger)
 * POST /api/admin/calculate-daily-reward
 * Body: { date? } - optional, defaults to today
 * 
 * Note: Reward juga otomatis dihitung saat admin/member login
 */
import { createClient } from '@supabase/supabase-js'
import { calculateDailyReward } from '../../utils/calculateDailyReward'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event).catch(() => ({}))
    const rewardDate = body.date || new Date().toISOString().split('T')[0] // YYYY-MM-DD format

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

    // Use utility function
    const result = await calculateDailyReward(supabase, rewardDate)

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: result.message || 'Gagal menghitung reward harian'
      })
    }

    return {
      success: true,
      message: result.message,
      data: {
        date: result.date,
        reward_percentage: result.reward_percentage,
        total_staking: result.total_staking,
        processed: result.processed,
        skipped: result.skipped,
        errors: result.errors
      }
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menghitung reward harian'
    })
  }
})

