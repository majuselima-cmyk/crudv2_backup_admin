/**
 * Update deposit
 * PUT /api/admin/deposits/[id]
 * Body: { amount, coin_amount, conversion_rate, from_wallet_address, to_wallet_address, payment_method, wallet_model, status }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const depositId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!depositId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Deposit ID is required'
      })
    }

    const {
      amount,
      coin_amount,
      conversion_rate,
      from_wallet_address,
      to_wallet_address,
      payment_method,
      wallet_model,
      status
    } = body

    // Validate required fields
    if (!amount || !from_wallet_address || !to_wallet_address || !payment_method || !status) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount, from_wallet_address, to_wallet_address, payment_method, and status are required'
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

    // Get current deposit to check previous status
    const { data: currentDeposit, error: currentError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .single()

    if (currentError || !currentDeposit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Deposit not found'
      })
    }

    const previousStatus = currentDeposit.status
    const previousCoinAmount = currentDeposit.coin_amount || 0

    // Update deposit
    const updateData: any = {
      amount: parseFloat(amount),
      from_wallet_address: from_wallet_address.trim(),
      to_wallet_address: to_wallet_address.trim(),
      payment_method: payment_method.trim(),
      wallet_model: wallet_model?.trim() || payment_method.trim(),
      status: status
    }

    // Add optional fields if provided
    const newCoinAmount = coin_amount !== undefined ? parseFloat(coin_amount) : previousCoinAmount
    if (coin_amount !== undefined) {
      updateData.coin_amount = newCoinAmount
    }
    if (conversion_rate !== undefined) {
      updateData.conversion_rate = parseFloat(conversion_rate)
    }

    const { data: deposit, error } = await supabase
      .from('deposits')
      .update(updateData)
      .eq('id', depositId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating deposit:', error)
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Failed to update deposit'
      })
    }

    if (!deposit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Deposit not found'
      })
    }

    // Update member coin balance when status changes to/from completed
    if (previousStatus !== status || (status === 'completed' && newCoinAmount !== previousCoinAmount)) {
      // Get member current balance
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, coin_balance, total_coin')
        .eq('id', deposit.member_id)
        .single()

      if (!memberError && member) {
        let newCoinBalance = parseFloat(member.coin_balance || 0)
        let newTotalCoin = parseFloat(member.total_coin || 0)

        if (status === 'completed' && previousStatus !== 'completed') {
          // Add coin when status becomes completed
          newCoinBalance += newCoinAmount
          newTotalCoin += newCoinAmount
        } else if (previousStatus === 'completed' && status !== 'completed') {
          // Subtract coin when status changes from completed to something else
          newCoinBalance -= previousCoinAmount
          newTotalCoin -= previousCoinAmount
        } else if (status === 'completed' && previousStatus === 'completed' && newCoinAmount !== previousCoinAmount) {
          // If already completed but coin_amount changed, adjust the difference
          const difference = newCoinAmount - previousCoinAmount
          newCoinBalance += difference
          newTotalCoin += difference
        }

        // Ensure balance doesn't go negative
        newCoinBalance = Math.max(0, newCoinBalance)
        newTotalCoin = Math.max(0, newTotalCoin)

        // Update member coin balance
        const { error: updateBalanceError } = await supabase
          .from('members')
          .update({
            coin_balance: newCoinBalance,
            total_coin: newTotalCoin
          })
          .eq('id', deposit.member_id)

        if (updateBalanceError) {
          console.error('Error updating member coin balance:', updateBalanceError)
          // Don't throw error, just log it - deposit update was successful
        } else {
          console.log(`Updated member ${deposit.member_id} coin balance: ${newCoinBalance} (was ${member.coin_balance || 0})`)
        }
      }
    }

    return {
      success: true,
      message: 'Deposit berhasil diupdate',
      data: deposit
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Failed to update deposit'
    })
  }
})

