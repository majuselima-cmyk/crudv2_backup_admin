/**
 * Update bonus multiplier staking (Unstake)
 * PUT /api/admin/bonus-multiplier-staking/:id
 * Body: { unstaked_at?: string }
 * Set unstaked_at dan status = 'completed'
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID bonus multiplier staking wajib diisi'
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
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: row, error: fetchErr } = await supabase
      .from('bonus_multiplier_staking')
      .select('id, status')
      .eq('id', id)
      .single()

    if (fetchErr || !row) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Bonus multiplier staking tidak ditemukan'
      })
    }

    if (row.status !== 'active') {
      throw createError({
        statusCode: 400,
        statusMessage: `Multiplier staking sudah tidak aktif (status: ${row.status})`
      })
    }

    const unstakedAt = new Date().toISOString()

    const { data: updated, error: updateErr } = await supabase
      .from('bonus_multiplier_staking')
      .update({
        status: 'completed',
        unstaked_at: unstakedAt
      } as Record<string, unknown>)
      .eq('id', id)
      .select('id, status')
      .single()

    if (updateErr) {
      const msg = updateErr.message || ''
      const code = (updateErr as { code?: string })?.code
      if (msg.includes('unstaked_at') || code === '42703') {
        const { error: updateStatusErr } = await supabase
          .from('bonus_multiplier_staking')
          .update({ status: 'completed' })
          .eq('id', id)
        if (updateStatusErr) {
          throw createError({
            statusCode: 500,
            statusMessage: updateStatusErr.message || 'Gagal unstake multiplier'
          })
        }
        return {
          success: true,
          message: 'Unstake multiplier berhasil',
          data: { id, status: 'completed' }
        }
      }
      throw createError({
        statusCode: 500,
        statusMessage: msg || 'Gagal unstake multiplier'
      })
    }

    return {
      success: true,
      message: 'Unstake multiplier berhasil',
      data: updated
    }
  } catch (e: any) {
    if (e?.statusCode || (e && typeof e === 'object' && 'statusCode' in e)) throw e
    throw createError({
      statusCode: e?.statusCode || 500,
      statusMessage: e?.message || 'Gagal unstake multiplier'
    })
  }
})
