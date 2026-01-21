/**
 * Get wallet addresses for deposit (admin wallets by network)
 * GET /api/admin/wallet-addresses?network=BEP20
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const network = query.network as string || 'BEP20'

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

    // Get active wallet addresses for the network
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('id, network, address, label, status')
      .eq('network', network)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // If wallets table doesn't exist, return empty
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      return {
        success: true,
        data: []
      }
    }

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch wallet addresses'
      })
    }

    return {
      success: true,
      data: wallets || []
    }
  } catch (err) {
    const error = err as { statusCode?: number, message?: string }
    
    if (error && typeof error === 'object' && error.statusCode) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message || 'Failed to fetch wallet addresses'
      })
    }

    // Return empty array on error
    return {
      success: true,
      data: []
    }
  }
})

