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
            Rekap Withdraw
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
                  placeholder="Cari withdraw (email, username, wallet address, network)..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <!-- Status Filter -->
              <select
                v-model="selectedStatus"
                @change="fetchWithdraws"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <!-- Withdraw Type Filter -->
              <select
                v-model="selectedWithdrawType"
                @change="fetchWithdraws"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="">Semua Tipe</option>
                <option value="balance">Balance</option>
                <option value="coin">Coin</option>
                <option value="bonus_aktif">Bonus Aktif</option>
                <option value="bonus_pasif">Bonus Pasif</option>
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
          <div v-if="!errorMessage && withdraws.length === 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div class="flex items-center gap-2">
              <Icon name="information-circle" size="md" class="text-blue-600" />
              <p class="text-sm text-blue-600">Belum ada data withdraw.</p>
            </div>
          </div>

          <!-- Withdraws Table -->
          <div v-if="!errorMessage" class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <!-- Table Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-800">
                Daftar Withdraw ({{ totalCount }})
              </h2>
              <!-- Add Withdraw Button -->
              <button 
                @click="openCreateModal"
                class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
              >
                <Icon name="plus" size="sm" />
                Tambah Withdraw
              </button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (USDT)</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin Amount</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dari Wallet (Admin)</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tujuan Wallet (Member)</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction Hash</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-if="withdraws.length === 0" class="hover:bg-gray-50">
                  <td colspan="13" class="px-6 py-12 text-center text-sm text-gray-500">
                    Belum ada data withdraw
                  </td>
                </tr>
                <tr
                  v-for="(withdraw, index) in withdraws"
                  :key="withdraw.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {{ index + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(withdraw.created_at) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div class="font-mono text-xs text-gray-600 break-all max-w-xs">
                      {{ withdraw.member_id }}
                    </div>
                    <button
                      @click="copyHash(withdraw.member_id)"
                      class="mt-1 text-xs text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div class="font-medium text-gray-900">{{ withdraw.members?.username || 'N/A' }}</div>
                      <div class="text-gray-500 text-xs">{{ withdraw.members?.email || '' }}</div>
                      <div class="mt-1">
                        <span
                          :class="[
                            'px-2 py-0.5 text-xs font-semibold rounded',
                            withdraw.members?.member_type === 'vip'
                              ? 'bg-purple-100 text-purple-800'
                              : withdraw.members?.member_type === 'leader'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          ]"
                        >
                          {{ formatMemberType(withdraw.members?.member_type || 'normal') }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded',
                        withdraw.withdraw_type === 'balance'
                          ? 'bg-blue-100 text-blue-800'
                          : withdraw.withdraw_type === 'coin'
                          ? 'bg-purple-100 text-purple-800'
                          : withdraw.withdraw_type === 'bonus_aktif'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      ]"
                    >
                      {{ formatWithdrawType(withdraw.withdraw_type) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {{ formatCurrency(withdraw.amount) }} USDT
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                    <span v-if="withdraw.withdraw_type === 'coin'">
                      {{ formatNumber(calculateCoinAmount(withdraw)) }} Coin
                    </span>
                    <span v-else class="text-gray-400">-</span>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="max-w-xs">
                      <div class="font-mono text-xs text-gray-700 break-all">
                        {{ withdraw.admin_wallet_address || '-' }}
                      </div>
                      <button
                        v-if="withdraw.admin_wallet_address"
                        @click="copyHash(withdraw.admin_wallet_address)"
                        class="mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="max-w-xs">
                      <div class="font-mono text-xs text-gray-700 break-all">
                        {{ withdraw.wallet_address || '-' }}
                      </div>
                      <button
                        v-if="withdraw.wallet_address"
                        @click="copyHash(withdraw.wallet_address)"
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
                        withdraw.wallet_network === 'BEP20'
                          ? 'bg-amber-100 text-amber-800'
                          : withdraw.wallet_network === 'ERC20'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      ]"
                    >
                      {{ withdraw.wallet_network || '-' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <div class="max-w-xs">
                      <div v-if="withdraw.hash" class="font-mono text-xs text-gray-700 break-all">
                        {{ withdraw.hash }}
                      </div>
                      <span v-else class="text-gray-400 text-xs">-</span>
                      <button
                        v-if="withdraw.hash"
                        @click="copyHash(withdraw.hash)"
                        class="mt-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-1 rounded-lg text-xs font-medium',
                        withdraw.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : withdraw.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      ]"
                    >
                      {{ withdraw.status === 'completed' ? 'Selesai' : withdraw.status === 'pending' ? 'Pending' : 'Ditolak' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                      <button 
                        @click="openEditModal(withdraw)"
                        class="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm font-medium"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        @click="confirmDelete(withdraw)"
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
                  <span class="font-semibold">{{ totalCount }}</span> withdraw
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
            <h3 class="text-xl font-semibold text-gray-800">Tambah Withdraw Baru</h3>
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

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Withdraw Type *</label>
              <select
                v-model="createForm.withdraw_type"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              >
                <option value="balance">Balance</option>
                <option value="coin">Coin</option>
                <option value="bonus_aktif">Bonus Aktif</option>
                <option value="bonus_pasif">Bonus Pasif</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Amount (USDT) *</label>
              <input
                v-model="createForm.amount"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Network *</label>
              <select
                v-model="createForm.wallet_network"
                @change="onNetworkChange"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              >
                <option value="BEP20">BEP20</option>
                <option value="ERC20">ERC20</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Model</label>
              <input
                v-model="createForm.wallet_model"
                type="text"
                readonly
                placeholder="Akan terisi otomatis berdasarkan network"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-gray-700">
              Admin Wallet Address (From Wallet) *
              <span 
                :class="[
                  'ml-2 px-2 py-0.5 text-xs font-semibold rounded',
                  createForm.wallet_network === 'BEP20' 
                    ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' 
                    : createForm.wallet_network === 'ERC20'
                    ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                    : 'bg-gray-500/20 text-gray-700 border border-gray-500/30'
                ]"
              >
                {{ createForm.wallet_network }}
              </span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="adminWalletAddress"
                type="text"
                readonly
                :class="[
                  'flex-1 px-4 py-3 rounded-lg font-mono text-sm border focus:outline-none',
                  createForm.wallet_network === 'BEP20'
                    ? adminWalletAddress
                      ? 'bg-white text-gray-900 border-amber-500/30'
                      : 'bg-white text-gray-900 border-amber-500/30 focus:border-amber-500'
                    : createForm.wallet_network === 'ERC20'
                    ? adminWalletAddress
                      ? 'bg-white text-gray-900 border-blue-500/30'
                      : 'bg-white text-gray-900 border-blue-500/30 focus:border-blue-500'
                    : 'bg-white text-gray-900 border-gray-500/30'
                ]"
                :placeholder="adminWalletAddress ? 'Wallet admin dari database' : 'Pilih network untuk load wallet admin'"
              />
              <button
                v-if="adminWalletAddress"
                type="button"
                @click="copyWalletAddress(adminWalletAddress)"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  createForm.wallet_network === 'BEP20'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : createForm.wallet_network === 'ERC20'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                ]"
                title="Copy wallet address"
              >
                <Icon name="clipboard-document" size="sm" />
              </button>
              <button
                v-if="createForm.wallet_network && (createForm.wallet_network === 'BEP20' || createForm.wallet_network === 'ERC20')"
                type="button"
                @click="loadRandomWalletAdmin"
                :disabled="isLoadingWallet"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  createForm.wallet_network === 'BEP20'
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
            <p v-else-if="createForm.wallet_network && (createForm.wallet_network === 'BEP20' || createForm.wallet_network === 'ERC20')" class="text-xs text-amber-600 mt-2">
              ⏳ Memuat wallet admin dari database...
            </p>
            <p v-else-if="createForm.wallet_network" class="text-xs text-gray-500 mt-2">
              Wallet admin auto-fill hanya tersedia untuk BEP20 dan ERC20.
            </p>
            <p v-else class="text-xs text-gray-500 mt-2">
              Pilih network (BEP20 atau ERC20) untuk memuat wallet admin dari database.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member Wallet Address (To Wallet) *</label>
            <input
              v-model="createForm.wallet_address"
              type="text"
              required
              placeholder="Masukkan wallet address member tujuan"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
            />
          </div>

          <!-- Coin Preview (if withdraw_type = coin) -->
          <div 
            v-if="createForm.withdraw_type === 'coin' && createForm.amount && selectedMemberInfo && selectedMemberInfo.coinPrice > 0" 
            class="p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">Jumlah Coin yang akan ditarik:</p>
                <p class="text-2xl font-bold text-blue-600">
                  {{ formatNumber(coinPreview) }} <span class="text-base text-gray-600">Coin</span>
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
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600">Harga Coin:</span>
                <span class="font-medium">{{ formatCurrency(selectedMemberInfo.coinPrice) }} USDT/Coin</span>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              v-model="createForm.notes"
              rows="3"
              placeholder="Catatan tambahan (opsional)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            ></textarea>
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
            <h3 class="text-xl font-semibold text-gray-800">Edit Withdraw</h3>
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Withdraw Type</label>
              <select
                v-model="editForm.withdraw_type"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              >
                <option value="balance">Balance</option>
                <option value="coin">Coin</option>
                <option value="bonus_aktif">Bonus Aktif</option>
                <option value="bonus_pasif">Bonus Pasif</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Amount (USDT) *</label>
              <input
                v-model="editForm.amount"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Network *</label>
              <select
                v-model="editForm.wallet_network"
                @change="onEditNetworkChange"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              >
                <option value="BEP20">BEP20</option>
                <option value="ERC20">ERC20</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Wallet Model</label>
              <input
                v-model="editForm.wallet_model"
                type="text"
                readonly
                placeholder="Akan terisi otomatis berdasarkan network"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-gray-700">
              Admin Wallet Address (From Wallet) *
              <span 
                :class="[
                  'ml-2 px-2 py-0.5 text-xs font-semibold rounded',
                  editForm.wallet_network === 'BEP20' 
                    ? 'bg-amber-500/20 text-amber-700 border border-amber-500/30' 
                    : editForm.wallet_network === 'ERC20'
                    ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                    : 'bg-gray-500/20 text-gray-700 border border-gray-500/30'
                ]"
              >
                {{ editForm.wallet_network }}
              </span>
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="editAdminWalletAddress"
                type="text"
                readonly
                :class="[
                  'flex-1 px-4 py-3 rounded-lg font-mono text-sm border focus:outline-none',
                  editForm.wallet_network === 'BEP20'
                    ? editAdminWalletAddress
                      ? 'bg-white text-gray-900 border-amber-500/30'
                      : 'bg-white text-gray-900 border-amber-500/30 focus:border-amber-500'
                    : editForm.wallet_network === 'ERC20'
                    ? editAdminWalletAddress
                      ? 'bg-white text-gray-900 border-blue-500/30'
                      : 'bg-white text-gray-900 border-blue-500/30 focus:border-blue-500'
                    : 'bg-white text-gray-900 border-gray-500/30'
                ]"
                :placeholder="editAdminWalletAddress ? 'Wallet admin dari database' : 'Pilih network untuk load wallet admin'"
              />
              <button
                v-if="editAdminWalletAddress"
                type="button"
                @click="copyWalletAddress(editAdminWalletAddress)"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  editForm.wallet_network === 'BEP20'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : editForm.wallet_network === 'ERC20'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                ]"
                title="Copy wallet address"
              >
                <Icon name="clipboard-document" size="sm" />
              </button>
              <button
                v-if="editForm.wallet_network && (editForm.wallet_network === 'BEP20' || editForm.wallet_network === 'ERC20')"
                type="button"
                @click="loadRandomEditWalletAdmin"
                :disabled="isLoadingEditWallet"
                :class="[
                  'px-3 py-3 font-semibold rounded-lg transition',
                  editForm.wallet_network === 'BEP20'
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
            <p v-else-if="editForm.wallet_network && (editForm.wallet_network === 'BEP20' || editForm.wallet_network === 'ERC20')" class="text-xs text-amber-600 mt-2">
              ⏳ Memuat wallet admin dari database...
            </p>
            <p v-else-if="editForm.wallet_network" class="text-xs text-gray-500 mt-2">
              Wallet admin auto-fill hanya tersedia untuk BEP20 dan ERC20.
            </p>
            <p v-else class="text-xs text-gray-500 mt-2">
              Pilih network (BEP20 atau ERC20) untuk memuat wallet admin dari database.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member Wallet Address (To Wallet) *</label>
            <input
              v-model="editForm.wallet_address"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Transaction Hash</label>
            <input
              v-model="editForm.hash"
              type="text"
              placeholder="Masukkan transaction hash setelah transfer"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
            />
            <p class="text-xs text-gray-500 mt-1">Isi transaction hash setelah admin melakukan transfer</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              v-model="editForm.notes"
              rows="3"
              placeholder="Catatan tambahan (opsional)"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            ></textarea>
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
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Hapus Withdraw</h3>
          <p class="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus withdraw dengan amount <strong>{{ formatCurrency(withdrawToDelete?.amount) }} USDT</strong>? 
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
const withdraws = ref([])
const selectedStatus = ref('')
const selectedWithdrawType = ref('')
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
const withdrawToDelete = ref(null)
const members = ref([])
const coinSettings = ref(null)
const selectedMemberInfo = ref(null)
const coinPreview = ref(0)
const adminWalletAddress = ref('')
const isLoadingWallet = ref(false)
const editAdminWalletAddress = ref('')
const isLoadingEditWallet = ref(false)

// Forms
const createForm = ref({
  member_id: '',
  withdraw_type: 'balance',
  amount: '',
  wallet_address: '',
  wallet_network: 'BEP20',
  wallet_model: '',
  notes: '',
  status: 'pending'
})

const editForm = ref({
  id: '',
  member_id: '',
  member_email: '',
  withdraw_type: 'balance',
  amount: '',
  wallet_address: '',
  wallet_network: 'BEP20',
  wallet_model: '',
  hash: '',
  notes: '',
  status: 'pending'
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Fetch withdraws
const fetchWithdraws = async () => {
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
    if (selectedWithdrawType.value) {
      params.withdraw_type = selectedWithdrawType.value
    }
    if (searchQuery.value && searchQuery.value.trim()) {
      params.search = searchQuery.value.trim()
    }

    console.log('Fetching withdraws with params:', params)
    const response = await $fetch('/api/admin/withdraws', {
      params
    })

    console.log('Withdraws API Response:', response)

    if (response && response.success) {
      withdraws.value = response.data || []
      totalCount.value = response.count || 0
      console.log('Withdraws loaded:', withdraws.value.length, 'items')
      console.log('Total count:', totalCount.value)
      
      if (withdraws.value.length === 0 && totalCount.value === 0) {
        errorMessage.value = 'Belum ada data withdraw.'
      }
    } else {
      errorMessage.value = response?.message || 'Gagal memuat data withdraw'
      withdraws.value = []
      totalCount.value = 0
    }
  } catch (error) {
    console.error('Failed to fetch withdraws:', error)
    console.error('Error details:', {
      message: error?.message,
      data: error?.data,
      statusCode: error?.statusCode
    })
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data withdraw. Silakan coba lagi.'
    withdraws.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// Format currency
const formatCurrency = (value) => {
  try {
    if (value === null || value === undefined || value === '') return '0.00'
    if (value === 0) return '0.00'
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(numValue)) return '0.00'
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue)
  } catch (error) {
    console.error('Error formatting currency:', error)
    return '0.00'
  }
}

// Format number
const formatNumber = (value) => {
  try {
    if (value === null || value === undefined || value === '') return '0.00'
    if (value === 0) return '0.00'
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(numValue)) return '0.00'
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(numValue)
  } catch (error) {
    console.error('Error formatting number:', error)
    return '0.00'
  }
}

// Format withdraw type
const formatWithdrawType = (type) => {
  const types = {
    balance: 'Balance',
    coin: 'Coin',
    bonus_aktif: 'Bonus Aktif',
    bonus_pasif: 'Bonus Pasif'
  }
  return types[type] || type
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
    alert('Berhasil di-copy!')
  } catch (error) {
    console.error('Failed to copy hash:', error)
    alert('Gagal copy')
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
    fetchWithdraws()
  }
}

const goToFirstPage = () => {
  offset.value = 0
  fetchWithdraws()
}

const goToLastPage = () => {
  offset.value = (totalPages.value - 1) * limit.value
  fetchWithdraws()
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    offset.value += limit.value
    fetchWithdraws()
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    offset.value = Math.max(0, offset.value - limit.value)
    fetchWithdraws()
  }
}

const handleLimitChange = () => {
  offset.value = 0
  fetchWithdraws()
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
    fetchWithdraws()
  }, 500)
}

// Watch status change
watch(selectedStatus, () => {
  offset.value = 0
  fetchWithdraws()
})

// Watch withdraw type change
watch(selectedWithdrawType, () => {
  offset.value = 0
  fetchWithdraws()
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

// Calculate coin amount based on withdraw amount and member type
const calculateCoinAmount = (withdraw) => {
  try {
    if (!withdraw || !withdraw.amount) return 0
    
    // Only calculate for coin withdraw type
    if (withdraw.withdraw_type !== 'coin') return 0
    
    if (!withdraw.members || !coinSettings.value) return 0
    
    const memberType = withdraw.members?.member_type || 'normal'
    const pricePerCoin = getCoinPriceByMemberType(memberType)
    
    if (pricePerCoin > 0) {
      const amount = parseFloat(withdraw.amount) || 0
      return amount / pricePerCoin
    }
    return 0
  } catch (error) {
    console.error('Error calculating coin amount:', error)
    return 0
  }
}

// Handle member change
const onMemberChange = () => {
  if (!createForm.value.member_id) {
    selectedMemberInfo.value = null
    coinPreview.value = 0
    return
  }
  
  const member = members.value.find(m => m.id === createForm.value.member_id)
  if (member) {
    const coinPrice = getCoinPriceByMemberType(member.member_type)
    selectedMemberInfo.value = {
      ...member,
      coinPrice
    }
    calculateCoinPreview()
  } else {
    selectedMemberInfo.value = null
    coinPreview.value = 0
  }
}

// Calculate coin preview
const calculateCoinPreview = () => {
  if (
    createForm.value.withdraw_type === 'coin' &&
    createForm.value.amount &&
    selectedMemberInfo.value &&
    selectedMemberInfo.value.coinPrice > 0
  ) {
    const amount = parseFloat(createForm.value.amount) || 0
    coinPreview.value = amount / selectedMemberInfo.value.coinPrice
  } else {
    coinPreview.value = 0
  }
}

// Load wallet address based on network
const loadWalletAddressByNetwork = async (network) => {
  if (!network || (network !== 'BEP20' && network !== 'ERC20')) {
    adminWalletAddress.value = ''
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
    } else {
      adminWalletAddress.value = ''
    }
  } catch (error) {
    console.error('Failed to load wallet address:', error)
    adminWalletAddress.value = ''
  } finally {
    isLoadingWallet.value = false
  }
}

// Load random wallet admin from database (for refresh button)
const loadRandomWalletAdmin = async () => {
  const network = createForm.value.wallet_network || 'BEP20'
  await loadWalletAddressByNetwork(network)
}

// Load wallet address for edit form
const loadEditWalletAddressByNetwork = async (network) => {
  if (!network || (network !== 'BEP20' && network !== 'ERC20')) {
    editAdminWalletAddress.value = ''
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
    } else {
      editAdminWalletAddress.value = ''
    }
  } catch (error) {
    console.error('Failed to load wallet address:', error)
    editAdminWalletAddress.value = ''
  } finally {
    isLoadingEditWallet.value = false
  }
}

// Load random wallet admin for edit form
const loadRandomEditWalletAdmin = async () => {
  const network = editForm.value.wallet_network || 'BEP20'
  await loadEditWalletAddressByNetwork(network)
}

// Handle network change in edit form
const onEditNetworkChange = () => {
  editAdminWalletAddress.value = ''
  // Auto-fill wallet_model based on network
  if (editForm.value.wallet_network === 'BEP20') {
    editForm.value.wallet_model = 'USDT_BEP20'
  } else if (editForm.value.wallet_network === 'ERC20') {
    editForm.value.wallet_model = 'USDT_ERC20'
  } else {
    editForm.value.wallet_model = ''
  }
  
  if (editForm.value.wallet_network && (editForm.value.wallet_network === 'BEP20' || editForm.value.wallet_network === 'ERC20')) {
    loadEditWalletAddressByNetwork(editForm.value.wallet_network)
  }
}

// Handle network change
const onNetworkChange = () => {
  adminWalletAddress.value = ''
  // Auto-fill wallet_model based on network
  if (createForm.value.wallet_network === 'BEP20') {
    createForm.value.wallet_model = 'USDT_BEP20'
  } else if (createForm.value.wallet_network === 'ERC20') {
    createForm.value.wallet_model = 'USDT_ERC20'
  } else {
    createForm.value.wallet_model = ''
  }
  
  if (createForm.value.wallet_network && (createForm.value.wallet_network === 'BEP20' || createForm.value.wallet_network === 'ERC20')) {
    loadWalletAddressByNetwork(createForm.value.wallet_network)
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

watch(() => createForm.value.withdraw_type, () => {
  calculateCoinPreview()
})

// Create Modal
const openCreateModal = () => {
  createForm.value = {
    member_id: '',
    withdraw_type: 'balance',
    amount: '',
    wallet_address: '',
    wallet_network: 'BEP20',
    wallet_model: 'USDT_BEP20',
    notes: '',
    status: 'pending'
  }
  createError.value = ''
  selectedMemberInfo.value = null
  coinPreview.value = 0
  adminWalletAddress.value = ''
  showCreateModal.value = true
  // Load wallet admin when modal opens if network is already set
  if (createForm.value.wallet_network && (createForm.value.wallet_network === 'BEP20' || createForm.value.wallet_network === 'ERC20')) {
    loadWalletAddressByNetwork(createForm.value.wallet_network)
  }
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.value = {
    member_id: '',
    withdraw_type: 'balance',
    amount: '',
    wallet_address: '',
    wallet_network: 'BEP20',
    wallet_model: 'USDT_BEP20',
    notes: '',
    status: 'pending'
  }
  createError.value = ''
  selectedMemberInfo.value = null
  coinPreview.value = 0
  adminWalletAddress.value = ''
}

const handleCreate = async () => {
  isCreating.value = true
  createError.value = ''

  try {
    const response = await $fetch('/api/admin/withdraws', {
      method: 'POST',
      body: {
        member_id: createForm.value.member_id,
        withdraw_type: createForm.value.withdraw_type,
        amount: createForm.value.amount,
        wallet_address: createForm.value.wallet_address,
        wallet_network: createForm.value.wallet_network,
        wallet_model: createForm.value.wallet_model || undefined,
        admin_wallet_address: adminWalletAddress.value || undefined,
        notes: createForm.value.notes || undefined,
        status: createForm.value.status
      }
    })

    if (response.success) {
      closeCreateModal()
      await fetchWithdraws()
    } else {
      createError.value = response.message || 'Gagal membuat withdraw'
    }
  } catch (error) {
    console.error('Error creating withdraw:', error)
    createError.value = error?.data?.message || error?.message || 'Gagal membuat withdraw'
  } finally {
    isCreating.value = false
  }
}

// Edit Modal
const openEditModal = (withdraw) => {
  const network = withdraw.wallet_network || 'BEP20'
  // Auto-fill wallet_model based on network
  let walletModel = withdraw.wallet_model || ''
  if (!walletModel) {
    if (network === 'BEP20') {
      walletModel = 'USDT_BEP20'
    } else if (network === 'ERC20') {
      walletModel = 'USDT_ERC20'
    }
  }
  
  editForm.value = {
    id: withdraw.id,
    member_id: withdraw.member_id,
    member_email: withdraw.members?.email || 'N/A',
    withdraw_type: withdraw.withdraw_type || 'balance',
    amount: withdraw.amount?.toString() || '',
    wallet_address: withdraw.wallet_address || '',
    wallet_network: network,
    wallet_model: walletModel,
    hash: withdraw.hash || '',
    notes: withdraw.notes || '',
    status: withdraw.status || 'pending'
  }
  updateError.value = ''
  // Pre-fill admin_wallet_address if it exists, otherwise load from database
  editAdminWalletAddress.value = withdraw.admin_wallet_address || ''
  showEditModal.value = true
  // Load wallet admin when modal opens if network is BEP20 or ERC20 and no existing admin wallet
  if (!editAdminWalletAddress.value && editForm.value.wallet_network && (editForm.value.wallet_network === 'BEP20' || editForm.value.wallet_network === 'ERC20')) {
    loadEditWalletAddressByNetwork(editForm.value.wallet_network)
  }
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = {
    id: '',
    member_id: '',
    member_email: '',
    withdraw_type: 'balance',
    amount: '',
    wallet_address: '',
    wallet_network: 'BEP20',
    wallet_model: 'USDT_BEP20',
    hash: '',
    notes: '',
    status: 'pending'
  }
  updateError.value = ''
  editAdminWalletAddress.value = ''
}

const handleUpdate = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    const response = await $fetch(`/api/admin/withdraws/${editForm.value.id}`, {
      method: 'PUT',
      body: {
        withdraw_type: editForm.value.withdraw_type,
        amount: editForm.value.amount,
        wallet_address: editForm.value.wallet_address,
        wallet_network: editForm.value.wallet_network,
        wallet_model: editForm.value.wallet_model || undefined,
        admin_wallet_address: editAdminWalletAddress.value || undefined,
        hash: editForm.value.hash || undefined,
        notes: editForm.value.notes || undefined,
        status: editForm.value.status
      }
    })

    if (response.success) {
      closeEditModal()
      await fetchWithdraws()
    } else {
      updateError.value = response.message || 'Gagal mengupdate withdraw'
    }
  } catch (error) {
    console.error('Error updating withdraw:', error)
    updateError.value = error?.data?.message || error?.message || 'Gagal mengupdate withdraw'
  } finally {
    isUpdating.value = false
  }
}

// Delete Modal
const confirmDelete = (withdraw) => {
  withdrawToDelete.value = withdraw
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  withdrawToDelete.value = null
  deleteError.value = ''
}

const handleDelete = async () => {
  if (!withdrawToDelete.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    const response = await $fetch(`/api/admin/withdraws/${withdrawToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      closeDeleteModal()
      await fetchWithdraws()
    } else {
      deleteError.value = response.message || 'Gagal menghapus withdraw'
    }
  } catch (error) {
    console.error('Error deleting withdraw:', error)
    deleteError.value = error?.data?.message || error?.message || 'Gagal menghapus withdraw'
  } finally {
    isDeleting.value = false
  }
}

// Fetch on mount
onMounted(() => {
  fetchWithdraws()
  fetchMembers()
  fetchCoinSettings()
})
</script>

