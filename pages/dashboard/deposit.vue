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
          <div>
            <h1 class="text-2xl font-bold text-blue-600">Deposit Management</h1>
            <p class="text-sm text-gray-500 mt-1">Kelola deposit member</p>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Loading State -->
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm mb-4">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </div>

        <!-- Floating Action Button - Always Visible -->
        <div class="fixed bottom-6 right-6 z-40 lg:hidden">
          <button
            @click="openCreateModal"
            class="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            title="Tambah Deposit"
          >
            <Icon name="plus" size="md" />
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage && !loading && !isDepositEmptyMessage(errorMessage)" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <Icon name="x-circle" size="md" class="text-red-600" />
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <Icon name="check-circle" size="md" class="text-green-600" />
            <p class="text-sm text-green-600">{{ successMessage }}</p>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div class="relative flex-1 w-full">
              <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Cari deposit (email, username, wallet address)..."
                :disabled="loading"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <select
              v-model="statusFilter"
              @change="fetchDeposits"
              :disabled="loading"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              @click="openCreateModal"
              :disabled="loading"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Icon name="plus" size="sm" />
              Tambah Deposit
            </button>
          </div>
        </div>

        <!-- Deposits Table -->
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">
              Daftar Deposit ({{ loading ? '...' : filteredDeposits.length }})
            </h2>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount (USDT)</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coin Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Wallet</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Wallet</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="filteredDeposits.length === 0 && !loading">
                  <td colspan="10" class="px-6 py-12 text-center text-sm text-gray-500">
                    <!-- Empty state -->
                  </td>
                </tr>
                <tr
                  v-for="(deposit, index) in paginatedDeposits"
                  :key="deposit.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(deposit.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div class="font-medium text-gray-900">{{ deposit.member?.username || 'N/A' }}</div>
                      <div class="text-gray-500 text-xs">{{ deposit.member?.email || '' }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {{ formatCurrency(deposit.amount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {{ formatCoinAmount(deposit.coin_amount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-mono text-xs text-gray-600 max-w-xs truncate" :title="deposit.from_wallet_address">
                      {{ deposit.from_wallet_address || '-' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-mono text-xs text-gray-600 max-w-xs truncate" :title="deposit.to_wallet_address">
                      {{ deposit.to_wallet_address || '-' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ deposit.payment_method || deposit.wallet_model || '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded',
                        deposit.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : deposit.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ formatStatus(deposit.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="flex items-center gap-2">
                      <button
                        @click="openEditModal(deposit)"
                        class="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                        title="Edit Deposit"
                      >
                        Edit
                      </button>
                      <button
                        @click="confirmDelete(deposit)"
                        class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        title="Hapus Deposit"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredDeposits.length > 0" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Menampilkan {{ paginationStart + 1 }} - {{ Math.min(paginationEnd, filteredDeposits.length) }} dari {{ filteredDeposits.length }} deposit
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="previousPage"
                :disabled="currentPage === 1"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span class="text-sm text-gray-600">
                Halaman {{ currentPage }} dari {{ totalPages }}
              </span>
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Create Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeCreateModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Tambah Deposit Baru</h3>
        </div>
        <form @submit.prevent="handleCreate" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Member <span class="text-red-500">*</span></label>
            <MemberSelect
              v-model="createForm.member_id"
              :members="membersList"
              placeholder="Cari member..."
              @select="onMemberSelected"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount (USDT) <span class="text-red-500">*</span></label>
            <input
              v-model="createForm.amount"
              type="number"
              step="0.00000001"
              min="0"
              required
              placeholder="0.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Coin Amount</label>
            <input
              v-model="createForm.coin_amount"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="Auto calculate jika kosong"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Conversion Rate</label>
            <input
              v-model="createForm.conversion_rate"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="0.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">From Wallet Address</label>
            <input
              v-model="createForm.from_wallet_address"
              type="text"
              placeholder="Wallet address pengirim"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">To Wallet Address</label>
            <input
              v-model="createForm.to_wallet_address"
              type="text"
              placeholder="Wallet address penerima"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <input
              v-model="createForm.payment_method"
              type="text"
              placeholder="Contoh: USDT_BEP20, USDT_ERC20"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status <span class="text-red-500">*</span></label>
            <select
              v-model="createForm.status"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div v-if="createError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ createError }}</p>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeCreateModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isCreating"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ isCreating ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Edit Deposit</h3>
        </div>
        <form @submit.prevent="handleUpdate" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member</label>
            <input
              :value="editForm.member_email || 'N/A'"
              type="text"
              disabled
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Amount (USDT) <span class="text-red-500">*</span></label>
            <input
              v-model="editForm.amount"
              type="number"
              step="0.00000001"
              min="0"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Coin Amount</label>
            <input
              v-model="editForm.coin_amount"
              type="number"
              step="0.00000001"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Conversion Rate</label>
            <input
              v-model="editForm.conversion_rate"
              type="number"
              step="0.00000001"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">From Wallet Address</label>
            <input
              v-model="editForm.from_wallet_address"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">To Wallet Address</label>
            <input
              v-model="editForm.to_wallet_address"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <input
              v-model="editForm.payment_method"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status <span class="text-red-500">*</span></label>
            <select
              v-model="editForm.status"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div v-if="updateError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ updateError }}</p>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeEditModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="isUpdating"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ isUpdating ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Hapus Deposit</h3>
          <p class="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus deposit ini? Tindakan ini tidak dapat dibatalkan.
          </p>

          <div v-if="deleteError" class="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p class="text-sm text-red-600">{{ deleteError }}</p>
          </div>

          <div class="flex gap-3">
            <button
              @click="handleDelete"
              :disabled="isDeleting"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
            <button
              @click="closeDeleteModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
const loading = ref(true)
const deposits = ref([])
const membersList = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(25)

// Create Modal
const showCreateModal = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createForm = ref({
  member_id: '',
  amount: '',
  coin_amount: '',
  conversion_rate: '',
  from_wallet_address: '',
  to_wallet_address: '',
  payment_method: '',
  status: 'pending'
})

// Edit Modal
const showEditModal = ref(false)
const isUpdating = ref(false)
const updateError = ref('')
const editForm = ref({
  id: '',
  member_id: '',
  member_email: '',
  amount: '',
  coin_amount: '',
  conversion_rate: '',
  from_wallet_address: '',
  to_wallet_address: '',
  payment_method: '',
  status: 'pending'
})

// Delete Modal
const showDeleteModal = ref(false)
const isDeleting = ref(false)
const deleteError = ref('')
const depositToDelete = ref(null)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const fetchDeposits = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    const params = {
      limit: 1000,
      ...(statusFilter.value && { status: statusFilter.value })
    }
    
    const response = await $fetch('/api/admin/deposits', { params })
    
    if (response.success) {
      deposits.value = response.data || []
      // Always clear error message on success, even if empty
      errorMessage.value = ''
    } else {
      // Only show error for actual errors, not empty data messages
      const msg = response.message || ''
      if (msg && !isDepositEmptyMessage(msg)) {
        errorMessage.value = msg
      } else {
        errorMessage.value = ''
      }
    }
  } catch (error) {
    console.error('Error fetching deposits:', error)
    // Only show error for actual errors, not empty data messages
    const errorMsg = error?.data?.message || error?.message || ''
    if (errorMsg && !isDepositEmptyMessage(errorMsg)) {
      errorMessage.value = errorMsg
    } else {
      errorMessage.value = ''
    }
    deposits.value = []
  } finally {
    loading.value = false
  }
}

const fetchMembers = async () => {
  try {
    const response = await $fetch('/api/admin/members', { params: { limit: 1000 } })
    if (response.success) {
      membersList.value = response.data || []
    }
  } catch (error) {
    console.error('Error fetching members:', error)
  membersList.value = []
  }
}

// Computed
const filteredDeposits = computed(() => {
  let filtered = deposits.value

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter(d => d.status === statusFilter.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(d => {
      return (
        d.member?.email?.toLowerCase().includes(query) ||
        d.member?.username?.toLowerCase().includes(query) ||
        d.from_wallet_address?.toLowerCase().includes(query) ||
        d.to_wallet_address?.toLowerCase().includes(query) ||
        d.payment_method?.toLowerCase().includes(query)
      )
    })
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredDeposits.value.length / itemsPerPage.value))
const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const paginationEnd = computed(() => paginationStart.value + itemsPerPage.value)
const paginatedDeposits = computed(() => 
  filteredDeposits.value.slice(paginationStart.value, paginationEnd.value)
)

// Pagination
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

// Create
const openCreateModal = () => {
  createForm.value = {
    member_id: '',
    amount: '',
    coin_amount: '',
    conversion_rate: '',
    from_wallet_address: '',
    to_wallet_address: '',
    payment_method: '',
    status: 'pending'
  }
  createError.value = ''
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createError.value = ''
}

const onMemberSelected = (member) => {
  // Member selected
}

const handleCreate = async () => {
  isCreating.value = true
  createError.value = ''

  try {
    const body = {
      member_id: createForm.value.member_id,
      amount: parseFloat(createForm.value.amount),
      status: createForm.value.status
    }

    if (createForm.value.coin_amount) {
      body.coin_amount = parseFloat(createForm.value.coin_amount)
    }
    if (createForm.value.conversion_rate) {
      body.conversion_rate = parseFloat(createForm.value.conversion_rate)
    }
    if (createForm.value.from_wallet_address) {
      body.from_wallet_address = createForm.value.from_wallet_address
    }
    if (createForm.value.to_wallet_address) {
      body.to_wallet_address = createForm.value.to_wallet_address
    }
    if (createForm.value.payment_method) {
      body.payment_method = createForm.value.payment_method
    }

    const response = await $fetch('/api/admin/deposits', {
      method: 'POST',
      body
    })

    if (response.success) {
      successMessage.value = 'Deposit berhasil dibuat'
      setTimeout(() => successMessage.value = '', 5000)
      closeCreateModal()
      await fetchDeposits()
      currentPage.value = 1
    } else {
      createError.value = response.message || 'Gagal membuat deposit'
    }
  } catch (error) {
    console.error('Error creating deposit:', error)
    createError.value = error?.data?.message || error?.message || 'Gagal membuat deposit'
  } finally {
    isCreating.value = false
  }
}

// Edit
const openEditModal = (deposit) => {
  editForm.value = {
    id: deposit.id,
    member_id: deposit.member_id,
    member_email: deposit.member?.email || 'N/A',
    amount: deposit.amount?.toString() || '',
    coin_amount: deposit.coin_amount?.toString() || '',
    conversion_rate: deposit.conversion_rate?.toString() || '',
    from_wallet_address: deposit.from_wallet_address || '',
    to_wallet_address: deposit.to_wallet_address || '',
    payment_method: deposit.payment_method || deposit.wallet_model || '',
    status: deposit.status || 'pending'
  }
  updateError.value = ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  updateError.value = ''
}

const handleUpdate = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    const body = {
      amount: parseFloat(editForm.value.amount),
      status: editForm.value.status
    }

    if (editForm.value.coin_amount) {
      body.coin_amount = parseFloat(editForm.value.coin_amount)
    }
    if (editForm.value.conversion_rate) {
      body.conversion_rate = parseFloat(editForm.value.conversion_rate)
    }
    if (editForm.value.from_wallet_address) {
      body.from_wallet_address = editForm.value.from_wallet_address
    }
    if (editForm.value.to_wallet_address) {
      body.to_wallet_address = editForm.value.to_wallet_address
    }
    if (editForm.value.payment_method) {
      body.payment_method = editForm.value.payment_method
    }

    const response = await $fetch(`/api/admin/deposits/${editForm.value.id}`, {
      method: 'PUT',
      body
    })

    if (response.success) {
      successMessage.value = 'Deposit berhasil diupdate'
      setTimeout(() => successMessage.value = '', 5000)
      closeEditModal()
      await fetchDeposits()
    } else {
      updateError.value = response.message || 'Gagal mengupdate deposit'
    }
  } catch (error) {
    console.error('Error updating deposit:', error)
    updateError.value = error?.data?.message || error?.message || 'Gagal mengupdate deposit'
  } finally {
    isUpdating.value = false
  }
}

// Delete
const confirmDelete = (deposit) => {
  depositToDelete.value = deposit
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteError.value = ''
}

const handleDelete = async () => {
  if (!depositToDelete.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    const response = await $fetch(`/api/admin/deposits/${depositToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      successMessage.value = 'Deposit berhasil dihapus'
      setTimeout(() => successMessage.value = '', 5000)
      closeDeleteModal()
      await fetchDeposits()
      
      // Reset to page 1 if current page is invalid
      const totalPagesAfterDelete = Math.ceil(filteredDeposits.value.length / itemsPerPage.value)
      if (currentPage.value > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        currentPage.value = 1
      }
    } else {
      deleteError.value = response.message || 'Gagal menghapus deposit'
    }
  } catch (error) {
    console.error('Error deleting deposit:', error)
    deleteError.value = error?.data?.message || error?.message || 'Gagal menghapus deposit'
  } finally {
    isDeleting.value = false
  }
}

// Format functions
const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  }).format(numValue)
}

const formatCoinAmount = (value) => {
  if (!value || value === 0) return '0'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0'
  return numValue.toFixed(8).replace(/\.?0+$/, '')
}

const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    completed: 'Completed',
    rejected: 'Rejected'
  }
  return statusMap[status] || status
}

// Helper to check if error message is about empty deposit
const isDepositEmptyMessage = (message) => {
  if (!message) return false
  const msg = message.toLowerCase()
  return msg.includes('belum ada data deposit') || 
         msg.includes('silakan tambah deposit baru') ||
         (msg.includes('belum ada data') && msg.includes('deposit'))
}

// Load data on mount
onMounted(() => {
  fetchDeposits()
  fetchMembers()
})
</script>

