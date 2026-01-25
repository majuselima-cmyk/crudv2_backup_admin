/**
 * Create new bonus multiplier staking (Admin only)
 * POST /api/admin/bonus-multiplier-staking
 * Body: { member_id, coin_amount, multiplier_bonus_base_percentage, reward_interval_minutes, multiplier_increment_period_minutes, started_at }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { 
      member_id, 
      coin_amount, 
      multiplier_bonus_base_percentage, 
      reward_interval_minutes,
      multiplier_increment_period_minutes,
      started_at 
    } = body

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

    if (!multiplier_bonus_base_percentage) {
      throw createError({
        statusCode: 400,
        statusMessage: 'multiplier_bonus_base_percentage wajib diisi'
      })
    }

    if (!reward_interval_minutes || parseInt(reward_interval_minutes) < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'reward_interval_minutes wajib diisi dan minimal 1 menit'
      })
    }

    if (!multiplier_increment_period_minutes || parseInt(multiplier_increment_period_minutes) < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'multiplier_increment_period_minutes wajib diisi dan minimal 1 menit'
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

    // Create bonus multiplier staking record
    const { data: newMultiplierStaking, error: stakingError } = await supabase
      .from('bonus_multiplier_staking')
      .insert({
        member_id,
        coin_amount: parseFloat(coin_amount),
        multiplier_bonus_base_percentage: parseFloat(multiplier_bonus_base_percentage),
        reward_interval_minutes: reward_interval_minutes ? parseInt(reward_interval_minutes) : null,
        multiplier_increment_period_minutes: multiplier_increment_period_minutes ? parseInt(multiplier_increment_period_minutes) : null,
        started_at: started_at || new Date().toISOString(),
        status: 'active'
      })
      .select('*')
      .single()

    if (stakingError) {
      throw createError({
        statusCode: 500,
        statusMessage: stakingError.message || 'Gagal membuat bonus multiplier staking'
      })
    }

    // Auto-generate reward schedules untuk multiplier staking baru
    try {
      const coinAmount = parseFloat(coin_amount)
      const basePercentage = parseFloat(multiplier_bonus_base_percentage)
      const rewardInterval = parseInt(reward_interval_minutes) // Reward Calculation Interval (multiplier)
      const stakingDuration = parseInt(multiplier_increment_period_minutes) // Default Staking Duration (multiplier)

      // Calculate schedule times
      const stakingStartDate = new Date(started_at || new Date().toISOString())
      const stakingEndDate = new Date(stakingStartDate.getTime() + stakingDuration * 60 * 1000)

      // Generate schedules - mulai dari started_at + interval
      const schedules = []
      let scheduleTime = new Date(stakingStartDate.getTime() + rewardInterval * 60 * 1000) // First reward after interval
      let currentAmount = coinAmount // Start with initial coin amount

      while (scheduleTime <= stakingEndDate) {
        // Calculate reward dengan compounding: reward = current_amount * base_percentage
        const rewardAmount = (currentAmount * basePercentage) / 100

        schedules.push({
          multiplier_staking_id: newMultiplierStaking.id,
          member_id: member_id,
          scheduled_time: scheduleTime.toISOString(),
          reward_amount: rewardAmount,
          multiplier_value: currentAmount, // Store current amount before reward
          status: 'pending'
        })

        // Accumulate the reward to current amount for next calculation
        currentAmount += rewardAmount

        scheduleTime = new Date(scheduleTime.getTime() + rewardInterval * 60 * 1000)
      }

      // Bulk insert reward schedules
      if (schedules.length > 0) {
        console.log(`[bonus-multiplier-staking.post] Generated ${schedules.length} reward schedules for multiplier staking ${newMultiplierStaking.id}, coinAmount: ${coinAmount}, basePercentage: ${basePercentage}, rewardInterval: ${rewardInterval} min, stakingDuration: ${stakingDuration} min`)
        const { error: scheduleError } = await supabase
          .from('bonus_multiplier_schedules')
          .insert(schedules)

        if (scheduleError) {
          console.error('[bonus-multiplier-staking.post] Error generating reward schedules:', scheduleError)
          // Don't fail the request if schedule generation fails, just log the error
        } else {
          console.log(`[bonus-multiplier-staking.post] Generated ${schedules.length} reward schedules for multiplier staking ${newMultiplierStaking.id}`)
        }
      }
    } catch (scheduleGenError) {
      console.error('[bonus-multiplier-staking.post] Error in reward schedule generation:', scheduleGenError)
      // Don't fail the request if schedule generation fails
    }

    return {
      success: true,
      message: 'Bonus multiplier staking berhasil dibuat',
      data: newMultiplierStaking
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal membuat bonus multiplier staking'
    })
  }
})

