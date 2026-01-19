/**
 * Update minimal deposit settings
 * PUT /api/admin/minimal-deposit
 * Body: { minimal_deposit_usdt }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { minimal_deposit_usdt } = body

    // Validate required fields
    if (minimal_deposit_usdt === undefined || minimal_deposit_usdt === null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Minimal deposit wajib diisi'
      })
    }

    // Validate values
    const depositValue = parseFloat(minimal_deposit_usdt)
    if (isNaN(depositValue) || depositValue < 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Minimal deposit harus berupa angka positif'
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
      .from('minimal_deposit_settings')
      .select('id')
      .limit(1)
      .single()

    let updatedSettings

    const updateData: any = {
      minimal_deposit_usdt: depositValue
    }

    if (existingSettings) {
      // Update existing settings
      const { data, error: updateError } = await supabase
        .from('minimal_deposit_settings')
        .update(updateData)
        .eq('id', existingSettings.id)
        .select('*')
        .single()

      if (updateError) {
        throw createError({
          statusCode: 500,
          statusMessage: updateError.message || 'Gagal mengupdate pengaturan minimal deposit'
        })
      }

      updatedSettings = data
    } else {
      // Create new settings if doesn't exist
      const { data, error: insertError } = await supabase
        .from('minimal_deposit_settings')
        .insert(updateData)
        .select('*')
        .single()

      if (insertError) {
        throw createError({
          statusCode: 500,
          statusMessage: insertError.message || 'Gagal membuat pengaturan minimal deposit'
        })
      }

      updatedSettings = data
    }

    return {
      success: true,
      message: 'Pengaturan minimal deposit berhasil disimpan',
      data: updatedSettings
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menyimpan pengaturan minimal deposit'
    })
  }
})

