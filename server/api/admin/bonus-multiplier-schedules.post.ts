/**
 * Create bonus multiplier schedules (bulk insert)
 * POST /api/admin/bonus-multiplier-schedules
 * Body: { multiplier_staking_id, schedules: [{ scheduled_time, reward_amount, multiplier_value, status }] }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { multiplier_staking_id, schedules } = body

    // Validate required fields
    if (!multiplier_staking_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'multiplier_staking_id wajib diisi'
      })
    }

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'schedules wajib diisi dan harus berupa array'
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

    // Verify multiplier staking exists
    const { data: multiplierStaking, error: stakingError } = await supabase
      .from('bonus_multiplier_staking')
      .select('id, member_id')
      .eq('id', multiplier_staking_id)
      .single()

    if (stakingError || !multiplierStaking) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bonus multiplier staking tidak ditemukan'
      })
    }

    // Prepare schedules for insert
    const schedulesToInsert = schedules.map((schedule: any) => ({
      multiplier_staking_id,
      member_id: multiplierStaking.member_id,
      scheduled_time: schedule.scheduled_time,
      reward_amount: parseFloat(schedule.reward_amount) || 0,
      multiplier_value: parseFloat(schedule.multiplier_value) || 1,
      status: schedule.status || 'pending'
    }))

    // Bulk insert schedules
    const { data: insertedSchedules, error: insertError } = await supabase
      .from('bonus_multiplier_schedules')
      .insert(schedulesToInsert)
      .select('*')

    if (insertError) {
      throw createError({
        statusCode: 500,
        statusMessage: insertError.message || 'Gagal membuat bonus multiplier schedules'
      })
    }

    return {
      success: true,
      message: `Berhasil membuat ${insertedSchedules?.length || 0} bonus multiplier schedules`,
      data: insertedSchedules || []
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal membuat bonus multiplier schedules'
    })
  }
})

