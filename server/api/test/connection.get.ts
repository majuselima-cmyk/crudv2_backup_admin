/**
 * Test Supabase Connection
 * GET /api/test/connection
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    
    // Try multiple sources for environment variables
    const supabaseUrl = config.public?.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseAnonKey = config.public?.supabaseAnonKey || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

    // Check environment variables
    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      urlFromConfig: !!config.public?.supabaseUrl,
      urlFromEnv: !!process.env.SUPABASE_URL || !!process.env.NUXT_PUBLIC_SUPABASE_URL,
      keyFromConfig: !!config.supabaseServiceRoleKey,
      keyFromEnv: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      // Show partial values for debugging (first 20 chars only)
      urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'missing',
      anonKeyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'missing',
      serviceKeyPreview: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'missing'
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        success: false,
        message: 'Supabase configuration is missing',
        envCheck,
        instructions: [
          '1. Pastikan file .env ada di folder admin-package/',
          '2. File .env harus berisi:',
          '   - SUPABASE_URL',
          '   - SUPABASE_SERVICE_ROLE_KEY',
          '   - NUXT_PUBLIC_SUPABASE_URL (optional)',
          '3. Restart dev server setelah membuat/mengubah .env'
        ]
      }
    }

    // Test connection with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Try a simple query to test connection
    // Check if we can access the database
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      // Check if it's a table not found error or connection error
      const isTableError = error.message.includes('relation') || error.message.includes('does not exist')
      
      return {
        success: true,
        connection: 'OK',
        message: isTableError 
          ? 'Koneksi berhasil, tapi tabel belum dibuat. Ini normal untuk setup awal.'
          : 'Koneksi OK tapi ada error saat query',
        envCheck,
        error: {
          message: error.message,
          code: error.code,
          hint: error.hint
        },
        note: isTableError 
          ? 'Buat tabel "users" di Supabase Dashboard untuk melanjutkan setup login.'
          : 'Cek error di atas untuk detail lebih lanjut.'
      }
    }

    return {
      success: true,
      connection: 'OK',
      message: 'Koneksi Supabase berhasil!',
      envCheck,
      testQuery: 'OK',
      data
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error saat test koneksi',
      error: error?.message || 'Unknown error',
      stack: error?.stack
    }
  }
})


