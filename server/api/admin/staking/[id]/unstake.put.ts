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

    // Update member_coins: decrease staked_coins, increase available_coins
    const newStakedCoins = Math.max(0, currentStakedCoins - coinAmount)
    const newAvailableCoins = currentAvailableCoins + coinAmount

    const { error: updateCoinsError } = await supabase
      .from('member_coins')
      .update({
        staked_coins: newStakedCoins,
        available_coins: newAvailableCoins
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

    return {
      success: true,
      message: 'Unstaking berhasil dilakukan',
      data: updatedStaking
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal melakukan unstaking'
    })
  }
})

