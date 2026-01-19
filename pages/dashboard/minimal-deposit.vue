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
            Minimal Deposit
          </h1>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <div class="max-w-2xl mx-auto">
          <!-- Loading State -->
          <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
            <div class="flex items-center justify-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span class="ml-3 text-gray-600">Memuat data...</span>
            </div>
          </div>

          <!-- Minimal Deposit Settings Form -->
          <div v-else class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
              <h2 class="text-2xl font-semibold text-white mb-2">Pengaturan Minimal Deposit</h2>
              <p class="text-green-50 text-sm">Atur jumlah minimal deposit yang harus dipenuhi oleh user</p>
            </div>

            <!-- Form Content -->
            <div class="p-6 space-y-6">
              <!-- Success Message -->
              <div v-if="successMessage" class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {{ successMessage }}
              </div>

              <!-- Error Message -->
              <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {{ errorMessage }}
              </div>

              <!-- Minimal Deposit Input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Minimal Deposit (USDT) *
                </label>
                <div class="relative">
                  <div class="flex items-center gap-3">
                    <input
                      v-model.number="minimalDepositForm.minimal_deposit_usdt"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="10.00"
                      class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-800"
                    />
                    <span class="text-gray-600 font-medium text-lg">USDT</span>
                  </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  Jumlah minimal deposit dalam USDT. User harus deposit minimal sejumlah ini untuk dapat melakukan transaksi.
                </p>
                <div class="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p class="text-sm text-blue-700">
                    <strong>Nilai saat ini:</strong> 
                    <span class="text-lg font-bold text-blue-600 ml-2">
                      {{ formatCurrency(minimalDepositForm.minimal_deposit_usdt) }} USDT
                    </span>
                  </p>
                </div>
              </div>

              <!-- Info Card -->
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <div class="flex-shrink-0">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-blue-800 mb-1">Informasi</h3>
                    <ul class="text-xs text-blue-700 space-y-1">
                      <li>• Minimal deposit ini akan digunakan untuk validasi deposit user</li>
                      <li>• User tidak dapat deposit jika jumlah kurang dari nilai ini</li>
                      <li>• Nilai dapat diubah kapan saja sesuai kebutuhan</li>
                      <li>• Default: 10.00 USDT</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  @click="resetForm"
                  class="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                  Reset
                </button>
                <button
                  type="button"
                  @click="handleSubmit"
                  :disabled="isSubmitting"
                  class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isSubmitting ? 'Menyimpan...' : 'Simpan Pengaturan' }}
                </button>
              </div>
            </div>
          </div>
        </div>
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
const errorMessage = ref('')
const successMessage = ref('')

const minimalDepositForm = ref({
  minimal_deposit_usdt: 10.00
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Format currency
const formatCurrency = (value) => {
  if (!value) return '0.00'
  return parseFloat(value).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Fetch minimal deposit settings
const fetchMinimalDeposit = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/minimal-deposit')
    if (response.success && response.data) {
      minimalDepositForm.value = {
        minimal_deposit_usdt: parseFloat(response.data.minimal_deposit_usdt) || 10.00
      }
    }
  } catch (error) {
    console.error('Error fetching minimal deposit settings:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat pengaturan minimal deposit'
  } finally {
    loading.value = false
  }
}

// Submit form
const handleSubmit = async () => {
  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  // Validate
  if (!minimalDepositForm.value.minimal_deposit_usdt || minimalDepositForm.value.minimal_deposit_usdt < 0) {
    errorMessage.value = 'Minimal deposit harus berupa angka positif'
    isSubmitting.value = false
    return
  }

  try {
    const response = await $fetch('/api/admin/minimal-deposit', {
      method: 'PUT',
      body: {
        minimal_deposit_usdt: minimalDepositForm.value.minimal_deposit_usdt
      }
    })

    if (response.success) {
      successMessage.value = 'Pengaturan minimal deposit berhasil disimpan!'
      // Auto hide success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    } else {
      errorMessage.value = response.message || 'Gagal menyimpan pengaturan minimal deposit'
    }
  } catch (error) {
    console.error('Error submitting minimal deposit settings:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal menyimpan pengaturan minimal deposit'
  } finally {
    isSubmitting.value = false
  }
}

// Reset form to fetched values
const resetForm = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  await fetchMinimalDeposit()
}

// Load data on mount
onMounted(() => {
  fetchMinimalDeposit()
})
</script>

