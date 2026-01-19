/**
 * Delete wallet
 * DELETE /api/admin/wallet/[id]
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID wallet wajib diisi'
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

    // Check if wallet exists
    const { data: existingWallet, error: checkError } = await supabase
      .from('wallets')
      .select('id, network, address')
      .eq('id', id)
      .single()

    if (checkError || !existingWallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Wallet tidak ditemukan'
      })
    }

    // Delete wallet
    const { error: deleteError } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteError.message || 'Gagal menghapus wallet'
      })
    }

    return {
      success: true,
      message: 'Wallet berhasil dihapus'
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menghapus wallet'
    })
  }
})





