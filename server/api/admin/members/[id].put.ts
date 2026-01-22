/**
 * Update member
 * PUT /api/admin/members/[id]
 * Body: { email?, username?, status?, password?, referral_code?, member_type?, bonus_aktif_withdraw_enabled?, bonus_pasif_withdraw_enabled? }
 */
import { createClient } from '@supabase/supabase-js'
import * as bcryptjs from 'bcryptjs'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { email, username, referral_code, member_type, status, password, bonus_aktif_withdraw_enabled, bonus_pasif_withdraw_enabled } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID member wajib diisi'
      })
    }

    const config = useRuntimeConfig()
    const supabaseUrl = config.public?.supabaseUrl || process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
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

    // Build update object
    const updateData: any = {}
    
    if (email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Format email tidak valid'
        })
      }
      updateData.email = email.toLowerCase().trim()
    }

    if (username !== undefined) {
      // Validate username
      const usernameRegex = /^[a-zA-Z0-9_]{3,}$/
      if (!usernameRegex.test(username)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Username minimal 3 karakter, hanya boleh huruf, angka, dan underscore'
        })
      }
      updateData.username = username.toLowerCase().trim()
    }

    if (referral_code !== undefined) {
      // Validate referral code (alphanumeric, uppercase, min 3 chars, max 20 chars)
      if (referral_code && referral_code.trim() !== '') {
        const referralCodeRegex = /^[A-Z0-9_]{3,20}$/
        if (!referralCodeRegex.test(referral_code.trim().toUpperCase())) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Kode referral harus 3-20 karakter, hanya huruf besar, angka, dan underscore'
          })
        }
        updateData.referral_code = referral_code.trim().toUpperCase()
      } else {
        // Allow empty referral code (set to null)
        updateData.referral_code = null
      }
    }

    if (member_type !== undefined) {
      // Validate member_type
      if (!['normal', 'leader', 'vip'].includes(member_type)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Member type must be normal, leader, or vip'
        })
      }
      updateData.member_type = member_type
    }

    if (status !== undefined) {
      // Validate status
      if (!['active', 'inactive', 'pending'].includes(status)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Status harus active, inactive, atau pending'
        })
      }
      updateData.status = status
    }

    if (bonus_aktif_withdraw_enabled !== undefined) {
      updateData.bonus_aktif_withdraw_enabled = Boolean(bonus_aktif_withdraw_enabled)
    }

    if (bonus_pasif_withdraw_enabled !== undefined) {
      updateData.bonus_pasif_withdraw_enabled = Boolean(bonus_pasif_withdraw_enabled)
    }

    // Handle password update
    if (password !== undefined && password !== null && password.trim() !== '') {
      // Validate password length
      if (password.length < 6) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Password minimal 6 karakter'
        })
      }
      // Hash password
      const saltRounds = 10
      const hashedPassword = bcryptjs.hashSync(password, saltRounds)
      updateData.password = hashedPassword
    }

    // Check if member exists and get current data
    const { data: existingMember, error: checkError } = await supabase
      .from('members')
      .select('id, email, username, referral_code')
      .eq('id', id)
      .single()

    if (checkError || !existingMember) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member tidak ditemukan'
      })
    }

    // Check if email already exists (only if email is being changed)
    if (updateData.email) {
      const normalizedNewEmail = updateData.email.toLowerCase().trim()
      const normalizedCurrentEmail = existingMember.email?.toLowerCase().trim()
      
      // Only check if email is actually being changed
      if (normalizedNewEmail !== normalizedCurrentEmail) {
        const { data: emailExists } = await supabase
          .from('members')
          .select('id')
          .eq('email', normalizedNewEmail)
          .neq('id', id) // Exclude current member
          .single()

        if (emailExists) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Email sudah digunakan oleh member lain'
          })
        }
      }
    }

    // Check if username already exists (only if username is being changed)
    if (updateData.username) {
      const normalizedNewUsername = updateData.username.toLowerCase().trim()
      const normalizedCurrentUsername = existingMember.username?.toLowerCase().trim()
      
      // Only check if username is actually being changed
      if (normalizedNewUsername !== normalizedCurrentUsername) {
        const { data: usernameExists } = await supabase
          .from('members')
          .select('id')
          .eq('username', normalizedNewUsername)
          .neq('id', id) // Exclude current member
          .single()

        if (usernameExists) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Username sudah digunakan oleh member lain'
          })
        }
      }
    }

    // Check if referral code already exists (only if referral code is being changed)
    if (updateData.referral_code !== undefined) {
      const normalizedNewReferralCode = updateData.referral_code ? updateData.referral_code.toUpperCase().trim() : null
      const normalizedCurrentReferralCode = existingMember.referral_code ? existingMember.referral_code.toUpperCase().trim() : null
      
      // Only check if referral code is actually being changed and not empty
      if (normalizedNewReferralCode && normalizedNewReferralCode !== normalizedCurrentReferralCode) {
        const { data: referralCodeExists } = await supabase
          .from('members')
          .select('id')
          .eq('referral_code', normalizedNewReferralCode)
          .neq('id', id) // Exclude current member
          .single()

        if (referralCodeExists) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Kode referral sudah digunakan oleh member lain'
          })
        }
      }
    }

    // Update member
    const { data: updatedMember, error: updateError } = await supabase
      .from('members')
      .update(updateData)
      .eq('id', id)
      .select('id, email, username, referral_code, member_type, status, bonus_aktif_withdraw_enabled, bonus_pasif_withdraw_enabled, created_at, updated_at')
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Gagal mengupdate member'
      })
    }

    return {
      success: true,
      message: 'Member berhasil diupdate',
      data: updatedMember
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengupdate member'
    })
  }
})

