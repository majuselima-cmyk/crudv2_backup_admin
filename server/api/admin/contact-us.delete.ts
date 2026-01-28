/**
 * Delete contact us message
 * DELETE /api/admin/contact-us
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

        const body = await readBody(event)
        const { id } = body

        if (!id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'ID is required'
            })
        }

        const { error } = await supabase
            .from('contact_us')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Supabase delete error:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to delete message'
            })
        }

        return {
            success: true,
            message: 'Message deleted successfully'
        }
    } catch (err: any) {
        if (err && typeof err === 'object' && err.statusCode) {
            throw err
        }

        throw createError({
            statusCode: 500,
            statusMessage: err?.message || 'Failed to delete message'
        })
    }
})
