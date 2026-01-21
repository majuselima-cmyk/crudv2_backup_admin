/**
 * Update coin settings
 * PUT /api/admin/coin
 * Body: { coin_name, total_supply, normal_price_usdt, vip_price_usdt, leader_price_usdt, is_active }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      coin_name,
      coin_code,
      total_supply,
      normal_price_usdt,
      vip_price_usdt,
      leader_price_usdt,
      is_active
    } = body

    // Validate required fields
    if (!coin_name || !coin_code || total_supply === undefined || normal_price_usdt === undefined || vip_price_usdt === undefined || leader_price_usdt === undefined || is_active === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Semua field wajib diisi'
      })
    }

    // Validate coin_code (max 10 characters, uppercase)
    if (coin_code.length > 10) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Kode coin maksimal 10 karakter'
      })
    }

    // Validate values
    if (parseFloat(total_supply) < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Total supply tidak boleh negatif'
      })
    }

    if (parseFloat(normal_price_usdt) < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Harga Normal tidak boleh negatif'
      })
    }

    if (parseFloat(vip_price_usdt) < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Harga VIP tidak boleh negatif'
      })
    }

    if (parseFloat(leader_price_usdt) < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Harga Leader tidak boleh negatif'
      })
    }

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

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('coin_settings')
      .select('id')
      .limit(1)
      .single()

    let updatedSettings

    const updateData: any = {
      coin_name: coin_name.trim(),
      coin_code: coin_code.trim().toUpperCase(),
      total_supply: parseFloat(total_supply),
      normal_price_usdt: parseFloat(normal_price_usdt),
      vip_price_usdt: parseFloat(vip_price_usdt),
      leader_price_usdt: parseFloat(leader_price_usdt),
      is_active: Boolean(is_active)
    }

    if (existingSettings) {
      // Update existing settings
      const { data, error: updateError } = await supabase
        .from('coin_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select('*')
        .single()

      if (updateError) {
        throw createError({
          statusCode: 500,
          statusMessage: updateError.message || 'Gagal mengupdate pengaturan coin'
        })
      }

      updatedSettings = data
    } else {
      // Create new settings if doesn't exist
      const { data, error: insertError } = await supabase
        .from('coin_settings')
        .insert(updateData)
        .select('*')
        .single()

      if (insertError) {
        throw createError({
          statusCode: 500,
          statusMessage: insertError.message || 'Gagal membuat pengaturan coin'
        })
      }

      updatedSettings = data
    }

    return {
      success: true,
      message: 'Pengaturan coin berhasil disimpan',
      data: updatedSettings
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menyimpan pengaturan coin'
    })
  }
})

