/**
 * Create new deposit
 * POST /api/admin/deposits
 */
import { createClient } from '@supabase/supabase-js'

// Function to calculate and distribute referral bonus
async function calculateAndDistributeReferralBonus(supabase: any, deposit: any) {
  try {
    console.log(`🔵 Starting referral bonus calculation for deposit ${deposit.id}, member ${deposit.member_id}`)
    
    // Get member who made the deposit
    const { data: depositingMember, error: memberError } = await supabase
      .from('members')
      .select('id, email, username, referred_by, member_type')
      .eq('id', deposit.member_id)
      .single()

    if (memberError) {
      console.error(`❌ Error fetching depositing member:`, memberError)
      return
    }

    if (!depositingMember) {
      console.log(`❌ Depositing member not found: ${deposit.member_id}`)
      return
    }

    console.log(`✅ Depositing member found: ${depositingMember.email || depositingMember.username}, referred_by: ${depositingMember.referred_by}`)

    if (!depositingMember.referred_by) {
      console.log(`⚠️ No referral found for member ${deposit.member_id} (${depositingMember.email || depositingMember.username})`)
      return // No referral, skip bonus
    }

    // Find referral (upline) - try by ID first, then by referral_code
    let referralMember = null
    const referredBy = depositingMember.referred_by

    console.log(`🔍 Looking for referral member: ${referredBy}`)

    // Try by ID
    const { data: referralById, error: referralByIdError } = await supabase
      .from('members')
      .select('id, email, username, member_type, coin_balance, total_coin')
      .eq('id', referredBy)
      .single()

    if (referralById && !referralByIdError) {
      referralMember = referralById
      console.log(`✅ Referral member found by ID: ${referralMember.email || referralMember.username}`)
    } else {
      // Try by referral_code
      const { data: referralByCode, error: referralByCodeError } = await supabase
        .from('members')
        .select('id, email, username, member_type, coin_balance, total_coin')
        .eq('referral_code', referredBy)
        .single()

      if (referralByCode && !referralByCodeError) {
        referralMember = referralByCode
        console.log(`✅ Referral member found by referral_code: ${referralMember.email || referralMember.username}`)
      } else {
        console.log(`❌ Referral member not found: ${referredBy}`)
        console.log(`   Error by ID:`, referralByIdError)
        console.log(`   Error by code:`, referralByCodeError)
      }
    }

    if (!referralMember) {
      console.log(`❌ Referral member not found: ${referredBy}`)
      return
    }

    // Get bonus settings
    const { data: bonusSettings } = await supabase
      .from('bonus_settings')
      .select('referral_percentage, referral_balance_percentage, referral_coin_percentage, is_active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!bonusSettings || !bonusSettings.is_active) {
      console.log('Bonus settings not found or inactive')
      return
    }

    const referralPercentage = parseFloat(bonusSettings.referral_percentage) || 15.00
    const balancePercentage = parseFloat(bonusSettings.referral_balance_percentage) || 80.00
    const coinPercentage = parseFloat(bonusSettings.referral_coin_percentage) || 20.00

    // Calculate total bonus (15% of deposit amount)
    const depositAmount = parseFloat(deposit.amount) || 0
    const totalBonus = depositAmount * (referralPercentage / 100)

    // Split bonus
    const bonusToBalance = totalBonus * (balancePercentage / 100)
    const bonusToCoin = totalBonus * (coinPercentage / 100)

    console.log(`Calculating referral bonus for deposit ${deposit.id}:`)
    console.log(`  Deposit amount: ${depositAmount} USDT`)
    console.log(`  Total bonus (${referralPercentage}%): ${totalBonus} USDT`)
    console.log(`  To balance (${balancePercentage}%): ${bonusToBalance} USDT`)
    console.log(`  To coin (${coinPercentage}%): ${bonusToCoin} USDT`)

    // Get coin settings to convert bonus to coin
    const { data: coinSettings } = await supabase
      .from('coin_settings')
      .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
      .single()

    let pricePerCoin = 0.5
    if (coinSettings) {
      if (referralMember.member_type === 'vip' && coinSettings.vip_price_usdt) {
        pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
      } else if (referralMember.member_type === 'leader' && coinSettings.leader_price_usdt) {
        pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
      } else {
        pricePerCoin = parseFloat(coinSettings.normal_price_usdt) || 0.5
      }
    }

    // Convert bonus to coin amount
    const coinAmount = pricePerCoin > 0 ? bonusToCoin / pricePerCoin : 0

    // Update referral member's coin balance
    const currentCoinBalance = parseFloat(referralMember.coin_balance || 0)
    const currentTotalCoin = parseFloat(referralMember.total_coin || 0)
    const newCoinBalance = currentCoinBalance + coinAmount
    const newTotalCoin = currentTotalCoin + coinAmount

    const { error: updateCoinError } = await supabase
      .from('members')
      .update({
        coin_balance: newCoinBalance,
        total_coin: newTotalCoin
      })
      .eq('id', referralMember.id)

    if (updateCoinError) {
      console.error('Error updating referral member coin balance:', updateCoinError)
    } else {
      console.log(`Updated referral member ${referralMember.id} coin balance: +${coinAmount} coin (total: ${newCoinBalance})`)
    }

    // Create deposit record for bonus balance (80% to balance USDT)
    // This deposit will be counted in total_balance calculation
    const { error: bonusDepositError } = await supabase
      .from('deposits')
      .insert({
        member_id: referralMember.id,
        amount: bonusToBalance,
        coin_amount: 0, // No coin from balance portion
        conversion_rate: 0,
        from_wallet_address: 'SYSTEM_BONUS',
        to_wallet_address: 'BONUS_REFERRAL',
        payment_method: 'referral_bonus',
        wallet_model: 'BONUS',
        status: 'completed' // Auto completed since it's bonus
      })

    if (bonusDepositError) {
      console.error('Error creating bonus deposit:', bonusDepositError)
    } else {
      console.log(`Created bonus deposit for referral member ${referralMember.id}: ${bonusToBalance} USDT`)
    }

    console.log(`Referral bonus distributed successfully to member ${referralMember.id}`)
  } catch (error) {
    console.error('Error calculating referral bonus:', error)
    // Don't throw error - bonus calculation failure shouldn't break deposit update
  }
}

// Function to calculate and distribute matching bonus (level 1, 2, 3)
async function calculateAndDistributeMatchingBonus(supabase: any, deposit: any) {
  try {
    console.log(`🔵 Starting matching bonus calculation for deposit ${deposit.id}, member ${deposit.member_id}`)
    
    // Get member who made the deposit
    const { data: depositingMember, error: memberError } = await supabase
      .from('members')
      .select('id, email, username, referred_by, member_type')
      .eq('id', deposit.member_id)
      .single()

    if (memberError || !depositingMember) {
      console.error(`❌ Error fetching depositing member:`, memberError)
      return
    }

    // Get bonus settings
    const { data: bonusSettings } = await supabase
      .from('bonus_settings')
      .select('matching_level1_percentage, matching_level2_percentage, matching_level3_percentage, referral_balance_percentage, referral_coin_percentage, is_active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!bonusSettings || !bonusSettings.is_active) {
      console.log('Bonus settings not found or inactive')
      return
    }

    const matchingLevel1Percentage = parseFloat(bonusSettings.matching_level1_percentage) || 10.00
    const matchingLevel2Percentage = parseFloat(bonusSettings.matching_level2_percentage) || 5.00
    const matchingLevel3Percentage = parseFloat(bonusSettings.matching_level3_percentage) || 2.00
    const balancePercentage = parseFloat(bonusSettings.referral_balance_percentage) || 80.00
    const coinPercentage = parseFloat(bonusSettings.referral_coin_percentage) || 20.00

    const depositAmount = parseFloat(deposit.amount) || 0

    // Get coin settings
    const { data: coinSettings } = await supabase
      .from('coin_settings')
      .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
      .single()

    // Find upline chain (level 1, 2, 3)
    const uplineChain = []
    let currentMember = depositingMember

    // Level 1: Direct upline (referred_by)
    if (currentMember.referred_by) {
      let level1Member = null
      const referredBy = currentMember.referred_by

      // Try by ID
      const { data: level1ById } = await supabase
        .from('members')
        .select('id, email, username, member_type, referred_by, coin_balance, total_coin')
        .eq('id', referredBy)
        .single()

      if (level1ById) {
        level1Member = level1ById
      } else {
        // Try by referral_code
        const { data: level1ByCode } = await supabase
          .from('members')
          .select('id, email, username, member_type, referred_by, coin_balance, total_coin')
          .eq('referral_code', referredBy)
          .single()

        if (level1ByCode) {
          level1Member = level1ByCode
        }
      }

      if (level1Member) {
        uplineChain.push({ level: 1, member: level1Member, percentage: matchingLevel1Percentage })
        currentMember = level1Member

        // Level 2: Upline of level 1
        if (currentMember.referred_by) {
          let level2Member = null
          const level2ReferredBy = currentMember.referred_by

          const { data: level2ById } = await supabase
            .from('members')
            .select('id, email, username, member_type, referred_by, coin_balance, total_coin')
            .eq('id', level2ReferredBy)
            .single()

          if (level2ById) {
            level2Member = level2ById
          } else {
            const { data: level2ByCode } = await supabase
              .from('members')
              .select('id, email, username, member_type, referred_by, coin_balance, total_coin')
              .eq('referral_code', level2ReferredBy)
              .single()

            if (level2ByCode) {
              level2Member = level2ByCode
            }
          }

          if (level2Member) {
            uplineChain.push({ level: 2, member: level2Member, percentage: matchingLevel2Percentage })
            currentMember = level2Member

            // Level 3: Upline of level 2
            if (currentMember.referred_by) {
              let level3Member = null
              const level3ReferredBy = currentMember.referred_by

              const { data: level3ById } = await supabase
                .from('members')
                .select('id, email, username, member_type, referred_by, coin_balance, total_coin')
                .eq('id', level3ReferredBy)
                .single()

              if (level3ById) {
                level3Member = level3ById
              } else {
                const { data: level3ByCode } = await supabase
                  .from('members')
                  .select('id, email, username, member_type, referred_by, coin_balance, total_coin')
                  .eq('referral_code', level3ReferredBy)
                  .single()

                if (level3ByCode) {
                  level3Member = level3ByCode
                }
              }

              if (level3Member) {
                uplineChain.push({ level: 3, member: level3Member, percentage: matchingLevel3Percentage })
              }
            }
          }
        }
      }
    }

    console.log(`Found ${uplineChain.length} upline levels for matching bonus`)

    // Distribute bonus to each level
    for (const upline of uplineChain) {
      const { level, member, percentage } = upline

      // Calculate total bonus for this level
      const totalBonus = depositAmount * (percentage / 100)

      // Split bonus
      const bonusToBalance = totalBonus * (balancePercentage / 100)
      const bonusToCoin = totalBonus * (coinPercentage / 100)

      console.log(`Calculating matching bonus level ${level} for member ${member.id}:`)
      console.log(`  Deposit amount: ${depositAmount} USDT`)
      console.log(`  Total bonus (${percentage}%): ${totalBonus} USDT`)
      console.log(`  To balance (${balancePercentage}%): ${bonusToBalance} USDT`)
      console.log(`  To coin (${coinPercentage}%): ${bonusToCoin} USDT`)

      // Get coin price for this member
      let pricePerCoin = 0.5
      if (coinSettings) {
        if (member.member_type === 'vip' && coinSettings.vip_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
        } else if (member.member_type === 'leader' && coinSettings.leader_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
        } else {
          pricePerCoin = parseFloat(coinSettings.normal_price_usdt) || 0.5
        }
      }

      // Convert bonus to coin amount
      const coinAmount = pricePerCoin > 0 ? bonusToCoin / pricePerCoin : 0

      // Update member's coin balance
      const currentCoinBalance = parseFloat(member.coin_balance || 0)
      const currentTotalCoin = parseFloat(member.total_coin || 0)
      const newCoinBalance = currentCoinBalance + coinAmount
      const newTotalCoin = currentTotalCoin + coinAmount

      const { error: updateCoinError } = await supabase
        .from('members')
        .update({
          coin_balance: newCoinBalance,
          total_coin: newTotalCoin
        })
        .eq('id', member.id)

      if (updateCoinError) {
        console.error(`Error updating level ${level} member coin balance:`, updateCoinError)
      } else {
        console.log(`Updated level ${level} member ${member.id} coin balance: +${coinAmount} coin (total: ${newCoinBalance})`)
      }

      // Create deposit record for bonus balance
      const { error: bonusDepositError } = await supabase
        .from('deposits')
        .insert({
          member_id: member.id,
          amount: bonusToBalance,
          coin_amount: 0,
          conversion_rate: 0,
          from_wallet_address: 'SYSTEM_BONUS',
          to_wallet_address: 'BONUS_MATCHING',
          payment_method: `matching_bonus_level${level}`,
          wallet_model: 'BONUS',
          status: 'completed'
        })

      if (bonusDepositError) {
        console.error(`Error creating matching bonus level ${level} deposit:`, bonusDepositError)
      } else {
        console.log(`Created matching bonus level ${level} deposit for member ${member.id}: ${bonusToBalance} USDT`)
      }
    }

    console.log(`Matching bonus distributed successfully to ${uplineChain.length} levels`)
  } catch (error) {
    console.error('Error calculating matching bonus:', error)
    // Don't throw error - bonus calculation failure shouldn't break deposit update
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      member_id,
      amount,
      coin_amount,
      conversion_rate,
      from_wallet_address,
      to_wallet_address,
      payment_method,
      wallet_model,
      status
    } = body

    // Validation
    if (!member_id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Member ID is required'
      })
    }

    if (!amount || parseFloat(amount) <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount must be greater than 0'
      })
    }

    if (!from_wallet_address) {
      throw createError({
        statusCode: 400,
        statusMessage: 'From wallet address is required'
      })
    }

    if (!to_wallet_address) {
      throw createError({
        statusCode: 400,
        statusMessage: 'To wallet address is required'
      })
    }

    if (!payment_method) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment method is required'
      })
    }

    if (!status || !['pending', 'completed', 'rejected'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid status'
      })
    }

    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
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

    // Check if member exists
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, member_type')
      .eq('id', member_id)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member not found'
      })
    }

    // Calculate coin_amount and conversion_rate if not provided
    let finalCoinAmount = coin_amount ? parseFloat(coin_amount) : null
    let finalConversionRate = conversion_rate ? parseFloat(conversion_rate) : null

    // If coin_amount or conversion_rate not provided, calculate from coin settings
    if (!finalCoinAmount || !finalConversionRate) {
      const { data: coinSettings } = await supabase
        .from('coin_settings')
        .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
        .single()

      if (coinSettings) {
        // Get price based on member type
        let pricePerCoin = parseFloat(coinSettings.normal_price_usdt) || 0.5
        if (member.member_type === 'vip' && coinSettings.vip_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
        } else if (member.member_type === 'leader' && coinSettings.leader_price_usdt) {
          pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
        }

        // Calculate conversion rate: 1 USDT / price_per_coin = jumlah coin per 1 USDT
        finalConversionRate = pricePerCoin > 0 ? 1 / pricePerCoin : 2.0
        finalCoinAmount = parseFloat(amount) * finalConversionRate
      } else {
        // Fallback to default
        finalConversionRate = 2.0
        finalCoinAmount = parseFloat(amount) * 2.0
      }
    }

    // Create deposit
    const { data: newDeposit, error: createError } = await supabase
      .from('deposits')
      .insert({
        member_id,
        amount: parseFloat(amount),
        coin_amount: finalCoinAmount,
        conversion_rate: finalConversionRate,
        from_wallet_address: from_wallet_address.trim(),
        to_wallet_address: to_wallet_address.trim(),
        payment_method: payment_method.trim(),
        wallet_model: wallet_model?.trim() || null,
        status
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating deposit:', createError)
      throw createError({
        statusCode: 500,
        statusMessage: createError.message || 'Failed to create deposit'
      })
    }

    // Calculate and distribute referral bonus if deposit is completed
    // Skip bonus deposit to prevent infinite loop
    if (status === 'completed' && payment_method !== 'referral_bonus' && !payment_method?.startsWith('matching_bonus')) {
      console.log(`🟢 New deposit ${newDeposit.id} created as completed, calculating referral bonus...`)
      await calculateAndDistributeReferralBonus(supabase, newDeposit)
      // Also calculate matching bonus (level 1, 2, 3)
      await calculateAndDistributeMatchingBonus(supabase, newDeposit)
    } else {
      if (payment_method === 'referral_bonus' || payment_method?.startsWith('matching_bonus')) {
        console.log(`⏭️ Skipping bonus calculation for bonus deposit ${newDeposit.id}`)
      } else {
        console.log(`⏭️ Deposit ${newDeposit.id} status is ${status}, not completed, skipping bonus`)
      }
    }

    return {
      success: true,
      data: newDeposit,
      message: 'Deposit created successfully'
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to create deposit'
    })
  }
})

