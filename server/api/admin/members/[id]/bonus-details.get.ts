/**
 * Get member bonus details
 * GET /api/admin/members/[id]/bonus-details
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

    const memberId = getRouterParam(event, 'id')

    if (!memberId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Member ID is required'
      })
    }

    // Get member data to get member_type for coin price
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('member_type')
      .eq('id', memberId)
      .single()

    if (memberError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to get member: ${memberError.message}`
      })
    }

    // Get coin settings for conversion
    const { data: coinSettings } = await supabase
      .from('coin_settings')
      .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
      .single()

    let pricePerCoin = parseFloat(coinSettings?.normal_price_usdt) || 0.5
    if (member?.member_type === 'vip' && coinSettings?.vip_price_usdt) {
      pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
    } else if (member?.member_type === 'leader' && coinSettings?.leader_price_usdt) {
      pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
    }

    // Get bonus settings
    const { data: bonusSetting, error: bonusError } = await supabase
      .from('bonus_settings')
      .select('*') // Select all to get dynamic level percentages
      .single()

    if (bonusError && bonusError.code !== 'PGRST116') {
      console.error('Error fetching bonus settings:', bonusError)
    }
    
    // Debug log to see available columns
    console.log('Bonus Settings Columns:', Object.keys(bonusSetting || {}))

    const referralPercentage = bonusSetting?.referral_percentage || 15.00
    const referralBalancePercentage = bonusSetting?.referral_balance_percentage || 80.00
    const referralCoinPercentage = bonusSetting?.referral_coin_percentage || 20.00

    // Get all downlines (members yang referred_by = memberId) - Level 1 (Direct Referral)
    const { data: downlines, error: downlineError } = await supabase
      .from('members')
      .select('id')
      .eq('referred_by', memberId)

    if (downlineError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to get downlines: ${downlineError.message}`
      })
    }

    const downlineIds = (downlines || []).map(d => d.id)

    // Calculate Referral Bonus (Level 1)
    let totalDownlineDeposit = 0
    
    if (downlineIds.length > 0) {
      // Get all completed deposits from downlines
      const { data: deposits, error: depositError } = await supabase
        .from('deposits')
        .select('amount')
        .in('member_id', downlineIds)
        .eq('status', 'completed')

      if (depositError) {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to get deposits: ${depositError.message}`
        })
      }

      if (deposits && deposits.length > 0) {
        totalDownlineDeposit = deposits.reduce((sum, deposit) => {
          const depositAmount = parseFloat(deposit.amount) || 0
          return sum + depositAmount
        }, 0)
      }
    }

    // Calculate total referral bonus (15% dari total deposit downline)
    const totalReferralBonus = totalDownlineDeposit * (referralPercentage / 100)
    const referralBonusUsdt = totalReferralBonus * (referralBalancePercentage / 100)
    const referralBonusCoinUsdt = totalReferralBonus * (referralCoinPercentage / 100)
    const referralBonusCoin = pricePerCoin > 0 ? referralBonusCoinUsdt / pricePerCoin : 0
    const referralBonusUsdtToCoin = pricePerCoin > 0 ? referralBonusUsdt / pricePerCoin : 0
    const referralBonusCoinToUsdt = referralBonusCoinUsdt

    // --- MATCHING BONUS CALCULATION ---
    // Level 1 Matching = Level 2 Referral
    // Level 2 Matching = Level 3 Referral
    // Level 3 Matching = Level 4 Referral
    
    // Get percentages from DB
    const level1Pct = parseFloat(bonusSetting?.matching_level1_percentage || 10)
    const level2Pct = parseFloat(bonusSetting?.matching_level2_percentage || 5)
    const level3Pct = parseFloat(bonusSetting?.matching_level3_percentage || 3)

    console.log(`Using Matching Percentages from DB: L1=${level1Pct}%, L2=${level2Pct}%, L3=${level3Pct}%`)

    // Settings Matching Bonus
    const matchingBonusLevels = [
      { level: 1, percentage: level1Pct }, // Level 1 Matching (from Level 2 Referral)
      { level: 2, percentage: level2Pct },  // Level 2 Matching (from Level 3 Referral)
      { level: 3, percentage: level3Pct }   // Level 3 Matching (from Level 4 Referral)
    ]

    const matchingDetails = {
      total_matching_bonus: 0,
      levels: [],
      explanation: 'Bonus matching dihitung dari level 2 referral ke atas (Level 1 Matching = Level 2 Referral).'
    }

    // Kita butuh Level 1 Referral (downlineIds) sebagai titik awal untuk mencari Level 2
    let currentLevelIds = downlineIds // Start with Level 1 Referral IDs
    
    // Loop untuk matching levels
    for (let i = 0; i < matchingBonusLevels.length; i++) {
      const matchingLevel = matchingBonusLevels[i]
      
      // Jika tidak ada upline di level sebelumnya, stop
      if (currentLevelIds.length === 0) {
        matchingDetails.levels.push({
          matching_level: matchingLevel.level,
          referral_level: matchingLevel.level + 1,
          percentage: matchingLevel.percentage,
          total_deposits: 0,
          matching_bonus: 0,
          member_count: 0,
          members: []
        })
        continue
      }

      // Cari referral level berikutnya (currentLevelIds adalah upline)
      const { data: nextLevelMembers, error: nextLevelError } = await supabase
        .from('members')
        .select('id, email, username')
        .in('referred_by', currentLevelIds)
      
      if (nextLevelError) {
        console.error(`Error fetching level ${matchingLevel.level + 1} referrals:`, nextLevelError)
        continue
      }
      
      const nextLevelIds = (nextLevelMembers || []).map(m => m.id)
      
      let levelTotalDeposits = 0
      const levelMembersWithDeposits = []

      if (nextLevelIds.length > 0) {
        // Hitung deposit level ini
        const { data: levelDeposits, error: levelDepositError } = await supabase
          .from('deposits')
          .select('member_id, amount')
          .in('member_id', nextLevelIds)
          .eq('status', 'completed')
        
        if (!levelDepositError && levelDeposits) {
          // Group deposits by member
          const memberDepositsMap = {}
          
          levelDeposits.forEach(d => {
            const amount = parseFloat(d.amount) || 0
            memberDepositsMap[d.member_id] = (memberDepositsMap[d.member_id] || 0) + amount
            levelTotalDeposits += amount
          })
          
          // Create members list with deposits
          nextLevelMembers.forEach(m => {
            if (memberDepositsMap[m.id] > 0) {
              levelMembersWithDeposits.push({
                id: m.id,
                email: m.email,
                username: m.username,
                deposits: memberDepositsMap[m.id]
              })
            }
          })
        }
      }

      const levelMatchingBonus = levelTotalDeposits * (matchingLevel.percentage / 100)
      
      console.log(`[Matching] Level ${matchingLevel.level} (Ref Level ${matchingLevel.level + 1}): Members=${nextLevelIds.length}, Deposit=${levelTotalDeposits}, Bonus=${levelMatchingBonus}`)
      
      matchingDetails.total_matching_bonus += levelMatchingBonus

      // Calculate allocation PER LEVEL
      const levelMatchingBonusUsdt = levelMatchingBonus * (referralBalancePercentage / 100)
      const levelMatchingBonusCoinValue = levelMatchingBonus * (referralCoinPercentage / 100)
      const levelMatchingBonusCoin = pricePerCoin > 0 ? levelMatchingBonusCoinValue / pricePerCoin : 0

      matchingDetails.levels.push({
        matching_level: matchingLevel.level,
        referral_level: matchingLevel.level + 1,
        percentage: matchingLevel.percentage,
        total_deposits: levelTotalDeposits,
        matching_bonus: levelMatchingBonus,
        // Add allocation per level
        matching_bonus_usdt: levelMatchingBonusUsdt,
        matching_bonus_coin: levelMatchingBonusCoin,
        
        member_count: levelMembersWithDeposits.length, // Count members who actually deposited
        members: levelMembersWithDeposits
      })

      // Update currentLevelIds for next iteration
      currentLevelIds = nextLevelIds
    }

    // Calculate Matching Bonus Allocation (Split)
    const matchingBonusUsdt = matchingDetails.total_matching_bonus * (referralBalancePercentage / 100)
    const matchingBonusCoinUsdt = matchingDetails.total_matching_bonus * (referralCoinPercentage / 100)
    const matchingBonusCoin = pricePerCoin > 0 ? matchingBonusCoinUsdt / pricePerCoin : 0
    const matchingBonusUsdtToCoin = pricePerCoin > 0 ? matchingBonusUsdt / pricePerCoin : 0
    const matchingBonusCoinToUsdt = matchingBonusCoinUsdt

    // Add allocation details to matching object
    matchingDetails.matching_bonus_usdt = matchingBonusUsdt
    matchingDetails.matching_bonus_coin = matchingBonusCoin
    matchingDetails.matching_bonus_usdt_to_coin = matchingBonusUsdtToCoin
    matchingDetails.matching_bonus_coin_to_usdt = matchingBonusCoinToUsdt

    return {
      success: true,
      data: {
        total_downline_deposit: totalDownlineDeposit,
        referral_percentage: referralPercentage,
        total_referral_bonus: totalReferralBonus,
        referral_balance_percentage: referralBalancePercentage,
        referral_coin_percentage: referralCoinPercentage,
        referral_bonus_usdt: referralBonusUsdt,
        referral_bonus_coin: referralBonusCoin,
        coin_price: pricePerCoin,
        referral_bonus_usdt_to_coin: referralBonusUsdtToCoin,
        referral_bonus_coin_to_usdt: referralBonusCoinToUsdt,
        
        // Add Matching Bonus Details
        matching_bonus_details: matchingDetails,
        total_matching_bonus: matchingDetails.total_matching_bonus,
        matching_bonus_levels: matchingDetails.levels,

        // Grand Total (Referral + Matching)
        grand_total_bonus: totalReferralBonus + matchingDetails.total_matching_bonus,
        grand_total_bonus_usdt: referralBonusUsdt + matchingBonusUsdt,
        grand_total_bonus_coin: referralBonusCoin + matchingBonusCoin
      }
    }
  } catch (error: any) {
    console.error('Error in bonus-details endpoint:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get member bonus details'
    })
  }
})