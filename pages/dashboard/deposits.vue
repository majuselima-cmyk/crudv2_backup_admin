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

          <!-- Add Deposit Button Section (Outside Table) -->
          <div v-if="!errorMessage" class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-gray-800">
              Daftar Deposit ({{ totalCount }})
            </h2>
            <button 
              @click="openCreateModal"
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
            >
              <Icon name="plus" size="sm" />
              Tambah Deposit
            </button>
          </div>

          <!-- Deposits Table -->
          <div v-if="!errorMessage" class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</th>
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
                <tr
                  v-for="(deposit, index) in deposits"
                  :key="deposit.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {{ index + 1 }}
                  </td>
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
                      <div class="mt-1">
                        <span
                          :class="[
                            'px-2 py-0.5 text-xs font-semibold rounded',
                            deposit.members?.member_type === 'vip'
                              ? 'bg-purple-100 text-purple-800'
                              : deposit.members?.member_type === 'leader'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          ]"
                        >
                          {{ formatMemberType(deposit.members?.member_type || 'normal') }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {{ formatCurrency(deposit.amount) }} USDT
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    {{ formatCoinAmount(calculateCoinAmount(deposit)) }} Coin
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
            <MemberSelect
              v-model="createForm.member_id"
              :members="members"
              @select="onMemberChange"
              placeholder="Cari member (nama, email, jenis member)..."
            />
            <div v-if="selectedMemberInfo" class="mt-2 p-3 rounded-lg" :class="getMemberTypeClass(selectedMemberInfo.member_type)">
              <p class="text-sm font-medium">
                Jenis Member: <span class="font-semibold">{{ formatMemberType(selectedMemberInfo.member_type) }}</span>
              </p>
              <p class="text-sm mt-1">
                Harga Coin: <span class="font-semibold">{{ formatCurrency(selectedMemberInfo.coinPrice) }} USDT/Coin</span>
              </p>
            </div>
          </div>

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

          <!-- Coin Preview -->
          <div 
            v-if="createForm.amount && selectedMemberInfo && selectedMemberInfo.coinPrice > 0" 
            class="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Jumlah Coin yang akan didapat:</p>
                <p class="text-2xl font-bold text-blue-600">
                  {{ formatCoinAmount(coinPreview) }} <span class="text-base text-gray-600">Coin</span>
                </p>
              </div>
            </div>
            <div class="mt-3 pt-3 border-t border-blue-200">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-600">Amount:</span>
                <span class="font-medium">{{ formatCurrency(createForm.amount) }} USDT</span>
              </div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-600">Jenis Member:</span>
                <span class="font-medium">{{ formatMemberType(selectedMemberInfo.member_type) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-600">Harga Coin:</span>
                <span class="font-medium">{{ formatCurrency(selectedMemberInfo.coinPrice) }} USDT/Coin</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600">Conversion Rate:</span>
                <span class="font-medium">1 USDT = {{ formatNumber(conversionRate) }} Coin</span>
              </div>
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
            <p class="text-xs text-gray-500 mt-1">Kosongkan untuk auto-calculate berdasarkan harga coin member</p>
          </div>

          <!-- Network Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Network *</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="selectNetwork('BEP20')"
                :class="[
                  'px-4 py-3 rounded-lg border-2 font-semibold transition-all',
                  createForm.network === 'BEP20'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-700 border-amber-500/30 hover:border-amber-500/50'
                ]"
              >
                USDT BEP20
              </button>
              <button
                type="button"
                @click="selectNetwork('ERC20')"
                :class="[
                  'px-4 py-3 rounded-lg border-2 font-semibold transition-all',
                  createForm.network === 'ERC20'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-blue-500/30 hover:border-blue-500/50'
                ]"
              >
                USDT ERC20
              </button>
            </div>
          </div>

          <!-- Admin Wallet Address (auto-filled from database) -->
          <div 
            v-if="createForm.network" 
            :class="[
              'bg-gradient-to-r rounded-lg p-4 border',
              createForm.network === 'BEP20'
                ? 'from-amber-500/10 to-amber-600/10 border-amber-500/30'
                : 'from-blue-500/10 to-blue-600/10 border-blue-500/30'
            ]"
          >
            <label class="block text-sm font-medium mb-2 text-gray-700">
              Admin Wallet Address (To Wallet) *
              <span 
                :class="[
                  'ml-2 px-2 py-0.5 text-xs font-semibold rounded',
                  createForm.network === 'BEP20' 
                    ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' 
                    : 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                ]"
              >
                {{ createForm.network }}
              </span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="createForm.to_wallet_address"
                type="text"
                :readonly="!!adminWalletAddress"
                required
                :class="[
                  'flex-1 px-4 py-3 rounded-lg font-mono text-sm border focus:outline-none',
                  createForm.network === 'BEP20'
                    ? adminWalletAddress
                      ? 'bg-white text-gray-900 border-amber-500/30'
                      : 'bg-white text-gray-900 border-amber-500/30 focus:border-amber-500'
                    : adminWalletAddress
                      ? 'bg-white text-gray-900 border-blue-500/30'
                      : 'bg-white text-gray-900 border-blue-500/30 focus:border-blue-500'
                ]"
                :placeholder="adminWalletAddress ? 'Wallet admin dari database' : 'Pilih network untuk load wallet admin'"
              />
              <button
                v-if="adminWalletAddress"
                type="button"
                @click="copyWalletAddress(createForm.to_wallet_address)"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  createForm.network === 'BEP20'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                ]"
                title="Copy wallet address"
              >
                <Icon name="clipboard-document" size="sm" />
              </button>
              <button
                v-if="createForm.network"
                type="button"
                @click="loadRandomWalletAdmin"
                :disabled="isLoadingWallet"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  createForm.network === 'BEP20'
                    ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
                  isLoadingWallet && 'opacity-50 cursor-not-allowed'
                ]"
                title="Refresh wallet address (random)"
              >
                <Icon name="arrow-path" size="sm" :class="isLoadingWallet && 'animate-spin'" />
              </button>
            </div>
            <p v-if="adminWalletAddress" class="text-xs text-gray-500 mt-2">
              ✓ Wallet admin diambil dari database secara random. Klik refresh untuk ganti wallet.
            </p>
            <p v-else-if="createForm.network" class="text-xs text-amber-600 mt-2">
              ⏳ Memuat wallet admin dari database...
            </p>
            <p v-else class="text-xs text-gray-500 mt-2">
              Pilih network (BEP20 atau ERC20) untuk memuat wallet admin dari database.
            </p>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Model</label>
              <input
                v-model="createForm.wallet_model"
                type="text"
                placeholder="Auto-filled berdasarkan network"
                readonly
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
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

          <!-- Network Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Network *</label>
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="selectEditNetwork('BEP20')"
                :class="[
                  'px-4 py-3 rounded-lg border-2 font-semibold transition-all',
                  editForm.network === 'BEP20'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-700 border-amber-500/30 hover:border-amber-500/50'
                ]"
              >
                USDT BEP20
              </button>
              <button
                type="button"
                @click="selectEditNetwork('ERC20')"
                :class="[
                  'px-4 py-3 rounded-lg border-2 font-semibold transition-all',
                  editForm.network === 'ERC20'
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-blue-500/30 hover:border-blue-500/50'
                ]"
              >
                USDT ERC20
              </button>
            </div>
          </div>

          <!-- Admin Wallet Address (auto-filled from database) -->
          <div 
            v-if="editForm.network" 
            :class="[
              'bg-gradient-to-r rounded-lg p-4 border',
              editForm.network === 'BEP20'
                ? 'from-amber-500/10 to-amber-600/10 border-amber-500/30'
                : 'from-blue-500/10 to-blue-600/10 border-blue-500/30'
            ]"
          >
            <label class="block text-sm font-medium mb-2 text-gray-700">
              Admin Wallet Address (To Wallet) *
              <span 
                :class="[
                  'ml-2 px-2 py-0.5 text-xs font-semibold rounded',
                  editForm.network === 'BEP20' 
                    ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' 
                    : 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                ]"
              >
                {{ editForm.network }}
              </span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="editForm.to_wallet_address"
                type="text"
                :readonly="!!editAdminWalletAddress"
                required
                :class="[
                  'flex-1 px-4 py-3 rounded-lg font-mono text-sm border focus:outline-none',
                  editForm.network === 'BEP20'
                    ? editAdminWalletAddress
                      ? 'bg-white text-gray-900 border-amber-500/30'
                      : 'bg-white text-gray-900 border-amber-500/30 focus:border-amber-500'
                    : editAdminWalletAddress
                      ? 'bg-white text-gray-900 border-blue-500/30'
                      : 'bg-white text-gray-900 border-blue-500/30 focus:border-blue-500'
                ]"
                :placeholder="editAdminWalletAddress ? 'Wallet admin dari database' : 'Pilih network untuk load wallet admin'"
              />
              <button
                v-if="editAdminWalletAddress"
                type="button"
                @click="copyWalletAddress(editForm.to_wallet_address)"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  editForm.network === 'BEP20'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                ]"
                title="Copy wallet address"
              >
                <Icon name="clipboard-document" size="sm" />
              </button>
              <button
                v-if="editForm.network"
                type="button"
                @click="loadRandomEditWalletAdmin"
                :disabled="isLoadingEditWallet"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  editForm.network === 'BEP20'
                    ? 'bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-300'
                    : 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
                  isLoadingEditWallet && 'opacity-50 cursor-not-allowed'
                ]"
                title="Refresh wallet address (random)"
              >
                <Icon name="arrow-path" size="sm" :class="isLoadingEditWallet && 'animate-spin'" />
              </button>
            </div>
            <p v-if="editAdminWalletAddress" class="text-xs text-gray-500 mt-2">
              ✓ Wallet admin diambil dari database secara random. Klik refresh untuk ganti wallet.
            </p>
            <p v-else-if="editForm.network" class="text-xs text-amber-600 mt-2">
              ⏳ Memuat wallet admin dari database...
            </p>
            <p v-else class="text-xs text-gray-500 mt-2">
              Pilih network (BEP20 atau ERC20) untuk memuat wallet admin dari database.
            </p>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Model</label>
              <input
                v-model="editForm.wallet_model"
                type="text"
                readonly
                placeholder="Auto-filled berdasarkan network"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
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
const limit = ref(10000)
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
const coinSettings = ref(null)
const selectedMemberInfo = ref(null)
const coinPreview = ref(0)
const conversionRate = ref(2.0)
const adminWalletAddress = ref('')
const isLoadingWallet = ref(false)

// Forms
const createForm = ref({
  member_id: '',
  network: '', // BEP20 or ERC20
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
  network: '',
  from_wallet_address: '',
  to_wallet_address: '',
  payment_method: '',
  wallet_model: '',
  status: 'pending'
})

const editAdminWalletAddress = ref('')
const isLoadingEditWallet = ref(false)

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

// Format coin amount (2 decimal places)
const formatCoinAmount = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

// Fetch coin settings
const fetchCoinSettings = async () => {
  try {
    const response = await $fetch('/api/admin/coin')
    if (response.success && response.data) {
      coinSettings.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch coin settings:', error)
  }
}

// Calculate coin amount based on amount and member type
const calculateCoinAmount = (deposit) => {
  if (!deposit || !deposit.amount) return 0
  
  const amount = parseFloat(deposit.amount) || 0
  if (amount <= 0) return 0
  
  // Get member type from deposit.members
  const memberType = deposit.members?.member_type || 'normal'
  
  // Get coin price based on member type
  if (!coinSettings.value) return 0
  
  let pricePerCoin = parseFloat(coinSettings.value.normal_price_usdt) || 0.5
  if (memberType === 'vip' && coinSettings.value.vip_price_usdt) {
    pricePerCoin = parseFloat(coinSettings.value.vip_price_usdt)
  } else if (memberType === 'leader' && coinSettings.value.leader_price_usdt) {
    pricePerCoin = parseFloat(coinSettings.value.leader_price_usdt)
  }
  
  // Calculate coin amount: amount (USDT) / price_per_coin
  if (pricePerCoin <= 0) return 0
  return amount / pricePerCoin
}

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

// Format member type
const formatMemberType = (type) => {
  const types = {
    normal: 'Normal',
    leader: 'Leader',
    vip: 'VIP'
  }
  return types[type] || type || 'Normal'
}

// Get member type class for styling
const getMemberTypeClass = (type) => {
  if (type === 'vip') {
    return 'bg-purple-50 border border-purple-200 text-purple-800'
  } else if (type === 'leader') {
    return 'bg-emerald-50 border border-emerald-200 text-emerald-800'
  }
  return 'bg-blue-50 border border-blue-200 text-blue-800'
}

// Get coin price based on member type
const getCoinPriceByMemberType = (memberType) => {
  if (!coinSettings.value) return 0.5
  
  if (memberType === 'vip' && coinSettings.value.vip_price_usdt) {
    return parseFloat(coinSettings.value.vip_price_usdt)
  } else if (memberType === 'leader' && coinSettings.value.leader_price_usdt) {
    return parseFloat(coinSettings.value.leader_price_usdt)
  }
  return parseFloat(coinSettings.value.normal_price_usdt) || 0.5
}

// Handle member change
const onMemberChange = () => {
  if (!createForm.value.member_id) {
    selectedMemberInfo.value = null
    coinPreview.value = 0
    conversionRate.value = 2.0
    return
  }
  
  const member = members.value.find(m => m.id === createForm.value.member_id)
  if (member) {
    const coinPrice = getCoinPriceByMemberType(member.member_type)
    selectedMemberInfo.value = {
      ...member,
      coinPrice
    }
    // Calculate conversion rate: 1 USDT / price_per_coin = jumlah coin per 1 USDT
    conversionRate.value = coinPrice > 0 ? 1 / coinPrice : 2.0
    calculateCoinPreview()
  } else {
    selectedMemberInfo.value = null
    coinPreview.value = 0
    conversionRate.value = 2.0
  }
}

// Calculate coin preview
const calculateCoinPreview = () => {
  if (
    createForm.value.amount &&
    selectedMemberInfo.value &&
    selectedMemberInfo.value.coinPrice > 0
  ) {
    const amount = parseFloat(createForm.value.amount) || 0
    coinPreview.value = amount * conversionRate.value
    
    // Auto-fill conversion_rate if empty
    if (!createForm.value.conversion_rate) {
      createForm.value.conversion_rate = conversionRate.value.toFixed(8)
    }
  } else {
    coinPreview.value = 0
  }
}

// Select network and load wallet address
const selectNetwork = async (network) => {
  createForm.value.network = network
  createForm.value.wallet_model = `USDT_${network}`
  createForm.value.payment_method = `USDT_${network}`
  
  // Load wallet admin from database based on selected network
  await loadWalletAddressByNetwork(network)
}

// Load wallet address based on network
const loadWalletAddressByNetwork = async (network) => {
  if (!network) {
    adminWalletAddress.value = ''
    createForm.value.to_wallet_address = ''
    return
  }

  isLoadingWallet.value = true
  try {
    const response = await $fetch('/api/admin/wallet-addresses', {
      params: { network }
    })

    if (response.success && response.data && response.data.length > 0) {
      // Get random wallet address from available wallets
      const randomIndex = Math.floor(Math.random() * response.data.length)
      adminWalletAddress.value = response.data[randomIndex].address || ''
      createForm.value.to_wallet_address = adminWalletAddress.value
    } else {
      adminWalletAddress.value = ''
      createForm.value.to_wallet_address = ''
    }
  } catch (error) {
    console.error('Failed to load wallet address:', error)
    adminWalletAddress.value = ''
    createForm.value.to_wallet_address = ''
  } finally {
    isLoadingWallet.value = false
  }
}

// Copy wallet address to clipboard
const copyWalletAddress = async (address) => {
  if (!address) return

  try {
    await navigator.clipboard.writeText(address)
    alert('Wallet address berhasil di-copy!')
  } catch (error) {
    console.error('Failed to copy wallet address:', error)
    alert('Gagal copy wallet address')
  }
}

// Watch for changes
watch(() => createForm.value.amount, () => {
  calculateCoinPreview()
})

watch(() => createForm.value.member_id, () => {
  onMemberChange()
})

// Create Modal
const openCreateModal = async () => {
  createForm.value = {
    member_id: '',
    network: '',
    amount: '',
    coin_amount: '',
    conversion_rate: '',
    from_wallet_address: '', // Manual input - tidak diisi otomatis
    to_wallet_address: '',
    payment_method: '',
    wallet_model: '',
    status: 'pending'
  }
  createError.value = ''
  selectedMemberInfo.value = null
  coinPreview.value = 0
  conversionRate.value = 2.0
  adminWalletAddress.value = ''
  
  showCreateModal.value = true
  
  // Tidak perlu load wallet admin di awal, tunggu user pilih network dulu
}

// Load random wallet admin from database (for refresh button)
const loadRandomWalletAdmin = async () => {
  const network = createForm.value.network || 'BEP20'
  await loadWalletAddressByNetwork(network)
}

// Select network for edit form
const selectEditNetwork = async (network) => {
  editForm.value.network = network
  editForm.value.wallet_model = `USDT_${network}`
  editForm.value.payment_method = `USDT_${network}`
  
  // Load wallet admin from database based on selected network
  await loadEditWalletAddressByNetwork(network)
}

// Load wallet address for edit form based on network
const loadEditWalletAddressByNetwork = async (network) => {
  if (!network) {
    editAdminWalletAddress.value = ''
    editForm.value.to_wallet_address = ''
    return
  }

  isLoadingEditWallet.value = true
  try {
    const response = await $fetch('/api/admin/wallet-addresses', {
      params: { network }
    })

    if (response.success && response.data && response.data.length > 0) {
      // Get random wallet address from available wallets
      const randomIndex = Math.floor(Math.random() * response.data.length)
      editAdminWalletAddress.value = response.data[randomIndex].address || ''
      editForm.value.to_wallet_address = editAdminWalletAddress.value
    } else {
      editAdminWalletAddress.value = ''
      editForm.value.to_wallet_address = ''
    }
  } catch (error) {
    console.error('Failed to load wallet address:', error)
    editAdminWalletAddress.value = ''
    editForm.value.to_wallet_address = ''
  } finally {
    isLoadingEditWallet.value = false
  }
}

// Load random wallet admin for edit form (for refresh button)
const loadRandomEditWalletAdmin = async () => {
  const network = editForm.value.network || 'BEP20'
  await loadEditWalletAddressByNetwork(network)
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.value = {
    member_id: '',
    network: '',
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
  selectedMemberInfo.value = null
  coinPreview.value = 0
  conversionRate.value = 2.0
  adminWalletAddress.value = ''
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
const openEditModal = async (deposit) => {
  // Extract network from payment_method or wallet_model
  let network = ''
  if (deposit.payment_method) {
    if (deposit.payment_method.includes('BEP20')) {
      network = 'BEP20'
    } else if (deposit.payment_method.includes('ERC20')) {
      network = 'ERC20'
    }
  } else if (deposit.wallet_model) {
    if (deposit.wallet_model.includes('BEP20')) {
      network = 'BEP20'
    } else if (deposit.wallet_model.includes('ERC20')) {
      network = 'ERC20'
    }
  }
  
  // If no network found, default to BEP20
  if (!network) {
    network = 'BEP20'
  }
  
  editForm.value = {
    id: deposit.id,
    member_id: deposit.member_id,
    member_email: deposit.members?.email || 'N/A',
    amount: deposit.amount?.toString() || '',
    coin_amount: deposit.coin_amount?.toString() || '',
    conversion_rate: deposit.conversion_rate?.toString() || '',
    network: network,
    from_wallet_address: deposit.from_wallet_address || '',
    to_wallet_address: deposit.to_wallet_address || '',
    payment_method: deposit.payment_method || `USDT_${network}`,
    wallet_model: deposit.wallet_model || `USDT_${network}`,
    status: deposit.status || 'pending'
  }
  updateError.value = ''
  editAdminWalletAddress.value = ''
  showEditModal.value = true
  
  // Load wallet admin if network is BEP20 or ERC20
  if (network === 'BEP20' || network === 'ERC20') {
    await loadEditWalletAddressByNetwork(network)
  }
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
    network: '',
    from_wallet_address: '',
    to_wallet_address: '',
    payment_method: '',
    wallet_model: '',
    status: 'pending'
  }
  updateError.value = ''
  editAdminWalletAddress.value = ''
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
  fetchCoinSettings()
})
</script>

