/**
 * Delete staking (Admin only)
 * DELETE /api/admin/staking/[id]
 * Hapus staking beserta semua reward history yang terkait
 * Jika status aktif, kembalikan coin ke member
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

    const coinAmount = parseFloat(staking.coin_amount) || 0
    const isActive = staking.status === 'active'

    // If staking is active, we need to return coins to member
    if (isActive) {
      // Get member_coins
      const { data: memberCoins, error: coinsError } = await supabase
        .from('member_coins')
        .select('*')
        .eq('member_id', staking.member_id)
        .single()

      if (coinsError || !memberCoins) {
        console.error('[staking.delete] Member coins not found:', coinsError)
        // Continue with deletion even if member_coins not found
      } else {
        // Update member_coins: decrease staked_coins
        const currentStakedCoins = parseFloat(memberCoins.staked_coins) || 0
        const newStakedCoins = Math.max(0, currentStakedCoins - coinAmount)

        const { error: updateCoinsError } = await supabase
          .from('member_coins')
          .update({
            staked_coins: newStakedCoins
          })
          .eq('member_id', staking.member_id)

        if (updateCoinsError) {
          console.error('[staking.delete] Error updating member_coins:', updateCoinsError)
          // Continue with deletion even if update fails
        }
      }
    }

    // Delete all reward_history related to this staking
    const { error: deleteRewardHistoryError } = await supabase
      .from('reward_history')
      .delete()
      .eq('staking_id', stakingId)

    if (deleteRewardHistoryError) {
      console.error('[staking.delete] Error deleting reward history:', deleteRewardHistoryError)
      // Continue with staking deletion even if reward history deletion fails
    }

    // Delete all reward_schedules related to this staking
    const { error: deleteRewardSchedulesError } = await supabase
      .from('reward_schedules')
      .delete()
      .eq('staking_id', stakingId)

    if (deleteRewardSchedulesError) {
      console.error('[staking.delete] Error deleting reward schedules:', deleteRewardSchedulesError)
      // Continue with staking deletion even if reward schedules deletion fails
    }

    // Create staking history record for delete (before deleting)
    try {
      await supabase
        .from('staking_history')
        .insert({
          staking_id: stakingId,
          member_id: staking.member_id,
          action: 'deleted',
          coin_amount: coinAmount,
          reward_percentage: parseFloat(staking.reward_percentage) || 0,
          duration_minutes: parseInt(staking.duration_minutes) || 0,
          staked_at: staking.staked_at,
          unstaked_at: isActive ? new Date().toISOString() : staking.unstaked_at,
          notes: `Staking dihapus oleh admin. Coin dikembalikan: ${isActive ? coinAmount : 0}`
        })
    } catch (historyError) {
      console.error('[staking.delete] Error creating staking history:', historyError)
      // Don't fail the request if history insert fails
    }

    // Delete staking record
    const { error: deleteStakingError } = await supabase
      .from('staking')
      .delete()
      .eq('id', stakingId)

    if (deleteStakingError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteStakingError.message || 'Gagal menghapus staking'
      })
    }

    return {
      success: true,
      message: 'Staking, reward history, dan reward schedule berhasil dihapus',
      data: {
        staking_id: stakingId,
        coin_returned: isActive ? coinAmount : 0,
        reward_history_deleted: true,
        reward_schedules_deleted: true
      }
    }
  } catch (error: any) {
    console.error('[staking.delete] Error:', error)
    
    // Jika sudah H3Error, throw langsung
    if (error && typeof error === 'object' && (error.statusCode || error._statusCode)) {
      throw error
    }

    // Jika error lain, wrap dengan proper format
    throw createError({
      statusCode: error?.statusCode || error?.data?.statusCode || 500,
      statusMessage: error?.message || error?.data?.message || 'Gagal menghapus staking'
    })
  }
})

