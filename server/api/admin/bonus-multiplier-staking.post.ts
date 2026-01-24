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

