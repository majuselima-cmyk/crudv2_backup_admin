/**
 * Create new deposit
 * POST /api/admin/deposits
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
      status
    } = body

    // Validation
    if (!member_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Member ID is required'
      })
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount must be greater than 0'
      })
    }

    if (!from_wallet_address) {
      throw createError({
        statusCode: 400,
        statusMessage: 'From wallet address is required'
      })
    }

    if (!to_wallet_address) {
      throw createError({
        statusCode: 400,
        statusMessage: 'To wallet address is required'
      })
    }

    if (!payment_method) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment method is required'
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
      .select('id, member_type')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member not found'
      })
    }

    // Calculate coin_amount and conversion_rate if not provided
    let finalCoinAmount = coin_amount ? parseFloat(coin_amount) : null
    let finalConversionRate = conversion_rate ? parseFloat(conversion_rate) : null

    // If coin_amount or conversion_rate not provided, calculate from coin settings
    if (!finalCoinAmount || !finalConversionRate) {
      const { data: coinSettings } = await supabase
        .from('coin_settings')
        .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
        .single()

      if (coinSettings) {
        // Get price based on member type
        let pricePerCoin = parseFloat(coinSettings.normal_price_usdt) || 0.5
        if (member.member_type === 'vip' && coinSettings.vip_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
        } else if (member.member_type === 'leader' && coinSettings.leader_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
        }

        // Calculate conversion rate: 1 USDT / price_per_coin = jumlah coin per 1 USDT
        finalConversionRate = pricePerCoin > 0 ? 1 / pricePerCoin : 2.0
        finalCoinAmount = parseFloat(amount) * finalConversionRate
      } else {
        // Fallback to default
        finalConversionRate = 2.0
        finalCoinAmount = parseFloat(amount) * 2.0
      }
    }

    // Create deposit
    const { data: newDeposit, error: createError } = await supabase
      .from('deposits')
      .insert({
        member_id,
        amount: parseFloat(amount),
        coin_amount: finalCoinAmount,
        conversion_rate: finalConversionRate,
        from_wallet_address: from_wallet_address.trim(),
        to_wallet_address: to_wallet_address.trim(),
        payment_method: payment_method.trim(),
        wallet_model: wallet_model?.trim() || null,
        status
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating deposit:', createError)
      throw createError({
        statusCode: 500,
        statusMessage: createError.message || 'Failed to create deposit'
      })
    }

    return {
      success: true,
      data: newDeposit,
      message: 'Deposit created successfully'
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to create deposit'
    })
  }
})

