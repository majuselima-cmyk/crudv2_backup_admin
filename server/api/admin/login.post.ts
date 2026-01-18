/**
 * Admin Login API
 * POST /api/admin/login
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, password } = body

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email dan password wajib diisi'
      })
    }

    const config = useRuntimeConfig()
    
    // Try multiple sources for environment variables
    const supabaseUrl = config.public?.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

    // Debug logging (remove in production)
    console.log('Supabase Config Check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlFromConfig: !!config.public?.supabaseUrl,
      keyFromConfig: !!config.supabaseServiceRoleKey,
      urlFromEnv: !!process.env.SUPABASE_URL,
      keyFromEnv: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      throw createError({
        statusCode: 500,
        statusMessage: `Supabase configuration is missing. URL: ${!!supabaseUrl}, Service Key: ${!!supabaseServiceKey}. Please check .env file.`
      })
    }

    // Use service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Find admin user by email and role
    // Note: Table 'users' harus punya kolom role (admin/member)
    const { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('role', 'admin')
      .single()

    if (queryError || !user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Email atau password salah'
      })
    }

    // TODO: Untuk production, gunakan bcrypt untuk verify password
    // Untuk test sekarang, kita cek password langsung (tidak aman untuk production!)
    // Pastikan di database, password di-hash dengan bcrypt
    const isValidPassword = user.password_hash === password || user.password === password

    if (!isValidPassword) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Email atau password salah'
      })
    }

    // Generate simple session token
    const sessionToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    // Set cookie for session
    setCookie(event, 'admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Store user ID in cookie for easy access
    setCookie(event, 'admin_user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Return user data (tanpa password_hash/password)
    const { password_hash, password: pwd, ...userWithoutPassword } = user

    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token: sessionToken
      }
    }
  } catch (error) {
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Login gagal'
    })
  }
})

