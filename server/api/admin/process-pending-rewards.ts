/**
 * Process pending rewards - Update status from pending to paid when scheduled time is reached
 * POST /api/admin/process-pending-rewards
 * Auto-update reward schedules yang sudah waktunya dan update total_reward_earned di staking
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
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

    const now = new Date().toISOString()

    // Get all pending reward schedules yang sudah waktunya
    const { data: pendingSchedules, error: fetchError } = await supabase
      .from('reward_schedules')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now)
      .order('scheduled_time', { ascending: true })

    if (fetchError) {
      console.error('[process-pending-rewards] Error fetching pending schedules:', fetchError)
      throw createError({
        statusCode: 500,
        statusMessage: fetchError.message || 'Gagal mengambil pending schedules'
      })
    }

    if (!pendingSchedules || pendingSchedules.length === 0) {
      return {
        success: true,
        message: 'Tidak ada reward yang perlu diproses',
        processed: 0,
        data: []
      }
    }

    let processedCount = 0
    const errors: string[] = []

    // Process each pending schedule
    for (const schedule of pendingSchedules) {
      try {
        // Check if staking masih aktif
        const { data: staking, error: stakingError } = await supabase
          .from('staking')
          .select('id, status, total_reward_earned')
          .eq('id', schedule.staking_id)
          .single()

        if (stakingError || !staking) {
          console.error(`[process-pending-rewards] Staking ${schedule.staking_id} not found:`, stakingError)
          errors.push(`Staking ${schedule.staking_id} tidak ditemukan`)
          continue
        }

        // Skip jika staking sudah tidak aktif
        if (staking.status !== 'active') {
          console.log(`[process-pending-rewards] Staking ${schedule.staking_id} is not active, skipping`)
          // Update schedule status to skipped
          await supabase
            .from('reward_schedules')
            .update({ status: 'skipped' })
            .eq('id', schedule.id)
          continue
        }

        // Update reward schedule status to paid
        const { error: updateScheduleError } = await supabase
          .from('reward_schedules')
          .update({ 
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id)

        if (updateScheduleError) {
          console.error(`[process-pending-rewards] Error updating schedule ${schedule.id}:`, updateScheduleError)
          errors.push(`Gagal update schedule ${schedule.id}`)
          continue
        }

        // Create or update reward history
        const rewardAmount = parseFloat(schedule.reward_amount) || 0
        
        // Check if reward history already exists
        const { data: existingReward, error: checkRewardError } = await supabase
          .from('reward_history')
          .select('id')
          .eq('staking_id', schedule.staking_id)
          .eq('member_id', schedule.member_id)
          .gte('reward_date', new Date(new Date(schedule.scheduled_time).getTime() - 60000).toISOString()) // Within 1 minute
          .lte('reward_date', new Date(new Date(schedule.scheduled_time).getTime() + 60000).toISOString())
          .maybeSingle()

        let rewardHistoryId = null

        if (!existingReward) {
          // Create new reward history
          const { data: newReward, error: createRewardError } = await supabase
            .from('reward_history')
            .insert({
              member_id: schedule.member_id,
              staking_id: schedule.staking_id,
              reward_amount: rewardAmount,
              reward_date: schedule.scheduled_time,
              status: 'paid',
              created_at: new Date().toISOString()
            })
            .select('id')
            .single()

          if (createRewardError) {
            console.error(`[process-pending-rewards] Error creating reward history:`, createRewardError)
            errors.push(`Gagal membuat reward history untuk schedule ${schedule.id}`)
            continue
          }

          rewardHistoryId = newReward.id
        } else {
          // Update existing reward history to paid
          const { error: updateRewardError } = await supabase
            .from('reward_history')
            .update({ 
              status: 'paid',
              updated_at: new Date().toISOString()
            })
            .eq('id', existingReward.id)

          if (updateRewardError) {
            console.error(`[process-pending-rewards] Error updating reward history:`, updateRewardError)
            errors.push(`Gagal update reward history untuk schedule ${schedule.id}`)
            continue
          }

          rewardHistoryId = existingReward.id
        }

        // Update reward_history_id in schedule
        await supabase
          .from('reward_schedules')
          .update({ reward_history_id: rewardHistoryId })
          .eq('id', schedule.id)

        // Update total_reward_earned di staking
        const currentTotal = parseFloat(staking.total_reward_earned) || 0
        const newTotal = currentTotal + rewardAmount

        const { error: updateStakingError } = await supabase
          .from('staking')
          .update({ 
            total_reward_earned: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.staking_id)

        if (updateStakingError) {
          console.error(`[process-pending-rewards] Error updating staking total_reward_earned:`, updateStakingError)
          errors.push(`Gagal update total reward untuk staking ${schedule.staking_id}`)
          continue
        }

        // Update member_coins.total_coins saat reward paid
        // rewardAmount sudah dalam coin, langsung tambahkan ke total_coins
        // Trigger akan otomatis update available_coins = total_coins - staked_coins
        try {
          // Get current total_coins
          const { data: currentCoins, error: fetchCoinsError } = await supabase
            .from('member_coins')
            .select('total_coins')
            .eq('member_id', schedule.member_id)
            .single()
          
          if (!fetchCoinsError && currentCoins) {
            const currentTotalCoins = parseFloat(String(currentCoins.total_coins || 0)) || 0
            const newTotalCoins = currentTotalCoins + rewardAmount
            
            const { error: updateCoinsError } = await supabase
              .from('member_coins')
              .update({ total_coins: newTotalCoins })
              .eq('member_id', schedule.member_id)
            
            if (updateCoinsError) {
              console.error(`[process-pending-rewards] Error updating member_coins.total_coins:`, updateCoinsError)
              // Tidak throw error, hanya log karena reward history sudah ter-update
            } else {
              console.log(`[process-pending-rewards] Updated member_coins.total_coins for member ${schedule.member_id}, added ${rewardAmount} coins (${currentTotalCoins} → ${newTotalCoins})`)
            }
          } else {
            console.warn(`[process-pending-rewards] Member coins not found for member ${schedule.member_id}, skipping total_coins update`)
          }
        } catch (coinsUpdateError: any) {
          console.error(`[process-pending-rewards] Error updating member_coins:`, coinsUpdateError)
          // Tidak throw error, hanya log karena reward history sudah ter-update
        }

        processedCount++
        console.log(`[process-pending-rewards] Processed schedule ${schedule.id} for staking ${schedule.staking_id}, reward: ${rewardAmount}`)

      } catch (scheduleError: any) {
        console.error(`[process-pending-rewards] Error processing schedule ${schedule.id}:`, scheduleError)
        errors.push(`Error processing schedule ${schedule.id}: ${scheduleError.message}`)
      }
    }

    return {
      success: true,
      message: `Berhasil memproses ${processedCount} dari ${pendingSchedules.length} reward`,
      processed: processedCount,
      total: pendingSchedules.length,
      errors: errors.length > 0 ? errors : undefined,
      data: {
        processed: processedCount,
        total: pendingSchedules.length,
        errors: errors.length
      }
    }
  } catch (error: any) {
    console.error('[process-pending-rewards] Error:', error)
    
    if (error && typeof error === 'object' && (error.statusCode || error._statusCode)) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || error?.data?.statusCode || 500,
      statusMessage: error?.message || error?.data?.message || 'Gagal memproses pending rewards'
    })
  }
})

