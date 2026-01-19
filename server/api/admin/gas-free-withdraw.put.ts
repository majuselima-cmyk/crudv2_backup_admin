/**
 * Update gas free withdraw settings
 * PUT /api/admin/gas-free-withdraw
 * Body: { gas_free_percentage, is_active }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { gas_free_percentage, is_active } = body

    // Validate required fields
    if (gas_free_percentage === undefined || is_active === undefined) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Gas free percentage dan status wajib diisi'
      })
    }

    // Validate percentage range (0-100)
    const percentage = parseFloat(gas_free_percentage)
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Gas free percentage harus antara 0 dan 100'
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
      .from('gas_free_withdraw_settings')
      .select('id')
      .limit(1)
      .single()

    let updatedSettings

    const updateData: any = {
      gas_free_percentage: percentage,
      is_active: Boolean(is_active)
    }

    if (existingSettings) {
      // Update existing settings
      const { data, error: updateError } = await supabase
        .from('gas_free_withdraw_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select('*')
        .single()

      if (updateError) {
        throw createError({
          statusCode: 500,
          statusMessage: updateError.message || 'Gagal mengupdate pengaturan gas free withdraw'
        })
      }

      updatedSettings = data
    } else {
      // Create new settings if doesn't exist
      const { data, error: insertError } = await supabase
        .from('gas_free_withdraw_settings')
        .insert(updateData)
        .select('*')
        .single()

      if (insertError) {
        throw createError({
          statusCode: 500,
          statusMessage: insertError.message || 'Gagal membuat pengaturan gas free withdraw'
        })
      }

      updatedSettings = data
    }

    return {
      success: true,
      message: 'Pengaturan gas free withdraw berhasil disimpan',
      data: updatedSettings
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menyimpan pengaturan gas free withdraw'
    })
  }
})







