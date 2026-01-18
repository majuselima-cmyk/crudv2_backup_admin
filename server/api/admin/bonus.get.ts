/**
 * Get bonus settings
 * GET /api/admin/bonus
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

    // Get bonus settings (should only have one record)
    const { data: settings, error } = await supabase
      .from('bonus_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil pengaturan bonus'
      })
    }

    // If no settings found, return default values
    if (!settings) {
      return {
        success: true,
        data: {
          referral_percentage: 15.00,
          matching_level1_percentage: 10.00,
          matching_level2_percentage: 5.00,
          matching_level3_percentage: 2.00,
          loyalty_percentage: 10.00,
          reward_percentage: 0.50,
          multiplier_percentage: 10.00,
          multiplier_increment_percentage: 10.00,
          multiplier_increment_days: 7,
          is_active: true
        }
      }
    }

    return {
      success: true,
      data: settings
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil pengaturan bonus'
    })
  }
})

