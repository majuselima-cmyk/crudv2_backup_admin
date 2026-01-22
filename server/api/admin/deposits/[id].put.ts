/**
 * Update deposit
 * PUT /api/admin/deposits/[id]
 * Body: { amount, coin_amount, conversion_rate, from_wallet_address, to_wallet_address, payment_method, wallet_model, status }
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
    const depositId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!depositId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Deposit ID is required'
      })
    }

    const {
      amount,
      coin_amount,
      conversion_rate,
      from_wallet_address,
      to_wallet_address,
      payment_method,
      wallet_model,
      status
    } = body

    // Validate required fields
    if (!amount || !from_wallet_address || !to_wallet_address || !payment_method || !status) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount, from_wallet_address, to_wallet_address, payment_method, and status are required'
      })
    }

    // Validate status
    if (!['pending', 'completed', 'rejected'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status must be pending, completed, or rejected'
      })
    }

    // Validate amount
    if (parseFloat(amount) <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Amount must be greater than 0'
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

    // Get current deposit to check previous status
    const { data: currentDeposit, error: currentError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .single()

    if (currentError || !currentDeposit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Deposit not found'
      })
    }

    const previousStatus = currentDeposit.status
    const previousCoinAmount = currentDeposit.coin_amount || 0

    // Update deposit
    const updateData: any = {
      amount: parseFloat(amount),
      from_wallet_address: from_wallet_address.trim(),
      to_wallet_address: to_wallet_address.trim(),
      payment_method: payment_method.trim(),
      wallet_model: wallet_model?.trim() || payment_method.trim(),
      status: status
    }

    // Add optional fields if provided
    const newCoinAmount = coin_amount !== undefined ? parseFloat(coin_amount) : previousCoinAmount
    if (coin_amount !== undefined) {
      updateData.coin_amount = newCoinAmount
    }
    if (conversion_rate !== undefined) {
      updateData.conversion_rate = parseFloat(conversion_rate)
    }

    const { data: deposit, error } = await supabase
      .from('deposits')
      .update(updateData)
      .eq('id', depositId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating deposit:', error)
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Failed to update deposit'
      })
    }

    if (!deposit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Deposit not found'
      })
    }

    // Update member coin balance when status changes to/from completed
    if (previousStatus !== status || (status === 'completed' && newCoinAmount !== previousCoinAmount)) {
      // Get member current balance
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, coin_balance, total_coin')
        .eq('id', deposit.member_id)
        .single()

      if (!memberError && member) {
        let newCoinBalance = parseFloat(member.coin_balance || 0)
        let newTotalCoin = parseFloat(member.total_coin || 0)

        if (status === 'completed' && previousStatus !== 'completed') {
          // Add coin when status becomes completed
          newCoinBalance += newCoinAmount
          newTotalCoin += newCoinAmount
        } else if (previousStatus === 'completed' && status !== 'completed') {
          // Subtract coin when status changes from completed to something else
          newCoinBalance -= previousCoinAmount
          newTotalCoin -= previousCoinAmount
        } else if (status === 'completed' && previousStatus === 'completed' && newCoinAmount !== previousCoinAmount) {
          // If already completed but coin_amount changed, adjust the difference
          const difference = newCoinAmount - previousCoinAmount
          newCoinBalance += difference
          newTotalCoin += difference
        }

        // Ensure balance doesn't go negative
        newCoinBalance = Math.max(0, newCoinBalance)
        newTotalCoin = Math.max(0, newTotalCoin)

        // Update member coin balance
        const { error: updateBalanceError } = await supabase
          .from('members')
          .update({
            coin_balance: newCoinBalance,
            total_coin: newTotalCoin
          })
          .eq('id', deposit.member_id)

        if (updateBalanceError) {
          console.error('Error updating member coin balance:', updateBalanceError)
          // Don't throw error, just log it - deposit update was successful
        } else {
          console.log(`Updated member ${deposit.member_id} coin balance: ${newCoinBalance} (was ${member.coin_balance || 0})`)
        }
      }
    }

    // Calculate and distribute referral bonus when deposit becomes completed
    // Skip bonus deposit to prevent infinite loop
    if (status === 'completed' && previousStatus !== 'completed' && deposit.payment_method !== 'referral_bonus' && !deposit.payment_method?.startsWith('matching_bonus')) {
      console.log(`🟢 Deposit ${deposit.id} became completed, calculating referral bonus...`)
      await calculateAndDistributeReferralBonus(supabase, deposit)
      // Also calculate matching bonus (level 1, 2, 3)
      await calculateAndDistributeMatchingBonus(supabase, deposit)
    } else {
      if (deposit.payment_method === 'referral_bonus' || deposit.payment_method?.startsWith('matching_bonus')) {
        console.log(`⏭️ Skipping bonus calculation for bonus deposit ${deposit.id}`)
      } else if (status !== 'completed') {
        console.log(`⏭️ Deposit ${deposit.id} status is ${status}, not completed, skipping bonus`)
      } else {
        console.log(`⏭️ Deposit ${deposit.id} was already completed, skipping bonus calculation`)
      }
    }

    return {
      success: true,
      message: 'Deposit berhasil diupdate',
      data: deposit
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Failed to update deposit'
    })
  }
})

