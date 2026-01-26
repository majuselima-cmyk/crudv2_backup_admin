/**
 * Get withdraw statistics
 * GET /api/admin/withdraw-stats
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

    // Get total members count
    const { count: totalMembers, error: membersError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true })

    if (membersError) {
      console.error('Error fetching members count:', membersError)
    }

    // Get total deposit (completed deposits only)
    const { data: deposits, error: depositsError } = await supabase
      .from('deposits')
      .select('amount')
      .eq('status', 'completed')

    let totalDeposit = 0
    if (deposits && !depositsError) {
      totalDeposit = deposits.reduce((sum, deposit) => {
        return sum + (parseFloat(deposit.amount || 0) || 0)
      }, 0)
    }

    // Get total withdraw (completed + pending, exclude rejected)
    const { data: withdraws, error: withdrawsError } = await supabase
      .from('withdraws')
      .select('amount')
      .in('status', ['completed', 'pending'])

    let totalWithdraw = 0
    if (withdraws && !withdrawsError) {
      totalWithdraw = withdraws.reduce((sum, withdraw) => {
        return sum + (parseFloat(withdraw.amount || 0) || 0)
      }, 0)
    }

    return {
      success: true,
      data: {
        totalMembers: totalMembers || 0,
        totalDeposit: totalDeposit,
        totalWithdraw: totalWithdraw
      }
    }
  } catch (err: any) {
    if (err && typeof err === 'object' && err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Failed to fetch withdraw statistics'
    })
  }
})
