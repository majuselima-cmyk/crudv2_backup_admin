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
            Wallet Management
          </h1>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Action Bar -->
        <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex-1 w-full sm:w-auto">
              <div class="relative">
                <Icon name="search" size="md" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Cari address, label, network..."
                  class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <button 
              @click="openAddModal"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition whitespace-nowrap shadow-sm hover:shadow-md"
            >
              <Icon name="plus" size="sm" />
              Tambah Wallet
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </div>

        <!-- Wallet Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- BEP20 Wallets -->
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div class="bg-gradient-to-r from-yellow-500 to-orange-500 p-4">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">USDT BEP20</h2>
                <span class="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                  {{ bep20Wallets.length }} Wallet
                </span>
              </div>
            </div>
            <div class="p-4">
              <div v-if="bep20Wallets.length === 0" class="text-center py-8 text-gray-400">
                Belum ada wallet BEP20
              </div>
              <div v-else class="space-y-3">
                <div 
                  v-for="wallet in bep20Wallets" 
                  :key="wallet.id"
                  class="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 min-w-0">
                      <p v-if="wallet.label" class="font-medium text-gray-800 mb-1">{{ wallet.label }}</p>
                      <p class="text-xs font-mono text-gray-600 break-all">{{ wallet.address }}</p>
                    </div>
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium ml-2',
                        wallet.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      {{ wallet.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <button 
                      @click="copyAddress(wallet.address)"
                      class="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition font-medium"
                      :title="'Copy: ' + wallet.address"
                    >
                      Copy
                    </button>
                    <button 
                      @click="openEditModal(wallet)"
                      class="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      @click="confirmDelete(wallet)"
                      class="flex-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ERC20 Wallets -->
          <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div class="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">USDT ERC20</h2>
                <span class="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                  {{ erc20Wallets.length }} Wallet
                </span>
              </div>
            </div>
            <div class="p-4">
              <div v-if="erc20Wallets.length === 0" class="text-center py-8 text-gray-400">
                Belum ada wallet ERC20
              </div>
              <div v-else class="space-y-3">
                <div 
                  v-for="wallet in erc20Wallets" 
                  :key="wallet.id"
                  class="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1 min-w-0">
                      <p v-if="wallet.label" class="font-medium text-gray-800 mb-1">{{ wallet.label }}</p>
                      <p class="text-xs font-mono text-gray-600 break-all">{{ wallet.address }}</p>
                    </div>
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium ml-2',
                        wallet.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      {{ wallet.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <button 
                      @click="copyAddress(wallet.address)"
                      class="px-3 py-1.5 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition font-medium"
                      :title="'Copy: ' + wallet.address"
                    >
                      Copy
                    </button>
                    <button 
                      @click="openEditModal(wallet)"
                      class="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      @click="confirmDelete(wallet)"
                      class="flex-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- All Wallets Table (Alternative View) -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">
              Semua Wallet ({{ filteredWallets.length }})
            </h2>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">No</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Network</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Label</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Address</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr 
                  v-for="(wallet, index) in filteredWallets" 
                  :key="wallet.id"
                  class="hover:bg-gray-50 transition"
                >
                  <td class="py-4 px-4 text-gray-600">{{ index + 1 }}</td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        wallet.network === 'BEP20' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : 'bg-blue-100 text-blue-700'
                      ]"
                    >
                      {{ wallet.network }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-gray-800">{{ wallet.label || '-' }}</td>
                  <td class="py-4 px-4">
                    <p class="text-xs font-mono text-gray-600 max-w-xs truncate" :title="wallet.address">
                      {{ wallet.address }}
                    </p>
                  </td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        wallet.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      {{ wallet.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                      <button 
                        @click="copyAddress(wallet.address)"
                        class="flex items-center gap-1 text-gray-600 hover:text-gray-700 transition text-sm font-medium"
                        :title="'Copy: ' + wallet.address"
                      >
                        Copy
                      </button>
                      <button 
                        @click="openEditModal(wallet)"
                        class="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition text-sm font-medium"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        @click="confirmDelete(wallet)"
                        class="flex items-center gap-1 text-red-600 hover:text-red-700 transition text-sm font-medium"
                      >
                        <Icon name="delete" size="sm" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredWallets.length === 0">
                  <td colspan="6" class="py-8 px-4 text-center text-gray-400">
                    {{ errorMessage || 'Tidak ada data wallet' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- Add/Edit Modal -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-800">
              {{ isEditing ? 'Edit Wallet' : 'Tambah Wallet' }}
            </h3>
            <button 
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Network *</label>
            <select
              v-model="walletForm.network"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Pilih Network</option>
              <option value="BEP20">BEP20 (Binance Smart Chain)</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Address *</label>
            <div class="flex items-center gap-2">
              <input
                v-model="walletForm.address"
                type="text"
                required
                placeholder="0x..."
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
              />
              <button
                type="button"
                @click="pasteAddress"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium text-sm whitespace-nowrap"
              >
                Paste
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Masukkan alamat wallet yang valid</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Label (Opsional)</label>
            <input
              v-model="walletForm.label"
              type="text"
              placeholder="Contoh: Wallet Utama, Wallet Backup"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
            <p class="text-xs text-gray-500 mt-1">Nama untuk identifikasi wallet</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              v-model="walletForm.status"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>

          <div v-if="submitError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ submitError }}</p>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isSubmitting ? 'Menyimpan...' : (isEditing ? 'Update' : 'Tambah') }}
            </button>
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div 
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Hapus Wallet</h3>
          <p class="text-gray-600 mb-4">
            Apakah Anda yakin ingin menghapus wallet <strong>{{ walletToDelete?.network }}</strong>?
          </p>
          <p class="text-xs font-mono text-gray-500 mb-6 break-all">{{ walletToDelete?.address }}</p>

          <div v-if="deleteError" class="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p class="text-sm text-red-600">{{ deleteError }}</p>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="handleDelete"
              :disabled="isDeleting"
              class="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
            <button
              @click="closeDeleteModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const isMobileMenuOpen = ref(false)
const searchQuery = ref('')
const loading = ref(true)
const wallets = ref([])
const errorMessage = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const submitError = ref('')
const deleteError = ref('')
const walletToDelete = ref(null)

const walletForm = ref({
  id: '',
  network: '',
  address: '',
  label: '',
  status: 'active'
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Filter wallets by network
const bep20Wallets = computed(() => {
  return wallets.value.filter(w => w.network === 'BEP20')
})

const erc20Wallets = computed(() => {
  return wallets.value.filter(w => w.network === 'ERC20')
})

// Filter wallets by search
const filteredWallets = computed(() => {
  if (!searchQuery.value) return wallets.value
  const query = searchQuery.value.toLowerCase()
  return wallets.value.filter(wallet => 
    wallet.address?.toLowerCase().includes(query) ||
    wallet.label?.toLowerCase().includes(query) ||
    wallet.network?.toLowerCase().includes(query)
  )
})

// Fetch wallets
const fetchWallets = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/wallet')
    if (response.success) {
      wallets.value = response.data || []
    } else {
      errorMessage.value = response.message || 'Gagal memuat data wallet'
    }
  } catch (error) {
    console.error('Error fetching wallets:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data wallet'
    wallets.value = []
  } finally {
    loading.value = false
  }
}

// Modal handlers
const openAddModal = () => {
  isEditing.value = false
  walletForm.value = {
    id: '',
    network: '',
    address: '',
    label: '',
    status: 'active'
  }
  submitError.value = ''
  showModal.value = true
}

const openEditModal = (wallet) => {
  isEditing.value = true
  walletForm.value = {
    id: wallet.id,
    network: wallet.network,
    address: wallet.address,
    label: wallet.label || '',
    status: wallet.status || 'active'
  }
  submitError.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  walletForm.value = {
    id: '',
    network: '',
    address: '',
    label: '',
    status: 'active'
  }
  submitError.value = ''
  isEditing.value = false
}

// Submit form
const handleSubmit = async () => {
  isSubmitting.value = true
  submitError.value = ''

  try {
    const url = isEditing.value 
      ? `/api/admin/wallet/${walletForm.value.id}`
      : '/api/admin/wallet'
    
    const method = isEditing.value ? 'PUT' : 'POST'
    
    const response = await $fetch(url, {
      method,
      body: {
        network: walletForm.value.network,
        address: walletForm.value.address.trim(),
        label: walletForm.value.label.trim() || null,
        status: walletForm.value.status
      }
    })

    if (response.success) {
      await fetchWallets() // Refresh data
      closeModal()
    } else {
      submitError.value = response.message || 'Gagal menyimpan wallet'
    }
  } catch (error) {
    console.error('Error submitting wallet:', error)
    submitError.value = error?.data?.message || error?.message || 'Gagal menyimpan wallet'
  } finally {
    isSubmitting.value = false
  }
}

// Delete handlers
const confirmDelete = (wallet) => {
  walletToDelete.value = wallet
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  walletToDelete.value = null
  deleteError.value = ''
}

const handleDelete = async () => {
  if (!walletToDelete.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    const response = await $fetch(`/api/admin/wallet/${walletToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      await fetchWallets() // Refresh data
      closeDeleteModal()
    } else {
      deleteError.value = response.message || 'Gagal menghapus wallet'
    }
  } catch (error) {
    console.error('Error deleting wallet:', error)
    deleteError.value = error?.data?.message || error?.message || 'Gagal menghapus wallet'
  } finally {
    isDeleting.value = false
  }
}

// Copy address to clipboard
const copyAddress = async (address) => {
  try {
    await navigator.clipboard.writeText(address)
    // Show success feedback (optional: bisa pakai toast notification)
    alert('Address berhasil di-copy: ' + address)
  } catch (error) {
    console.error('Failed to copy:', error)
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = address
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      alert('Address berhasil di-copy: ' + address)
    } catch (err) {
      alert('Gagal copy address. Silakan copy manual: ' + address)
    }
    document.body.removeChild(textArea)
  }
}

// Paste address from clipboard
const pasteAddress = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text && text.trim()) {
      walletForm.value.address = text.trim()
    } else {
      alert('Clipboard kosong atau tidak berisi text')
    }
  } catch (error) {
    console.error('Failed to paste:', error)
    // Fallback: prompt user to paste manually
    const pastedText = prompt('Paste wallet address di sini:')
    if (pastedText && pastedText.trim()) {
      walletForm.value.address = pastedText.trim()
    }
  }
}

// Load data on mount
onMounted(() => {
  fetchWallets()
})
</script>

