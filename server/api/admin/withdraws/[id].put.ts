/**
 * Update withdraw (approve/reject)
 * PUT /api/admin/withdraws/[id]
 * Body: { status, hash? }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const withdrawId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!withdrawId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Withdraw ID is required'
      })
    }

    const { status, hash } = body

    // Validate required fields
    if (!status) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status is required'
      })
    }

    // Validate status
    if (!['pending', 'completed', 'rejected'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status must be pending, completed, or rejected'
      })
    }

    // If status is completed, hash is required
    if (status === 'completed' && !hash) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Hash is required when approving withdraw (status: completed)'
      })
    }

    // Validate hash format (should be a string, typically 64 characters for blockchain hashes)
    if (hash && (typeof hash !== 'string' || hash.trim().length < 10)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Hash must be a valid string (minimum 10 characters)'
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

    // Check if withdraw exists
    const { data: existingWithdraw, error: fetchError } = await supabase
      .from('withdraws')
      .select('*')
      .eq('id', withdrawId)
      .single()

    if (fetchError || !existingWithdraw) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Withdraw not found'
      })
    }

    // Prepare update data
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    }

    // Add hash if provided (usually when approving)
    if (hash && hash.trim()) {
      updateData.hash = hash.trim()
    }

    // If status is not completed, remove hash
    if (status !== 'completed') {
      updateData.hash = null
    }

    // Update withdraw
    const { data: updatedWithdraw, error: updateError } = await supabase
      .from('withdraws')
      .update(updateData)
      .eq('id', withdrawId)
      .select('*')
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Failed to update withdraw'
      })
    }

    return {
      success: true,
      message: status === 'completed' ? 'Withdraw berhasil diapprove' : status === 'rejected' ? 'Withdraw berhasil ditolak' : 'Withdraw berhasil diupdate',
      data: updatedWithdraw
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Failed to update withdraw'
    })
  }
})

