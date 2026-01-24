/**
 * Utility function to calculate reward for all active staking
 * Supports configurable interval (default 240 menit = 1 hari)
 * This function can be called from anywhere (login, middleware, etc.)
 * It will automatically skip if reward already calculated within interval
 * Auto-unstake staking yang sudah selesai waktunya
 */
import { createClient } from '@supabase/supabase-js'

/**
 * Auto-unstake staking yang sudah melewati duration_minutes
 */
async function autoUnstakeExpiredStakings(supabase: any, stakings: any[]) {
  const now = new Date()
  let unstakedCount = 0

  for (const staking of stakings) {
    try {
      if (!staking.staked_at || !staking.duration_minutes) continue

      const stakedAt = new Date(staking.staked_at)
      const durationMinutes = parseInt(staking.duration_minutes) || 0
      const endDate = new Date(stakedAt.getTime() + durationMinutes * 60 * 1000)

      // Jika waktu sudah melewati end date, auto-unstake
      if (now >= endDate) {
        const coinAmount = parseFloat(staking.coin_amount) || 0

        // Update staking status to unstaked
        const { error: updateStakingError } = await supabase
          .from('staking')
          .update({
            status: 'unstaked',
            unstaked_at: now.toISOString()
          })
          .eq('id', staking.id)

        if (updateStakingError) {
          console.error(`[autoUnstakeExpiredStakings] Error updating staking ${staking.id}:`, updateStakingError)
          continue
        }

        // Update member_coins: decrease staked_coins
        const { data: memberCoins, error: coinsError } = await supabase
          .from('member_coins')
          .select('staked_coins')
          .eq('member_id', staking.member_id)
          .single()

        if (coinsError || !memberCoins) {
          console.error(`[autoUnstakeExpiredStakings] Error fetching member_coins for ${staking.member_id}:`, coinsError)
          continue
        }

        const currentStakedCoins = parseFloat(memberCoins.staked_coins) || 0
        const newStakedCoins = Math.max(0, currentStakedCoins - coinAmount)

        const { error: updateCoinsError } = await supabase
          .from('member_coins')
          .update({
            staked_coins: newStakedCoins
          })
          .eq('member_id', staking.member_id)

        if (updateCoinsError) {
          console.error(`[autoUnstakeExpiredStakings] Error updating member_coins for ${staking.member_id}:`, updateCoinsError)
          // Rollback: revert staking status
          await supabase
            .from('staking')
            .update({
              status: 'active',
              unstaked_at: null
            })
            .eq('id', staking.id)
          continue
        }

        // Create staking history record for auto-unstake
        try {
          await supabase
            .from('staking_history')
            .insert({
              staking_id: staking.id,
              member_id: staking.member_id,
              action: 'auto_unstaked',
              coin_amount: coinAmount,
              reward_percentage: parseFloat(staking.reward_percentage) || 0,
              duration_minutes: durationMinutes,
              staked_at: stakedAt.toISOString(),
              unstaked_at: now.toISOString(),
              notes: `Auto-unstake: Waktu staking selesai (expired at ${endDate.toISOString()})`
            })
        } catch (historyError) {
          console.error(`[autoUnstakeExpiredStakings] Error creating history for staking ${staking.id}:`, historyError)
        }

        unstakedCount++
        console.log(`[autoUnstakeExpiredStakings] Auto-unstaked staking ${staking.id} (expired at ${endDate.toISOString()})`)
      }
    } catch (error: any) {
      console.error(`[autoUnstakeExpiredStakings] Error processing staking ${staking.id}:`, error)
    }
  }

  return unstakedCount
}

export async function calculateDailyReward(supabase: any, rewardDate?: string, forceCalculate: boolean = false) {
  try {
    const today = rewardDate || new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const now = new Date()

    // Get reward_percentage & interval from bonus_settings
    const { data: bonusSettings, error: settingsError } = await supabase
      .from('bonus_settings')
      .select('reward_percentage, is_active, reward_interval_minutes, last_reward_calculated')
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

    // Check interval (default 240 menit = 1 hari)
    const rewardIntervalMinutes = bonusSettings.reward_interval_minutes || 240
    const lastCalculated = bonusSettings.last_reward_calculated ? new Date(bonusSettings.last_reward_calculated) : null
    
    if (!forceCalculate && lastCalculated) {
      const minutesSinceLastCalculation = (now.getTime() - lastCalculated.getTime()) / (1000 * 60)
      if (minutesSinceLastCalculation < rewardIntervalMinutes) {
        console.log(`[calculateDailyReward] Reward sudah dihitung ${minutesSinceLastCalculation.toFixed(2)} menit lalu. Tunggu ${(rewardIntervalMinutes - minutesSinceLastCalculation).toFixed(2)} menit lagi.`)
        return {
          success: true,
          message: `Reward sudah dihitung. Interval: ${rewardIntervalMinutes} menit. Tunggu ${(rewardIntervalMinutes - minutesSinceLastCalculation).toFixed(2)} menit lagi.`,
          processed: 0,
          skipped: 0,
          errors: [],
          next_calculation: new Date(lastCalculated.getTime() + rewardIntervalMinutes * 60 * 1000).toISOString()
        }
      }
    }

    const rewardPercentage = parseFloat(bonusSettings.reward_percentage) || 0.5

    // Get all active staking
    const { data: activeStakings, error: stakingError } = await supabase
      .from('staking')
      .select('id, member_id, coin_amount, reward_percentage, staked_at, duration_minutes')
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

    // Auto-unstake staking yang sudah selesai waktunya
    const autoUnstakedCount = await autoUnstakeExpiredStakings(supabase, activeStakings || [])
    if (autoUnstakedCount > 0) {
      console.log(`[calculateDailyReward] Auto-unstaked ${autoUnstakedCount} staking yang sudah selesai`)
    }

    // Get updated active staking list (after auto-unstake)
    const { data: updatedActiveStakings } = await supabase
      .from('staking')
      .select('id, member_id, coin_amount, reward_percentage')
      .eq('status', 'active')

    if (!updatedActiveStakings || updatedActiveStakings.length === 0) {
      console.log('[calculateDailyReward] Tidak ada staking aktif')
      return {
        success: true,
        message: 'Tidak ada staking aktif',
        processed: 0,
        skipped: 0,
        errors: [],
        auto_unstaked: autoUnstakedCount
      }
    }

    const results = {
      processed: 0,
      skipped: 0,
      errors: [] as any[]
    }

    // Process each staking
    for (const staking of updatedActiveStakings) {
      try {
        // Check if reward already exists WITHIN interval (bukan per hari, per interval)
        // Cari reward paling baru untuk staking ini
        const { data: existingReward } = await supabase
          .from('reward_history')
          .select('created_at')
          .eq('staking_id', staking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        // Jika ada reward sebelumnya, check apakah sudah lewat interval
        if (existingReward) {
          const lastRewardTime = new Date(existingReward.created_at)
          const minutesSinceLastReward = (now.getTime() - lastRewardTime.getTime()) / (1000 * 60)
          
          if (minutesSinceLastReward < rewardIntervalMinutes) {
            results.skipped++
            continue // Skip jika belum lewat interval
          }
        }

        // Calculate reward
        const coinAmount = parseFloat(staking.coin_amount) || 0
        const stakingRewardPercentage = parseFloat(staking.reward_percentage) || rewardPercentage
        const rewardAmount = coinAmount * (stakingRewardPercentage / 100)

        // Insert reward history dengan reward_date = hari ini, tapi bisa multiple per hari sesuai interval
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

    // Update last_reward_calculated in bonus_settings jika ada yang di-process
    if (results.processed > 0 || forceCalculate) {
      const { error: updateError } = await supabase
        .from('bonus_settings')
        .update({
          last_reward_calculated: now.toISOString()
        })
        .order('created_at', { ascending: false })
        .limit(1)

      if (updateError) {
        console.warn('[calculateDailyReward] Warning: Gagal update last_reward_calculated:', updateError)
      } else {
        console.log(`[calculateDailyReward] Updated last_reward_calculated to ${now.toISOString()}`)
      }
    }

    return {
      success: true,
      message: `Reward harian berhasil dihitung untuk tanggal ${today}`,
      date: today,
      reward_percentage: rewardPercentage,
      reward_interval_minutes: rewardIntervalMinutes,
      total_staking: updatedActiveStakings.length,
      auto_unstaked: autoUnstakedCount,
      next_calculation: new Date(now.getTime() + rewardIntervalMinutes * 60 * 1000).toISOString(),
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

