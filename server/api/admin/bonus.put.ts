/**
 * Update bonus settings
 * PUT /api/admin/bonus
 * Body: { referral_percentage, referral_balance_percentage, referral_coin_percentage, matching_level1_percentage, matching_level2_percentage, matching_level3_percentage, loyalty_percentage_level0, loyalty_percentage_level1, loyalty_percentage_level2, reward_percentage, reward_interval_minutes, multiplier_percentage, is_active }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      referral_percentage,
      referral_balance_percentage,
      referral_coin_percentage,
      matching_level1_percentage,
      matching_level2_percentage,
      matching_level3_percentage,
      loyalty_percentage_level0,
      loyalty_percentage_level1,
      loyalty_percentage_level2,
      reward_percentage,
      reward_interval_minutes,
      default_staking_duration_minutes,
      multiplier_percentage,
      multiplier_increment_percentage,
      multiplier_increment_minutes,
      is_active
    } = body

    // Validate required fields
    if (
      referral_percentage === undefined ||
      referral_balance_percentage === undefined ||
      referral_coin_percentage === undefined ||
      matching_level1_percentage === undefined ||
      matching_level2_percentage === undefined ||
      matching_level3_percentage === undefined ||
      loyalty_percentage_level0 === undefined ||
      loyalty_percentage_level1 === undefined ||
      loyalty_percentage_level2 === undefined ||
      reward_percentage === undefined ||
      reward_interval_minutes === undefined || // NEW
      multiplier_percentage === undefined ||
      multiplier_increment_percentage === undefined ||
      multiplier_increment_minutes === undefined ||
      is_active === undefined
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Semua field wajib diisi'
      })
    }

    // Validate reward_interval_minutes (min 1 minute)
    const intervalMinutes = parseInt(reward_interval_minutes)
    if (isNaN(intervalMinutes) || intervalMinutes < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reward interval harus minimal 1 menit'
      })
    }

    // Validate referral split ratio (must total 100%)
    const balancePct = parseFloat(referral_balance_percentage) || 0
    const coinPct = parseFloat(referral_coin_percentage) || 0
    const totalSplit = balancePct + coinPct
    if (Math.abs(totalSplit - 100) > 0.01) { // Allow small floating point error
      throw createError({
        statusCode: 400,
        statusMessage: `Referral split ratio harus total 100% (Balance: ${balancePct}%, Coin: ${coinPct}%)`
      })
    }

    // Validate percentage ranges (0-100)
    const percentages = [
      { name: 'Referral', value: referral_percentage },
      { name: 'Matching Level 1', value: matching_level1_percentage },
      { name: 'Matching Level 2', value: matching_level2_percentage },
      { name: 'Matching Level 3', value: matching_level3_percentage },
      { name: 'Loyalty Level 0', value: loyalty_percentage_level0 },
      { name: 'Loyalty Level 1', value: loyalty_percentage_level1 },
      { name: 'Loyalty Level 2', value: loyalty_percentage_level2 },
      { name: 'Reward', value: reward_percentage },
      { name: 'Multiplier', value: multiplier_percentage }
    ]

    // Validate multiplier_increment_percentage (sekarang INTEGER menit, bukan persen)
    const incrementIntervalMinutes = parseInt(multiplier_increment_percentage)
    if (isNaN(incrementIntervalMinutes) || incrementIntervalMinutes < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Multiplier increment interval harus minimal 1 menit'
      })
    }

    // Validate multiplier_increment_minutes (min 1 minute)
    const incrementMinutes = parseInt(multiplier_increment_minutes)
    if (isNaN(incrementMinutes) || incrementMinutes < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Multiplier increment harus minimal 1 menit'
      })
    }

    // Validate default_staking_duration_minutes (min 1 minute for testing, recommended 43200 for production)
    const MIN_STAKING_DURATION = 1 // Allow testing with 1 minute minimum
    const stakingDuration = default_staking_duration_minutes !== undefined 
      ? parseInt(default_staking_duration_minutes) 
      : 43200 // Default to 1 month if not provided
    if (isNaN(stakingDuration) || stakingDuration < MIN_STAKING_DURATION) {
      throw createError({
        statusCode: 400,
        statusMessage: `Default staking duration minimal ${MIN_STAKING_DURATION} menit`
      })
    }

    for (const item of percentages) {
      const value = parseFloat(item.value)
      if (isNaN(value) || value < 0 || value > 100) {
        throw createError({
          statusCode: 400,
          statusMessage: `${item.name} harus antara 0 dan 100`
        })
      }
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

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('bonus_settings')
      .select('id')
      .limit(1)
      .single()

    let updatedSettings

    if (existingSettings) {
      // Update existing settings
      const { data, error: updateError } = await supabase
        .from('bonus_settings')
        .update({
          referral_percentage: parseFloat(referral_percentage),
          referral_balance_percentage: parseFloat(referral_balance_percentage),
          referral_coin_percentage: parseFloat(referral_coin_percentage),
          matching_level1_percentage: parseFloat(matching_level1_percentage),
          matching_level2_percentage: parseFloat(matching_level2_percentage),
          matching_level3_percentage: parseFloat(matching_level3_percentage),
          loyalty_percentage_level0: parseFloat(loyalty_percentage_level0),
          loyalty_percentage_level1: parseFloat(loyalty_percentage_level1),
          loyalty_percentage_level2: parseFloat(loyalty_percentage_level2),
          reward_percentage: parseFloat(reward_percentage),
          reward_interval_minutes: parseInt(reward_interval_minutes),
          default_staking_duration_minutes: stakingDuration,
          multiplier_percentage: parseFloat(multiplier_percentage),
          multiplier_increment_percentage: parseInt(multiplier_increment_percentage), // INTEGER menit, bukan DECIMAL persen
          multiplier_increment_minutes: parseInt(multiplier_increment_minutes),
          is_active: Boolean(is_active)
        })
        .eq('id', existingSettings.id)
        .select('*')
        .single()

      if (updateError) {
        throw createError({
          statusCode: 500,
          statusMessage: updateError.message || 'Gagal mengupdate pengaturan bonus'
        })
      }

      updatedSettings = data
    } else {
      // Create new settings if doesn't exist
      const { data, error: insertError } = await supabase
        .from('bonus_settings')
        .insert({
          referral_percentage: parseFloat(referral_percentage),
          referral_balance_percentage: parseFloat(referral_balance_percentage),
          referral_coin_percentage: parseFloat(referral_coin_percentage),
          matching_level1_percentage: parseFloat(matching_level1_percentage),
          matching_level2_percentage: parseFloat(matching_level2_percentage),
          matching_level3_percentage: parseFloat(matching_level3_percentage),
          loyalty_percentage_level0: parseFloat(loyalty_percentage_level0),
          loyalty_percentage_level1: parseFloat(loyalty_percentage_level1),
          loyalty_percentage_level2: parseFloat(loyalty_percentage_level2),
          reward_percentage: parseFloat(reward_percentage),
          reward_interval_minutes: parseInt(reward_interval_minutes),
          default_staking_duration_minutes: stakingDuration,
          multiplier_percentage: parseFloat(multiplier_percentage),
          multiplier_increment_percentage: parseInt(multiplier_increment_percentage), // INTEGER menit, bukan DECIMAL persen
          multiplier_increment_minutes: parseInt(multiplier_increment_minutes),
          is_active: Boolean(is_active)
        })
        .select('*')
        .single()

      if (insertError) {
        throw createError({
          statusCode: 500,
          statusMessage: insertError.message || 'Gagal membuat pengaturan bonus'
        })
      }

      updatedSettings = data
    }

    return {
      success: true,
      message: 'Pengaturan bonus berhasil disimpan',
      data: updatedSettings
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal menyimpan pengaturan bonus'
    })
  }
})

