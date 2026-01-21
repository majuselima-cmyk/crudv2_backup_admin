/**
 * Delete withdraw by ID
 * DELETE /api/admin/withdraws/:id
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Withdraw ID is required'
      })
    }

    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
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

    // Check if withdraw exists
    const { data: existingWithdraw, error: checkError } = await supabase
      .from('withdraws')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingWithdraw) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Withdraw not found'
      })
    }

    // Delete withdraw
    const { error: deleteError } = await supabase
      .from('withdraws')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting withdraw:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: deleteError.message || 'Failed to delete withdraw'
      })
    }

    return {
      success: true,
      message: 'Withdraw deleted successfully'
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to delete withdraw'
    })
  }
})
