
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    try {
        // 1. Auth Check (Assuming admin middleware or check)
        // In a real app, verify admin session here.
        // const user = await checkAdminUser(event)

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

        // 2. Handle Query Params
        const query = getQuery(event)
        const page = Number(query.page) || 1
        const limit = Number(query.limit) || 10
        const type = query.type as string
        const search = query.search as string
        const status = query.status as string

        const offset = (page - 1) * limit

        // 3. Build Query
        let queryBuilder = supabase
            .from('tools_documents')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type) {
            queryBuilder = queryBuilder.eq('type', type)
        }

        if (status) {
            queryBuilder = queryBuilder.eq('status', status)
        }

        if (search) {
            queryBuilder = queryBuilder.ilike('title', `%${search}%`)
        }

        const { data, error, count } = await queryBuilder

        if (error) {
            throw createError({
                statusCode: 500,
                statusMessage: error.message
            })
        }

        return {
            success: true,
            data,
            total: count,
            page,
            limit,
            total_pages: Math.ceil((count || 0) / limit)
        }

    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || 'Internal Server Error'
        })
    }
})
