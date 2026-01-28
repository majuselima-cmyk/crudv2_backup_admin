/**
 * Get all contact us messages
 * GET /api/admin/contact-us
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
    const limit = parseInt(query.limit as string) || 50
    const offset = parseInt(query.offset as string) || 0
    const search = query.search as string | undefined

    let queryBuilder = supabase
      .from('contact_us')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search && search.trim()) {
      const searchTerm = search.trim()
      queryBuilder = queryBuilder.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
    }

    const { data: messages, error, count } = await queryBuilder

    if (error) {
      console.error('Supabase query error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Failed to fetch messages'
      })
    }

    return {
      success: true,
      data: messages || [],
      count: count || 0,
      limit,
      offset
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to fetch messages'
    })
  }
})
