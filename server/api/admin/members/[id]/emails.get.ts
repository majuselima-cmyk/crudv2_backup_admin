
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const memberId = event.context.params?.id

        if (!memberId) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Member ID is required'
            })
        }

        const client = await serverSupabaseClient(event)

        const { data, error } = await client
            .from('email_logs')
            .select('*')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false })

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message
            })
        }

        return {
            success: true,
            data: data
        }

    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.message || 'Failed to fetch email history'
        })
    }
})
