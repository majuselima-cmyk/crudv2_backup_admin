/**
 * Process pending bonus multiplier rewards
 * POST /api/admin/process-pending-multiplier-rewards
 * Update bonus_multiplier_schedules status dari 'pending' ke 'paid' untuk schedule yang sudah waktunya
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

    const { data: pendingSchedules, error: fetchError } = await supabase
      .from('bonus_multiplier_schedules')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_time', now)
      .order('scheduled_time', { ascending: true })

    if (fetchError) {
      console.error('[process-pending-multiplier-rewards] Error fetching pending schedules:', fetchError)
      throw createError({
        statusCode: 500,
        statusMessage: fetchError.message || 'Gagal mengambil pending multiplier schedules'
      })
    }

    if (!pendingSchedules || pendingSchedules.length === 0) {
      return {
        success: true,
        message: 'Tidak ada reward multiplier yang perlu diproses',
        processed: 0,
        total: 0,
        data: { processed: 0, total: 0, errors: 0 }
      }
    }

    let processedCount = 0
    const errors: string[] = []

    for (const schedule of pendingSchedules) {
      try {
        const { data: multiplierStaking, error: stakingError } = await supabase
          .from('bonus_multiplier_staking')
          .select('id, status')
          .eq('id', schedule.multiplier_staking_id)
          .single()

        if (stakingError || !multiplierStaking) {
          errors.push(`Bonus multiplier staking ${schedule.multiplier_staking_id} tidak ditemukan`)
          continue
        }

        if (multiplierStaking.status !== 'active') {
          await supabase
            .from('bonus_multiplier_schedules')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', schedule.id)
          continue
        }

        const { error: updateError } = await supabase
          .from('bonus_multiplier_schedules')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', schedule.id)

        if (updateError) {
          errors.push(`Gagal update schedule ${schedule.id}: ${updateError.message}`)
          continue
        }

        processedCount++
        const rewardAmount = parseFloat(schedule.reward_amount) || 0
        console.log(`[process-pending-multiplier-rewards] Processed ${schedule.id}, multiplier_staking ${schedule.multiplier_staking_id}, reward: ${rewardAmount}`)
      } catch (err: any) {
        console.error(`[process-pending-multiplier-rewards] Error processing schedule ${schedule.id}:`, err)
        errors.push(`Schedule ${schedule.id}: ${err?.message || 'Unknown error'}`)
      }
    }

    return {
      success: true,
      message: `Berhasil memproses ${processedCount} dari ${pendingSchedules.length} reward multiplier`,
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
    console.error('[process-pending-multiplier-rewards] Error:', error)
    if (error && typeof error === 'object' && (error.statusCode || error._statusCode)) {
      throw error
    }
    throw createError({
      statusCode: error?.statusCode || error?.data?.statusCode || 500,
      statusMessage: error?.message || error?.data?.message || 'Gagal memproses pending multiplier rewards'
    })
  }
})
