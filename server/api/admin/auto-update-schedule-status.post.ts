/**
 * Auto-update reward schedule status from pending to paid when scheduled_time is passed
 * POST /api/admin/auto-update-schedule-status
 * Simple endpoint to update schedule status without creating reward_history
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
      .select('id, staking_id, scheduled_time, status')
      .eq('status', 'pending')
      .lte('scheduled_time', now)

    if (fetchError) {
      console.error('[auto-update-schedule-status] Error fetching pending schedules:', fetchError)
      throw createError({
        statusCode: 500,
        statusMessage: fetchError.message || 'Gagal mengambil pending schedules'
      })
    }

    if (!pendingSchedules || pendingSchedules.length === 0) {
      return {
        success: true,
        message: 'Tidak ada schedule yang perlu diupdate',
        updated: 0,
        data: []
      }
    }

    // Update semua schedule yang sudah waktunya ke status 'paid'
    const scheduleIds = pendingSchedules.map(s => s.id)
    
    const { data: updatedSchedules, error: updateError } = await supabase
      .from('reward_schedules')
      .update({ 
        status: 'paid',
        updated_at: new Date().toISOString()
      })
      .in('id', scheduleIds)
      .eq('status', 'pending')
      .select('id')

    if (updateError) {
      console.error('[auto-update-schedule-status] Error updating schedules:', updateError)
      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Gagal mengupdate schedule status'
      })
    }

    const updatedCount = updatedSchedules?.length || 0

    console.log(`[auto-update-schedule-status] Updated ${updatedCount} schedules from pending to paid`)

    return {
      success: true,
      message: `Berhasil mengupdate ${updatedCount} schedule ke status paid`,
      updated: updatedCount,
      total: pendingSchedules.length,
      data: {
        updated: updatedCount,
        total: pendingSchedules.length
      }
    }
  } catch (error: any) {
    console.error('[auto-update-schedule-status] Error:', error)
    
    if (error && typeof error === 'object' && (error.statusCode || error._statusCode)) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || error?.data?.statusCode || 500,
      statusMessage: error?.message || error?.data?.message || 'Gagal mengupdate schedule status'
    })
  }
})

