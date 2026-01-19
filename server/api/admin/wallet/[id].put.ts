/**
 * Update wallet
 * PUT /api/admin/wallet/[id]
 * Body: { network?, address?, label?, status? }
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
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const { network, address, label, status } = body

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'ID wallet wajib diisi'
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

    // Check if wallet exists
    const { data: existingWallet, error: checkError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingWallet) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Wallet tidak ditemukan'
      })
    }

    // Build update object
    const updateData: any = {}

    if (network !== undefined) {
      if (!['BEP20', 'ERC20'].includes(network)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Network harus BEP20 atau ERC20'
        })
      }
      updateData.network = network
    }

    if (address !== undefined) {
      const normalizedAddress = address.trim()
      if (!isValidAddress(normalizedAddress)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Format address tidak valid. Address harus dimulai dengan 0x dan diikuti 40 karakter hex'
        })
      }
      updateData.address = normalizedAddress
    }

    if (label !== undefined) {
      updateData.label = label?.trim() || null
    }

    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Status harus active atau inactive'
        })
      }
      updateData.status = status
    }

    // Check if address already exists for this network (if address or network is being changed)
    if (updateData.address || updateData.network) {
      const checkNetwork = updateData.network || existingWallet.network
      const checkAddress = updateData.address || existingWallet.address

      // Only check if address or network is actually being changed
      if (checkNetwork !== existingWallet.network || checkAddress !== existingWallet.address) {
        const { data: duplicateWallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('network', checkNetwork)
          .eq('address', checkAddress)
          .neq('id', id) // Exclude current wallet
          .single()

        if (duplicateWallet) {
          throw createError({
            statusCode: 400,
            statusMessage: `Address ini sudah terdaftar untuk network ${checkNetwork}`
          })
        }
      }
    }

    // Update wallet
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      throw createError({
        statusCode: 500,
        statusMessage: updateError.message || 'Gagal mengupdate wallet'
      })
    }

    return {
      success: true,
      message: 'Wallet berhasil diupdate',
      data: updatedWallet
    }
  } catch (error: any) {
    if (error && typeof error === 'object' && error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage: error?.message || 'Gagal mengupdate wallet'
    })
  }
})





