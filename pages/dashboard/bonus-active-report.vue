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
            Report Bonus Aktif
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
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Total Balance Semua Member</p>
                  <p class="text-2xl font-bold text-green-600 mt-1">
                    {{ formatCurrency(summary.total_balance || 0) }} USDT
                  </p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <Icon name="currency-dollar" size="lg" class="text-green-600" />
                </div>
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Total Bonus Aktif</p>
                  <p class="text-2xl font-bold text-blue-600 mt-1">
                    {{ formatCurrency(summary.total_bonus || 0) }} USDT
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    Referral ({{ bonusPercentages.referral_percentage }}%): {{ formatCurrency(summary.total_referral_bonus || 0) }} | 
                    Matching L1 ({{ bonusPercentages.matching_level1_percentage }}%): {{ formatCurrency(summary.total_matching_level1 || 0) }} | 
                    L2 ({{ bonusPercentages.matching_level2_percentage }}%): {{ formatCurrency(summary.total_matching_level2 || 0) }} | 
                    L3 ({{ bonusPercentages.matching_level3_percentage }}%): {{ formatCurrency(summary.total_matching_level3 || 0) }}
                  </p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <Icon name="currency-dollar" size="lg" class="text-blue-600" />
                </div>
              </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Total Member</p>
                  <p class="text-2xl font-bold text-purple-600 mt-1">
                    {{ summary.total_members || 0 }}
                  </p>
                  <p class="text-xs text-gray-500 mt-1">
                    Semua member
                  </p>
                </div>
                <div class="p-3 bg-purple-100 rounded-full">
                  <Icon name="users" size="lg" class="text-purple-600" />
                </div>
              </div>
            </div>
          </div>


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
                  placeholder="Cari member (email, username, jenis member)..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <!-- Member Type Filter -->
              <select
                v-model="selectedMemberType"
                @change="handleFilterChange"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="">Semua Jenis Member</option>
                <option value="normal">Normal</option>
                <option value="leader">Leader</option>
                <option value="vip">VIP</option>
              </select>
              <!-- Bonus Filter -->
              <select
                v-model="selectedBonusFilter"
                @change="handleFilterChange"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="">Semua Member</option>
                <option value="with_bonus">Dengan Bonus</option>
                <option value="without_bonus">Tanpa Bonus</option>
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

          <!-- Bonus Report Table -->
          <div v-if="!errorMessage" class="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-800">
                Daftar Semua Member ({{ filteredBonusList.length }})
              </h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Member</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Depo (Completed)</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total WD (Pending/Completed)</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Balance USDT</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Balance Coin</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Downline Deposit</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Referral</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Level 1</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Level 2</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Level 3</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bonus Aktif</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="bonusList.length === 0" class="hover:bg-gray-50">
                    <td colspan="14" class="px-6 py-12 text-center text-sm text-gray-500">
                      Belum ada data member
                    </td>
                  </tr>
                  <tr v-else-if="filteredBonusList.length === 0" class="hover:bg-gray-50">
                    <td colspan="14" class="px-6 py-12 text-center text-sm text-gray-500">
                      {{ searchQuery || selectedMemberType || selectedBonusFilter ? 'Tidak ada data member yang sesuai dengan filter' : 'Tidak ada data untuk halaman ini' }}
                    </td>
                  </tr>
                  <tr
                    v-for="memberBonus in paginatedBonusList"
                    :key="memberBonus.member_id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div class="font-medium text-gray-900">{{ memberBonus.member?.username || 'N/A' }}</div>
                        <div class="text-gray-500 text-xs">{{ memberBonus.member?.email || '' }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        :class="[
                          'px-2 py-1 text-xs font-semibold rounded',
                          memberBonus.member?.member_type === 'vip'
                            ? 'bg-purple-100 text-purple-800'
                            : memberBonus.member?.member_type === 'leader'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        ]"
                      >
                        {{ formatMemberType(memberBonus.member?.member_type || 'normal') }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-semibold">
                      {{ formatCurrency(memberBonus.total_deposit || 0) }} USDT
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-amber-700 font-semibold">
                      {{ formatCurrency(memberBonus.total_withdraw || 0) }} USDT
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {{ formatCurrency(memberBonus.total_balance || 0) }} USDT
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                      {{ formatNumber(memberBonus.total_coin_balance || 0) }} Coin
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {{ formatCurrency(memberBonus.total_downline_deposit || 0) }} USDT
                      <span class="text-gray-500 text-xs ml-1">({{ memberBonus.total_downline_count || 0 }} member)</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                      {{ formatCurrency(memberBonus.total_bonus || 0) }} USDT
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                      <div class="flex flex-col">
                        <span>{{ formatCurrency(memberBonus.total_matching_level1 || 0) }} USDT</span>
                        <span class="text-xs text-gray-500 font-normal">({{ bonusPercentages.matching_level1_percentage }}%)</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-amber-600 font-semibold">
                      <div class="flex flex-col">
                        <span>{{ formatCurrency(memberBonus.total_matching_level2 || 0) }} USDT</span>
                        <span class="text-xs text-gray-500 font-normal">({{ bonusPercentages.matching_level2_percentage }}%)</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">
                      <div class="flex flex-col">
                        <span>{{ formatCurrency(memberBonus.total_matching_level3 || 0) }} USDT</span>
                        <span class="text-xs text-gray-500 font-normal">({{ bonusPercentages.matching_level3_percentage }}%)</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-bold">
                      {{ formatCurrency((memberBonus.total_bonus || 0) + (memberBonus.total_matching_level1 || 0) + (memberBonus.total_matching_level2 || 0) + (memberBonus.total_matching_level3 || 0)) }} USDT
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        v-if="(memberBonus.total_bonus || 0) + (memberBonus.total_matching_level1 || 0) + (memberBonus.total_matching_level2 || 0) + (memberBonus.total_matching_level3 || 0) > 0"
                        @click="toggleMemberDetail(memberBonus.member_id)"
                        class="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {{ expandedMembers.has(memberBonus.member_id) ? 'Sembunyikan' : 'Lihat' }}
                      </button>
                      <span v-else class="text-gray-400 text-xs">-</span>
                    </td>
                  </tr>
                  <!-- Expanded Detail Row -->
                  <tr
                    v-for="memberBonus in paginatedBonusList.filter(mb => expandedMembers.has(mb.member_id) && ((mb.total_bonus || 0) + (mb.total_matching_level1 || 0) + (mb.total_matching_level2 || 0) + (mb.total_matching_level3 || 0) > 0))"
                    :key="`detail-${memberBonus.member_id}`"
                    class="bg-blue-50"
                  >
                    <td colspan="14" class="px-6 py-4">
                      <div class="space-y-3">
                        <p class="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                          <span class="w-1 h-4 bg-blue-600 rounded"></span>
                          Detail Transaksi Bonus Aktif Referral:
                        </p>
                        <div v-if="memberBonus.transactions && memberBonus.transactions.length > 0" class="space-y-2">
                          <div
                            v-for="(transaction, idx) in memberBonus.transactions"
                            :key="transaction.id"
                            :class="[
                              'flex items-center justify-between text-xs p-3 rounded-lg border-2 shadow-sm',
                              idx % 2 === 0 
                                ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' 
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                            ]"
                          >
                            <div class="flex items-center gap-4 flex-wrap">
                              <span class="px-2 py-1 bg-blue-600 text-white font-bold rounded">#{{ idx + 1 }}</span>
                              <span class="px-2 py-1 bg-gray-100 text-gray-700 font-medium rounded">{{ formatDate(transaction.created_at) }}</span>
                              <span v-if="transaction.downline_deposit_amount" class="px-3 py-1 bg-orange-100 text-orange-800 font-semibold rounded border border-orange-300">
                                <span v-if="transaction.downline_member" class="font-bold">
                                  {{ transaction.downline_member.username || transaction.downline_member.email }}
                                </span>
                                deposit <span class="font-bold">{{ formatCurrency(transaction.downline_deposit_amount) }} USDT</span>
                              </span>
                              <span class="px-3 py-1 bg-green-100 text-green-800 font-bold rounded border border-green-300">
                                +{{ formatCurrency(transaction.bonus_balance) }} USDT (80%)
                              </span>
                              <span class="px-3 py-1 bg-blue-100 text-blue-800 font-bold rounded border border-blue-300">
                                +{{ formatNumber(transaction.bonus_coin) }} Coin (20%)
                              </span>
                              <span 
                                :class="[
                                  'px-3 py-1 font-bold rounded border-2',
                                  transaction.bonus_type === 'referral'
                                    ? 'bg-purple-200 text-purple-900 border-purple-400'
                                    : transaction.level === 1
                                    ? 'bg-orange-200 text-orange-900 border-orange-400'
                                    : transaction.level === 2
                                    ? 'bg-amber-200 text-amber-900 border-amber-400'
                                    : 'bg-yellow-200 text-yellow-900 border-yellow-400'
                                ]"
                              >
                                <span v-if="transaction.bonus_type === 'referral'">
                                  Referral ({{ bonusPercentages.referral_percentage }}%): {{ formatCurrency(transaction.total_bonus) }} USDT
                                </span>
                                <span v-else>
                                  Matching L{{ transaction.level }} ({{ transaction.level === 1 ? bonusPercentages.matching_level1_percentage : transaction.level === 2 ? bonusPercentages.matching_level2_percentage : bonusPercentages.matching_level3_percentage }}%): {{ formatCurrency(transaction.total_bonus) }} USDT
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-xs text-gray-500 italic bg-yellow-50 p-3 rounded border border-yellow-200">
                          Tidak ada detail transaksi
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="bonusList.length > 0" class="px-6 py-4 border-t border-gray-200">
              <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                <!-- Info & Items Per Page -->
                <div class="flex flex-col sm:flex-row items-center gap-4">
                  <div class="text-sm text-gray-700">
                    Menampilkan <span class="font-semibold">{{ paginationStart + 1 }}</span> - 
                    <span class="font-semibold">{{ Math.min(paginationEnd, filteredBonusList.length) }}</span> dari 
                    <span class="font-semibold">{{ filteredBonusList.length }}</span> member
                    <span v-if="filteredBonusList.length !== bonusList.length" class="text-gray-500">
                      (dari total {{ bonusList.length }} member)
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-700">Items per page:</label>
                    <select
                      v-model="itemsPerPage"
                      @change="goToPage(1)"
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
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const isMobileMenuOpen = ref(false)
const loading = ref(true)
const errorMessage = ref('')
const bonusList = ref([])
const summary = ref({ total_bonus: 0, total_members: 0, total_balance: 0 })
const bonusPercentages = ref({
  referral_percentage: 15,
  matching_level1_percentage: 10,
  matching_level2_percentage: 5,
  matching_level3_percentage: 2
})
const expandedMembers = ref(new Set())

// Search and Filters
const searchQuery = ref('')
const searchTimeout = ref(null)
const selectedMemberType = ref('')
const selectedBonusFilter = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(25)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Toggle member detail
const toggleMemberDetail = (memberId) => {
  const newSet = new Set(expandedMembers.value)
  if (newSet.has(memberId)) {
    newSet.delete(memberId)
  } else {
    newSet.add(memberId)
  }
  expandedMembers.value = newSet
}

// Fetch bonus report
const fetchBonusReport = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/admin/bonus-active-report')
    
    if (response.success) {
      bonusList.value = response.data || []
      summary.value = response.summary || { total_bonus: 0, total_members: 0 }
      bonusPercentages.value = response.bonus_percentages || {
        referral_percentage: 15,
        matching_level1_percentage: 10,
        matching_level2_percentage: 5,
        matching_level3_percentage: 2
      }
      // Reset to first page when new data is loaded
      currentPage.value = 1
    } else {
      errorMessage.value = response.message || 'Gagal memuat data bonus'
    }
  } catch (error) {
    console.error('Error fetching bonus report:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data bonus'
  } finally {
    loading.value = false
  }
}


// Format functions
const formatCurrency = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

const formatNumber = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

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

const formatMemberType = (type) => {
  const types = {
    normal: 'Normal',
    leader: 'Leader',
    vip: 'VIP'
  }
  return types[type] || type || 'Normal'
}

// Filter computed properties
const filteredBonusList = computed(() => {
  let filtered = bonusList.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(memberBonus => {
      const member = memberBonus.member
      const username = (member?.username || '').toLowerCase()
      const email = (member?.email || '').toLowerCase()
      const memberType = formatMemberType(member?.member_type || '').toLowerCase()
      
      return username.includes(query) || 
             email.includes(query) || 
             memberType.includes(query)
    })
  }

  // Filter by member type
  if (selectedMemberType.value) {
    filtered = filtered.filter(memberBonus => {
      return memberBonus.member?.member_type === selectedMemberType.value
    })
  }

  // Filter by bonus
  if (selectedBonusFilter.value === 'with_bonus') {
    filtered = filtered.filter(memberBonus => memberBonus.total_bonus > 0)
  } else if (selectedBonusFilter.value === 'without_bonus') {
    filtered = filtered.filter(memberBonus => memberBonus.total_bonus === 0)
  }

  return filtered
})

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredBonusList.value.length / itemsPerPage.value)
})

const paginationStart = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const paginationEnd = computed(() => {
  return paginationStart.value + itemsPerPage.value
})

const paginatedBonusList = computed(() => {
  return filteredBonusList.value.slice(paginationStart.value, paginationEnd.value)
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

// Search and Filter functions
const handleSearch = () => {
  // Clear existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  
  // Reset to first page when searching
  currentPage.value = 1
  
  // Debounce search - wait 300ms after user stops typing
  searchTimeout.value = setTimeout(() => {
    // Filter is handled by computed property, no need to do anything here
  }, 300)
}

const handleFilterChange = () => {
  // Reset to first page when filter changes
  currentPage.value = 1
}

// Pagination functions
const goToPage = (page) => {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const goToFirstPage = () => {
  currentPage.value = 1
}

const goToLastPage = () => {
  currentPage.value = totalPages.value
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Load data on mount
onMounted(() => {
  fetchBonusReport()
})
</script>

