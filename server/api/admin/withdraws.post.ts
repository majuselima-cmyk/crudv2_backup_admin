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
      amount_coin,
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

    if (!withdraw_type || !['balance', 'coin'].includes(withdraw_type)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid withdraw_type. Must be: balance or coin'
      })
    }

    // Initialize Supabase first (needed for validation)
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

    // Validation for amount based on withdraw_type
    if (withdraw_type === 'balance') {
      if (!amount || parseFloat(amount) <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Amount (USDT) must be greater than 0'
        })
      }
    } else if (withdraw_type === 'coin') {
      if (!amount_coin || parseFloat(amount_coin) <= 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Amount (Coin) must be greater than 0'
        })
      }
      // Calculate amount from amount_coin (will need coin price from member)
      // Get member to get coin price
      const { data: memberData } = await supabase
        .from('members')
        .select('member_type')
        .eq('id', member_id)
        .single()
      
      // Get coin settings for price
      const { data: coinSettings } = await supabase
        .from('coin_settings')
        .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
        .single()
      
      let coinPrice = parseFloat(coinSettings?.normal_price_usdt) || 0.5
      if (memberData?.member_type === 'vip' && coinSettings?.vip_price_usdt) {
        coinPrice = parseFloat(coinSettings.vip_price_usdt)
      } else if (memberData?.member_type === 'leader' && coinSettings?.leader_price_usdt) {
        coinPrice = parseFloat(coinSettings.leader_price_usdt)
      }
      
      // Calculate amount (USDT) from amount_coin
      const calculatedAmount = parseFloat(amount_coin) * coinPrice
      // Use calculated amount if amount not provided, otherwise use provided amount
      if (!amount || parseFloat(amount) <= 0) {
        amount = calculatedAmount.toString()
      }
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

    // Check if member exists and get member type for coin price calculation
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

    // Calculate amount from amount_coin if withdraw_type is 'coin'
    let finalAmount = parseFloat(amount)
    if (withdraw_type === 'coin' && amount_coin) {
      // Get coin settings for price
      const { data: coinSettings } = await supabase
        .from('coin_settings')
        .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
        .single()
      
      let coinPrice = parseFloat(coinSettings?.normal_price_usdt) || 0.5
      if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
        coinPrice = parseFloat(coinSettings.vip_price_usdt)
      } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
        coinPrice = parseFloat(coinSettings.leader_price_usdt)
      }
      
      // Calculate amount (USDT) from amount_coin
      finalAmount = parseFloat(amount_coin) * coinPrice
    }

    // Determine withdraw_category based on withdraw_type
    let withdraw_category = null
    if (withdraw_type === 'balance') {
      withdraw_category = 'bonus_referral' // Balance USDT dari bonus pasif referral 80%
    } else if (withdraw_type === 'coin') {
      withdraw_category = 'coin' // Withdraw coin
    }

    // Create withdraw - build insert object
    const insertData: any = {
      member_id,
      withdraw_type,
      withdraw_category,
      amount: finalAmount,
      wallet_address,
      wallet_network,
      wallet_model: wallet_model || null,
      notes: notes || null,
      status
    }
    
    // Add amount_coin if provided (for coin withdraw type)
    if (amount_coin) {
      insertData.amount_coin = parseFloat(amount_coin)
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

