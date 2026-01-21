/**
 * Test endpoint to debug deposits
 * GET /api/admin/test-deposits
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

    // Get all deposits
    const { data: allDeposits, error: depositsError } = await supabase
      .from('deposits')
      .select('id, member_id, amount, coin_amount, status')
      .order('created_at', { ascending: false })

    if (depositsError) {
      return {
        success: false,
        error: depositsError.message,
        deposits: []
      }
    }

    // Get all members
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('id, email, username')
      .limit(5)

    // Filter completed deposits
    const completedDeposits = (allDeposits || []).filter(d => {
      const status = String(d.status || '').toLowerCase().trim()
      return status === 'completed' || status === 'selesai'
    })

    // Group by member
    const depositsByMember: any = {}
    completedDeposits.forEach(deposit => {
      const memberId = String(deposit.member_id || '')
      if (!depositsByMember[memberId]) {
        depositsByMember[memberId] = {
          member_id: memberId,
          deposits: [],
          total_balance: 0,
          total_coin: 0
        }
      }
      depositsByMember[memberId].deposits.push(deposit)
      depositsByMember[memberId].total_balance += parseFloat(deposit.amount || 0)
      depositsByMember[memberId].total_coin += parseFloat(deposit.coin_amount || 0)
    })

    return {
      success: true,
      total_deposits: allDeposits?.length || 0,
      completed_deposits: completedDeposits.length,
      deposits_by_member: depositsByMember,
      sample_deposits: allDeposits?.slice(0, 10) || [],
      sample_members: allMembers || []
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Unknown error',
      deposits: []
    }
  }
})

