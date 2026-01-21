/**
 * Create new withdraw
 * POST /api/admin/withdraws
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      member_id,
      withdraw_type,
      amount,
      wallet_address,
      wallet_network,
      wallet_model,
      admin_wallet_address,
      notes,
      status
    } = body

    // Validation
    if (!member_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Member ID is required'
      })
    }

    if (!withdraw_type || !['balance', 'coin', 'bonus_aktif', 'bonus_pasif'].includes(withdraw_type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid withdraw_type'
      })
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount must be greater than 0'
      })
    }

    if (!wallet_address) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Wallet address is required'
      })
    }

    if (!wallet_network) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Wallet network is required'
      })
    }

    if (!status || !['pending', 'completed', 'rejected'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid status'
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

    // Check if member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member not found'
      })
    }

    // Create withdraw - build insert object
    const insertData: any = {
      member_id,
      withdraw_type,
      amount: parseFloat(amount),
      wallet_address,
      wallet_network,
      wallet_model: wallet_model || null,
      notes: notes || null,
      status
    }
    
    // Only add admin_wallet_address if provided and field exists in database
    if (admin_wallet_address) {
      insertData.admin_wallet_address = admin_wallet_address
    }

    // Create withdraw
    const { data: newWithdraw, error: createError } = await supabase
      .from('withdraws')
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating withdraw:', createError)
      // If error is about unknown column, try without admin_wallet_address
      if (createError.message?.includes('admin_wallet_address') || createError.code === '42703') {
        delete insertData.admin_wallet_address
        const { data: retryWithdraw, error: retryError } = await supabase
          .from('withdraws')
          .insert(insertData)
          .select()
          .single()
        
        if (retryError) {
          throw createError({
            statusCode: 500,
            statusMessage: retryError.message || 'Failed to create withdraw'
          })
        }
        
        return {
          success: true,
          data: retryWithdraw,
          message: 'Withdraw created successfully'
        }
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: createError.message || 'Failed to create withdraw'
      })
    }

    return {
      success: true,
      data: newWithdraw,
      message: 'Withdraw created successfully'
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to create withdraw'
    })
  }
})

