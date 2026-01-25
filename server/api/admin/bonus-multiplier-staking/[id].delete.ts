/**
 * Delete bonus multiplier staking (Admin only)
 * DELETE /api/admin/bonus-multiplier-staking/:id
 * Menghapus record bonus_multiplier_staking. bonus_multiplier_schedules terhapus CASCADE.
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID bonus multiplier staking wajib diisi'
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

    const { data: existing, error: fetchErr } = await supabase
      .from('bonus_multiplier_staking')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bonus multiplier staking tidak ditemukan'
      })
    }

    const { error } = await supabase
      .from('bonus_multiplier_staking')
      .delete()
      .eq('id', id)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal menghapus staking multiplier'
      })
    }

    return {
      success: true,
      message: 'Staking multiplier berhasil dihapus'
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && (error.statusCode || error._statusCode)) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menghapus staking multiplier'
    })
  }
})
