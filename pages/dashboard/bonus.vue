<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar 
      :is-mobile-menu-open="isMobileMenuOpen" 
      @close-mobile-menu="isMobileMenuOpen = false"
    />

    <!-- Main Content -->
    <div class="lg:pl-64">
      <!-- Mobile Header -->
      <MobileHeader @toggle-menu="toggleMobileMenu" />

      <!-- Desktop Header -->
      <header class="hidden lg:block sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div class="flex items-center justify-between px-6 py-4">
          <h1 class="text-2xl font-bold text-blue-600">
            Pengaturan Bonus
          </h1>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Loading State -->
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </div>

        <!-- Bonus Settings Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 2 Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Bonus Aktif Section (Left Column) -->
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                <h2 class="text-xl font-semibold text-white">Bonus Aktif</h2>
              </div>
              
              <div class="p-6 space-y-6">
                <!-- Referral Bonus -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Referral Bonus (%)
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model.number="bonusForm.referral_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    <span class="text-gray-600 font-medium">%</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Bonus untuk setiap referral yang berhasil</p>
                  
                  <!-- Split Ratio -->
                  <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <label class="block text-xs font-semibold text-blue-700 mb-3">
                      Pembagian Bonus Referral
                    </label>
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Ke Balance USDT (%)
                        </label>
                        <div class="flex items-center gap-2">
                          <input
                            v-model.number="bonusForm.referral_balance_percentage"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            @input="updateCoinPercentage"
                            class="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-sm"
                          />
                          <span class="text-gray-600 font-medium text-sm">%</span>
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 mb-1">
                          Ke Coin (%)
                        </label>
                        <div class="flex items-center gap-2">
                          <input
                            v-model.number="bonusForm.referral_coin_percentage"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            @input="updateBalancePercentage"
                            class="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-sm"
                          />
                          <span class="text-gray-600 font-medium text-sm">%</span>
                        </div>
                      </div>
                      <div class="text-xs text-gray-600 mt-2">
                        Total: <span :class="getSplitTotalClass()">{{ (bonusForm.referral_balance_percentage + bonusForm.referral_coin_percentage).toFixed(2) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Matching Bonus -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">
                    Matching Bonus (%)
                  </label>
                  <div class="space-y-4 pl-4 border-l-2 border-gray-200">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-2">Level 1</label>
                      <div class="flex items-center gap-3">
                        <input
                          v-model.number="bonusForm.matching_level1_percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                        />
                        <span class="text-gray-600 font-medium">%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-2">Level 2</label>
                      <div class="flex items-center gap-3">
                        <input
                          v-model.number="bonusForm.matching_level2_percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                        />
                        <span class="text-gray-600 font-medium">%</span>
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-xs font-medium text-gray-600 mb-2">Level 3</label>
                      <div class="flex items-center gap-3">
                        <input
                          v-model.number="bonusForm.matching_level3_percentage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                        />
                        <span class="text-gray-600 font-medium">%</span>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs text-gray-500 mt-2">Bonus matching untuk setiap level downline</p>
                </div>

                <!-- Loyalty Bonus -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Loyalty (%)
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model.number="bonusForm.loyalty_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    <span class="text-gray-600 font-medium">%</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Bonus untuk loyalitas member</p>
                </div>
              </div>
            </div>

            <!-- Bonus Pasif Section (Right Column) -->
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                <h2 class="text-xl font-semibold text-white">Bonus Pasif</h2>
              </div>
              
              <div class="p-6 space-y-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Reward Bonus (%)
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model.number="bonusForm.reward_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      required
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    <span class="text-gray-600 font-medium">%</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Bonus reward untuk aktivitas pasif</p>
                </div>

                <!-- Reward Interval (NEW) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Reward Calculation Interval
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model.number="bonusForm.reward_interval_minutes"
                      type="number"
                      step="1"
                      min="1"
                      required
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    <span class="text-gray-600 font-medium">Menit</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Interval untuk menghitung reward (default 240 menit = 1 hari)</p>
                  <div class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p class="text-xs text-blue-700">
                      <strong>Contoh:</strong>
                      <br/>• 240 menit = 1 hari
                      <br/>• 60 menit = 1 jam
                      <br/>• 5 menit = 5 menit (untuk testing)
                    </p>
                  </div>
                </div>

                <!-- Default Staking Duration -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Default Staking Duration
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model.number="bonusForm.default_staking_duration_minutes"
                      type="number"
                      step="1"
                      min="1"
                      required
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    <span class="text-gray-600 font-medium">Menit</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Durasi default untuk staking baru (dinamis)</p>
                  <div class="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p class="text-xs text-purple-700 whitespace-pre-line">
                      <strong>Konversi:</strong>
                      {{ formatDurationConversion(bonusForm.default_staking_duration_minutes) }}
                    </p>
                  </div>
                  <div v-if="bonusForm.default_staking_duration_minutes && bonusForm.default_staking_duration_minutes < 43200" class="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-xs text-yellow-700 font-medium">
                      ⚠️ Mode Testing: Durasi kurang dari 1 bulan (43,200 menit)
                      <br/>Untuk production, gunakan minimal 43,200 menit
                    </p>
                  </div>
                  <div v-else-if="bonusForm.default_staking_duration_minutes && bonusForm.default_staking_duration_minutes >= 43200" class="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p class="text-xs text-green-700 font-medium">
                      ✓ Mode Production: Durasi sesuai untuk production (≥ 1 bulan)
                    </p>
                  </div>
                </div>

              <!-- Multiplier: Reward Bonus (%) = Multiplier Bonus Base (%) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Reward Bonus (%) = Multiplier Bonus Base (%)
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="bonusForm.multiplier_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">%</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Base multiplier bonus percentage</p>
              </div>

              <!-- Reward Calculation Interval (multiplier) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Reward Calculation Interval (multiplier)
                </label>
                <p class="text-xs text-gray-500 mb-1">Interval perhitungan reward untuk staking multiplier, dalam menit. Bukan persen.</p>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="bonusForm.multiplier_increment_minutes"
                    type="number"
                    step="1"
                    min="1"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">Menit</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Default: 10080 menit (7 hari). Untuk testing, ubah ke 5 menit.</p>
                <p class="text-xs text-purple-600 mt-1 font-medium">
                  {{ (bonusForm.multiplier_increment_minutes / 60).toFixed(2) }} jam = {{ (bonusForm.multiplier_increment_minutes / 1440).toFixed(2) }} hari
                </p>
              </div>

              <!-- Default Staking Duration = Multiplier Increment Interval (Menit) multiplier -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Default Staking Duration = Multiplier Increment Interval (Menit) multiplier
                </label>
                <p class="text-xs text-gray-500 mb-1">Batas waktu staking multiplier, dalam menit. Bukan persen.</p>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="bonusForm.multiplier_increment_percentage"
                    type="number"
                    step="1"
                    min="1"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">Menit</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Default: 10080 menit (7 hari). Contoh: Base {{ bonusForm.multiplier_percentage }}% setiap {{ bonusForm.multiplier_increment_percentage }} menit.</p>
                <p class="text-xs text-purple-600 mt-1 font-medium">
                  {{ (bonusForm.multiplier_increment_percentage / 60).toFixed(2) }} jam = {{ (bonusForm.multiplier_increment_percentage / 1440).toFixed(2) }} hari
                </p>
              </div>
              </div>
            </div>
          </div>

          <!-- Status Toggle -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Status Bonus
                </label>
                <p class="text-xs text-gray-500">Aktifkan atau nonaktifkan semua bonus</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="bonusForm.is_active"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm font-medium text-gray-700">
                  {{ bonusForm.is_active ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </label>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600">{{ submitError }}</p>
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4">
            <p class="text-sm text-green-600">{{ successMessage }}</p>
          </div>

          <!-- Submit Button -->
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              @click="resetForm"
              class="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan' }}
            </button>
          </div>
        </form>
      </main>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const isMobileMenuOpen = ref(false)
const loading = ref(true)
const isSubmitting = ref(false)
const submitError = ref('')
const successMessage = ref('')

const bonusForm = ref({
  referral_percentage: 15.00,
  referral_balance_percentage: 80.00,
  referral_coin_percentage: 20.00,
  matching_level1_percentage: 10.00,
  matching_level2_percentage: 5.00,
  matching_level3_percentage: 2.00,
  loyalty_percentage: 10.00,
  reward_percentage: 0.50,
  reward_interval_minutes: 240, // 240 menit = 1 hari
  default_staking_duration_minutes: 43200, // 43200 menit = 1 bulan (30 hari)
  multiplier_percentage: 10.00,
  multiplier_increment_percentage: 10080, // INTEGER menit (7 hari) untuk interval staking multiplier, bukan DECIMAL persen
  multiplier_increment_minutes: 10080, // 10080 menit = 7 hari, ubah ke 5 untuk testing
  is_active: true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Fetch bonus settings
const fetchBonusSettings = async () => {
  loading.value = true
  submitError.value = ''
  successMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/bonus')
    if (response.success && response.data) {
      // Update form with fetched data
      bonusForm.value = {
        referral_percentage: parseFloat(response.data.referral_percentage) || 15.00,
        referral_balance_percentage: parseFloat(response.data.referral_balance_percentage) || 80.00,
        referral_coin_percentage: parseFloat(response.data.referral_coin_percentage) || 20.00,
        matching_level1_percentage: parseFloat(response.data.matching_level1_percentage) || 10.00,
        matching_level2_percentage: parseFloat(response.data.matching_level2_percentage) || 5.00,
        matching_level3_percentage: parseFloat(response.data.matching_level3_percentage) || 2.00,
        loyalty_percentage: parseFloat(response.data.loyalty_percentage) || 10.00,
        reward_percentage: parseFloat(response.data.reward_percentage) || 0.50,
        reward_interval_minutes: parseInt(response.data.reward_interval_minutes) || 240,
        default_staking_duration_minutes: parseInt(response.data.default_staking_duration_minutes) || 43200,
        multiplier_percentage: parseFloat(response.data.multiplier_percentage) || 10.00,
        multiplier_increment_percentage: parseInt(response.data.multiplier_increment_percentage, 10) || 10080, // INTEGER menit, bukan DECIMAL persen
        multiplier_increment_minutes: parseInt(response.data.multiplier_increment_minutes) || 10080,
        is_active: response.data.is_active !== undefined ? response.data.is_active : true
      }
    }
  } catch (error) {
    console.error('Error fetching bonus settings:', error)
    submitError.value = error?.data?.message || error?.message || 'Gagal memuat pengaturan bonus'
  } finally {
    loading.value = false
  }
}

// Submit form
const handleSubmit = async () => {
  isSubmitting.value = true
  submitError.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch('/api/admin/bonus', {
      method: 'PUT',
      body: {
        referral_percentage: bonusForm.value.referral_percentage,
        referral_balance_percentage: bonusForm.value.referral_balance_percentage,
        referral_coin_percentage: bonusForm.value.referral_coin_percentage,
        matching_level1_percentage: bonusForm.value.matching_level1_percentage,
        matching_level2_percentage: bonusForm.value.matching_level2_percentage,
        matching_level3_percentage: bonusForm.value.matching_level3_percentage,
        loyalty_percentage: bonusForm.value.loyalty_percentage,
        reward_percentage: bonusForm.value.reward_percentage,
        reward_interval_minutes: bonusForm.value.reward_interval_minutes,
        default_staking_duration_minutes: bonusForm.value.default_staking_duration_minutes,
        multiplier_percentage: bonusForm.value.multiplier_percentage,
        multiplier_increment_percentage: bonusForm.value.multiplier_increment_percentage,
        multiplier_increment_minutes: bonusForm.value.multiplier_increment_minutes,
        is_active: bonusForm.value.is_active
      }
    })

    if (response.success) {
      successMessage.value = 'Pengaturan bonus berhasil disimpan!'
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      submitError.value = response.message || 'Gagal menyimpan pengaturan bonus'
    }
  } catch (error) {
    console.error('Error submitting bonus settings:', error)
    submitError.value = error?.data?.message || error?.message || 'Gagal menyimpan pengaturan bonus'
  } finally {
    isSubmitting.value = false
  }
}

// Update coin percentage when balance percentage changes
const updateCoinPercentage = () => {
  bonusForm.value.referral_coin_percentage = 100 - bonusForm.value.referral_balance_percentage
}

// Update balance percentage when coin percentage changes
const updateBalancePercentage = () => {
  bonusForm.value.referral_balance_percentage = 100 - bonusForm.value.referral_coin_percentage
}

// Get class for split total (red if not 100%, green if 100%)
const getSplitTotalClass = () => {
  const total = bonusForm.value.referral_balance_percentage + bonusForm.value.referral_coin_percentage
  if (Math.abs(total - 100) < 0.01) {
    return 'text-green-600 font-semibold'
  }
  return 'text-red-600 font-semibold'
}

// Format duration conversion
const formatDurationConversion = (minutes) => {
  if (!minutes || minutes <= 0) return '• 0.00 jam\n• 0.00 hari\n• 0.00 bulan'
  const hours = (minutes / 60).toFixed(2)
  const days = (minutes / 1440).toFixed(2)
  const months = (minutes / 43200).toFixed(2)
  return `• ${hours} jam\n• ${days} hari\n• ${months} bulan`
}

// Reset form to default values
const resetForm = () => {
  bonusForm.value = {
    referral_percentage: 15.00,
    referral_balance_percentage: 80.00,
    referral_coin_percentage: 20.00,
    matching_level1_percentage: 10.00,
    matching_level2_percentage: 5.00,
    matching_level3_percentage: 2.00,
    loyalty_percentage: 10.00,
    reward_percentage: 0.50,
    reward_interval_minutes: 240,
    default_staking_duration_minutes: 43200,
    multiplier_percentage: 10.00,
    multiplier_increment_percentage: 10080, // INTEGER menit (7 hari), bukan DECIMAL persen
    multiplier_increment_minutes: 10080,
    is_active: true
  }
  submitError.value = ''
  successMessage.value = ''
}

// Load data on mount
onMounted(() => {
  fetchBonusSettings()
})
</script>

