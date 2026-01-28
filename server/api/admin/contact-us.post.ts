/**
 * Create new contact us message
 * POST /api/admin/contact-us
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
        const { username, email, subject, message, member_id } = body

        // Validation
        if (!username || !email || !message) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Username, email, and message are required'
            })
        }

        const { data, error } = await supabase
            .from('contact_us')
            .insert({
                username,
                email,
                subject: subject || 'No Subject',
                message,
                member_id: member_id || null
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase insert error:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to create message'
            })
        }

        return {
            success: true,
            data,
            message: 'Message created successfully'
        }
    } catch (err: any) {
        if (err && typeof err === 'object' && err.statusCode) {
            throw err
        }

        throw createError({
            statusCode: 500,
            statusMessage: err?.message || 'Failed to create message'
        })
    }
})
