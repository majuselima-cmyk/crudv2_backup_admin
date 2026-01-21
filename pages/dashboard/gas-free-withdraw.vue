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
            Gas Free Withdraw
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

        <!-- Gas Free Withdraw Settings Form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Settings Card -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
              <h2 class="text-xl font-semibold text-white">Gas Free Withdraw Settings</h2>
            </div>
            
            <div class="p-6 space-y-6">
              <!-- Gas Free Percentage -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Gas Free Percentage (%)
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="gasFreeForm.gas_free_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">%</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Percentage untuk gas free withdraw (default: 3%)</p>
                <p class="text-xs text-green-600 mt-1 font-medium">
                  Gas free: {{ gasFreeForm.gas_free_percentage }}% dari total withdraw
                </p>
              </div>

              <!-- Minimal Withdraw -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Minimal Withdraw (USDT)
                </label>
                <div class="flex items-center gap-3">
                  <input
                    v-model.number="gasFreeForm.minimal_withdraw"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span class="text-gray-600 font-medium">USDT</span>
                </div>
                <p class="text-xs text-gray-500 mt-1">Minimal jumlah withdraw yang diperbolehkan (default: 10 USDT)</p>
              </div>

              <!-- Info Card -->
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-xs text-green-700 font-medium mb-1">Info Gas Free Withdraw</p>
                <p class="text-xs text-green-600">
                  Gas free withdraw memungkinkan member untuk withdraw tanpa dikenakan gas fee. 
                  Percentage ini menentukan berapa persen dari total withdraw yang akan ditanggung oleh sistem.
                </p>
              </div>
            </div>
          </div>

          <!-- Status Toggle -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Status Gas Free Withdraw
                </label>
                <p class="text-xs text-gray-500">Aktifkan atau nonaktifkan gas free withdraw</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="gasFreeForm.is_active"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm font-medium text-gray-700">
                  {{ gasFreeForm.is_active ? 'Aktif' : 'Tidak Aktif' }}
                </span>
              </label>
            </div>
          </div>

          <!-- Summary Card -->
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <p class="text-xs text-gray-500 mb-1">Gas Free Percentage</p>
                <p class="text-lg font-bold text-green-600">{{ gasFreeForm.gas_free_percentage }}%</p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <p class="text-xs text-gray-500 mb-1">Minimal Withdraw</p>
                <p class="text-lg font-bold text-blue-600">{{ gasFreeForm.minimal_withdraw }} USDT</p>
              </div>
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <p class="text-xs text-gray-500 mb-1">Status</p>
                <p class="text-lg font-bold" :class="gasFreeForm.is_active ? 'text-green-600' : 'text-red-600'">
                  {{ gasFreeForm.is_active ? 'Aktif' : 'Tidak Aktif' }}
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

const gasFreeForm = ref({
  gas_free_percentage: 3.00,
  minimal_withdraw: 10,
  is_active: true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Fetch gas free withdraw settings
const fetchSettings = async () => {
  loading.value = true
  submitError.value = ''
  successMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/gas-free-withdraw')
    if (response.success && response.data) {
      // Update form with fetched data
      gasFreeForm.value = {
        gas_free_percentage: parseFloat(response.data.gas_free_percentage) || 3.00,
        minimal_withdraw: parseFloat(response.data.minimal_withdraw) || 10,
        is_active: response.data.is_active !== undefined ? response.data.is_active : true
      }
    }
  } catch (error) {
    console.error('Error fetching gas free withdraw settings:', error)
    submitError.value = error?.data?.message || error?.message || 'Gagal memuat pengaturan gas free withdraw'
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
    const response = await $fetch('/api/admin/gas-free-withdraw', {
      method: 'PUT',
      body: {
        gas_free_percentage: gasFreeForm.value.gas_free_percentage,
        minimal_withdraw: gasFreeForm.value.minimal_withdraw,
        is_active: gasFreeForm.value.is_active
      }
    })

    if (response.success) {
      successMessage.value = 'Pengaturan gas free withdraw berhasil disimpan!'
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      submitError.value = response.message || 'Gagal menyimpan pengaturan gas free withdraw'
    }
  } catch (error) {
    console.error('Error submitting gas free withdraw settings:', error)
    submitError.value = error?.data?.message || error?.message || 'Gagal menyimpan pengaturan gas free withdraw'
  } finally {
    isSubmitting.value = false
  }
}

// Reset form to default values
const resetForm = () => {
  gasFreeForm.value = {
    gas_free_percentage: 3.00,
    minimal_withdraw: 10,
    is_active: true
  }
  submitError.value = ''
  successMessage.value = ''
}

// Load data on mount
onMounted(() => {
  fetchSettings()
})
</script>







