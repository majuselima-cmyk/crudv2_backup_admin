import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  // Only allow POST method
  if (getMethod(event) !== 'POST') {
    setResponseStatus(event, 405)
    return {
      success: false,
      message: 'Method not allowed'
    }
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Missing Supabase environment variables'
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const body = await readBody(event)
    const { staking_id, forceRegenerate } = body

    // Get bonus settings
    const { data: bonusSettings, error: bonusError } = await supabase
      .from('bonus_settings')
      .select('*')
      .single()

    if (bonusError || !bonusSettings) {
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Bonus settings tidak ditemukan'
      }
    }

    const rewardIntervalMinutes = bonusSettings.reward_interval_minutes || 240
    const rewardPercentage = parseFloat(bonusSettings.reward_percentage) || 0.5

    // Get active staking
    let stakingQuery = supabase
      .from('staking')
      .select('*')
      .eq('status', 'active')

    if (staking_id) {
      stakingQuery = stakingQuery.eq('id', staking_id)
    }

    const { data: stakingList, error: stakingError } = await stakingQuery

    if (stakingError) {
      console.error('[Generate Reward Schedules] Error fetching staking:', stakingError)
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Gagal mengambil data staking',
        error: stakingError.message
      }
    }

    if (!stakingList || stakingList.length === 0) {
      return {
        success: true,
        message: 'Tidak ada staking aktif',
        generated: 0
      }
    }

    let totalGenerated = 0
    const errors: string[] = []

    // Generate reward schedules untuk setiap staking
    for (const staking of stakingList) {
      try {
        // Check if schedules already exist
        if (!forceRegenerate) {
          const { data: existingSchedules } = await supabase
            .from('reward_schedules')
            .select('id')
            .eq('staking_id', staking.id)
            .limit(1)

          if (existingSchedules && existingSchedules.length > 0) {
            console.log(`[Generate Reward Schedules] Staking ${staking.id} sudah memiliki schedules, skip`)
            continue
          }
        } else {
          // Delete existing schedules if force regenerate
          await supabase
            .from('reward_schedules')
            .delete()
            .eq('staking_id', staking.id)
        }

        // Calculate reward amount
        const coinAmount = parseFloat(staking.coin_amount) || 0
        const rewardAmount = (coinAmount * rewardPercentage) / 100

        // Calculate schedule times
        const stakedAt = new Date(staking.staked_at)
        const durationMinutes = parseInt(staking.duration_minutes) || 0
        const endDate = new Date(stakedAt.getTime() + durationMinutes * 60 * 1000)

        // Generate schedules
        const schedules = []
        let currentTime = new Date(stakedAt.getTime() + rewardIntervalMinutes * 60 * 1000) // First reward after interval

        while (currentTime <= endDate) {
          schedules.push({
            staking_id: staking.id,
            member_id: staking.member_id,
            scheduled_time: currentTime.toISOString(),
            reward_amount: rewardAmount,
            status: 'pending'
          })

          currentTime = new Date(currentTime.getTime() + rewardIntervalMinutes * 60 * 1000)
        }

        if (schedules.length > 0) {
          // Bulk insert schedules
          const { error: insertError } = await supabase
            .from('reward_schedules')
            .insert(schedules)

          if (insertError) {
            console.error(`[Generate Reward Schedules] Error inserting for staking ${staking.id}:`, insertError)
            errors.push(`Staking ${staking.id}: ${insertError.message}`)
          } else {
            totalGenerated += schedules.length
            console.log(`[Generate Reward Schedules] Generated ${schedules.length} schedules for staking ${staking.id}`)
          }
        }
      } catch (error: any) {
        console.error(`[Generate Reward Schedules] Error processing staking ${staking.id}:`, error)
        errors.push(`Staking ${staking.id}: ${error.message}`)
      }
    }

    return {
      success: true,
      message: `Berhasil generate ${totalGenerated} reward schedules`,
      generated: totalGenerated,
      processed: stakingList.length,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error: any) {
    console.error('[Generate Reward Schedules] Unexpected Error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Gagal generate reward schedules',
      error: error?.stack || String(error)
    }
  }
})

