/**
 * Get member coins data
 * GET /api/admin/member-coins/:memberId
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const memberId = getRouterParam(event, 'memberId')
    console.log(`[member-coins] Fetching coin data for member: ${memberId}`)

    if (!memberId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'memberId wajib diisi'
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

    // Get member coins data
    let { data: memberCoins, error } = await supabase
      .from('member_coins')
      .select('*')
      .eq('member_id', memberId)
      .single()

    console.log(`[member-coins] Query memberCoins - Found: ${!!memberCoins}, Error: ${error?.code}`)

    // If not found, create with default values or calculate from balance
    if (error && error.code === 'PGRST116') {
      // Get member and coin settings
      let member = null
      let memberError = null
      
      const { data: memberData, error: mError } = await supabase
        .from('members')
        .select('id, member_type')
        .eq('id', memberId)
        .single()
      
      if (mError) {
        // Try alternative query without single() in case of format issues
        const { data: memberArray, error: mError2 } = await supabase
          .from('members')
          .select('id, member_type')
          .eq('id', memberId)
        
        if (mError2 || !memberArray || memberArray.length === 0) {
          console.error('Error fetching member:', mError?.message, mError2?.message)
          throw createError({
            statusCode: 404,
            statusMessage: 'Member tidak ditemukan'
          })
        }
        member = memberArray[0]
      } else {
        member = memberData
      }

      if (!member) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Member tidak ditemukan'
        })
      }

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

      // Calculate coin balance from USDT balance
      // Get total deposits (completed only)
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount, coin_amount, status')
        .eq('member_id', memberId)

      let totalBalance = 0
      let totalCoinFromDeposits = 0
      if (deposits) {
        console.log(`[member-coins] Raw deposits fetch: ${deposits.length} records`)
        deposits.forEach(d => {
          console.log(`  - Amount: ${d.amount}, Status: ${d.status}, Coin: ${d.coin_amount}`)
        })
        
        const completedDeposits = deposits.filter(d => {
          const status = String(d.status || '').toLowerCase().trim()
          return status === 'completed' || status === 'selesai'
        })
        
        console.log(`[member-coins] Completed deposits: ${completedDeposits.length}`)
        
        totalBalance = completedDeposits.reduce((sum, d) => sum + (parseFloat(String(d.amount || 0)) || 0), 0)
        totalCoinFromDeposits = completedDeposits.reduce((sum, d) => sum + (parseFloat(String(d.coin_amount || 0)) || 0), 0)
      }

      console.log(`[member-coins] Total deposit balance: ${totalBalance}, Total coin from deposits: ${totalCoinFromDeposits}`)

      // Get total withdraws (completed + pending)
      const { data: withdraws } = await supabase
        .from('withdraws')
        .select('amount, status')
        .eq('member_id', memberId)

      let totalWithdraw = 0
      if (withdraws) {
        console.log(`[member-coins] Raw withdraws fetch: ${withdraws.length} records`)
        const validWithdraws = withdraws.filter(w => {
          const status = String(w.status || '').toLowerCase().trim()
          return status === 'completed' || status === 'pending' || status === 'selesai'
        })
        console.log(`[member-coins] Valid withdraws: ${validWithdraws.length}`)
        totalWithdraw = validWithdraws.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0)
      }

      console.log(`[member-coins] Total withdraw: ${totalWithdraw}`)

      // Calculate bonus aktif from deposits table (payment_method = referral_bonus, matching_bonus_level*)
      const { data: bonusDeposits } = await supabase
        .from('deposits')
        .select('amount, payment_method, status')
        .eq('member_id', memberId)
        .eq('status', 'completed')

      let totalBonusAktif = 0
      if (bonusDeposits && bonusDeposits.length > 0) {
        console.log(`[member-coins] Raw bonus deposits fetch: ${bonusDeposits.length} records`)
        bonusDeposits.forEach(d => {
          console.log(`  - Amount: ${d.amount}, Method: ${d.payment_method}`)
        })
        
        // Sum deposits where payment_method contains bonus keywords
        totalBonusAktif = bonusDeposits
          .filter(d => {
            const method = String(d.payment_method || '').toLowerCase()
            return method.includes('bonus') || method.includes('referral') || method.includes('matching')
          })
          .reduce((sum, d) => sum + (parseFloat(String(d.amount || 0)) || 0), 0)
        
        console.log(`[member-coins] Total bonus aktif: ${totalBonusAktif}`)
      } else {
        console.log('[member-coins] No bonus deposits found')
      }

      // Calculate remaining balance (deposit - withdraw + bonus)
      const remainingBalance = Math.max(0, (totalBalance - totalWithdraw + totalBonusAktif))
      const calculatedCoinBalance = coinPrice > 0 ? remainingBalance / coinPrice : totalCoinFromDeposits

      console.log(`[member-coins] Creating new record - Total deposit: ${totalBalance}, Withdraw: ${totalWithdraw}, Bonus: ${totalBonusAktif}, Remaining: ${remainingBalance}, Coin price: ${coinPrice}, Calculated coins: ${calculatedCoinBalance}`)

      const { data: newMemberCoins, error: insertError } = await supabase
        .from('member_coins')
        .insert({
          member_id: memberId,
          total_coins: totalCoinFromDeposits,
          staked_coins: 0,
          available_coins: calculatedCoinBalance,
          coin_price: coinPrice,
          member_type: member.member_type || 'normal'
        })
        .select('*')
        .single()

      if (insertError) {
        console.error('[member-coins] Insert error:', insertError)
        throw createError({
          statusCode: 500,
          statusMessage: insertError.message || 'Gagal membuat member_coins'
        })
      }

      console.log(`[member-coins] Successfully created member_coins - Available coins: ${newMemberCoins?.available_coins}`)

      memberCoins = newMemberCoins
    } else if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil data member_coins'
      })
    } else if (memberCoins) {
      // If memberCoins exists, recalculate available_coins to ensure it's always fresh
      console.log(`[member-coins] Member coins record exists, recalculating...`)
      try {
        let member = null
        const { data: memberData, error: mError } = await supabase
          .from('members')
          .select('id, member_type, total_bonus_aktif')
          .eq('id', memberId)
          .single()

        // If member not found via single(), try array query
        if (mError) {
          const { data: memberArray, error: mError2 } = await supabase
            .from('members')
            .select('id, member_type, total_bonus_aktif')
            .eq('id', memberId)
          
          if (mError2 || !memberArray || memberArray.length === 0) {
            // If member truly not found, just return existing memberCoins
            console.log('[member-coins] Member not found, returning existing record')
            return {
              success: true,
              data: memberCoins,
              debug: {
                message: 'Using existing member_coins (member not found)',
                availableCoins: memberCoins?.available_coins,
                totalCoins: memberCoins?.total_coins,
                stakedCoins: memberCoins?.staked_coins,
                coinPrice: memberCoins?.coin_price,
                memberType: memberCoins?.member_type
              }
            }
          }
          member = memberArray[0]
        } else {
          member = memberData
        }

        // If member not found, just return existing memberCoins without recalculation
        if (!member) {
          console.log('[member-coins] Member still not found after fallback, returning existing record')
          return {
            success: true,
            data: memberCoins,
            debug: {
              message: 'Using existing member_coins (member not found in fallback)',
              availableCoins: memberCoins?.available_coins,
              totalCoins: memberCoins?.total_coins,
              stakedCoins: memberCoins?.staked_coins,
              coinPrice: memberCoins?.coin_price,
              memberType: memberCoins?.member_type
            }
          }
        }

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

      // Get total deposits
      const { data: deposits } = await supabase
        .from('deposits')
        .select('amount, coin_amount, status')
        .eq('member_id', memberId)

      let totalBalance = 0
      if (deposits) {
        const completedDeposits = deposits.filter(d => {
          const status = String(d.status || '').toLowerCase().trim()
          return status === 'completed' || status === 'selesai'
        })
        console.log(`[member-coins] Recalc - Deposits: ${deposits.length}, Completed: ${completedDeposits.length}`)
        totalBalance = completedDeposits.reduce((sum, d) => sum + (parseFloat(String(d.amount || 0)) || 0), 0)
      }
      console.log(`[member-coins] Recalc - Total balance from deposits: ${totalBalance}`)

      // Get total withdraws
      const { data: withdraws } = await supabase
        .from('withdraws')
        .select('amount, status')
        .eq('member_id', memberId)

      let totalWithdraw = 0
      if (withdraws) {
        const validWithdraws = withdraws.filter(w => {
          const status = String(w.status || '').toLowerCase().trim()
          return status === 'completed' || status === 'pending' || status === 'selesai'
        })
        totalWithdraw = validWithdraws.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0)
      }

      // Get staked coins
      const { data: stakingRecords } = await supabase
        .from('staking')
        .select('coin_amount')
        .eq('member_id', memberId)
        .eq('status', 'active')

      let totalStakedCoins = 0
      if (stakingRecords) {
        totalStakedCoins = stakingRecords.reduce((sum, s) => sum + (parseFloat(String(s.coin_amount || 0)) || 0), 0)
      }

      // Get bonus aktif from deposits table (payment_method = referral_bonus, matching_bonus_level*)
      const { data: bonusDepositsForUpdate } = await supabase
        .from('deposits')
        .select('amount, payment_method, status')
        .eq('member_id', memberId)
        .eq('status', 'completed')

      let totalBonusAktif = 0
      if (bonusDepositsForUpdate && bonusDepositsForUpdate.length > 0) {
        // Sum deposits where payment_method contains bonus keywords
        totalBonusAktif = bonusDepositsForUpdate
          .filter(d => {
            const method = String(d.payment_method || '').toLowerCase()
            return method.includes('bonus') || method.includes('referral') || method.includes('matching')
          })
          .reduce((sum, d) => sum + (parseFloat(String(d.amount || 0)) || 0), 0)
      }

      // Calculate available coins
      const remainingBalance = Math.max(0, (totalBalance - totalWithdraw + totalBonusAktif))
      const calculatedAvailableCoins = coinPrice > 0 ? remainingBalance / coinPrice : 0
      const calculatedAvailableCoinsAfterStaking = Math.max(0, calculatedAvailableCoins - totalStakedCoins)

      // Update available_coins
      const { data: updatedMemberCoins, error: updateError } = await supabase
        .from('member_coins')
        .update({
          available_coins: calculatedAvailableCoinsAfterStaking,
          coin_price: coinPrice
        })
        .eq('member_id', memberId)
        .select('*')
        .single()

      if (!updateError && updatedMemberCoins) {
        memberCoins = updatedMemberCoins
      }
    } catch (recalcError) {
      // If recalculation fails, still return existing memberCoins
      console.error('[member-coins] Error during recalculation:', recalcError)
    }
    }

    return {
      success: true,
      data: memberCoins,
      debug: {
        message: 'Coin balance calculation complete',
        memberCoinsId: memberCoins?.id,
        availableCoins: memberCoins?.available_coins,
        totalCoins: memberCoins?.total_coins,
        stakedCoins: memberCoins?.staked_coins,
        coinPrice: memberCoins?.coin_price,
        memberType: memberCoins?.member_type
      }
    }
  } catch (error) {
    console.error('[member-coins] Error:', (error as any)?.message || String(error))
    throw error
  }
})
