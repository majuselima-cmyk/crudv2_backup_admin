/**
 * Create new wallet
 * POST /api/admin/wallet
 * Body: { network, address, label?, status? }
 */
import { createClient } from '@supabase/supabase-js'

// Validate Ethereum/BSC address format
function isValidAddress(address: string): boolean {
  // Ethereum/BSC address: 0x followed by 40 hex characters
  const addressRegex = /^0x[a-fA-F0-9]{40}$/
  return addressRegex.test(address)
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { network, address, label, status } = body

    // Validate required fields
    if (!network || !address) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Network dan address wajib diisi'
      })
    }

    // Validate network
    if (!['BEP20', 'ERC20'].includes(network)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Network harus BEP20 atau ERC20'
      })
    }

    // Validate address format
    const normalizedAddress = address.trim()
    if (!isValidAddress(normalizedAddress)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Format address tidak valid. Address harus dimulai dengan 0x dan diikuti 40 karakter hex'
      })
    }

    // Validate status if provided
    if (status && !['active', 'inactive'].includes(status)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Status harus active atau inactive'
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

    // Check if address already exists for this network
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('network', network)
      .eq('address', normalizedAddress)
      .single()

    if (existingWallet) {
      throw createError({
        statusCode: 400,
        statusMessage: `Address ini sudah terdaftar untuk network ${network}`
      })
    }

    // Create wallet
    const { data: newWallet, error: createError_1 } = await supabase
      .from('wallets')
      .insert({
        network,
        address: normalizedAddress,
        label: label?.trim() || null,
        status: status || 'active'
      })
      .select('*')
      .single()

    if (createError_1) {
      throw createError({
        statusCode: 500,
        statusMessage: createError_1.message || 'Gagal membuat wallet'
      })
    }

    return {
      success: true,
      message: 'Wallet berhasil ditambahkan',
      data: newWallet
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal membuat wallet'
    })
  }
})





