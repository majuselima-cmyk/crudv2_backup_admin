/**
 * Get referrals/downline for a specific member
 * GET /api/admin/members/[id]/referrals
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const memberId = getRouterParam(event, 'id')
    
    if (!memberId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Member ID is required'
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

    // Get member info first
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, email, username, referral_code')
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Member not found'
      })
    }

    // Get direct referrals
    // Try multiple methods to find referrals:
    // 1. By referred_by = member.id (UUID)
    // 2. By referred_by = member.referral_code (string)
    // 3. By any field that might store the referrer
    
    let referrals = []
    
    // Method 1: Try by referred_by = member ID
    const { data: referralsById } = await supabase
      .from('members')
      .select('id, email, username, referral_code, member_type, status, created_at, referred_by')
      .eq('referred_by', memberId)
      .order('created_at', { ascending: false })
    
    if (referralsById && referralsById.length > 0) {
      referrals = referralsById
    } else {
      // Method 2: Try by referred_by = referral_code
      if (member.referral_code) {
        const { data: referralsByCode } = await supabase
          .from('members')
          .select('id, email, username, referral_code, member_type, status, created_at, referred_by')
          .eq('referred_by', member.referral_code)
          .order('created_at', { ascending: false })
        
        if (referralsByCode && referralsByCode.length > 0) {
          referrals = referralsByCode
        }
      }
    }

    // Get total count for each referral (direct downline only)
    const referralsWithCount = await Promise.all(
      referrals.map(async (referral) => {
        // Count direct downline for this referral
        // Try by ID first, then by referral_code
        let downlineCount = 0
        
        const { count: countById } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by', referral.id)
        
        if (countById !== null) {
          downlineCount = countById
        } else if (referral.referral_code) {
          const { count: countByCode } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true })
            .eq('referred_by', referral.referral_code)
          
          if (countByCode !== null) {
            downlineCount = countByCode
          }
        }
        
        return {
          ...referral,
          total_downline: downlineCount || 0
        }
      })
    )

    return {
      success: true,
      data: {
        member: {
          id: member.id,
          email: member.email,
          username: member.username,
          referral_code: member.referral_code
        },
        referrals: referralsWithCount,
        total_referrals: referralsWithCount.length
      }
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengambil data referrals'
    })
  }
})

