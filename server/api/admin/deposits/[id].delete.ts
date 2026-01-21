/**
 * Delete deposit
 * DELETE /api/admin/deposits/[id]
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const depositId = getRouterParam(event, 'id')

    if (!depositId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Deposit ID is required'
      })
    }

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

    // Check if deposit exists and get full details
    const { data: existingDeposit, error: checkError } = await supabase
      .from('deposits')
      .select('*')
      .eq('id', depositId)
      .single()

    if (checkError || !existingDeposit) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Deposit not found'
      })
    }

    // Delete deposit
    const { error } = await supabase
      .from('deposits')
      .delete()
      .eq('id', depositId)

    if (error) {
      console.error('Error deleting deposit:', error)
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Failed to delete deposit'
      })
    }

    // If deposit was completed, subtract coin from member balance
    if (existingDeposit.status === 'completed' && existingDeposit.coin_amount && existingDeposit.member_id) {
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, coin_balance, total_coin')
        .eq('id', existingDeposit.member_id)
        .single()

      if (!memberError && member) {
        const currentBalance = parseFloat(member.coin_balance || 0)
        const currentTotal = parseFloat(member.total_coin || 0)
        const coinToSubtract = parseFloat(existingDeposit.coin_amount)

        const newBalance = Math.max(0, currentBalance - coinToSubtract)
        const newTotal = Math.max(0, currentTotal - coinToSubtract)

        const { error: updateBalanceError } = await supabase
          .from('members')
          .update({
            coin_balance: newBalance,
            total_coin: newTotal
          })
          .eq('id', existingDeposit.member_id)

        if (updateBalanceError) {
          console.error('Error updating member coin balance after delete:', updateBalanceError)
        } else {
          console.log(`Updated member ${existingDeposit.member_id} coin balance after deposit delete: ${newBalance}`)
        }
      }
    }

    return {
      success: true,
      message: 'Deposit berhasil dihapus'
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Failed to delete deposit'
    })
  }
})

