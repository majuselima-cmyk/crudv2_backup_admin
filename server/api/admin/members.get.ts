/**
 * Get all members
 * GET /api/admin/members
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

    // Get query parameters for pagination
    const query = getQuery(event)
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    // Get all members (exclude password fields) with pagination
    const { data: members, error, count } = await supabase
      .from('members')
      .select('id, email, username, referral_code, member_type, status, bonus_aktif_withdraw_enabled, bonus_pasif_withdraw_enabled, created_at, updated_at, referred_by', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal mengambil data members'
      })
    }

    // Calculate total downline and deposit stats for each member
    const membersWithStats = await Promise.all(
      (members || []).map(async (member) => {
        // Count direct referrals (downline level 1)
        // Try by ID first, then by referral_code
        let downlineCount = 0
        
        // Method 1: Count by referred_by = member.id
        const { count: countById } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', member.id)
        
        if (countById !== null) {
          downlineCount = countById
        } else if (member.referral_code) {
          // Method 2: Count by referred_by = member.referral_code
          const { count: countByCode } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', member.referral_code)
          
          if (countByCode !== null) {
            downlineCount = countByCode
          }
        }
        
        // Calculate total deposit amount (completed deposits only)
        // Get ALL deposits first, then filter by member_id and status
        // This ensures we catch all deposits regardless of type mismatches
        type DepositRow = { id: string; member_id: string; amount: number | string; coin_amount?: number | string; status: string }
        let completedDeposits: DepositRow[] = []
        let allMemberDeposits: DepositRow[] = []
        let depositsError = null
        
        // Get ALL deposits from database (we'll filter in JavaScript)
        const { data: allDeposits, error: allDepositsError } = await supabase
          .from('deposits')
          .select('id, member_id, amount, coin_amount, status')
        
        if (allDepositsError) {
          depositsError = allDepositsError
          console.error(`Error fetching all deposits:`, allDepositsError)
        } else if (allDeposits) {
          // Filter by member_id (handle type conversion - UUID vs string)
          const memberIdStr = String(member.id || '')
          allMemberDeposits = allDeposits.filter(deposit => {
            const depositMemberId = String(deposit.member_id || '')
            const matches = depositMemberId === memberIdStr || 
                           depositMemberId === member.id ||
                           deposit.member_id === member.id
            return matches
          })
          
          // Filter by completed status (case insensitive, handle both "completed" and "selesai")
          completedDeposits = allMemberDeposits.filter(deposit => {
            const status = String(deposit.status || '').toLowerCase().trim()
            return status === 'completed' || status === 'selesai'
          })
        }
        
        let totalBalance = 0
        let totalCoinFromDeposits = 0
        
        if (depositsError) {
          console.error(`Error fetching deposits for member ${member.id}:`, depositsError)
        }
        
        if (!depositsError) {
          if (completedDeposits && completedDeposits.length > 0) {
            totalBalance = completedDeposits.reduce((sum, deposit) => {
              const amount = parseFloat(String(deposit.amount || 0)) || 0
              return sum + amount
            }, 0)
            
            totalCoinFromDeposits = completedDeposits.reduce((sum, deposit) => {
              const coinAmount = parseFloat(String(deposit.coin_amount || 0)) || 0
              return sum + coinAmount
            }, 0)
          }
        } else if (depositsError) {
          console.error(`Error fetching deposits for member ${member.id}:`, depositsError)
        }
        
        // Calculate total withdraws (completed + pending, exclude rejected)
        let totalWithdraw = 0
        const memberIdStr = String(member.id || '')
        const { data: allWithdraws, error: withdrawsError } = await supabase
          .from('withdraws')
          .select('id, member_id, amount, status')
        
        if (!withdrawsError && allWithdraws) {
          // Filter by member_id and status (completed or pending, exclude rejected)
          const validWithdraws = allWithdraws.filter(withdraw => {
            const withdrawMemberId = String(withdraw.member_id || '')
            const matches = withdrawMemberId === memberIdStr || 
                           withdrawMemberId === member.id ||
                           withdraw.member_id === member.id
            if (!matches) return false
            
            const status = String(withdraw.status || '').toLowerCase().trim()
            return status === 'completed' || status === 'pending'
          })
          
          totalWithdraw = validWithdraws.reduce((sum, withdraw) => {
            const amount = parseFloat(withdraw.amount) || 0
            return sum + amount
          }, 0)
        }
        
        // Rumus: Total Balance USDT = deposit (completed) - withdraw (pending + completed)
        // Rejected withdraw TIDAK dihitung. Bonus referral (80% ke balance) sudah termasuk
        // di total deposit via deposit dengan payment_method = 'referral_bonus'.
        const remainingBalance = Math.max(0, totalBalance - totalWithdraw)
        
        // Saldo Coin = Total Balance USDT / harga coin (berdasarkan member_type: normal/leader/vip)
        let coinBalance = 0
        const { data: coinSettings } = await supabase
          .from('coin_settings')
          .select('normal_price_usdt, vip_price_usdt, leader_price_usdt')
          .single()
        
        if (coinSettings && remainingBalance > 0) {
          let pricePerCoin = parseFloat(coinSettings.normal_price_usdt) || 0.5
          if (member.member_type === 'vip' && coinSettings.vip_price_usdt) {
            pricePerCoin = parseFloat(coinSettings.vip_price_usdt)
          } else if (member.member_type === 'leader' && coinSettings.leader_price_usdt) {
            pricePerCoin = parseFloat(coinSettings.leader_price_usdt)
          }
          
          if (pricePerCoin > 0) {
            coinBalance = remainingBalance / pricePerCoin
          }
        }
        
        return {
          ...member,
          total_downline: downlineCount || 0,
          total_balance: totalBalance, // Total deposit completed (termasuk bonus referral)
          total_withdraw: totalWithdraw, // Total withdraw (completed + pending, exclude rejected)
          remaining_balance: remainingBalance, // Balance USDT = deposit - withdraw
          total_coin_from_deposits: totalCoinFromDeposits,
          coin_balance: coinBalance // Saldo Coin = remaining_balance / price (by member_type)
        }
      })
    )

    return {
      success: true,
      data: membersWithStats || [],
      count: count || 0,
      limit,
      offset
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil data members'
    })
  }
})
