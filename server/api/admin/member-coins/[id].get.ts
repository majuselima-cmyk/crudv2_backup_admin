/**
 * Get member coins data (Calculated realtime)
 * GET /api/admin/member-coins/[id]
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

    const memberId = event.context.params?.id

    if (!memberId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Member ID is required'
      })
    }

    // 1. Get existing member_coins data (for staked_coins info)
    const { data: memberCoinsData, error: coinsError } = await supabase
      .from('member_coins')
      .select('*')
      .eq('member_id', memberId)
      .single()

    if (coinsError && coinsError.code !== 'PGRST116') {
      console.error('[member-coins.get] Error:', coinsError)
    }

    // 2. Get member data (for type and referral check)
    const { data: member, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('id', memberId)
        .single()
        
    if (memberError || !member) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Member not found'
        })
    }

    // 3. Calculate Realtime Balance (Same logic as members.get.ts)
    
    // Get coin price
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

    // Get Deposits for Coin Calculation
    const { data: completedDeposits } = await supabase
        .from('deposits')
        .select('coin_amount, amount')
        .eq('member_id', memberId)
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
    const { data: dl1 } = await supabase.from('members').select('id').eq('referred_by', memberId)
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
    const stakedCoins = parseFloat(memberCoinsData?.staked_coins || 0)
    
    // Construct response compatible with member_coins table structure
    // But with realtime total_coins calculation
    const result = {
        id: memberCoinsData?.id || null, // Might be null if no entry exists yet
        member_id: memberId,
        total_coins: totalCoinCalculated, // REALTIME TOTAL
        staked_coins: stakedCoins,
        total_reward_earned: memberCoinsData?.total_reward_earned || 0,
        // Calculate available coins for convenience
        available_coins: Math.max(0, totalCoinCalculated - stakedCoins)
    }

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    console.error('[member-coins.get] Error:', error)
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil data koin member'
    })
  }
})