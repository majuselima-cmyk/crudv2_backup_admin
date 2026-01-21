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
            Pengaturan Coin
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

        <!-- Coin Settings Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- 4 Column Layout Horizontal -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Column 1: Informasi Coin -->
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
                <h2 class="text-xl font-semibold text-white">Informasi Coin</h2>
              </div>
              
              <div class="p-6 space-y-6">
                <!-- Coin Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nama Coin *
                  </label>
                  <input
                    v-model="coinForm.coin_name"
                    type="text"
                    required
                    placeholder="Contoh: MyCoin, TokenX, dll"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <p class="text-xs text-gray-500 mt-1">Nama token/coin yang akan digunakan</p>
                </div>

                <!-- Coin Code -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Kode Coin *
                  </label>
                  <input
                    v-model="coinForm.coin_code"
                    type="text"
                    required
                    maxlength="10"
                    placeholder="Contoh: BTC, ETH, MYC"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 uppercase"
                    @input="coinForm.coin_code = coinForm.coin_code.toUpperCase()"
                  />
                  <p class="text-xs text-gray-500 mt-1">Kode singkat untuk coin (maksimal 10 karakter, otomatis uppercase)</p>
                </div>

                <!-- Total Supply -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Total Supply *
                  </label>
                  <div class="flex items-center gap-3">
                    <input
                      v-model.number="coinForm.total_supply"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    />
                    <span class="text-gray-600 font-medium">Coins</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Total jumlah coin yang tersedia</p>
                  <p class="text-xs text-blue-600 mt-1 font-medium">
                    {{ formatNumber(coinForm.total_supply) }} coins
                  </p>
                </div>

                <!-- Logo URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    v-model="coinForm.logo_url"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <p class="text-xs text-gray-500 mt-1">URL logo untuk ditampilkan di sidebar dan header</p>
                  <div v-if="coinForm.logo_url" class="mt-2">
                    <img :src="coinForm.logo_url" alt="Logo Preview" class="h-8 object-contain" onerror="this.style.display='none'" />
                  </div>
                </div>

                <!-- Favicon URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Favicon URL
                  </label>
                  <input
                    v-model="coinForm.favicon_url"
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <p class="text-xs text-gray-500 mt-1">URL favicon untuk browser tab</p>
                  <div v-if="coinForm.favicon_url" class="mt-2">
                    <img :src="coinForm.favicon_url" alt="Favicon Preview" class="h-6 w-6 object-contain" onerror="this.style.display='none'" />
                  </div>
                </div>

                <!-- Website Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Nama Website *
                  </label>
                  <input
                    v-model="coinForm.website_name"
                    type="text"
                    required
                    placeholder="localhost:3000"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <p class="text-xs text-gray-500 mt-1">Nama website/domain (contoh: localhost:3000, example.com)</p>
                </div>

                <!-- Website Title -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Title Website *
                  </label>
                  <input
                    v-model="coinForm.website_title"
                    type="text"
                    required
                    placeholder="CRUD App"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <p class="text-xs text-gray-500 mt-1">Title yang akan ditampilkan di browser tab</p>
                </div>
              </div>
            </div>

            <!-- Column 2: Harga Member Biasa -->
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
              <h2 class="text-xl font-semibold text-white">Normal Member Price</h2>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- Price Per Coin -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Coin (USDT) *
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="coinForm.normal_price_usdt"
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">USDT</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Price for normal members</p>
                <p class="text-xs text-blue-600 mt-1 font-medium">
                  1 Coin = {{ coinForm.normal_price_usdt }} USDT
                </p>
              </div>

              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p class="text-xs text-blue-700 font-medium mb-1">Normal Member Info</p>
                <p class="text-xs text-blue-600">
                  Default all members are normal. Only admin can upgrade to VIP.
                </p>
              </div>
            </div>
            </div>

            <!-- Column 3: Harga Member Leader -->
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
              <h2 class="text-xl font-semibold text-white">Leader Member Price</h2>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- Leader Price -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Leader Price Per Coin (USDT) *
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="coinForm.leader_price_usdt"
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">USDT</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Special price for Leader members</p>
                <p v-if="coinForm.leader_price_usdt && coinForm.normal_price_usdt" class="text-xs text-green-600 mt-1 font-medium">
                  Discount: {{ calculateLeaderDiscount() }}% from normal price
                </p>
              </div>

              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p class="text-xs text-emerald-700 font-medium mb-1">Leader Member Info</p>
                <p class="text-xs text-emerald-600">
                  Leader members get special price. Only admin can upgrade members to Leader.
                </p>
              </div>
            </div>
            </div>

            <!-- Column 4: Harga Member VIP (Presale) -->
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
              <h2 class="text-xl font-semibold text-white">VIP Member Price</h2>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- VIP Price -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  VIP Price Per Coin (USDT) *
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="coinForm.vip_price_usdt"
                    type="number"
                    step="0.0001"
                    min="0"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">USDT</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Special price for VIP members</p>
                <p v-if="coinForm.vip_price_usdt && coinForm.normal_price_usdt" class="text-xs text-green-600 mt-1 font-medium">
                  Discount: {{ calculateDiscount() }}% from normal price
                </p>
              </div>

              <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p class="text-xs text-purple-700 font-medium mb-1">VIP Member Info</p>
                <p class="text-xs text-purple-600">
                  VIP members get cheaper price. Only admin can upgrade members to VIP.
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
                  Status Coin
                </label>
                <p class="text-xs text-gray-500">Aktifkan atau nonaktifkan coin</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="coinForm.is_active"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm font-medium text-gray-700">
                  {{ coinForm.is_active ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </label>
            </div>
          </div>

          <!-- Summary Card -->
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Ringkasan</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <p class="text-xs text-gray-500 mb-1">Nama Coin</p>
                <p class="text-lg font-bold text-gray-800">{{ coinForm.coin_name || '-' }}</p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <p class="text-xs text-gray-500 mb-1">Kode Coin</p>
                <p class="text-lg font-bold text-gray-800">{{ coinForm.coin_code || '-' }}</p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-blue-200">
                <p class="text-xs text-gray-500 mb-1">Normal Member Price</p>
                <p class="text-lg font-bold text-blue-600">{{ coinForm.normal_price_usdt }} USDT</p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-emerald-200">
                <p class="text-xs text-gray-500 mb-1">Leader Member Price</p>
                <p class="text-lg font-bold text-emerald-600">{{ coinForm.leader_price_usdt }} USDT</p>
                <p v-if="coinForm.leader_price_usdt && coinForm.normal_price_usdt" class="text-xs text-green-600 mt-1">
                  {{ calculateLeaderDiscount() }}% discount
                </p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-purple-200">
                <p class="text-xs text-gray-500 mb-1">VIP Member Price</p>
                <p class="text-lg font-bold text-purple-600">{{ coinForm.vip_price_usdt }} USDT</p>
                <p v-if="coinForm.vip_price_usdt && coinForm.normal_price_usdt" class="text-xs text-green-600 mt-1">
                  {{ calculateDiscount() }}% discount
                </p>
              </div>
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

const coinForm = ref({
  coin_name: 'MyCoin',
  coin_code: 'COIN',
  total_supply: 999999999.00,
  normal_price_usdt: 0.5000,
  vip_price_usdt: 0.4000, // Harga untuk member VIP
  leader_price_usdt: 0.5000, // Harga untuk member Leader
  logo_url: '',
  favicon_url: '',
  website_name: 'localhost:3000',
  website_title: 'CRUD App',
  is_active: true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Format number with thousand separators
const formatNumber = (num) => {
  if (!num) return '0'
  return parseFloat(num).toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
}

// Calculate discount percentage for VIP
const calculateDiscount = () => {
  if (!coinForm.value.vip_price_usdt || !coinForm.value.normal_price_usdt) return 0
  const normal = parseFloat(coinForm.value.normal_price_usdt)
  const presale = parseFloat(coinForm.value.vip_price_usdt)
  if (presale >= normal) return 0
  const discount = ((normal - presale) / normal) * 100
  return discount.toFixed(2)
}

// Calculate discount percentage for Leader
const calculateLeaderDiscount = () => {
  if (!coinForm.value.leader_price_usdt || !coinForm.value.normal_price_usdt) return 0
  const normal = parseFloat(coinForm.value.normal_price_usdt)
  const leader = parseFloat(coinForm.value.leader_price_usdt)
  if (leader >= normal) return 0
  const discount = ((normal - leader) / normal) * 100
  return discount.toFixed(2)
}


// Fetch coin settings
const fetchCoinSettings = async () => {
  loading.value = true
  submitError.value = ''
  successMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/coin')
    if (response.success && response.data) {
      // Update form with fetched data
      coinForm.value = {
        coin_name: response.data.coin_name || 'MyCoin',
        coin_code: response.data.coin_code || 'COIN',
        total_supply: parseFloat(response.data.total_supply) || 999999999.00,
        normal_price_usdt: parseFloat(response.data.normal_price_usdt) || 0.5000,
        vip_price_usdt: response.data.vip_price_usdt ? parseFloat(response.data.vip_price_usdt) : 0.4000,
        leader_price_usdt: response.data.leader_price_usdt ? parseFloat(response.data.leader_price_usdt) : 0.5000,
        logo_url: response.data.logo_url || '',
        favicon_url: response.data.favicon_url || '',
        website_name: response.data.website_name || 'localhost:3000',
        website_title: response.data.website_title || 'CRUD App',
        is_active: response.data.is_active !== undefined ? response.data.is_active : true
      }
    }
  } catch (error) {
    console.error('Error fetching coin settings:', error)
    submitError.value = error?.data?.message || error?.message || 'Gagal memuat pengaturan coin'
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
    const response = await $fetch('/api/admin/coin', {
      method: 'PUT',
      body: {
        coin_name: coinForm.value.coin_name,
        coin_code: coinForm.value.coin_code,
        total_supply: coinForm.value.total_supply,
        normal_price_usdt: coinForm.value.normal_price_usdt,
        vip_price_usdt: coinForm.value.vip_price_usdt,
        leader_price_usdt: coinForm.value.leader_price_usdt,
        logo_url: coinForm.value.logo_url || null,
        favicon_url: coinForm.value.favicon_url || null,
        website_name: coinForm.value.website_name || 'localhost:3000',
        website_title: coinForm.value.website_title || 'CRUD App',
        is_active: coinForm.value.is_active
      }
    })

    if (response.success) {
      successMessage.value = 'Pengaturan coin berhasil disimpan!'
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      submitError.value = response.message || 'Gagal menyimpan pengaturan coin'
    }
  } catch (error) {
    console.error('Error submitting coin settings:', error)
    submitError.value = error?.data?.message || error?.message || 'Gagal menyimpan pengaturan coin'
  } finally {
    isSubmitting.value = false
  }
}

// Reset form to default values
const resetForm = () => {
  coinForm.value = {
    coin_name: 'MyCoin',
    coin_code: 'COIN',
    total_supply: 999999999.00,
    normal_price_usdt: 0.5000,
    vip_price_usdt: 0.4000,
    leader_price_usdt: 0.5000,
    is_active: true
  }
  submitError.value = ''
  successMessage.value = ''
}

// Load data on mount
onMounted(() => {
  fetchCoinSettings()
})
</script>

