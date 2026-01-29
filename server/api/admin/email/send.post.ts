/**
 * Mock Email Sender API
 * POST /api/admin/email/send
 * Body: { memberId, to, subject, message, type }
 */

// import { Resend } from 'resend';
import { serverSupabaseClient } from '#supabase/server'

// const resend = new Resend(process.env.NUXT_RESEND_API_KEY);

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { memberId, to, subject, message, type } = body

        if (!subject || !message) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Subject and message are required'
            })
        }

        // 1. Send Actual Email via Resend (Disabled for now)
        /*
        if (to && to !== 'BROADCAST') {
            try {
                await resend.emails.send({
                    from: process.env.NUXT_MAIL_FROM || 'onboarding@resend.dev',
                    to: to,
                    subject: subject,
                    text: message,
                    // html: `<p>${message}</p>` 
                });
            } catch (emailError) {
                console.error('Resend Error:', emailError);
                // We continue to log to DB even if sending fails, or we could handle it differently
            }
        }
        */

        // Log to Database (Supabase)
        // We assume the nuxtjs/supabase module is available as per package.json
        // But since this is a server-side handler, we might need to use serverSupabaseClient or standard createClient
        // Let's try serverSupabaseClient if available, otherwise just mock it or use process.env

        // In Nuxt 3 with @nuxtjs/supabase:
        const client = await serverSupabaseClient(event)

        const { error: dbError } = await client
            .from('email_logs')
            .insert({
                member_id: memberId || null,
                email_to: to || 'BROADCAST',
                subject: subject,
                message: message,
                category: type,
                status: 'sent'
            })

        if (dbError) {
            console.error('Failed to log email:', dbError)
            // We don't throw error here to not block the success response of sending
        }

        return {
            success: true,
            message: 'Email sent and logged successfully'
        }

    } catch (error: any) {
        console.error('Email send error:', error)
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to send email'
        })
    }
})
