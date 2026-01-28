/**
 * Create new member
 * POST /api/admin/members
 * Body: { email, username, password, referral_code?, member_type?, status?, referred_by?, bonus_aktif_withdraw_enabled?, bonus_pasif_withdraw_enabled? }
 */
import { createClient } from '@supabase/supabase-js'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'REF'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const {
      email,
      username,
      password,
      referral_code,
      member_type,
      status,
      referred_by,
      bonus_aktif_withdraw_enabled,
      bonus_pasif_withdraw_enabled
    } = body

    if (!email || !username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email, username, dan password wajib diisi'
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Format email tidak valid'
      })
    }

    // Validate username (min 3 chars, alphanumeric + underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,}$/
    if (!usernameRegex.test(username)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username minimal 3 karakter, hanya boleh huruf, angka, dan underscore'
      })
    }

    // Validate password (min 6 chars)
    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password minimal 6 karakter'
      })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedUsername = username.toLowerCase().trim()

    // Check if email already exists
    const { data: emailExists } = await supabase
      .from('members')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (emailExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email sudah digunakan oleh member lain'
      })
    }

    // Check if username already exists
    const { data: usernameExists } = await supabase
      .from('members')
      .select('id')
      .eq('username', normalizedUsername)
      .single()

    if (usernameExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username sudah digunakan oleh member lain'
      })
    }

    // Determine referral_code
    let finalReferralCode: string | null = null
    if (referral_code && referral_code.trim() !== '') {
      const referralCodeRegex = /^[A-Z0-9_]{3,20}$/
      const code = referral_code.trim().toUpperCase()
      if (!referralCodeRegex.test(code)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Kode referral harus 3-20 karakter, hanya huruf besar, angka, dan underscore'
        })
      }
      const { data: refCodeExists } = await supabase
        .from('members')
        .select('id')
        .eq('referral_code', code)
        .single()

      if (refCodeExists) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Kode referral sudah digunakan oleh member lain'
        })
      }
      finalReferralCode = code
    } else {
      // Auto-generate unique referral code
      let candidate = generateReferralCode()
      let attempts = 0
      const maxAttempts = 20
      while (attempts < maxAttempts) {
        const { data: exists } = await supabase
          .from('members')
          .select('id')
          .eq('referral_code', candidate)
          .single()
        if (!exists) {
          finalReferralCode = candidate
          break
        }
        candidate = generateReferralCode()
        attempts++
      }
      if (!finalReferralCode) {
        finalReferralCode = generateReferralCode() + Date.now().toString(36).toUpperCase().slice(-4)
      }
    }

    // Validate member_type
    const finalMemberType = ['normal', 'leader', 'vip'].includes(member_type) ? member_type : 'normal'

    // Validate status
    const finalStatus = ['active', 'inactive', 'pending'].includes(status) ? status : 'active'

    const insertData: Record<string, unknown> = {
      email: normalizedEmail,
      username: normalizedUsername,
      password: password,
      referral_code: finalReferralCode,
      member_type: finalMemberType,
      status: finalStatus,
      bonus_aktif_withdraw_enabled: bonus_aktif_withdraw_enabled !== false,
      bonus_pasif_withdraw_enabled: bonus_pasif_withdraw_enabled !== false
    }

    // Handle referred_by - can be UUID or referral_code
    if (referred_by !== undefined && referred_by !== null && String(referred_by).trim() !== '') {
      const referredByValue = String(referred_by).trim()
      
      // Check if it's a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (uuidRegex.test(referredByValue)) {
        // It's a UUID, check if member exists
        const { data: memberById } = await supabase
          .from('members')
          .select('id')
          .eq('id', referredByValue)
          .single()
        
        if (memberById) {
          insertData.referred_by = referredByValue
        } else {
          throw createError({
            statusCode: 400,
            statusMessage: 'Member dengan ID tersebut tidak ditemukan'
          })
        }
      } else {
        // It's a referral code, find member by referral_code
        const { data: memberByCode } = await supabase
          .from('members')
          .select('id')
          .eq('referral_code', referredByValue.toUpperCase())
          .single()
        
        if (memberByCode) {
          insertData.referred_by = memberByCode.id
        } else {
          throw createError({
            statusCode: 400,
            statusMessage: 'Member dengan kode referral tersebut tidak ditemukan'
          })
        }
      }
    }

    const { data: newMember, error } = await supabase
      .from('members')
      .insert(insertData)
      .select('id, email, username, referral_code, member_type, status, bonus_aktif_withdraw_enabled, bonus_pasif_withdraw_enabled, created_at, updated_at, referred_by')
      .single()

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message || 'Gagal membuat member baru'
      })
    }

    return {
      success: true,
      message: 'Member berhasil ditambahkan',
      data: newMember
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal membuat member baru'
    })
  }
})

