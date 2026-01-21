/**
 * Get all deposits for admin (with transaction hash and all details)
 * GET /api/admin/deposits
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
    const search = query.search as string | undefined
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0

    let deposits = []
    let totalCount = 0

    // If search is provided, combine results from deposits fields and member search
    if (search && search.trim()) {
      const searchTerm = search.trim()
      
      // 1. Find matching members first
      const { data: matchingMembers } = await supabase
        .from('members')
        .select('id')
        .or(`email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      
      const matchingMemberIds = matchingMembers?.map(m => m.id) || []
      
      // 2. Query deposits by fields (wallet addresses, payment method, etc)
      let fieldQueryBuilder = supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false })
        .or(`from_wallet_address.ilike.%${searchTerm}%,to_wallet_address.ilike.%${searchTerm}%,payment_method.ilike.%${searchTerm}%,wallet_model.ilike.%${searchTerm}%`)
      
      if (status && ['pending', 'completed', 'rejected'].includes(status)) {
        fieldQueryBuilder = fieldQueryBuilder.eq('status', status)
      }
      
      const { data: depositsFromFields } = await fieldQueryBuilder
      
      // 3. Query deposits by member IDs
      let depositsFromMembers = []
      if (matchingMemberIds.length > 0) {
        let memberQueryBuilder = supabase
          .from('deposits')
          .select('*')
          .order('created_at', { ascending: false })
          .in('member_id', matchingMemberIds)
        
        if (status && ['pending', 'completed', 'rejected'].includes(status)) {
          memberQueryBuilder = memberQueryBuilder.eq('status', status)
        }
        
        const { data: memberDeposits } = await memberQueryBuilder
        depositsFromMembers = memberDeposits || []
      }
      
      // 4. Combine and deduplicate
      const allDepositsMap = new Map()
      ;[...(depositsFromFields || []), ...depositsFromMembers].forEach(deposit => {
        if (!allDepositsMap.has(deposit.id)) {
          allDepositsMap.set(deposit.id, deposit)
        }
      })
      
      deposits = Array.from(allDepositsMap.values())
      deposits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      totalCount = deposits.length
      
      // Apply pagination
      deposits = deposits.slice(offset, offset + limit)
    } else {
      // No search - normal query
      let queryBuilder = supabase
        .from('deposits')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status && ['pending', 'completed', 'rejected'].includes(status)) {
        queryBuilder = queryBuilder.eq('status', status)
      }

      const { data: normalDeposits, error, count } = await queryBuilder
      
      if (error) {
        console.error('Supabase query error:', error)
        throw createError({
          statusCode: 500,
          statusMessage: error.message || 'Failed to fetch deposits'
        })
      }
      
      deposits = normalDeposits || []
      totalCount = count || 0
    }

    console.log('Raw deposits from Supabase:', deposits?.length || 0, 'items')
    console.log('Total count:', totalCount)

    // Fetch members separately and merge
    const memberIds = [...new Set((deposits || []).map(d => d.member_id).filter(Boolean))]
    let membersMap = {}
    
    console.log('Unique member IDs:', memberIds.length)
    
    if (memberIds.length > 0) {
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, username, email')
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
    
    // Merge deposits with members data
    const depositsWithMembers = (deposits || []).map(deposit => ({
      ...deposit,
      members: membersMap[deposit.member_id] || null
    }))

    console.log('Final deposits with members:', depositsWithMembers.length)

    return {
      success: true,
      data: depositsWithMembers,
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
      statusMessage: err?.message || 'Failed to fetch deposits'
    })
  }
})
