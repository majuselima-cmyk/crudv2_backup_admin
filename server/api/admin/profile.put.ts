/**
 * Update admin profile
 * PUT /api/admin/profile
 * Body: { name?, email?, password? }
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { name, email, password } = body

    // Get user ID from cookie
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

    // Prepare update data
    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString()
    }

    // Only update fields that are provided
    if (name !== undefined && name !== '') {
      updateData.name = name
    }

    if (email !== undefined && email !== '') {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Format email tidak valid'
        })
      }

      // Check if email already exists (exclude current user)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .neq('id', userId)
        .single()

      if (existingUser) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email sudah digunakan oleh user lain'
        })
      }

      updateData.email = email.toLowerCase().trim()
    }

    if (password !== undefined && password !== '') {
      // Validate password length
      if (password.length < 6) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Password minimal 6 karakter'
        })
      }
      
      // TODO: For production, hash password with bcrypt
      // For now, save as plain text (tidak aman untuk production!)
      updateData.password = password
    }

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, role, created_at, updated_at')
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Failed to update profile'
      })
    }

    return {
      success: true,
      message: 'Profil berhasil diupdate',
      data: updatedUser
    }
  } catch (error: any) {
    // If error is already an H3Error, just re-throw it
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }
    
    // Handle error safely
    const statusCode = error?.statusCode || 500
    const message = error?.message || String(error) || 'Failed to update profile'
    
    throw createError({
      statusCode,
      statusMessage: message
    })
  }
})

