
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    try {
        // 1. Auth Check (TODO: Add admin auth check)

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

        // 2. Handle Multipart Form Data (File Upload) OR JSON Body
        // We expect multipart form data to handle file uploads
        const formData = await readMultipartFormData(event)

        let title = ''
        let type = ''
        let status = 'active'
        let fileUrl = ''
        let filename = ''
        let fileSize = 0
        let notes = ''
        let memberId = null // Admin upload, maybe null or admin's id if applicable

        if (formData) {
            // Handle Multipart
            let filePart: any = null

            for (const part of formData) {
                if (part.name === 'title') title = part.data.toString()
                if (part.name === 'type') type = part.data.toString()
                if (part.name === 'status') status = part.data.toString()
                if (part.name === 'notes') notes = part.data.toString()
                if (part.name === 'file_url') fileUrl = part.data.toString() // If providing direct URL
                if (part.name === 'filename') filename = part.data.toString() // Manual filename override
                if (part.name === 'file') filePart = part
            }

            // Upload file if provided
            if (filePart && filePart.filename) {
                if (!filename) filename = filePart.filename
                fileSize = filePart.data.length

                // Upload to Supabase Storage
                const fileExt = filename.split('.').pop()
                const uniquePath = `admin-tools/${type}/${Date.now()}_${filename}`

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('tools') // Ensure this bucket exists or use 'public'
                    .upload(uniquePath, filePart.data, {
                        contentType: filePart.type,
                        upsert: false
                    })

                if (uploadError) {
                    throw createError({ statusCode: 500, statusMessage: 'Failed to upload file to storage: ' + uploadError.message })
                }

                // Get Public URL
                const { data: publicUrlData } = supabase.storage
                    .from('tools')
                    .getPublicUrl(uniquePath)

                fileUrl = publicUrlData.publicUrl
            }
        } else {
            // Try reading JSON body if no multipart (e.g. just adding a link)
            const body = await readBody(event)
            if (body) {
                title = body.title
                type = body.type
                status = body.status || 'active'
                fileUrl = body.file_url
                filename = body.filename
                notes = body.notes
            }
        }

        // Validation
        if (!title || !type || (!fileUrl && !filename)) { // Basic validation
            throw createError({ statusCode: 400, statusMessage: 'Title, Type, and File (or URL) are required' })
        }
        if (!filename && fileUrl) {
            // Extract filename from URL if not provided
            filename = fileUrl.split('/').pop() || 'download'
        }

        // 3. Insert into DB
        const { data, error } = await supabase
            .from('tools_documents')
            .insert({
                title,
                type,
                status,
                file_url: fileUrl,
                filename,
                file_size: fileSize,
                notes,
                // member_id: ... // Optional: link to admin user if needed
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            throw createError({ statusCode: 500, statusMessage: error.message })
        }

        return {
            success: true,
            message: 'Document created successfully',
            data
        }

    } catch (err: any) {
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err.statusMessage || 'Internal Server Error'
        })
    }
})
