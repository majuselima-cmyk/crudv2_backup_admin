/**
 * Get all members
 * GET /api/admin/members
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  console.log('🔵 [MEMBERS API] Starting to fetch members...')
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
        let completedDeposits = []
        let allMemberDeposits = []
        let depositsError = null
        
        // Get ALL deposits from database (we'll filter in JavaScript)
        const { data: allDeposits, error: allDepositsError } = await supabase
          .from('deposits')
          .select('id, member_id, amount, coin_amount, status')
        
        if (allDepositsError) {
          depositsError = allDepositsError
          console.error(`Error fetching all deposits:`, allDepositsError)
        } else if (allDeposits) {
          console.log(`Total deposits in database: ${allDeposits.length}`)
          
          // Filter by member_id (handle type conversion - UUID vs string)
          const memberIdStr = String(member.id || '')
          allMemberDeposits = allDeposits.filter(deposit => {
            const depositMemberId = String(deposit.member_id || '')
            const matches = depositMemberId === memberIdStr || 
                           depositMemberId === member.id ||
                           deposit.member_id === member.id
            return matches
          })
          
          console.log(`Member ${member.id} (${member.email}): Found ${allMemberDeposits.length} total deposits`)
          if (allMemberDeposits.length > 0) {
            console.log(`  All deposits for member:`, allMemberDeposits.map(d => ({
              id: d.id,
              member_id: d.member_id,
              status: d.status,
              amount: d.amount,
              coin_amount: d.coin_amount
            })))
          }
          
          // Filter by completed status (case insensitive, handle both "completed" and "selesai")
          completedDeposits = allMemberDeposits.filter(deposit => {
            const status = String(deposit.status || '').toLowerCase().trim()
            const isCompleted = status === 'completed' || status === 'selesai'
            if (isCompleted) {
              console.log(`  Found completed deposit:`, {
                id: deposit.id,
                status: deposit.status,
                amount: deposit.amount,
                coin_amount: deposit.coin_amount
              })
            }
            return isCompleted
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
              const amount = parseFloat(deposit.amount) || 0
              return sum + amount
            }, 0)
            
            totalCoinFromDeposits = completedDeposits.reduce((sum, deposit) => {
              const coinAmount = parseFloat(deposit.coin_amount) || 0
              return sum + coinAmount
            }, 0)
            
            console.log(`✅ Member ${member.id} (${member.email}): ${completedDeposits.length} completed deposits`)
            console.log(`  Deposits:`, completedDeposits.map(d => ({ 
              id: d.id, 
              amount: d.amount, 
              coin_amount: d.coin_amount,
              status: d.status,
              member_id: d.member_id 
            })))
            console.log(`  Total Balance: ${totalBalance}, Total Coin: ${totalCoinFromDeposits}`)
          } else {
            // Debug: Check all deposits for this member
            if (allMemberDeposits && allMemberDeposits.length > 0) {
              console.log(`⚠️ Member ${member.id} (${member.email}): Found ${allMemberDeposits.length} deposits but none are completed`)
              console.log(`  Deposit statuses:`, allMemberDeposits.map(d => ({ 
                id: d.id, 
                status: d.status, 
                amount: d.amount,
                member_id: d.member_id,
                member_id_type: typeof d.member_id,
                member_id_str: String(d.member_id)
              })))
              console.log(`  Member ID being searched: ${member.id} (type: ${typeof member.id})`)
            } else {
              console.log(`❌ Member ${member.id} (${member.email}): No deposits found at all`)
            }
          }
        } else if (depositsError) {
          console.error(`❌ Error fetching deposits for member ${member.id}:`, depositsError)
        }
        
        return {
          ...member,
          total_downline: downlineCount || 0,
          total_balance: totalBalance,
          total_coin_from_deposits: totalCoinFromDeposits
        }
      })
    )

    console.log(`🔵 [MEMBERS API] Returning ${membersWithStats?.length || 0} members`)
    
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
