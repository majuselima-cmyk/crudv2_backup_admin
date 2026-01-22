/**
 * Utility function to calculate daily reward for all active staking
 * This function can be called from anywhere (login, middleware, etc.)
 * It will automatically skip if reward already calculated for today
 */
import { createClient } from '@supabase/supabase-js'

export async function calculateDailyReward(supabase: any, rewardDate?: string) {
  try {
    const today = rewardDate || new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Get reward_percentage from bonus_settings
    const { data: bonusSettings, error: settingsError } = await supabase
      .from('bonus_settings')
      .select('reward_percentage, is_active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (settingsError || !bonusSettings) {
      console.log('[calculateDailyReward] Bonus settings tidak ditemukan')
      return {
        success: false,
        message: 'Bonus settings tidak ditemukan',
        processed: 0,
        skipped: 0,
        errors: []
      }
    }

    if (!bonusSettings.is_active) {
      console.log('[calculateDailyReward] Bonus settings tidak aktif')
      return {
        success: true,
        message: 'Bonus settings tidak aktif, reward tidak dihitung',
        processed: 0,
        skipped: 0,
        errors: []
      }
    }

    const rewardPercentage = parseFloat(bonusSettings.reward_percentage) || 0.5

    // Get all active staking
    const { data: activeStakings, error: stakingError } = await supabase
      .from('staking')
      .select('id, member_id, coin_amount, reward_percentage')
      .eq('status', 'active')

    if (stakingError) {
      console.error('[calculateDailyReward] Error fetching staking:', stakingError)
      return {
        success: false,
        message: stakingError.message || 'Gagal mengambil data staking',
        processed: 0,
        skipped: 0,
        errors: []
      }
    }

    if (!activeStakings || activeStakings.length === 0) {
      console.log('[calculateDailyReward] Tidak ada staking aktif')
      return {
        success: true,
        message: 'Tidak ada staking aktif',
        processed: 0,
        skipped: 0,
        errors: []
      }
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as any[]
    }

    // Process each staking
    for (const staking of activeStakings) {
      try {
        // Check if reward already exists for this date
        const { data: existingReward } = await supabase
          .from('reward_history')
          .select('id')
          .eq('staking_id', staking.id)
          .eq('reward_date', today)
          .single()

        if (existingReward) {
          results.skipped++
          continue // Skip if reward already calculated for this date
        }

        // Calculate reward
        const coinAmount = parseFloat(staking.coin_amount) || 0
        const stakingRewardPercentage = parseFloat(staking.reward_percentage) || rewardPercentage
        const rewardAmount = coinAmount * (stakingRewardPercentage / 100)

        // Insert reward history
        const { error: insertError } = await supabase
          .from('reward_history')
          .insert({
            staking_id: staking.id,
            member_id: staking.member_id,
            reward_amount: rewardAmount,
            reward_date: today,
            coin_amount_staked: coinAmount,
            reward_percentage: stakingRewardPercentage,
            status: 'pending'
          })

        if (insertError) {
          results.errors.push({
            staking_id: staking.id,
            member_id: staking.member_id,
            error: insertError.message
          })
          console.error(`[calculateDailyReward] Error inserting reward for staking ${staking.id}:`, insertError)
        } else {
          results.processed++
        }
      } catch (error: any) {
        results.errors.push({
          staking_id: staking.id,
          member_id: staking.member_id,
          error: error.message || 'Unknown error'
        })
        console.error(`[calculateDailyReward] Error processing staking ${staking.id}:`, error)
      }
    }

    console.log(`[calculateDailyReward] Completed for ${today}: Processed: ${results.processed}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`)

    return {
      success: true,
      message: `Reward harian berhasil dihitung untuk tanggal ${today}`,
      date: today,
      reward_percentage: rewardPercentage,
      total_staking: activeStakings.length,
      ...results
    }
  } catch (error: any) {
    console.error('[calculateDailyReward] Unexpected error:', error)
    return {
      success: false,
      message: error.message || 'Gagal menghitung reward harian',
      processed: 0,
      skipped: 0,
      errors: [error.message || 'Unknown error']
    }
  }
}

