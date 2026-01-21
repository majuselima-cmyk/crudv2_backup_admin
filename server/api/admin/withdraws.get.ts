/**
 * Get all withdraws for admin (with member details)
 * GET /api/admin/withdraws
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
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

    // Get query parameters
    const query = getQuery(event)
    const status = query.status as string | undefined
    const withdraw_type = query.withdraw_type as string | undefined
    const search = query.search as string | undefined
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    let withdraws = []
    let totalCount = 0

    // If search is provided, combine results from withdraws fields and member search
    if (search && search.trim()) {
      const searchTerm = search.trim()
      
      // 1. Find matching members first
      const { data: matchingMembers } = await supabase
        .from('members')
        .select('id')
        .or(`email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      
      const matchingMemberIds = matchingMembers?.map(m => m.id) || []
      
      // 2. Query withdraws by fields (wallet address, network, etc)
      let fieldQueryBuilder = supabase
        .from('withdraws')
        .select('*')
        .order('created_at', { ascending: false })
        .or(`wallet_address.ilike.%${searchTerm}%,wallet_network.ilike.%${searchTerm}%,wallet_model.ilike.%${searchTerm}%,hash.ilike.%${searchTerm}%`)
      
      if (status && ['pending', 'completed', 'rejected'].includes(status)) {
        fieldQueryBuilder = fieldQueryBuilder.eq('status', status)
      }
      
      if (withdraw_type && ['balance', 'coin', 'bonus_aktif', 'bonus_pasif'].includes(withdraw_type)) {
        fieldQueryBuilder = fieldQueryBuilder.eq('withdraw_type', withdraw_type)
      }
      
      const { data: withdrawsFromFields } = await fieldQueryBuilder
      
      // 3. Query withdraws by member IDs
      let withdrawsFromMembers = []
      if (matchingMemberIds.length > 0) {
        let memberQueryBuilder = supabase
          .from('withdraws')
          .select('*')
          .order('created_at', { ascending: false })
          .in('member_id', matchingMemberIds)
        
        if (status && ['pending', 'completed', 'rejected'].includes(status)) {
          memberQueryBuilder = memberQueryBuilder.eq('status', status)
        }
        
        if (withdraw_type && ['balance', 'coin', 'bonus_aktif', 'bonus_pasif'].includes(withdraw_type)) {
          memberQueryBuilder = memberQueryBuilder.eq('withdraw_type', withdraw_type)
        }
        
        const { data: memberWithdraws } = await memberQueryBuilder
        withdrawsFromMembers = memberWithdraws || []
      }
      
      // 4. Combine and deduplicate
      const allWithdrawsMap = new Map()
      ;[...(withdrawsFromFields || []), ...withdrawsFromMembers].forEach(withdraw => {
        if (!allWithdrawsMap.has(withdraw.id)) {
          allWithdrawsMap.set(withdraw.id, withdraw)
        }
      })
      
      withdraws = Array.from(allWithdrawsMap.values())
      withdraws.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      totalCount = withdraws.length
      
      // Apply pagination
      withdraws = withdraws.slice(offset, offset + limit)
    } else {
      // No search - normal query
      let queryBuilder = supabase
        .from('withdraws')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && ['pending', 'completed', 'rejected'].includes(status)) {
        queryBuilder = queryBuilder.eq('status', status)
      }

      if (withdraw_type && ['balance', 'coin', 'bonus_aktif', 'bonus_pasif'].includes(withdraw_type)) {
        queryBuilder = queryBuilder.eq('withdraw_type', withdraw_type)
      }

      const { data: normalWithdraws, error, count } = await queryBuilder
      
      if (error) {
        console.error('Supabase query error:', error)
        throw createError({
          statusCode: 500,
          statusMessage: error.message || 'Failed to fetch withdraws'
        })
      }
      
      withdraws = normalWithdraws || []
      totalCount = count || 0
    }

    console.log('Raw withdraws from Supabase:', withdraws?.length || 0, 'items')
    console.log('Total count:', totalCount)

    // Fetch members separately and merge
    const memberIds = [...new Set((withdraws || []).map(w => w.member_id).filter(Boolean))]
    let membersMap = {}
    
    console.log('Unique member IDs:', memberIds.length)
    
    if (memberIds.length > 0) {
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, username, email, member_type')
        .in('id', memberIds)
      
      if (membersError) {
        console.error('Error fetching members:', membersError)
      } else if (membersData) {
        membersMap = membersData.reduce((acc, m) => {
          acc[m.id] = m
          return acc
        }, {})
        console.log('Members fetched:', Object.keys(membersMap).length)
      }
    }
    
    // Merge withdraws with members data
    const withdrawsWithMembers = (withdraws || []).map(withdraw => ({
      ...withdraw,
      members: membersMap[withdraw.member_id] || null
    }))

    console.log('Final withdraws with members:', withdrawsWithMembers.length)

    return {
      success: true,
      data: withdrawsWithMembers,
      count: totalCount || 0,
      limit,
      offset
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to fetch withdraws'
    })
  }
})

