
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

        // Read Body
        const body = await readBody(event)
        // We assume JSON body for updates usually, but if file replacement is needed, might need multipart.
        // Simplifying to metadata update for now. If file needs update, delete and re-create or separate endpoint.
        // Or just support updating title/status/notes here.

        const updateData: any = {
            updated_at: new Date().toISOString()
        }
        if (body.title !== undefined) updateData.title = body.title
        if (body.status !== undefined) updateData.status = body.status
        if (body.type !== undefined) updateData.type = body.type
        if (body.notes !== undefined) updateData.notes = body.notes
        if (body.filename !== undefined) updateData.filename = body.filename
        if (body.file_url !== undefined) updateData.file_url = body.file_url // Allow updating URL manually

        const { data, error } = await supabase
            .from('tools_documents')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }

        return {
            success: true,
            message: 'Document updated successfully',
            data
        }

    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || 'Internal Server Error'
        })
    }
})
