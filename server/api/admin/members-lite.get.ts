/**
 * Fetch members list (lite version) for dropdowns
 * GET /api/admin/members-lite
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig()
        const query = getQuery(event)
        const search = query.search as string
        const limit = Number(query.limit) || 10

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

        let queryBuilder = supabase
            .from('members')
            .select('id, username, email')
            .limit(limit)

        if (search) {
            queryBuilder = queryBuilder.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
        }

        const { data, error } = await queryBuilder

        if (error) {
            throw error
        }

        return {
            success: true,
            data: data || []
        }
    } catch (err: any) {
        if (err && typeof err === 'object' && err.statusCode) {
            throw err
        }

        throw createError({
            statusCode: 500,
            statusMessage: err?.message || 'Failed to fetch members'
        })
    }
})
