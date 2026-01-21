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
            Rekap Deposit
          </h1>
          <div class="flex items-center gap-4">
            <!-- Add Deposit Button -->
            <button 
              @click="openCreateModal"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
            >
              <Icon name="plus" size="sm" />
              Tambah Deposit
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Mobile Add Button -->
        <div class="lg:hidden mb-4">
          <button 
            @click="openCreateModal"
            class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-sm"
          >
            <Icon name="plus" size="sm" />
            Tambah Deposit
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </div>

        <!-- Content when not loading -->
        <template v-else>
          <!-- Search and Filters Section -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <!-- Search Input -->
              <div class="relative flex-1 w-full sm:w-auto">
                <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="searchQuery"
                  @input="handleSearch"
                  type="text"
                  placeholder="Cari deposit (email, username, wallet address, payment method)..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <!-- Status Filter -->
              <select
                v-model="selectedStatus"
                @change="fetchDeposits"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div class="flex items-center gap-2">
              <Icon name="x-circle" size="md" class="text-red-600" />
              <p class="text-sm text-red-600">{{ errorMessage }}</p>
            </div>
          </div>

          <!-- Info Message (when no data but no error) -->
          <div v-if="!errorMessage && deposits.length === 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div class="flex items-center gap-2">
              <Icon name="information-circle" size="md" class="text-blue-600" />
              <p class="text-sm text-blue-600">Belum ada data deposit. Klik tombol "Tambah Deposit" untuk menambah deposit baru.</p>
            </div>
          </div>

          <!-- Deposits Table -->
          <div v-if="!errorMessage" class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <!-- Table Header -->
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">
              Daftar Deposit ({{ totalCount }})
            </h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (Input)</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From Wallet</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Wallet</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="deposits.length === 0" class="hover:bg-gray-50">
                  <td colspan="10" class="px-6 py-12 text-center text-sm text-gray-500">
                    Belum ada data deposit
                  </td>
                </tr>
                <tr
                  v-for="deposit in deposits"
                  :key="deposit.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(deposit.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-mono text-xs text-gray-600 break-all max-w-xs">
                      {{ deposit.member_id }}
                    </div>
                    <button
                      @click="copyHash(deposit.member_id)"
                      class="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div class="font-medium text-gray-900">{{ deposit.members?.username || 'N/A' }}</div>
                      <div class="text-gray-500 text-xs">{{ deposit.members?.email || '' }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {{ formatCurrency(deposit.amount) }} USDT
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {{ formatNumber(deposit.coin_amount || 0) }} Coin
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="max-w-xs">
                      <div class="font-mono text-xs text-gray-700 break-all">
                        {{ deposit.from_wallet_address || '-' }}
                      </div>
                      <button
                        v-if="deposit.from_wallet_address"
                        @click="copyHash(deposit.from_wallet_address)"
                        class="mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="max-w-xs">
                      <div class="font-mono text-xs text-gray-700 break-all">
                        {{ deposit.to_wallet_address || '-' }}
                      </div>
                      <button
                        v-if="deposit.to_wallet_address"
                        @click="copyHash(deposit.to_wallet_address)"
                        class="mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded',
                        deposit.wallet_model?.includes('BEP20')
                          ? 'bg-amber-100 text-amber-800'
                          : deposit.wallet_model?.includes('ERC20')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      ]"
                    >
                      {{ deposit.wallet_model || deposit.payment_method || '-' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-1 rounded-lg text-xs font-medium',
                        deposit.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : deposit.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ deposit.status === 'completed' ? 'Selesai' : deposit.status === 'pending' ? 'Pending' : 'Ditolak' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <button 
                        @click="openEditModal(deposit)"
                        class="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm font-medium"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        @click="confirmDelete(deposit)"
                        class="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium"
                      >
                        <Icon name="delete" size="sm" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalCount > 0" class="px-6 py-4 border-t border-gray-200">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <!-- Info & Items Per Page -->
              <div class="flex flex-col sm:flex-row items-center gap-4">
                <div class="text-sm text-gray-700">
                  Menampilkan <span class="font-semibold">{{ offset + 1 }}</span> - 
                  <span class="font-semibold">{{ Math.min(offset + limit, totalCount) }}</span> dari 
                  <span class="font-semibold">{{ totalCount }}</span> deposit
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-700">Items per page:</label>
                  <select
                    v-model="limit"
                    @change="handleLimitChange"
                    class="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                </div>
              </div>

              <!-- Page Navigation -->
              <div class="flex items-center gap-2">
                <button
                  @click="goToFirstPage"
                  :disabled="currentPage === 1"
                  :class="[
                    'px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition',
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  ]"
                  title="First Page"
                >
                  ««
                </button>
                <button
                  @click="previousPage"
                  :disabled="currentPage === 1"
                  :class="[
                    'px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition',
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  ]"
                >
                  Previous
                </button>
                
                <!-- Page Numbers -->
                <div class="flex items-center gap-1">
                  <template v-for="page in visiblePages" :key="page">
                    <button
                      v-if="typeof page === 'number'"
                      @click="goToPage(page)"
                      :class="[
                        'px-3 py-2 border rounded-lg text-sm font-medium transition min-w-[40px]',
                        page === currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      ]"
                    >
                      {{ page }}
                    </button>
                    <span
                      v-else
                      class="px-2 py-2 text-gray-500"
                    >
                      {{ page }}
                    </span>
                  </template>
                </div>

                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  :class="[
                    'px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium transition',
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  ]"
                >
                  Next
                </button>
                <button
                  @click="goToLastPage"
                  :disabled="currentPage === totalPages"
                  :class="[
                    'px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium transition',
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  ]"
                  title="Last Page"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        </div>
        </template>
      </main>
    </div>

    <!-- Create Modal -->
    <div 
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeCreateModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-800">Tambah Deposit Baru</h3>
            <button 
              @click="closeCreateModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        </div>

        <form @submit.prevent="handleCreate" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member *</label>
            <select
              v-model="createForm.member_id"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Pilih Member</option>
              <option v-for="member in members" :key="member.id" :value="member.id">
                {{ member.username }} ({{ member.email }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Amount (USDT) *</label>
              <input
                v-model="createForm.amount"
                type="number"
                step="0.00000001"
                min="0"
                required
                placeholder="0.00"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Coin Amount</label>
              <input
                v-model="createForm.coin_amount"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Conversion Rate</label>
            <input
              v-model="createForm.conversion_rate"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="0.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">From Wallet Address *</label>
            <input
              v-model="createForm.from_wallet_address"
              type="text"
              required
              placeholder="Masukkan wallet address pengirim"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">To Wallet Address *</label>
            <input
              v-model="createForm.to_wallet_address"
              type="text"
              required
              placeholder="Masukkan wallet address penerima"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
              <input
                v-model="createForm.payment_method"
                type="text"
                required
                placeholder="USDT, BTC, dll"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Model / Network</label>
              <input
                v-model="createForm.wallet_model"
                type="text"
                placeholder="ERC20, BEP20, TRC20, dll"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              v-model="createForm.status"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div v-if="createError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ createError }}</p>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <button
              type="submit"
              :disabled="isCreating"
              class="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isCreating ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button
              type="button"
              @click="closeCreateModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div 
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-800">Edit Deposit</h3>
            <button 
              @click="closeEditModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        </div>

        <form @submit.prevent="handleUpdate" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member</label>
            <input
              :value="editForm.member_email || 'N/A'"
              type="text"
              disabled
              class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
            <p class="text-xs text-gray-500 mt-1">Member tidak dapat diubah</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Amount (USDT) *</label>
              <input
                v-model="editForm.amount"
                type="number"
                step="0.00000001"
                min="0"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Coin Amount</label>
              <input
                v-model="editForm.coin_amount"
                type="number"
                step="0.00000001"
                min="0"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Conversion Rate</label>
            <input
              v-model="editForm.conversion_rate"
              type="number"
              step="0.00000001"
              min="0"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">From Wallet Address *</label>
            <input
              v-model="editForm.from_wallet_address"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">To Wallet Address *</label>
            <input
              v-model="editForm.to_wallet_address"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
              <input
                v-model="editForm.payment_method"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Model / Network</label>
              <input
                v-model="editForm.wallet_model"
                type="text"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              v-model="editForm.status"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div v-if="updateError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ updateError }}</p>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <button
              type="submit"
              :disabled="isUpdating"
              class="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isUpdating ? 'Menyimpan...' : 'Simpan' }}
            </button>
            <button
              type="button"
              @click="closeEditModal"
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
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Hapus Deposit</h3>
          <p class="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus deposit dengan amount <strong>{{ formatCurrency(depositToDelete?.amount) }} USDT</strong>? 
            Tindakan ini tidak dapat dibatalkan.
          </p>

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
const loading = ref(false)
const deposits = ref([])
const members = ref([])
const selectedStatus = ref('')
const searchQuery = ref('')
const searchTimeout = ref(null)
const totalCount = ref(0)
const limit = ref(50)
const offset = ref(0)
const errorMessage = ref('')

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const createError = ref('')
const updateError = ref('')
const deleteError = ref('')
const depositToDelete = ref(null)

// Forms
const createForm = ref({
  member_id: '',
  amount: '',
  coin_amount: '',
  conversion_rate: '',
  from_wallet_address: '',
  to_wallet_address: '',
  payment_method: '',
  wallet_model: '',
  status: 'pending'
})

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
  wallet_model: '',
  status: 'pending'
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Fetch deposits
const fetchDeposits = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const params = {
      limit: limit.value,
      offset: offset.value
    }
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    if (searchQuery.value && searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    console.log('Fetching deposits with params:', params)
    const response = await $fetch('/api/admin/deposits', {
      params
    })

    console.log('Deposits API Response:', response)

    if (response && response.success) {
      deposits.value = response.data || []
      totalCount.value = response.count || 0
      console.log('Deposits loaded:', deposits.value.length, 'items')
      console.log('Total count:', totalCount.value)
      
      if (deposits.value.length === 0 && totalCount.value === 0) {
        errorMessage.value = 'Belum ada data deposit. Silakan tambah deposit baru.'
      }
    } else {
      errorMessage.value = response?.message || 'Gagal memuat data deposit'
      deposits.value = []
      totalCount.value = 0
    }
  } catch (error) {
    console.error('Failed to fetch deposits:', error)
    console.error('Error details:', {
      message: error?.message,
      data: error?.data,
      statusCode: error?.statusCode
    })
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data deposit. Silakan coba lagi.'
    deposits.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// Format currency
const formatCurrency = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  }).format(numValue)
}

// Format number
const formatNumber = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  }).format(numValue)
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Copy hash to clipboard
const copyHash = async (hash) => {
  try {
    await navigator.clipboard.writeText(hash)
    alert('Transaction hash berhasil di-copy!')
  } catch (error) {
    console.error('Failed to copy hash:', error)
    alert('Gagal copy transaction hash')
  }
}

// Pagination - Computed properties
const currentPage = computed(() => {
  return Math.floor(offset.value / limit.value) + 1
})

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / limit.value)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    // Show all pages if total pages <= 7
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Show pages with ellipsis
    if (current <= 3) {
      // Show first 5 pages
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      // Show last 5 pages
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Show current page with neighbors
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// Pagination functions
const goToPage = (page) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    offset.value = (page - 1) * limit.value
    fetchDeposits()
  }
}

const goToFirstPage = () => {
  offset.value = 0
  fetchDeposits()
}

const goToLastPage = () => {
  offset.value = (totalPages.value - 1) * limit.value
  fetchDeposits()
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    offset.value += limit.value
    fetchDeposits()
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    offset.value = Math.max(0, offset.value - limit.value)
    fetchDeposits()
  }
}

const handleLimitChange = () => {
  offset.value = 0
  fetchDeposits()
}

// Handle search with debounce
const handleSearch = () => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // Reset to first page when searching
  offset.value = 0
  
  // Debounce search - wait 500ms after user stops typing
  searchTimeout.value = setTimeout(() => {
    fetchDeposits()
  }, 500)
}

// Watch status change
watch(selectedStatus, () => {
  offset.value = 0
  fetchDeposits()
})

// Fetch members for dropdown
const fetchMembers = async () => {
  try {
    const response = await $fetch('/api/admin/members')
    if (response.success) {
      members.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch members:', error)
  }
}

// Create Modal
const openCreateModal = () => {
  createForm.value = {
    member_id: '',
    amount: '',
    coin_amount: '',
    conversion_rate: '',
    from_wallet_address: '',
    to_wallet_address: '',
    payment_method: '',
    wallet_model: '',
    status: 'pending'
  }
  createError.value = ''
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.value = {
    member_id: '',
    amount: '',
    coin_amount: '',
    conversion_rate: '',
    from_wallet_address: '',
    to_wallet_address: '',
    payment_method: '',
    wallet_model: '',
    status: 'pending'
  }
  createError.value = ''
}

const handleCreate = async () => {
  isCreating.value = true
  createError.value = ''

  try {
    const response = await $fetch('/api/admin/deposits', {
      method: 'POST',
      body: {
        member_id: createForm.value.member_id,
        amount: createForm.value.amount,
        coin_amount: createForm.value.coin_amount || undefined,
        conversion_rate: createForm.value.conversion_rate || undefined,
        from_wallet_address: createForm.value.from_wallet_address,
        to_wallet_address: createForm.value.to_wallet_address,
        payment_method: createForm.value.payment_method,
        wallet_model: createForm.value.wallet_model || undefined,
        status: createForm.value.status
      }
    })

    if (response.success) {
      closeCreateModal()
      await fetchDeposits()
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

// Edit Modal
const openEditModal = (deposit) => {
  editForm.value = {
    id: deposit.id,
    member_id: deposit.member_id,
    member_email: deposit.members?.email || 'N/A',
    amount: deposit.amount?.toString() || '',
    coin_amount: deposit.coin_amount?.toString() || '',
    conversion_rate: deposit.conversion_rate?.toString() || '',
    from_wallet_address: deposit.from_wallet_address || '',
    to_wallet_address: deposit.to_wallet_address || '',
    payment_method: deposit.payment_method || '',
    wallet_model: deposit.wallet_model || '',
    status: deposit.status || 'pending'
  }
  updateError.value = ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = {
    id: '',
    member_id: '',
    member_email: '',
    amount: '',
    coin_amount: '',
    conversion_rate: '',
    from_wallet_address: '',
    to_wallet_address: '',
    payment_method: '',
    wallet_model: '',
    status: 'pending'
  }
  updateError.value = ''
}

const handleUpdate = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    const response = await $fetch(`/api/admin/deposits/${editForm.value.id}`, {
      method: 'PUT',
      body: {
        amount: editForm.value.amount,
        coin_amount: editForm.value.coin_amount || undefined,
        conversion_rate: editForm.value.conversion_rate || undefined,
        from_wallet_address: editForm.value.from_wallet_address,
        to_wallet_address: editForm.value.to_wallet_address,
        payment_method: editForm.value.payment_method,
        wallet_model: editForm.value.wallet_model || undefined,
        status: editForm.value.status
      }
    })

    if (response.success) {
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

// Delete Modal
const confirmDelete = (deposit) => {
  depositToDelete.value = deposit
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  depositToDelete.value = null
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
      closeDeleteModal()
      await fetchDeposits()
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

// Fetch on mount
onMounted(() => {
  fetchDeposits()
  fetchMembers()
})
</script>

