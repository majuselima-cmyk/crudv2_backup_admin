/**
 * Create new deposit
 * POST /api/admin/deposits
 * Body: { member_id, amount, coin_amount, conversion_rate, from_wallet_address, to_wallet_address, payment_method, wallet_model, status }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const {
      member_id,
      amount,
      coin_amount,
      conversion_rate,
      from_wallet_address,
      to_wallet_address,
      payment_method,
      wallet_model,
      status = 'pending'
    } = body

    // Validate required fields
    if (!member_id || !amount || !from_wallet_address || !to_wallet_address || !payment_method) {
      throw createError({
        statusCode: 400,
        statusMessage: 'member_id, amount, from_wallet_address, to_wallet_address, and payment_method are required'
      })
    }

    // Validate status
    if (!['pending', 'completed', 'rejected'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status must be pending, completed, or rejected'
      })
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount must be greater than 0'
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

    // Verify member exists
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

    // Create deposit
    const insertData: any = {
      member_id: member_id,
      amount: parseFloat(amount),
      from_wallet_address: from_wallet_address.trim(),
      to_wallet_address: to_wallet_address.trim(),
      payment_method: payment_method.trim(),
      wallet_model: wallet_model?.trim() || payment_method.trim(),
      status: status
    }

    // Add optional fields if provided
    if (coin_amount !== undefined) {
      insertData.coin_amount = parseFloat(coin_amount)
    }
    if (conversion_rate !== undefined) {
      insertData.conversion_rate = parseFloat(conversion_rate)
    }

    const { data: deposit, error } = await supabase
      .from('deposits')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating deposit:', error)
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Failed to create deposit'
      })
    }

    // Update member coin balance if status is completed
    if (status === 'completed' && deposit.coin_amount) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, coin_balance, total_coin')
        .eq('id', member_id)
        .single()

      if (!memberError && member) {
        const currentBalance = parseFloat(member.coin_balance || 0)
        const currentTotal = parseFloat(member.total_coin || 0)
        const coinToAdd = parseFloat(deposit.coin_amount)

        const { error: updateBalanceError } = await supabase
          .from('members')
          .update({
            coin_balance: currentBalance + coinToAdd,
            total_coin: currentTotal + coinToAdd
          })
          .eq('id', member_id)

        if (updateBalanceError) {
          console.error('Error updating member coin balance:', updateBalanceError)
        } else {
          console.log(`Updated member ${member_id} coin balance: ${currentBalance + coinToAdd}`)
        }
      }
    }

    return {
      success: true,
      message: 'Deposit berhasil dibuat',
      data: deposit
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Failed to create deposit'
    })
  }
})

