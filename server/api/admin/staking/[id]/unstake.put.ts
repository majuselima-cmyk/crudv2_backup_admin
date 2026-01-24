/**
 * Unstake staking (Admin only)
 * PUT /api/admin/staking/[id]/unstake
 * Body: { }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const stakingId = getRouterParam(event, 'id')

    if (!stakingId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'staking_id wajib diisi'
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

    // Get staking record
    const { data: staking, error: stakingError } = await supabase
      .from('staking')
      .select('*')
      .eq('id', stakingId)
      .single()

    if (stakingError || !staking) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Staking tidak ditemukan'
      })
    }

    // Check if already unstaked
    if (staking.status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: `Staking sudah di-unstake (status: ${staking.status})`
      })
    }

    // Get member_coins
    const { data: memberCoins, error: coinsError } = await supabase
      .from('member_coins')
      .select('*')
      .eq('member_id', staking.member_id)
      .single()

    if (coinsError || !memberCoins) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member coins tidak ditemukan'
      })
    }

    const coinAmount = parseFloat(staking.coin_amount) || 0
    const currentStakedCoins = parseFloat(memberCoins.staked_coins) || 0
    const currentAvailableCoins = parseFloat(memberCoins.available_coins) || 0

    // Update staking status to unstaked
    const { data: updatedStaking, error: updateStakingError } = await supabase
      .from('staking')
      .update({
        status: 'unstaked',
        unstaked_at: new Date().toISOString()
      })
      .eq('id', stakingId)
      .select('*')
      .single()

    if (updateStakingError) {
      throw createError({
        statusCode: 500,
        statusMessage: updateStakingError.message || 'Gagal mengupdate staking'
      })
    }

    // Update member_coins: decrease staked_coins
    // Note: available_coins will be calculated by trigger: available_coins = total_coins - staked_coins
    const newStakedCoins = Math.max(0, currentStakedCoins - coinAmount)

    const { error: updateCoinsError } = await supabase
      .from('member_coins')
      .update({
        staked_coins: newStakedCoins
      })
      .eq('member_id', staking.member_id)

    if (updateCoinsError) {
      // Rollback: revert staking status
      await supabase
        .from('staking')
        .update({
          status: 'active',
          unstaked_at: null
        })
        .eq('id', stakingId)

      throw createError({
        statusCode: 500,
        statusMessage: updateCoinsError.message || 'Gagal mengupdate member_coins'
      })
    }

    // Create staking history record for unstake
    try {
      await supabase
        .from('staking_history')
        .insert({
          staking_id: stakingId,
          member_id: staking.member_id,
          action: 'unstaked',
          coin_amount: coinAmount,
          reward_percentage: parseFloat(staking.reward_percentage) || 0,
          duration_minutes: parseInt(staking.duration_minutes) || 0,
          staked_at: staking.staked_at,
          unstaked_at: updatedStaking.unstaked_at,
          notes: 'Unstake manual oleh admin'
        })
    } catch (historyError) {
      console.error('[unstake] Error creating staking history:', historyError)
      // Don't fail the request if history insert fails
    }

    return {
      success: true,
      message: 'Unstaking berhasil dilakukan',
      data: updatedStaking
    }
  } catch (error: any) {
    console.error('[unstake] Error:', error)
    
    // Jika sudah H3Error, throw langsung
    if (error && typeof error === 'object' && (error.statusCode || error._statusCode)) {
      throw error
    }

    // Jika error lain, wrap dengan proper format
    throw createError({
      statusCode: error?.statusCode || error?.data?.statusCode || 500,
      statusMessage: error?.message || error?.data?.message || 'Gagal melakukan unstaking'
    })
  }
})

