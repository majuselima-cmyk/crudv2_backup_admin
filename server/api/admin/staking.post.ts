/**
 * Create new staking (Admin only)
 * POST /api/admin/staking
 * Body: { member_id, coin_amount, reward_percentage? }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { member_id, coin_amount, reward_percentage } = body

    // Validate required fields
    if (!member_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'member_id wajib diisi'
      })
    }

    if (!coin_amount || parseFloat(coin_amount) <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'coin_amount harus lebih dari 0'
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

    // Verify member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, username, member_type')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member tidak ditemukan'
      })
    }

    // Get or create member_coins record
    let { data: memberCoins, error: coinsError } = await supabase
      .from('member_coins')
      .select('*')
      .eq('member_id', member_id)
      .single()

    if (coinsError && coinsError.code === 'PGRST116') {
      // Member coins doesn't exist, create it
      // Get coin price from coin_settings based on member_type
      const { data: coinSettings } = await supabase
        .from('coin_settings')
        .select('price_per_coin_usdt, leader_price_usdt, presale_price_usdt')
        .single()

      let coinPrice = 0.5 // default
      if (coinSettings) {
        if (member.member_type === 'leader') {
          coinPrice = parseFloat(coinSettings.leader_price_usdt) || 0.5
        } else if (member.member_type === 'presale' || member.member_type === 'vip') {
          coinPrice = parseFloat(coinSettings.presale_price_usdt) || 0.4
        } else {
          coinPrice = parseFloat(coinSettings.price_per_coin_usdt) || 0.5
        }
      }

      const { data: newMemberCoins, error: createError } = await supabase
        .from('member_coins')
        .insert({
          member_id,
          total_coins: 0,
          staked_coins: 0,
          available_coins: 0,
          coin_price: coinPrice,
          member_type: member.member_type || 'normal'
        })
        .select('*')
        .single()

      if (createError) {
        throw createError({
          statusCode: 500,
          statusMessage: createError.message || 'Gagal membuat member_coins'
        })
      }

      memberCoins = newMemberCoins
    } else if (coinsError) {
      throw createError({
        statusCode: 500,
        statusMessage: coinsError.message || 'Gagal mengambil data member_coins'
      })
    }

    // Validate available coins
    const coinAmount = parseFloat(coin_amount)
    const availableCoins = parseFloat(memberCoins.available_coins) || 0

    if (coinAmount > availableCoins) {
      throw createError({
        statusCode: 400,
        statusMessage: `Koin yang tersedia tidak cukup. Tersedia: ${availableCoins}, Diminta: ${coinAmount}`
      })
    }

    // Get reward_percentage from bonus_settings if not provided
    let finalRewardPercentage = reward_percentage
    if (!finalRewardPercentage) {
      const { data: bonusSettings } = await supabase
        .from('bonus_settings')
        .select('reward_percentage')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (bonusSettings) {
        finalRewardPercentage = parseFloat(bonusSettings.reward_percentage) || 0.5
      } else {
        finalRewardPercentage = 0.5 // default
      }
    } else {
      finalRewardPercentage = parseFloat(finalRewardPercentage)
    }

    // Create staking record
    const { data: newStaking, error: stakingError } = await supabase
      .from('staking')
      .insert({
        member_id,
        coin_amount: coinAmount,
        reward_percentage: finalRewardPercentage,
        status: 'active',
        staked_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (stakingError) {
      throw createError({
        statusCode: 500,
        statusMessage: stakingError.message || 'Gagal membuat staking'
      })
    }

    // Update member_coins: increase staked_coins, decrease available_coins
    const newStakedCoins = (parseFloat(memberCoins.staked_coins) || 0) + coinAmount
    const newAvailableCoins = availableCoins - coinAmount

    const { error: updateError } = await supabase
      .from('member_coins')
      .update({
        staked_coins: newStakedCoins,
        available_coins: newAvailableCoins
      })
      .eq('member_id', member_id)

    if (updateError) {
      // Rollback: delete staking if update fails
      await supabase
        .from('staking')
        .delete()
        .eq('id', newStaking.id)

      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Gagal mengupdate member_coins'
      })
    }

    return {
      success: true,
      message: 'Staking berhasil dibuat',
      data: newStaking
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal membuat staking'
    })
  }
})

