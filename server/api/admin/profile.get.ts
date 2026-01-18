/**
 * Get admin profile
 * GET /api/admin/profile
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    // Get user ID from cookie (set saat login)
    const userId = getCookie(event, 'admin_user_id')

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const config = useRuntimeConfig()
    const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
    const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user profile
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error) {
      throw createError({
        statusCode: 404,
        statusMessage: error.message || 'User not found'
      })
    }

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return {
      success: true,
      data: user
    }
  } catch (error: any) {
    // If error is already an H3Error, just re-throw it
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }
    
    // Handle error safely
    const statusCode = error?.statusCode || 500
    const message = error?.message || String(error) || 'Failed to fetch profile'
    
    throw createError({
      statusCode,
      statusMessage: message
    })
  }
})

