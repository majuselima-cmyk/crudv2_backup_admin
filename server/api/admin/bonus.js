// API endpoint untuk mengambil dan mengupdate bonus settings
export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  try {
    if (method === 'GET') {
      // Ambil bonus settings
      const bonusSettings = await getBonusSettings()
      
      return {
        success: true,
        data: bonusSettings
      }
    }
    
    if (method === 'PUT' || method === 'POST') {
      // Update bonus settings
      const body = await readBody(event)
      
      const updatedSettings = await updateBonusSettings(body)
      
      return {
        success: true,
        data: updatedSettings,
        message: 'Bonus settings berhasil diupdate'
      }
    }
    
    return {
      success: false,
      message: 'Method tidak didukung'
    }
    
  } catch (error) {
    console.error('Error handling bonus settings:', error)
    return {
      success: false,
      message: 'Terjadi kesalahan saat memproses bonus settings'
    }
  }
})

// Fungsi untuk mengambil bonus settings dari database
async function getBonusSettings() {
  // TODO: Implementasi query database
  // Simulasi data untuk contoh
  return {
    referral_percentage: 15,
    referral_balance_percentage: 80,
    referral_coin_percentage: 20,
    reward_percentage: 0.5,
    reward_interval_minutes: 240,
    coin_price: 0.5,
    matching_bonus_enabled: true,
    matching_bonus_levels: [
      { level: 1, percentage: 10 }, // Level 1 matching = dari level 2 referral
      { level: 2, percentage: 5 },  // Level 2 matching = dari level 3 referral  
      { level: 3, percentage: 3 }   // Level 3 matching = dari level 4 referral
    ]
  }
}

// Fungsi untuk mengupdate bonus settings
async function updateBonusSettings(newSettings) {
  // TODO: Implementasi update ke database
  // Validasi data terlebih dahulu
  
  const validatedSettings = {
    referral_percentage: parseFloat(newSettings.referral_percentage) || 15,
    referral_balance_percentage: parseFloat(newSettings.referral_balance_percentage) || 80,
    referral_coin_percentage: parseFloat(newSettings.referral_coin_percentage) || 20,
    reward_percentage: parseFloat(newSettings.reward_percentage) || 0.5,
    reward_interval_minutes: parseInt(newSettings.reward_interval_minutes) || 240,
    coin_price: parseFloat(newSettings.coin_price) || 0.5,
    matching_bonus_enabled: Boolean(newSettings.matching_bonus_enabled),
    matching_bonus_levels: newSettings.matching_bonus_levels || [
      { level: 1, percentage: 10 },
      { level: 2, percentage: 5 },  
      { level: 3, percentage: 3 }
    ]
  }
  
  // Validasi persentase tidak lebih dari 100%
  if (validatedSettings.referral_balance_percentage + validatedSettings.referral_coin_percentage > 100) {
    throw new Error('Total persentase alokasi referral tidak boleh lebih dari 100%')
  }
  
  // Validasi matching bonus levels
  if (validatedSettings.matching_bonus_levels) {
    for (const level of validatedSettings.matching_bonus_levels) {
      if (!level.level || !level.percentage || level.percentage <= 0) {
        throw new Error('Invalid matching bonus level configuration')
      }
    }
  }
  
  // TODO: Simpan ke database
  console.log('Updating bonus settings:', validatedSettings)
  
  return validatedSettings
}
