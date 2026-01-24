/**
 * Reset reward untuk staking
 * PUT /api/admin/staking/:id/reset-reward
 * Reset total_reward_earned menjadi 0 dan hapus semua reward_history
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Staking ID is required'
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

    // Get staking data first
    const { data: staking, error: fetchError } = await supabase
      .from('staking')
      .select('id, member_id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) {
      console.error('[reset-reward] Error fetching staking:', fetchError)
      throw createError({
        statusCode: 500,
        statusMessage: fetchError.message || 'Gagal mengambil data staking'
      })
    }

    if (!staking) {
      console.error('[reset-reward] Staking not found:', id)
      throw createError({
        statusCode: 404,
        statusMessage: 'Staking tidak ditemukan'
      })
    }

    // Get reward history untuk menghitung total reward sebelum dihapus
    const { data: rewardHistory, error: rewardHistoryError } = await supabase
      .from('reward_history')
      .select('reward_amount')
      .eq('staking_id', id)

    if (rewardHistoryError) {
      console.error('[reset-reward] Error fetching reward history:', rewardHistoryError)
      // Continue even if we can't fetch reward history
    }

    // Calculate previous reward from reward_history
    const previousReward = (rewardHistory || []).reduce((sum: number, reward: any) => {
      return sum + (parseFloat(reward.reward_amount) || 0)
    }, 0)

    // Hapus semua reward_history yang terkait dengan staking ini
    const { error: deleteRewardHistoryError } = await supabase
      .from('reward_history')
      .delete()
      .eq('staking_id', id)

    if (deleteRewardHistoryError) {
      console.error('[reset-reward] Error deleting reward history:', deleteRewardHistoryError)
      throw createError({
        statusCode: 500,
        statusMessage: deleteRewardHistoryError.message || 'Gagal menghapus reward history'
      })
    }

    // Note: total_reward_earned is calculated dynamically from reward_history
    // So we don't need to update it - it will be 0 automatically after deleting reward_history

    return {
      success: true,
      message: 'Reward dan reward history berhasil direset',
      data: {
        staking_id: id,
        previous_reward: previousReward,
        new_reward: 0,
        reward_history_deleted: true
      }
    }
  } catch (error: any) {
    console.error('[reset-reward] Error:', error)
    
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal reset reward'
    })
  }
})
