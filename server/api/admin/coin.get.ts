/**
 * Get coin settings
 * GET /api/admin/coin
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

    // Get coin settings (should only have one record)
    const { data: settings, error } = await supabase
      .from('coin_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil pengaturan coin'
      })
    }

    // If no settings found, return default values
    if (!settings) {
      return {
        success: true,
        data: {
          coin_name: 'MyCoin',
          coin_code: 'COIN',
          total_supply: 999999999.00,
          normal_price_usdt: 0.5000,
          vip_price_usdt: 0.4000,
          leader_price_usdt: 0.5000,
          chart_min_price: 0.4,
          chart_mid_price: 0.5,
          chart_max_price: 0.6,
          logo_url: null,
          favicon_url: null,
          website_name: 'localhost:3000',
          website_title: 'CRUD App',
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
      statusMessage: error?.message || 'Gagal mengambil pengaturan coin'
    })
  }
})

