
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    try {
        const id = event.context.params?.id

        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID is required' })
        }

        const config = useRuntimeConfig()
        const supabaseUrl = config.public.supabaseUrl || process.env.SUPABASE_URL
        const supabaseServiceKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

        const supabase = createClient(supabaseUrl, supabaseServiceKey || '', {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // Physical delete from DB
        // Ideally we also delete the file from Storage if it exists.
        // Fetch file_url first to see if it needs storage deletion.
        const { data: doc } = await supabase.from('tools_documents').select('file_url').eq('id', id).single()

        // Delete record
        const { error } = await supabase
            .from('tools_documents')
            .delete()
            .eq('id', id)

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }

        // Attempt storage delete if it's a supabase storage URL (optional enhancement)
        // if (doc && doc.file_url && doc.file_url.includes('supa')) { ... }

        return {
            success: true,
            message: 'Document deleted successfully'
        }

    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || 'Internal Server Error'
        })
    }
})
