/**
 * Create new staking (Admin only)
 * POST /api/admin/staking
 * Body: { member_id, coin_amount, reward_percentage? }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { member_id, coin_amount, reward_percentage, duration_minutes } = body

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

    // Get or create member_coins record
    let { data: memberCoins, error: coinsError } = await supabase
      .from('member_coins')
      .select('*')
      .eq('member_id', member_id)
      .single()

    if (coinsError && coinsError.code === 'PGRST116') {
      // Member coins doesn't exist, create it
      // Get coin price from coin_settings based on member_type
      const { data: coinSettings } = await supabase
        .from('coin_settings')
        .select('price_per_coin_usdt, leader_price_usdt, presale_price_usdt')
        .single()

      let coinPrice = 0.5 // default
      if (coinSettings) {
        if (member.member_type === 'leader') {
          coinPrice = parseFloat(coinSettings.leader_price_usdt) || 0.5
        } else if (member.member_type === 'presale' || member.member_type === 'vip') {
          coinPrice = parseFloat(coinSettings.presale_price_usdt) || 0.4
        } else {
          coinPrice = parseFloat(coinSettings.price_per_coin_usdt) || 0.5
        }
      }

      const { data: newMemberCoins, error: createError } = await supabase
        .from('member_coins')
        .insert({
          member_id,
          total_coins: 0,
          staked_coins: 0,
          available_coins: 0,
          coin_price: coinPrice,
          member_type: member.member_type || 'normal'
        })
        .select('*')
        .single()

      if (createError) {
        throw createError({
          statusCode: 500,
          statusMessage: createError.message || 'Gagal membuat member_coins'
        })
      }

      memberCoins = newMemberCoins
    } else if (coinsError) {
      throw createError({
        statusCode: 500,
        statusMessage: coinsError.message || 'Gagal mengambil data member_coins'
      })
    }

    // --- VALIDASI SALDO KOIN (REALTIME CALCULATION) ---
    // Gunakan logika yang sama dengan member-coins/[id].get.ts
    const requestedAmount = parseFloat(coin_amount)
    
    // Get coin price for conversion
    const { data: coinSettings } = await supabase
        .from('coin_settings')
        .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
        .single()
    
    let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
    if (member.member_type === 'vip' && coinSettings?.vip_price_usdt) {
        pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
    } else if (member.member_type === 'leader' && coinSettings?.leader_price_usdt) {
        pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
    }

    // Get Completed Deposits for Coin Calculation
    const { data: completedDeposits } = await supabase
        .from('deposits')
        .select('coin_amount, amount')
        .eq('member_id', member_id)
        .eq('status', 'completed')
        
    let totalCoinFromDeposits = 0
    if (completedDeposits) {
        totalCoinFromDeposits = completedDeposits.reduce((sum, d) => sum + (parseFloat(d.coin_amount) || 0), 0)
    }

    // Get Bonus Settings
    const { data: bonusSettingsFull } = await supabase
        .from('bonus_settings')
        .select('*')
        .single()

    // --- A. REFERRAL BONUS COIN ---
    let referralBonusCoin = 0
    
    // Count direct downlines
    const { data: dl1 } = await supabase.from('members').select('id').eq('referred_by', member_id)
    const downlineIds = (dl1 || []).map(d => d.id)
    
    if (downlineIds.length > 0 && bonusSettingsFull) {
        const referralPercentage = bonusSettingsFull.referral_percentage || 15.00
        const referralCoinPercentage = bonusSettingsFull.referral_coin_percentage || 20.00
        
        const { data: downlineDeposits } = await supabase
            .from('deposits')
            .select('amount')
            .in('member_id', downlineIds)
            .eq('status', 'completed')
            
        if (downlineDeposits && downlineDeposits.length > 0) {
            const totalReferralBonus = downlineDeposits.reduce((sum, deposit) => {
                const depositAmount = parseFloat(deposit.amount) || 0
                return sum + (depositAmount * referralPercentage / 100)
            }, 0)
            
            const referralBonusCoinUsdt = totalReferralBonus * (referralCoinPercentage / 100)
            referralBonusCoin = pricePerCoin > 0 ? referralBonusCoinUsdt / pricePerCoin : 0
        }
    }

    // --- B. MATCHING BONUS COIN ---
    let matchingBonusCoin = 0
    
    if (bonusSettingsFull) {
        const level1Pct = parseFloat(bonusSettingsFull.matching_level1_percentage || 10)
        const level2Pct = parseFloat(bonusSettingsFull.matching_level2_percentage || 5)
        const level3Pct = parseFloat(bonusSettingsFull.matching_level3_percentage || 3)
        
        const matchingLevels = [
          { level: 1, percentage: level1Pct },
          { level: 2, percentage: level2Pct },
          { level: 3, percentage: level3Pct }
        ]
        
        let currentIds = downlineIds // Start with L1 referrals
        let totalMatchingBonus = 0
        
        for (const level of matchingLevels) {
            if (currentIds.length === 0) break
            
            const { data: nextLevelMembers } = await supabase
                .from('members')
                .select('id')
                .in('referred_by', currentIds)
            
            const nextIds = (nextLevelMembers || []).map(m => m.id)
            
            if (nextIds.length > 0) {
                const { data: levelDeposits } = await supabase
                    .from('deposits')
                    .select('amount')
                    .in('member_id', nextIds)
                    .eq('status', 'completed')
                    
                if (levelDeposits && levelDeposits.length > 0) {
                    const levelDepositSum = levelDeposits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
                    totalMatchingBonus += levelDepositSum * (level.percentage / 100)
                }
            }
            
            currentIds = nextIds
        }
        
        const referralCoinPct = parseFloat(bonusSettingsFull.referral_coin_percentage || 20)
        const matchingCoinUsdt = totalMatchingBonus * (referralCoinPct / 100)
        matchingBonusCoin = pricePerCoin > 0 ? matchingCoinUsdt / pricePerCoin : 0
    }

    // --- FINAL CALCULATION ---
    const totalCoinCalculated = totalCoinFromDeposits + referralBonusCoin + matchingBonusCoin
    const stakedCoins = parseFloat(memberCoins.staked_coins || 0)
    
    // Available Coins = Total Realtime - Staked
    const availableCoins = Math.max(0, totalCoinCalculated - stakedCoins)
    
    console.log(`[staking.post] Member ${member_id}: Total Calculated=${totalCoinCalculated} (Dep=${totalCoinFromDeposits} + Ref=${referralBonusCoin} + Match=${matchingBonusCoin}), Staked=${stakedCoins}, Available=${availableCoins}`)

    if (requestedAmount > availableCoins) {
      throw createError({
        statusCode: 400,
        statusMessage: `Koin yang tersedia tidak cukup. Tersedia: ${availableCoins.toFixed(8)}, Diminta: ${requestedAmount}`
      })
    }

    // Get reward_percentage from bonus_settings if not provided
    let finalRewardPercentage = reward_percentage
    if (!finalRewardPercentage) {
      const { data: bonusSettings } = await supabase
        .from('bonus_settings')
        .select('reward_percentage, default_staking_duration_minutes')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (bonusSettings) {
        finalRewardPercentage = parseFloat(bonusSettings.reward_percentage) || 0.5
      } else {
        finalRewardPercentage = 0.5 // default
      }
    } else {
      finalRewardPercentage = parseFloat(finalRewardPercentage)
    }

    // Get duration_minutes from bonus_settings if not provided
    // Minimum 1 minute for testing, recommended 43200 minutes (1 month) for production
    const MIN_DURATION_MINUTES = 1 // Allow testing with 1 minute minimum
    let finalDurationMinutes = duration_minutes
    if (!finalDurationMinutes) {
      const { data: bonusSettings } = await supabase
        .from('bonus_settings')
        .select('default_staking_duration_minutes')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (bonusSettings && bonusSettings.default_staking_duration_minutes) {
        finalDurationMinutes = parseInt(bonusSettings.default_staking_duration_minutes) || 43200
      } else {
        finalDurationMinutes = 43200 // default 1 month
      }
    } else {
      finalDurationMinutes = parseInt(finalDurationMinutes)
    }

    // Validate minimum duration (1 minute for testing)
    if (finalDurationMinutes < MIN_DURATION_MINUTES) {
      throw createError({
        statusCode: 400,
        statusMessage: `Durasi staking minimal ${MIN_DURATION_MINUTES} menit. Durasi yang diminta: ${finalDurationMinutes} menit`
      })
    }

    // Calculate staking end date
    const stakedAt = new Date()
    const stakingEndDate = new Date(stakedAt.getTime() + finalDurationMinutes * 60 * 1000)

    // Create staking record
    const { data: newStaking, error: stakingError } = await supabase
      .from('staking')
      .insert({
        member_id,
        coin_amount: requestedAmount,
        reward_percentage: finalRewardPercentage,
        duration_minutes: finalDurationMinutes,
        status: 'active',
        staked_at: stakedAt.toISOString()
      })
      .select('*')
      .single()

    if (stakingError) {
      throw createError({
        statusCode: 500,
        statusMessage: stakingError.message || 'Gagal membuat staking'
      })
    }

    // Update member_coins: increase staked_coins
    // Note: available_coins will be calculated by trigger: available_coins = total_coins - staked_coins
    const newStakedCoins = (parseFloat(memberCoins.staked_coins) || 0) + requestedAmount

    const { error: updateError } = await supabase
      .from('member_coins')
      .update({
        staked_coins: newStakedCoins
      })
      .eq('member_id', member_id)

    if (updateError) {
      // Rollback: delete staking if update fails
      await supabase
        .from('staking')
        .delete()
        .eq('id', newStaking.id)

      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Gagal mengupdate member_coins'
      })
    }

    // Create staking history record
    try {
      await supabase
        .from('staking_history')
        .insert({
          staking_id: newStaking.id,
          member_id,
          action: 'created',
          coin_amount: requestedAmount,
          reward_percentage: finalRewardPercentage,
          duration_minutes: finalDurationMinutes,
          staked_at: stakedAt.toISOString(),
          notes: `Staking dibuat dengan durasi ${finalDurationMinutes} menit`
        })
    } catch (historyError) {
      console.error('[staking.post] Error creating staking history:', historyError)
      // Don't fail the request if history insert fails
    }

    // Auto-generate reward schedules untuk staking baru
    try {
      // Get bonus settings untuk reward interval
      const { data: bonusSettings } = await supabase
        .from('bonus_settings')
        .select('reward_interval_minutes')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const rewardIntervalMinutes = bonusSettings?.reward_interval_minutes || 240 // default 4 jam
      
      // Calculate reward amount
      const rewardAmount = (requestedAmount * finalRewardPercentage) / 100

      // Calculate schedule times
      const stakingStartDate = new Date(stakedAt)
      const stakingEndDate = new Date(stakingStartDate.getTime() + finalDurationMinutes * 60 * 1000)
      
      // Generate schedules - mulai dari staking_start + interval
      const schedules = []
      let scheduleTime = new Date(stakingStartDate.getTime() + rewardIntervalMinutes * 60 * 1000) // First reward after interval

      while (scheduleTime <= stakingEndDate) {
        schedules.push({
          staking_id: newStaking.id,
          member_id: member_id,
          scheduled_time: scheduleTime.toISOString(),
          reward_amount: rewardAmount,
          status: 'pending'
        })

        scheduleTime = new Date(scheduleTime.getTime() + rewardIntervalMinutes * 60 * 1000)
      }

      // Bulk insert reward schedules
      if (schedules.length > 0) {
        const { error: scheduleError } = await supabase
          .from('reward_schedules')
          .insert(schedules)

        if (scheduleError) {
          console.error('[staking.post] Error generating reward schedules:', scheduleError)
          // Don't fail the request if schedule generation fails, just log the error
        } else {
          console.log(`[staking.post] Generated ${schedules.length} reward schedules for staking ${newStaking.id}`)
        }
      }
    } catch (scheduleGenError) {
      console.error('[staking.post] Error in reward schedule generation:', scheduleGenError)
      // Don't fail the request if schedule generation fails
    }

    return {
      success: true,
      message: 'Staking berhasil dibuat',
      data: newStaking
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal membuat staking'
    })
  }
})