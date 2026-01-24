import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[Reward Schedules API] Missing Supabase environment variables')
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'Missing Supabase environment variables',
        data: []
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const query = getQuery(event)
    const { staking_id, member_id, status } = query

    // Build query
    let queryBuilder = supabase
      .from('reward_schedules')
      .select('*')
      .order('scheduled_time', { ascending: true })

    // Apply filters
    if (staking_id) {
      queryBuilder = queryBuilder.eq('staking_id', staking_id)
    }

    if (member_id) {
      queryBuilder = queryBuilder.eq('member_id', member_id)
    }

    if (status) {
      queryBuilder = queryBuilder.eq('status', status)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error('[Reward Schedules API] Supabase Error:', error)
      
      // Handle specific error: table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        setResponseStatus(event, 500)
        return {
          success: false,
          message: 'Tabel reward_schedules belum dibuat. Silakan jalankan migration SQL terlebih dahulu.',
          data: [],
          error: error.message
        }
      }
      
      setResponseStatus(event, 500)
      return {
        success: false,
        message: error.message || 'Gagal mengambil data reward schedules',
        data: [],
        error: error.message
      }
    }

    return {
      success: true,
      data: data || [],
      message: 'Data reward schedules berhasil diambil'
    }
  } catch (error: any) {
    console.error('[Reward Schedules API] Unexpected Error:', error)
    setResponseStatus(event, 500)
    return {
      success: false,
      message: error?.message || 'Gagal mengambil data reward schedules',
      data: [],
      error: error?.stack || String(error)
    }
  }
})

