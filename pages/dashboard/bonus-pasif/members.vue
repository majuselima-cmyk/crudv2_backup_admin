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
            <h1 class="text-2xl font-bold text-purple-600">Member List - Bonus Pasif</h1>
            <p class="text-sm text-gray-500 mt-1">Lihat data member dan status staking</p>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Loading State -->
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span class="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm mb-4">
          <div class="flex items-start gap-3">
            <Icon name="alert-circle" size="md" class="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-red-700 font-medium">{{ errorMessage }}</p>
              <button
                @click="fetchData"
                class="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                Coba lagi
              </button>
            </div>
          </div>
        </div>

        <template v-if="!loading">
          <!-- Info Box -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div class="flex items-start gap-3">
              <Icon name="info" size="md" class="text-blue-600 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-semibold text-blue-800 mb-1">💡 Info Reward</p>
                <p class="text-xs text-blue-700">
                  Member akan mendapat reward <strong>hanya jika staking statusnya "Aktif"</strong>. 
                  Reward dihitung otomatis setiap interval dan ditambahkan ke reward history. 
                  Jika staking di-unstake, reward akan berhenti diberikan.
                </p>
              </div>
            </div>
          </div>

          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Member</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ membersList.length }}</p>
                </div>
                <div class="p-3 bg-blue-100 rounded-lg">
                  <Icon name="user" size="md" class="text-blue-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Aktif Staking</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.membersWithActiveStaking }}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-lg">
                  <Icon name="check-circle" size="md" class="text-green-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Coin Staking</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatNumber(stats.totalCoinStaking) }}</p>
                </div>
                <div class="p-3 bg-yellow-100 rounded-lg">
                  <Icon name="coin" size="md" class="text-yellow-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Coin Balance</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatNumber(stats.totalCoinBalance) }}</p>
                </div>
                <div class="p-3 bg-purple-100 rounded-lg">
                  <Icon name="wallet" size="md" class="text-purple-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Reward</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCoinAmountWithCode(stats.totalReward) }}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-lg">
                  <Icon name="star" size="md" class="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <!-- Filter Section -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div class="flex-1 w-full sm:w-auto">
                <label class="block text-sm font-medium text-gray-700 mb-2">Cari Member</label>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Username atau email..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div class="flex-1 w-full sm:w-auto">
                <label class="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
                <select
                  v-model="statusFilter"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif Staking</option>
                  <option value="none">Belum Staking</option>
                </select>
              </div>
              <div class="flex items-end gap-2">
                <button
                  @click="clearFilters"
                  class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          </div>

          <!-- Members Table -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-gray-800">Daftar Member ({{ filteredMembersList.length }})</h2>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-600">Items per page:</label>
                    <select
                      v-model="itemsPerPage"
                      @change="currentPage = 1"
                      class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option :value="10">10</option>
                      <option :value="25">25</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <!-- Members Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Balance Coin</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sudah Staking</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belum Staking</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reward</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Staking</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="filteredMembersList.length === 0">
                    <td colspan="8" class="px-6 py-12 text-center text-sm text-gray-500">
                      Tidak ada data member
                    </td>
                  </tr>
                  <tr
                    v-for="member in paginatedMembersList"
                    :key="member.id"
                    class="hover:bg-gray-50 transition-colors"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div class="font-medium text-gray-900">{{ member.username || 'N/A' }}</div>
                        <div class="text-gray-500 text-xs">{{ member.email || '' }}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        :class="[
                          'px-2 py-1 text-xs font-semibold rounded',
                          member.member_type === 'vip'
                            ? 'bg-purple-100 text-purple-800'
                            : member.member_type === 'leader'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        ]"
                      >
                        {{ formatMemberType(member.member_type || 'normal') }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                      {{ formatCoinAmountWithCode(getTotalCoinBalance(member)) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {{ formatCoinAmountWithCode(getStakedAmount(member.id)) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                      {{ formatCoinAmountWithCode(getUnstakedAmount(member)) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      {{ formatCoinAmountWithCode(getTotalRewardEarned(member.id)) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div v-if="getMemberStakingStatus(member.id) === 'active'" class="flex flex-col gap-1">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span class="text-green-600 font-medium">Running</span>
                        </div>
                        <span class="text-xs text-green-600">✓ Mendapat reward</span>
                      </div>
                      <div v-else class="text-gray-400 text-xs">Belum Staking</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        v-if="getMemberStakingStatus(member.id) === 'active'"
                        disabled
                        class="px-3 py-1.5 text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed text-sm font-medium"
                      >
                        Sudah Staking
                      </button>
                      <button
                        v-else
                        @click="selectMemberForStaking(member)"
                        class="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                      >
                        Staking
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
              
              <!-- Pagination -->
              <div v-if="filteredMembersList.length > 0" class="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div class="text-sm text-gray-600">
                  Menampilkan {{ paginationStart + 1 }} - {{ Math.min(paginationEnd, filteredMembersList.length) }} dari {{ filteredMembersList.length }} member
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="previousPage"
                    :disabled="currentPage === 1"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <div class="flex items-center gap-1">
                    <template v-for="page in visiblePages" :key="page">
                      <button
                        v-if="page !== '...'"
                        @click="currentPage = page"
                        :class="[
                          'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                          page === currentPage
                            ? 'bg-purple-600 text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        ]"
                      >
                        {{ page }}
                      </button>
                      <span
                        v-else
                        class="px-2 text-sm text-gray-500"
                      >
                        ...
                      </span>
                    </template>
                  </div>
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
          </div>
        </template>
      </main>
    </div>
  </div>

  <!-- Create Staking Modal -->
  <div
    v-if="showCreateStakingModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeCreateStakingModal"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4">
      <div class="p-6 border-b border-gray-200">
        <h3 class="text-xl font-semibold text-gray-800">Staking Baru</h3>
      </div>
      <form @submit.prevent="createStaking" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Member</label>
          <input
            :value="selectedMemberForStaking?.username || ''"
            type="text"
            disabled
            class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah Koin</label>
          <div v-if="selectedMemberCoins" class="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span class="text-gray-500 block">Total:</span>
                <p class="font-semibold text-gray-900 truncate" :title="formatCoinAmount(selectedMemberCoins.total_coins)">{{ formatCoinAmount(selectedMemberCoins.total_coins) }}</p>
              </div>
              <div>
                <span class="text-gray-500 block">Staked:</span>
                <p class="font-semibold text-blue-600 truncate" :title="formatCoinAmount(selectedMemberCoins.staked_coins)">{{ formatCoinAmount(selectedMemberCoins.staked_coins) }}</p>
              </div>
              <div>
                <span class="text-gray-500 block">Available:</span>
                <p class="font-semibold text-green-600 truncate" :title="formatCoinAmount(selectedMemberCoins.available_coins)">{{ formatCoinAmount(selectedMemberCoins.available_coins) }}</p>
              </div>
            </div>
          </div>
          <input
            v-model="stakingForm.coin_amount"
            type="number"
            step="0.00000001"
            min="0"
            required
            :max="selectedMemberCoins ? selectedMemberCoins.available_coins : undefined"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="0.00000000"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Reward % (default: {{ defaultRewardPercentage }}%)</label>
          <input
            v-model="stakingForm.reward_percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Durasi Staking (Menit)
            <span class="text-xs text-gray-500">(Default: {{ defaultStakingDurationMinutes }} menit)</span>
          </label>
          <div class="mb-2 p-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
            💡 Default: {{ defaultStakingDurationMinutes }} menit ({{ formatDuration(defaultStakingDurationMinutes) }})
          </div>
          <input
            v-model="stakingForm.duration_minutes"
            type="number"
            step="1"
            min="1"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            :placeholder="defaultStakingDurationMinutes.toString()"
          />
          <p class="mt-1 text-xs text-gray-500">
            Durasi minimal: 1 menit. Untuk production, gunakan minimal 43,200 menit (1 bulan).
          </p>
        </div>
        <div class="flex gap-3 pt-4">
          <button
            type="button"
            @click="closeCreateStakingModal"
            class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="creatingStaking || !isStakingFormValid"
            class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {{ creatingStaking ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Success Toast -->
  <div v-if="successMessage" class="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
    <div class="flex items-center gap-2">
      <Icon name="check-circle" size="md" class="text-green-600" />
      <p class="text-sm text-green-600">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const isMobileMenuOpen = ref(false)
const loading = ref(true)
const membersList = ref([])
const stakingList = ref([])
const rewardSchedulesList = ref([]) // Data reward schedules dari database
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(25)
const showCreateStakingModal = ref(false)
const creatingStaking = ref(false)
const selectedMemberForStaking = ref(null)
const selectedMemberCoins = ref(null)
const defaultRewardPercentage = ref(0.5)
const defaultStakingDurationMinutes = ref(43200) // 1 month default
const coinSettings = ref({ coin_code: '' })
const coinCode = ref('')

const stakingForm = ref({
  member_id: '',
  coin_amount: '',
  reward_percentage: '',
  duration_minutes: ''
})

const stats = ref({
  membersWithActiveStaking: 0,
  totalCoinStaking: 0,
  totalCoinBalance: 0,
  totalReward: 0
})

const filteredMembersList = computed(() => {
  let filtered = membersList.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(m => 
      (m.username && m.username.toLowerCase().includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query))
    )
  }

  // Filter by status
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(m => getMemberStakingStatus(m.id) === 'active')
  } else if (statusFilter.value === 'none') {
    filtered = filtered.filter(m => getMemberStakingStatus(m.id) === 'none')
  }

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredMembersList.value.length / itemsPerPage.value))
const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const paginationEnd = computed(() => paginationStart.value + itemsPerPage.value)
const paginatedMembersList = computed(() => filteredMembersList.value.slice(paginationStart.value, paginationEnd.value))

const isStakingFormValid = computed(() => {
  if (!stakingForm.value.member_id || !selectedMemberCoins.value) return false
  const coinAmount = parseFloat(stakingForm.value.coin_amount)
  if (!coinAmount || coinAmount <= 0) return false
  
  // Validate against available coins (Total - Staked)
  const available = selectedMemberCoins.value.available_coins !== undefined 
    ? parseFloat(selectedMemberCoins.value.available_coins)
    : (parseFloat(selectedMemberCoins.value.total_coins || 0) - parseFloat(selectedMemberCoins.value.staked_coins || 0))
    
  if (coinAmount > available) return false
  return true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const fetchData = async () => {
  try {
    loading.value = true
    await Promise.all([
      $fetch('/api/admin/members', { params: { limit: 1000 } }).then(r => {
        if (r.success) membersList.value = r.data || []
      }),
      $fetch('/api/admin/staking').then(r => {
        if (r.success) stakingList.value = r.data || []
      }),
      fetchRewardSchedules(),
      $fetch('/api/admin/bonus').then(r => {
        if (r.success && r.data) {
          defaultRewardPercentage.value = parseFloat(r.data.reward_percentage) || 0.5
          defaultStakingDurationMinutes.value = parseInt(r.data.default_staking_duration_minutes) || 43200
          coinCode.value = r.data.coin_code || r.data.coin_name || ''
        }
      }),
      $fetch('/api/admin/coin').then(r => {
        if (r.success && r.data) {
          coinSettings.value = { coin_code: r.data.coin_code || '' }
          // Update coinCode jika belum ada dari bonus settings
          if (!coinCode.value && r.data.coin_code) {
            coinCode.value = r.data.coin_code
          }
        }
      })
    ])
    // Panggil calculateStats setelah semua data ter-fetch
    calculateStats()
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal memuat data'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  const withActiveStaking = membersList.value.filter(m => getMemberStakingStatus(m.id) === 'active')
  stats.value.membersWithActiveStaking = withActiveStaking.length
  stats.value.totalCoinStaking = stakingList.value
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (parseFloat(s.coin_amount) || 0), 0)
  stats.value.totalCoinBalance = membersList.value.reduce((sum, m) => sum + getTotalCoinBalance(m), 0)
  // Hitung total reward dari reward_schedules yang statusnya "paid"
  stats.value.totalReward = rewardSchedulesList.value
    .filter(rs => rs.status === 'paid')
    .reduce((sum, rs) => sum + (parseFloat(rs.reward_amount) || 0), 0)
}

const getTotalCoinBalance = (member) => parseFloat(member.total_coin_balance || member.coin_balance || 0)

const getStakedAmount = (memberId) => {
  const activeStakings = stakingList.value.filter(s => s.member_id === memberId && s.status === 'active')
  return activeStakings.reduce((sum, s) => sum + (parseFloat(s.coin_amount) || 0), 0)
}

const getUnstakedAmount = (member) => Math.max(0, getTotalCoinBalance(member) - getStakedAmount(member.id))

const getMemberStakingStatus = (memberId) => {
  const staking = stakingList.value.find(s => s.member_id === memberId && s.status === 'active')
  return staking?.status || 'none'
}

const getTotalRewardEarned = (memberId) => {
  // Hitung total reward dari reward_schedules yang statusnya "paid"
  const memberStakings = stakingList.value.filter(s => s.member_id === memberId)
  const stakingIds = memberStakings.map(s => s.id)
  
  // Hitung total dari reward_schedules yang statusnya paid
  const paidRewards = rewardSchedulesList.value.filter(rs => 
    rs.staking_id && stakingIds.includes(rs.staking_id) && rs.status === 'paid'
  )
  
  const totalFromRewardSchedules = paidRewards.reduce((sum, rs) => {
    const amount = parseFloat(rs.reward_amount) || 0
    return sum + amount
  }, 0)
  
  // Jika ada reward schedules dengan status paid, gunakan itu
  if (paidRewards.length > 0) {
    return totalFromRewardSchedules
  }
  
  // Fallback: gunakan total_reward_earned dari staking
  if (memberStakings.length > 0) {
    const fallbackTotal = memberStakings.reduce((sum, s) => sum + (parseFloat(s.total_reward_earned) || 0), 0)
    return fallbackTotal
  }
  
  return 0
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  currentPage.value = 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const selectMemberForStaking = async (member) => {
  selectedMemberForStaking.value = member
  stakingForm.value = {
    member_id: member.id,
    coin_amount: '',
    reward_percentage: '',
    duration_minutes: defaultStakingDurationMinutes.value
  }
  await fetchMemberCoins(member.id)
  showCreateStakingModal.value = true
}

const fetchMemberCoins = async (memberId) => {
  try {
    selectedMemberCoins.value = null
    console.log('[Frontend] Fetching member coins for:', memberId)
    
    const response = await $fetch(`/api/admin/member-coins/${memberId}`)
    console.log('[Frontend] Member coins response:', response)

    if (response.success && response.data) {
      selectedMemberCoins.value = response.data
      
      // Hitung available coins (Total - Staked)
      // Gunakan available_coins dari API jika ada, atau hitung manual
      const available = response.data.available_coins !== undefined 
        ? parseFloat(response.data.available_coins) 
        : (parseFloat(response.data.total_coins || 0) - parseFloat(response.data.staked_coins || 0))
      
      console.log('[Frontend] Auto-filling coin amount:', available)
      stakingForm.value.coin_amount = available > 0 ? available : ''
    }
  } catch (error) {
    console.error('Error fetching coin data:', error)
  }
}

const closeCreateStakingModal = () => {
  showCreateStakingModal.value = false
  selectedMemberForStaking.value = null
  selectedMemberCoins.value = null
  stakingForm.value = { member_id: '', coin_amount: '', reward_percentage: '', duration_minutes: defaultStakingDurationMinutes.value }
}

const createStaking = async () => {
  try {
    if (!isStakingFormValid.value) {
      errorMessage.value = 'Form tidak valid'
      return
    }
    creatingStaking.value = true
    const body = {
      member_id: stakingForm.value.member_id,
      coin_amount: parseFloat(stakingForm.value.coin_amount),
      reward_percentage: stakingForm.value.reward_percentage ? parseFloat(stakingForm.value.reward_percentage) : defaultRewardPercentage.value,
      duration_minutes: stakingForm.value.duration_minutes ? parseInt(stakingForm.value.duration_minutes) : defaultStakingDurationMinutes.value
    }
    const response = await $fetch('/api/admin/staking', { method: 'POST', body })
    if (response.success) {
      successMessage.value = 'Staking berhasil dibuat'
      setTimeout(() => successMessage.value = '', 5000)
      closeCreateStakingModal()
      await fetchData()
    }
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal membuat staking'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    creatingStaking.value = false
  }
}

const formatNumber = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numValue)
}

const formatCoinAmount = (amount) => {
  if (!amount) return '0'
  const num = parseFloat(amount)
  return isNaN(num) ? '0' : num.toFixed(8).replace(/\.?0+$/, '')
}

// Format coin amount dengan kode koin dari database
const formatCoinAmountWithCode = (amount) => {
  const formatted = formatCoinAmount(amount)
  // Prioritaskan coin_code dari coin_settings, fallback ke coinCode dari bonus settings
  const code = coinSettings.value?.coin_code || coinCode.value || ''
  return code ? `${formatted} ${code}` : formatted
}

const formatMemberType = (type) => {
  const types = { normal: 'Normal', leader: 'Leader', vip: 'VIP' }
  return types[type] || type || 'Normal'
}

// Visible pages for pagination UI
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
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

// Format duration
const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const mins = parseInt(minutes)
  if (isNaN(mins)) return '-'
  
  // Convert to months (1 month = 30 days = 43200 minutes)
  const months = mins / 43200
  if (months >= 1) {
    const wholeMonths = Math.floor(months)
    const remainingDays = Math.floor((months - wholeMonths) * 30)
    if (remainingDays > 0) {
      return `${wholeMonths} bulan ${remainingDays} hari`
    }
    return `${wholeMonths} bulan`
  }
  
  // Convert to days (1 day = 1440 minutes)
  const days = mins / 1440
  if (days >= 1) {
    const wholeDays = Math.floor(days)
    const remainingHours = Math.floor((days - wholeDays) * 24)
    if (remainingHours > 0) {
      return `${wholeDays} hari ${remainingHours} jam`
    }
    return `${wholeDays} hari`
  }
  
  // Convert to hours (1 hour = 60 minutes)
  const hours = mins / 60
  if (hours >= 1) {
    const wholeHours = Math.floor(hours)
    const remainingMins = mins % 60
    if (remainingMins > 0) {
      return `${wholeHours} jam ${remainingMins} menit`
    }
    return `${wholeHours} jam`
  }
  
  return `${mins} menit`
}

// Auto-refresh reward history untuk update realtime
let rewardSchedulesRefreshInterval = null

const fetchRewardSchedules = async () => {
  try {
    const response = await $fetch('/api/admin/reward-schedules')
    if (response.success) {
      rewardSchedulesList.value = response.data || []
    }
  } catch (error) {
    // Handle 404 - endpoint belum tersedia, gunakan fallback
    if (error?.statusCode === 404 || error?.status === 404) {
      console.log('[Members] Reward schedules endpoint belum tersedia')
      rewardSchedulesList.value = []
      return
    }
    console.error('[Members] Error fetching reward schedules:', error)
    rewardSchedulesList.value = []
  }
}

const refreshRewardSchedules = async () => {
  try {
    await fetchRewardSchedules()
    calculateStats()
  } catch (error) {
    // Silent fail untuk auto-refresh
    console.log('[Members] Error refreshing reward schedules:', error)
  }
}

onMounted(() => {
  fetchData()
  
  // Auto-refresh reward schedules setiap 10 detik untuk update realtime
  rewardSchedulesRefreshInterval = setInterval(() => {
    refreshRewardSchedules()
  }, 10000) // 10 detik
})

onBeforeUnmount(() => {
  if (rewardSchedulesRefreshInterval) {
    clearInterval(rewardSchedulesRefreshInterval)
  }
})
</script>
