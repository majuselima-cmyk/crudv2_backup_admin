/**
 * Debug API untuk check data staking dan member_coins
 * GET /api/admin/staking/debug
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const supabaseUrl = config.public?.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check staking table exists dan punya data
    const { data: stakingData, error: stakingError } = await supabase
      .from('staking')
      .select('*')
      .limit(5)

    // Check staking table structure
    const { data: tableInfo } = await supabase
      .rpc('get_table_columns', { table_name: 'staking' })
      .catch(() => ({ data: null }))

    // Check if member_coins table exists
    const { data: memberCoinsData, error: memberCoinsError } = await supabase
      .from('member_coins')
      .select('*')
      .limit(5)

    return {
      success: true,
      staking: {
        data: stakingData,
        error: stakingError?.message,
        count: stakingData?.length || 0
      },
      member_coins: {
        data: memberCoinsData,
        error: memberCoinsError?.message,
        count: memberCoinsData?.length || 0
      },
      table_info: tableInfo,
      config: {
        has_supabase_url: !!supabaseUrl,
        has_service_key: !!supabaseServiceKey
      }
    }
  } catch (error) {
    console.error('[DEBUG] Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
