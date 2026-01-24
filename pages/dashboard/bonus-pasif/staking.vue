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
            <h1 class="text-2xl font-bold text-blue-600">Staking Management</h1>
            <p class="text-sm text-gray-500 mt-1">Kelola staking dan member</p>
          </div>
          <button
            @click="openCreateStakingModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Staking Baru
          </button>
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

        <!-- Info Box -->
        <div v-if="!loading" class="space-y-3 mb-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon name="info" size="md" class="text-blue-600 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-semibold text-blue-800 mb-1">💡 Info Reward</p>
                <p class="text-xs text-blue-700">
                  Reward hanya diberikan untuk staking dengan status <strong>"Aktif"</strong>. 
                  Setiap interval ({{ defaultRewardPercentage }}% dari coin staking), reward akan otomatis dihitung dan ditambahkan ke reward schedule dengan status "Pending".
                  Jika staking di-unstake, reward akan berhenti diberikan.
                </p>
              </div>
            </div>
          </div>
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <Icon name="clock" size="md" class="text-yellow-600 flex-shrink-0 mt-0.5" />
              <div class="flex-1">
                <p class="text-sm font-semibold text-yellow-800 mb-1">⏰ Info Timezone</p>
                <p class="text-xs text-yellow-700">
                  <strong>Waktu staking disimpan dalam UTC (Coordinated Universal Time)</strong>. 
                  Di tabel, waktu ditampilkan dalam format UTC dan WIB (Waktu Indonesia Barat, UTC+7) untuk kemudahan membaca. 
                  Saat membuat staking baru, waktu akan otomatis disimpan dalam UTC.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Total Staking Aktif</p>
                <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.totalActiveStaking }}</p>
                <p class="text-xs text-green-600 mt-1">Mendapat reward</p>
              </div>
              <div class="p-3 bg-green-100 rounded-lg">
                <Icon name="check-circle" size="md" class="text-green-600" />
              </div>
            </div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Total Koin Staking</p>
                <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCoinAmount(stats.totalStakedCoins) }}</p>
              </div>
              <div class="p-3 bg-blue-100 rounded-lg">
                <Icon name="coin" size="md" class="text-blue-600" />
              </div>
            </div>
          </div>
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500">Total Reward Earned</p>
                <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCoinAmountWithCode(stats.totalReward) }}</p>
              </div>
              <div class="p-3 bg-yellow-100 rounded-lg">
                <Icon name="star" size="md" class="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <template v-if="!loading">
          <!-- Staking List -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-semibold text-gray-800">Daftar Staking ({{ stakingList.length }})</h2>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-600">Items per page:</label>
                    <select
                      v-model="itemsPerPageStaking"
                      @change="currentPageStaking = 1"
                      class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option :value="10">10</option>
                      <option :value="25">25</option>
                      <option :value="50">50</option>
                      <option :value="100">100</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <!-- Staking Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Koin</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward %</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reward</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mulai<br/><span class="text-xs text-gray-400">(UTC & WIB)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Selesai<br/><span class="text-xs text-gray-400">(UTC & WIB)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="stakingList.length === 0">
                      <td colspan="9" class="px-6 py-12 text-center text-sm text-gray-500">
                        Belum ada data staking
                      </td>
                    </tr>
                    <template v-for="staking in paginatedStakingList" :key="staking?.id">
                      <tr
                        class="hover:bg-gray-50 transition-colors"
                      >
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <div class="flex items-center gap-2">
                              <span class="font-medium text-gray-900">{{ staking?.member?.username || 'N/A' }}</span>
                              <span
                                :class="[
                                  'px-2 py-1 text-xs font-semibold rounded',
                                  staking?.member?.member_type === 'vip'
                                    ? 'bg-purple-100 text-purple-800'
                                    : staking?.member?.member_type === 'leader'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                ]"
                              >
                                {{ formatMemberType(staking?.member?.member_type || 'normal') }}
                              </span>
                            </div>
                            <div class="text-gray-500 text-xs mt-1">{{ staking?.member?.email || '' }}</div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                          {{ formatCoinAmountWithCode(staking?.coin_amount) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          {{ staking?.reward_percentage }}%
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                          {{ formatDuration(staking?.duration_minutes) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {{ formatCoinAmountWithCode(staking?.total_reward_paid || 0) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <div class="flex flex-col gap-1">
                            <span
                              :class="[
                                'px-2 py-1 text-xs font-semibold rounded',
                                staking?.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : staking?.status === 'unstaked'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              ]"
                            >
                              {{ formatStatus(staking?.status) }}
                            </span>
                            <span v-if="staking?.status === 'active'" class="text-xs text-green-600 font-medium">
                              ✓ Mendapat reward
                            </span>
                            <span v-else class="text-xs text-gray-400">
                              ✗ Tidak mendapat reward
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div class="flex flex-col gap-1">
                            <div>
                              <span class="text-xs text-gray-500 font-medium">UTC:</span>
                              <span class="font-medium ml-1">{{ formatDateTimeUTC(staking?.staked_at) }}</span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 font-medium">WIB:</span>
                              <span class="font-medium ml-1 text-blue-600">{{ formatDateTimeWIB(staking?.staked_at) }}</span>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <div class="flex flex-col gap-1">
                            <div>
                              <span class="text-xs text-gray-500 font-medium">UTC:</span>
                              <span class="font-medium text-green-700 ml-1">{{ formatDateTimeUTC(calculateStakingEndDate(staking)) }}</span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 font-medium">WIB:</span>
                              <span class="font-medium text-green-600 ml-1">{{ formatDateTimeWIB(calculateStakingEndDate(staking)) }}</span>
                            </div>
                            <span v-if="staking?.status === 'active'" class="text-xs text-orange-600 mt-1">
                              {{ getRemainingTime(staking) }}
                            </span>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                          <div class="flex items-center gap-2">
                            <button
                              v-if="staking?.id"
                              @click="toggleStakingSchedule(staking.id)"
                              class="px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                              title="Lihat Jadwal Reward"
                            >
                              {{ expandedStakingRows.has(staking.id) ? '▼ Sembunyikan' : '▶ Jadwal' }}
                            </button>
                            <button
                              v-if="staking?.status === 'active'"
                              @click="confirmUnstake(staking)"
                              class="px-3 py-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
                            >
                              Unstake
                            </button>
                            <button
                              v-if="parseFloat(staking?.total_reward_paid || 0) > 0"
                              @click="confirmResetReward(staking)"
                              :disabled="resettingReward"
                              class="px-3 py-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reset Reward ke 0"
                            >
                              Reset Reward
                            </button>
                            <button
                              @click="confirmDeleteStaking(staking)"
                              :disabled="deletingStaking"
                              class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus Staking"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                      <!-- Expanded Row: Reward Schedule -->
                      <tr v-if="staking?.id && expandedStakingRows.has(staking.id)">
                        <td colspan="9" class="px-6 py-4 bg-gray-50">
                          <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <h4 class="text-sm font-semibold text-gray-800 mb-3">📅 Jadwal Reward dari Database</h4>
                            <div v-if="getRewardSchedulesForStaking(staking.id).length === 0" class="text-sm text-gray-500 text-center py-4">
                              Belum ada jadwal reward untuk staking ini
                            </div>
                            <div v-else class="space-y-3">
                              <div class="bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto border border-gray-200">
                                <div class="space-y-1">
                                  <div
                                    v-for="(schedule, index) in getRewardSchedulesForStaking(staking.id)"
                                    :key="schedule.id || index"
                                    :class="[
                                      'text-xs p-2 rounded flex items-center justify-between',
                                      schedule.status === 'paid'
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                                    ]"
                                  >
                                    <div class="flex flex-col gap-1 flex-1 flex-wrap">
                                      <div class="flex items-center gap-2 flex-wrap">
                                        <span class="font-semibold text-gray-700 min-w-[25px]">{{ index + 1 }}.</span>
                                        <span
                                          :class="[
                                            'text-xs px-2 py-0.5 rounded font-medium flex items-center gap-1',
                                            schedule.status === 'paid' 
                                              ? 'bg-green-100 text-green-800 border border-green-300' 
                                              : 'bg-orange-100 text-orange-800 border border-orange-300'
                                          ]"
                                        >
                                          <Icon 
                                            v-if="schedule.status === 'paid'" 
                                            name="check-circle" 
                                            size="xs" 
                                            class="text-green-600" 
                                          />
                                          {{ formatScheduleStatus(schedule.status || 'pending') }}
                                        </span>
                                      </div>
                                      <div class="ml-7 flex items-center gap-2 flex-wrap">
                                        <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-medium">
                                          UTC: {{ formatDateTimeUTCCompact(schedule.scheduled_time) }}
                                        </span>
                                        <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                          WIB: {{ formatDateTimeWIBCompact(schedule.scheduled_time) }}
                                        </span>
                                      </div>
                                    </div>
                                    <span class="text-green-600 font-semibold ml-2 min-w-[60px] text-right">
                                      {{ formatCoinAmountWithCode(schedule.reward_amount) }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
              
              <!-- Pagination -->
              <div v-if="stakingList.length > 0" class="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div class="text-sm text-gray-600">
                  Menampilkan {{ paginationStartStaking + 1 }} - {{ Math.min(paginationEndStaking, stakingList.length) }} dari {{ stakingList.length }} staking
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="previousPageStaking"
                    :disabled="currentPageStaking === 1"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:bg-gray-100 disabled:text-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                  <div class="flex items-center gap-1">
                    <template v-for="page in visiblePages" :key="page">
                      <button
                        v-if="page !== '...'"
                        @click="currentPageStaking = page"
                        :class="[
                          'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                          page === currentPageStaking
                            ? 'bg-blue-600 text-white'
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
                    @click="nextPageStaking"
                    :disabled="currentPageStaking === totalPagesStaking"
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
            <label class="block text-sm font-medium text-gray-700 mb-2">Pilih Member</label>
            <MemberSelect
              v-model="stakingForm.member_id"
              :members="membersList"
              placeholder="Cari member..."
              @select="onMemberSelected"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah Koin</label>
            <div v-if="selectedMemberCoins" class="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-gray-500">Total:</span>
                  <p class="font-semibold text-gray-900">{{ formatCoinAmount(selectedMemberCoins.total_coins) }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Staked:</span>
                  <p class="font-semibold text-blue-600">{{ formatCoinAmount(selectedMemberCoins.staked_coins) }}</p>
                </div>
              </div>
            </div>
            <input
              v-model="stakingForm.coin_amount"
              type="number"
              step="0.00000001"
              min="0"
              required
              :max="selectedMemberCoins ? selectedMemberCoins.total_coins : undefined"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Durasi Staking (Menit)
              <span class="text-xs text-gray-500">(Minimal 1 bulan = 43,200 menit)</span>
            </label>
            <div class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              💡 Default: {{ defaultStakingDurationMinutes }} menit ({{ formatDuration(defaultStakingDurationMinutes) }})
            </div>
            <input
              v-model="stakingForm.duration_minutes"
              type="number"
              step="1"
              :min="43200"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="43200"
            />
            <p class="mt-1 text-xs text-gray-500">
              Durasi minimal: 1 bulan (43,200 menit). Untuk testing bisa pakai 10 menit.
            </p>
          </div>
          
          <!-- Preview Tanggal dan Waktu -->
          <div v-if="stakingForm.duration_minutes" class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p class="text-sm font-semibold text-blue-800 mb-3">📅 Informasi Staking (Waktu disimpan dalam UTC)</p>
            <div class="grid grid-cols-1 gap-3 text-sm">
              <div>
                <span class="text-gray-600 font-medium">Tanggal & Waktu Mulai:</span>
                <div class="mt-1 space-y-1">
                  <div>
                    <span class="text-xs text-gray-500">UTC:</span>
                    <span class="font-semibold text-gray-900 ml-1">{{ formatDateTimeUTC(new Date()) }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500">WIB:</span>
                    <span class="font-semibold text-blue-600 ml-1">{{ formatDateTimeWIB(new Date()) }}</span>
                  </div>
                </div>
              </div>
              <div>
                <span class="text-gray-600 font-medium">Tanggal & Waktu Selesai:</span>
                <div class="mt-1 space-y-1">
                  <div>
                    <span class="text-xs text-gray-500">UTC:</span>
                    <span class="font-semibold text-green-700 ml-1">{{ formatDateTimeUTC(calculateEndDate(new Date(), parseInt(stakingForm.duration_minutes) || 0)) }}</span>
                  </div>
                  <div>
                    <span class="text-xs text-gray-500">WIB:</span>
                    <span class="font-semibold text-green-600 ml-1">{{ formatDateTimeWIB(calculateEndDate(new Date(), parseInt(stakingForm.duration_minutes) || 0)) }}</span>
                  </div>
                </div>
              </div>
              <div>
                <span class="text-gray-600">Durasi:</span>
                <p class="font-semibold text-purple-700">{{ formatDuration(parseInt(stakingForm.duration_minutes) || 0) }}</p>
              </div>
            </div>
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
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {{ creatingStaking ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Unstake Modal -->
    <div
      v-if="showUnstakeModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeUnstakeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Confirm Unstake</h3>
        </div>
        <div class="p-6 space-y-4">
          <div v-if="selectedStakingForUnstake" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p class="text-gray-600">Member</p>
                <p class="font-semibold">{{ selectedStakingForUnstake.member?.username }}</p>
              </div>
              <div>
                <p class="text-gray-600">Koin</p>
                <p class="font-semibold text-blue-600">{{ formatCoinAmount(selectedStakingForUnstake.coin_amount) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Total Reward</p>
                <p class="font-semibold text-green-600">{{ formatCoinAmount(selectedStakingForUnstake.total_reward_paid || 0) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Reward %</p>
                <p class="font-semibold">{{ selectedStakingForUnstake.reward_percentage }}%</p>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600">Apakah Anda yakin ingin unstake? Koin akan dikembalikan ke member.</p>
          <div class="flex gap-3">
            <button
              @click="handleUnstake"
              :disabled="unStaking"
              class="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
            >
              {{ unStaking ? 'Unstaking...' : 'Ya, Unstake' }}
            </button>
            <button
              @click="closeUnstakeModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Reward Modal -->
    <div
      v-if="showResetRewardModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeResetRewardModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Reset Reward</h3>
        </div>
        <div class="p-6 space-y-4">
          <div v-if="selectedStakingForReset" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-700 font-semibold mb-2">⚠️ Peringatan!</p>
            <p class="text-sm text-red-600 mb-3">
              Anda akan mereset total reward yang sudah dihitung untuk staking ini menjadi 0.
            </p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-gray-600">Member</p>
                <p class="font-semibold text-gray-900">{{ selectedStakingForReset.member?.username || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-gray-600">Koin Staking</p>
                <p class="font-semibold text-blue-600">{{ formatCoinAmount(selectedStakingForReset.coin_amount) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Total Reward Saat Ini</p>
                <p class="font-semibold text-green-600">{{ formatCoinAmount(selectedStakingForReset.total_reward_paid || 0) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Setelah Reset</p>
                <p class="font-semibold text-red-600">0</p>
              </div>
            </div>
            <p class="text-xs text-red-600 mt-3 pt-3 border-t border-red-200">
              ⚠️ Semua reward schedule yang terkait dengan staking ini akan dihapus dan total_reward_earned direset ke 0.
            </p>
          </div>
          <p class="text-sm text-gray-600">
            Apakah Anda yakin ingin mereset reward ini?
          </p>
          <div class="flex gap-3 pt-4">
            <button
              @click="closeResetRewardModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              @click="handleResetReward"
              :disabled="resettingReward"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ resettingReward ? 'Mereset...' : 'Ya, Reset' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Staking Modal -->
    <div
      v-if="showDeleteStakingModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDeleteStakingModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Hapus Staking</h3>
        </div>
        <div class="p-6 space-y-4">
          <div v-if="selectedStakingForDelete" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-700 font-semibold mb-2">⚠️ Peringatan!</p>
            <p class="text-sm text-red-600 mb-3">
              Anda akan menghapus staking ini beserta semua reward schedule yang terkait. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p class="text-gray-600">Member</p>
                <p class="font-semibold text-gray-900">{{ selectedStakingForDelete.member?.username || 'N/A' }}</p>
              </div>
              <div>
                <p class="text-gray-600">Koin Staking</p>
                <p class="font-semibold text-blue-600">{{ formatCoinAmount(selectedStakingForDelete.coin_amount) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Total Reward</p>
                <p class="font-semibold text-green-600">{{ formatCoinAmount(selectedStakingForDelete.total_reward_paid || 0) }}</p>
              </div>
              <div>
                <p class="text-gray-600">Status</p>
                <p class="font-semibold">{{ formatStatus(selectedStakingForDelete.status) }}</p>
              </div>
            </div>
            <p class="text-xs text-red-600 mt-3 pt-3 border-t border-red-200">
              ⚠️ Staking, reward schedule, dan coin akan dikembalikan ke available coins member (jika status aktif).
            </p>
          </div>
          <p class="text-sm text-gray-600">
            Apakah Anda yakin ingin menghapus staking ini?
          </p>
          <div class="flex gap-3 pt-4">
            <button
              @click="closeDeleteStakingModal"
              class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              @click="handleDeleteStaking"
              :disabled="deletingStaking"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ deletingStaking ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="successMessage" class="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
      <div class="flex items-center gap-2">
        <Icon name="check-circle" size="md" class="text-green-600" />
        <p class="text-sm text-green-600">{{ successMessage }}</p>
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
const stakingList = ref([])
const membersList = ref([])
const bonusSettings = ref({ reward_interval_minutes: 60, is_active: true, coin_code: '' })
const coinCode = ref('')
const coinSettings = ref({ coin_code: '' })
const errorMessage = ref('')
const successMessage = ref('')
const expandedStakingRows = ref(new Set())
const rewardSchedulesList = ref([]) // Data reward schedules dari database
const creatingStaking = ref(false)
const showCreateStakingModal = ref(false)
const showUnstakeModal = ref(false)
const unStaking = ref(false)
const selectedStakingForUnstake = ref(null)
const showResetRewardModal = ref(false)
const resettingReward = ref(false)
const selectedStakingForReset = ref(null)
const showDeleteStakingModal = ref(false)
const deletingStaking = ref(false)
const selectedStakingForDelete = ref(null)
const selectedMemberCoins = ref(null)
const defaultRewardPercentage = ref(0.5)
const defaultStakingDurationMinutes = ref(43200) // 1 month default
const currentPageStaking = ref(1)
const itemsPerPageStaking = ref(25)

const stats = ref({
  totalActiveStaking: 0,
  totalStakedCoins: 0,
  totalReward: 0
})

const stakingForm = ref({
  member_id: '',
  coin_amount: '',
  reward_percentage: '',
  duration_minutes: ''
})

const totalPagesStaking = computed(() => Math.ceil(stakingList.value.length / itemsPerPageStaking.value))
const paginationStartStaking = computed(() => (currentPageStaking.value - 1) * itemsPerPageStaking.value)
const paginationEndStaking = computed(() => paginationStartStaking.value + itemsPerPageStaking.value)
const paginatedStakingList = computed(() => stakingList.value.slice(paginationStartStaking.value, paginationEndStaking.value))


const isStakingFormValid = computed(() => {
  if (!stakingForm.value.member_id || !selectedMemberCoins.value) return false
  const coinAmount = parseFloat(stakingForm.value.coin_amount)
  if (!coinAmount || coinAmount <= 0) return false
  if (coinAmount > (selectedMemberCoins.value.total_coins || 0)) return false
  const durationMinutes = parseInt(stakingForm.value.duration_minutes) || defaultStakingDurationMinutes.value
  if (durationMinutes < 43200) return false // Minimum 1 month
  return true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const fetchData = async () => {
  try {
    loading.value = true
    // Auto-update schedule status dari pending ke paid jika waktu sudah melewati scheduled_time
    try {
      await $fetch('/api/admin/auto-update-schedule-status', { method: 'POST' }).catch(() => null)
    } catch (updateError) {
      // Silent fail - tidak perlu show error untuk auto-update
      console.log('[Staking] Auto-update schedule status on refresh:', updateError)
    }
    // Process pending rewards
    try {
      await $fetch('/api/admin/process-pending-rewards', { method: 'POST' }).catch(() => null)
    } catch (processError) {
      // Silent fail - tidak perlu show error untuk auto-process
      console.log('[Staking] Auto-process on refresh:', processError)
    }
    
    await Promise.all([
      $fetch('/api/admin/members', { params: { limit: 1000 } }).then(r => {
        if (r.success) membersList.value = r.data || []
      }),
      $fetch('/api/admin/staking').then(r => {
        if (r.success) {
          stakingList.value = r.data || []
          calculateStats()
          // Reset to page 1 if current page is invalid
          const totalPages = Math.ceil(stakingList.value.length / itemsPerPageStaking.value)
          if (currentPageStaking.value > totalPages && totalPages > 0) {
            currentPageStaking.value = 1
          }
        }
      }),
      $fetch('/api/admin/bonus').then(r => {
        if (r.success && r.data) {
          defaultRewardPercentage.value = parseFloat(r.data.reward_percentage) || 0.5
          defaultStakingDurationMinutes.value = parseInt(r.data.default_staking_duration_minutes) || 43200
          coinCode.value = r.data.coin_code || r.data.coin_name || ''
          bonusSettings.value = {
            reward_interval_minutes: parseInt(r.data.reward_interval_minutes) || 60,
            is_active: r.data.is_active !== false,
            coin_code: r.data.coin_code || r.data.coin_name || ''
          }
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
      }),
      fetchRewardSchedules()
    ])
    errorMessage.value = ''
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal memuat data'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  const activeStaking = stakingList.value.filter(s => s.status === 'active')
  stats.value.totalActiveStaking = activeStaking.length
  stats.value.totalStakedCoins = activeStaking.reduce((sum, s) => sum + (parseFloat(s.coin_amount) || 0), 0)
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

const openCreateStakingModal = () => {
  stakingForm.value = { 
    member_id: '', 
    coin_amount: '', 
    reward_percentage: '',
    duration_minutes: defaultStakingDurationMinutes.value
  }
  showCreateStakingModal.value = true
}

const closeCreateStakingModal = () => {
  showCreateStakingModal.value = false
  selectedMemberCoins.value = null
  stakingForm.value = { member_id: '', coin_amount: '', reward_percentage: '', duration_minutes: defaultStakingDurationMinutes.value }
}

const onMemberSelected = (member) => {
  fetchMemberCoins(member.id)
}

const fetchMemberCoins = async (memberId) => {
  try {
    selectedMemberCoins.value = null
    const response = await $fetch(`/api/admin/member-coins/${memberId}`)
    if (response.success && response.data) {
      selectedMemberCoins.value = response.data
      stakingForm.value.coin_amount = response.data.total_coins > 0 ? response.data.total_coins : ''
    }
  } catch (error) {
    console.error('Error fetching coin data:', error)
  }
}

const selectMemberForStaking = (member) => {
  stakingForm.value.member_id = member.id
  onMemberSelected(member)
  showCreateStakingModal.value = true
}

const createStaking = async () => {
  try {
    if (!isStakingFormValid.value) {
      errorMessage.value = 'Form tidak valid'
      return
    }
    creatingStaking.value = true
    // Pastikan waktu menggunakan UTC
    const now = new Date()
    const body = {
      member_id: stakingForm.value.member_id,
      coin_amount: parseFloat(stakingForm.value.coin_amount),
      reward_percentage: stakingForm.value.reward_percentage ? parseFloat(stakingForm.value.reward_percentage) : defaultRewardPercentage.value,
      duration_minutes: stakingForm.value.duration_minutes ? parseInt(stakingForm.value.duration_minutes) : defaultStakingDurationMinutes.value,
      // Waktu akan di-set di backend menggunakan UTC
      staked_at: now.toISOString() // Kirim dalam format ISO (UTC)
    }
    const response = await $fetch('/api/admin/staking', { method: 'POST', body })
    if (response.success) {
      successMessage.value = 'Staking berhasil dibuat (waktu disimpan dalam UTC)'
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

const confirmUnstake = (staking) => {
  selectedStakingForUnstake.value = staking
  showUnstakeModal.value = true
}

const closeUnstakeModal = () => {
  showUnstakeModal.value = false
  selectedStakingForUnstake.value = null
}

const handleUnstake = async () => {
  try {
    if (!selectedStakingForUnstake.value) return
    unStaking.value = true
    const response = await $fetch(`/api/admin/staking/${selectedStakingForUnstake.value.id}/unstake`, { method: 'PUT' })
    if (response.success) {
      successMessage.value = 'Unstaking berhasil'
      setTimeout(() => successMessage.value = '', 5000)
      closeUnstakeModal()
      await fetchData()
    }
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal unstaking'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    unStaking.value = false
  }
}

const confirmResetReward = (staking) => {
  selectedStakingForReset.value = staking
  showResetRewardModal.value = true
}

const closeResetRewardModal = () => {
  showResetRewardModal.value = false
  selectedStakingForReset.value = null
}

const handleResetReward = async () => {
  try {
    if (!selectedStakingForReset.value) {
      errorMessage.value = 'Data staking tidak ditemukan'
      setTimeout(() => errorMessage.value = '', 5000)
      closeResetRewardModal()
      return
    }
    
    resettingReward.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    const response = await $fetch(`/api/admin/staking/${selectedStakingForReset.value.id}/reset-reward`, {
      method: 'PUT'
    })
    
    if (response && response.success) {
      successMessage.value = 'Reward berhasil direset'
      setTimeout(() => successMessage.value = '', 5000)
      closeResetRewardModal()
      await fetchData()
    } else {
      errorMessage.value = response?.message || 'Gagal reset reward'
      setTimeout(() => errorMessage.value = '', 5000)
    }
  } catch (error) {
    console.error('[Staking] Error resetting reward:', error)
    const errorMsg = error?.data?.message || error?.message || 'Gagal reset reward. Silakan coba lagi.'
    errorMessage.value = errorMsg
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    resettingReward.value = false
  }
}

const confirmDeleteStaking = (staking) => {
  selectedStakingForDelete.value = staking
  showDeleteStakingModal.value = true
}

const closeDeleteStakingModal = () => {
  showDeleteStakingModal.value = false
  selectedStakingForDelete.value = null
}

const handleDeleteStaking = async () => {
  try {
    if (!selectedStakingForDelete.value) {
      errorMessage.value = 'Data staking tidak ditemukan'
      setTimeout(() => errorMessage.value = '', 5000)
      closeDeleteStakingModal()
      return
    }
    
    deletingStaking.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    const response = await $fetch(`/api/admin/staking/${selectedStakingForDelete.value.id}`, {
      method: 'DELETE'
    })
    
    if (response && response.success) {
      const deletedStakingId = selectedStakingForDelete.value.id
      successMessage.value = 'Staking dan reward schedule berhasil dihapus'
      setTimeout(() => successMessage.value = '', 5000)
      closeDeleteStakingModal()
      
      // Remove from expanded rows if it was expanded
      expandedStakingRows.value.delete(deletedStakingId)
      
      // Remove from stakingList immediately
      stakingList.value = stakingList.value.filter(s => s.id !== deletedStakingId)
      
      // Remove reward schedules for this staking
      rewardSchedulesList.value = rewardSchedulesList.value.filter(rs => rs.staking_id !== deletedStakingId)
      
      // Recalculate stats
      calculateStats()
      
      // Reset pagination if needed
      const totalPages = Math.ceil(stakingList.value.length / itemsPerPageStaking.value)
      if (currentPageStaking.value > totalPages && totalPages > 0) {
        currentPageStaking.value = 1
      }
      
      // Refresh all data to ensure consistency (background refresh)
      fetchData().catch(err => {
        console.error('[Staking] Error refreshing data after delete:', err)
      })
    } else {
      errorMessage.value = response?.message || 'Gagal menghapus staking'
      setTimeout(() => errorMessage.value = '', 5000)
    }
  } catch (error) {
    console.error('[Staking] Error deleting staking:', error)
    const errorMsg = error?.data?.message || error?.message || 'Gagal menghapus staking. Silakan coba lagi.'
    errorMessage.value = errorMsg
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    deletingStaking.value = false
  }
}

const nextPageStaking = () => {
  if (currentPageStaking.value < totalPagesStaking.value) currentPageStaking.value++
}

const previousPageStaking = () => {
  if (currentPageStaking.value > 1) currentPageStaking.value--
}

const visiblePages = computed(() => {
  const total = totalPagesStaking.value
  const current = currentPageStaking.value
  const pages = []
  
  if (total <= 7) {
    // Show all pages if 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Show first page, current page, and last page with ellipsis
    if (current <= 3) {
      // Near the start
      for (let i = 1; i <= 4; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 2) {
      // Near the end
      pages.push(1)
      pages.push('...')
      for (let i = total - 3; i <= total; i++) pages.push(i)
    } else {
      // In the middle
      pages.push(1)
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('id-ID', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

// Helper: Parse date string sebagai UTC (jika tidak ada timezone indicator)
const parseAsUTC = (date) => {
  if (!date) return null
  if (typeof date === 'string') {
    // Jika string tidak ada Z atau timezone, anggap sebagai UTC dan tambahkan Z
    if (!date.includes('Z') && !date.includes('+') && !date.includes('-', 10)) {
      // Format: "2026-01-23 03:45:42" atau "2026-01-23T03:45:42"
      const normalized = date.replace(' ', 'T') + 'Z'
      return new Date(normalized)
    }
  }
  return new Date(date)
}

// Format datetime UTC (waktu yang disimpan di database)
// Database menyimpan waktu dalam UTC, jadi kita baca langsung sebagai UTC
const formatDateTimeUTC = (date) => {
  if (!date) return '-'
  const d = parseAsUTC(date)
  // Gunakan getUTC* methods untuk membaca waktu UTC dari Date object
  const year = d.getUTCFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[d.getUTCMonth()]
  const day = d.getUTCDate().toString().padStart(2, '0')
  const hours = d.getUTCHours().toString().padStart(2, '0')
  const minutes = d.getUTCMinutes().toString().padStart(2, '0')
  const seconds = d.getUTCSeconds().toString().padStart(2, '0')
  // Return waktu UTC dari database: "23 Jan 2026, 03:45:42 UTC"
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} UTC`
}

// Format datetime UTC compact (untuk badge)
const formatDateTimeUTCCompact = (date) => {
  if (!date) return '-'
  const d = parseAsUTC(date)
  // Gunakan getUTC* methods untuk membaca waktu UTC dari Date object
  const year = d.getUTCFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[d.getUTCMonth()]
  const day = d.getUTCDate().toString().padStart(2, '0')
  const hours = d.getUTCHours().toString().padStart(2, '0')
  const minutes = d.getUTCMinutes().toString().padStart(2, '0')
  const seconds = d.getUTCSeconds().toString().padStart(2, '0')
  // Return waktu UTC dari database: "23 Jan 2026, 03:45:42"
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`
}

// Format datetime WIB (konversi dari UTC ke WIB, UTC+7)
const formatDateTimeWIB = (date) => {
  if (!date) return '-'
  const d = parseAsUTC(date)
  // Convert UTC to WIB (Asia/Jakarta, UTC+7)
  // Gunakan Intl.DateTimeFormat untuk konversi yang lebih akurat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(d)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const hours = parts.find(p => p.type === 'hour')?.value
  const minutes = parts.find(p => p.type === 'minute')?.value
  const seconds = parts.find(p => p.type === 'second')?.value
  
  // Format: "24 Jan 2026, 03:45:42 WIB"
  return `${day.padStart(2, '0')} ${month} ${year}, ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')} WIB`
}

// Format datetime WIB compact (untuk badge)
const formatDateTimeWIBCompact = (date) => {
  if (!date) return '-'
  const d = parseAsUTC(date)
  // Convert UTC to WIB (Asia/Jakarta, UTC+7)
  // Gunakan Intl.DateTimeFormat untuk konversi yang lebih akurat
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(d)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const hours = parts.find(p => p.type === 'hour')?.value
  const minutes = parts.find(p => p.type === 'minute')?.value
  const seconds = parts.find(p => p.type === 'second')?.value
  
  // Format: "24 Jan 2026, 03:45:42"
  return `${day.padStart(2, '0')} ${month} ${year}, ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
}

const formatDateOnly = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', { 
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  })
}

const formatDateTimePreview = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long'
  })
}

const formatDateTimeForSchedule = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  // Format: 24 Jan 2026, 04.00.38
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('id-ID', { month: 'short' })
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}.${minutes}.${seconds}`
}

const calculateEndDate = (startDate, durationMinutes) => {
  if (!startDate || !durationMinutes) return null
  return new Date(startDate.getTime() + durationMinutes * 60 * 1000)
}

const calculateStakingEndDate = (staking) => {
  if (!staking.staked_at || !staking.duration_minutes) return null
  const startDate = new Date(staking.staked_at)
  const durationMinutes = parseInt(staking.duration_minutes) || 0
  return new Date(startDate.getTime() + durationMinutes * 60 * 1000)
}

const getRemainingTime = (staking) => {
  if (!staking.staked_at || !staking.duration_minutes || staking.status !== 'active') return ''
  const endDate = calculateStakingEndDate(staking)
  if (!endDate) return ''
  
  const now = new Date()
  const diff = endDate.getTime() - now.getTime()
  
  if (diff <= 0) return 'Sudah selesai'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `Tersisa: ${days} hari ${hours} jam`
  } else if (hours > 0) {
    return `Tersisa: ${hours} jam ${minutes} menit`
  } else {
    return `Tersisa: ${minutes} menit`
  }
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

const formatNumber = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numValue)
}

const formatMemberType = (type) => {
  const types = { normal: 'Normal', leader: 'Leader', vip: 'VIP' }
  return types[type] || type || 'Normal'
}

const formatStatus = (status) => {
  const statusMap = { 
    active: 'Aktif', 
    unstaked: 'Unstaked', 
    cancelled: 'Dibatalkan',
    paid: 'Dibayar',
    pending: 'Pending',
    failed: 'Failed'
  }
  return statusMap[status] || status
}

// Format status untuk schedule (hanya Pending dan Paid)
const formatScheduleStatus = (status) => {
  const statusMap = { 
    paid: 'Dibayar',
    pending: 'Pending'
  }
  return statusMap[status] || 'Pending'
}

// Get schedule status dari database
// Status sudah diupdate otomatis oleh endpoint auto-update-schedule-status saat fetchData
const getScheduleStatus = (schedule) => {
  if (!schedule) return 'pending'
  
  // Gunakan status dari database
  // Jika status sudah paid, tetap paid
  if (schedule.status === 'paid') {
    return 'paid'
  }
  
  // Fallback: jika waktu sekarang melebihi scheduled_time tapi status masih pending di database
  // (ini hanya untuk display, database akan diupdate saat refresh berikutnya)
  const scheduledTime = new Date(schedule.scheduled_time)
  const now = new Date()
  
  if (now >= scheduledTime && schedule.status === 'pending') {
    // Tampilkan sebagai paid di UI, tapi database akan diupdate saat refresh
    return 'paid'
  }
  
  // Jika belum waktunya, tetap pending
  return 'pending'
}

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

// Toggle staking schedule row expansion
const toggleStakingSchedule = (stakingId) => {
  if (expandedStakingRows.value.has(stakingId)) {
    expandedStakingRows.value.delete(stakingId)
  } else {
    expandedStakingRows.value.add(stakingId)
    // Fetch reward schedules if not already loaded
    if (rewardSchedulesList.value.length === 0 || !rewardSchedulesList.value.some(rs => rs.staking_id === stakingId)) {
      fetchRewardSchedules()
    }
  }
}

// Fetch reward schedules from database
const fetchRewardSchedules = async () => {
  try {
    const response = await $fetch('/api/admin/reward-schedules')
    if (response.success) {
      rewardSchedulesList.value = response.data || []
    }
  } catch (error) {
    // Handle 404 - endpoint belum tersedia, gunakan fallback
    if (error?.statusCode === 404 || error?.status === 404) {
      console.log('[Staking] Reward schedules endpoint belum tersedia')
      rewardSchedulesList.value = []
      return
    }
    console.error('[Staking] Error fetching reward schedules:', error)
    rewardSchedulesList.value = []
  }
}

// Get reward schedules for a specific staking
const getRewardSchedulesForStaking = (stakingId) => {
  if (!stakingId) return []
  const schedules = rewardSchedulesList.value.filter(rs => rs.staking_id === stakingId)
  // Sort berdasarkan scheduled_time
  return schedules.sort((a, b) => {
    return new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
  })
}


// Auto-refresh intervals
let stakingRefreshInterval = null
let autoUpdateStatusInterval = null
let autoProcessPendingInterval = null

onMounted(() => {
  fetchData()
  
  // Auto-update schedule status saat pertama kali load
  setTimeout(async () => {
    try {
      // Update schedule status dari pending ke paid
      const updateResult = await $fetch('/api/admin/auto-update-schedule-status', {
        method: 'POST'
      }).catch(() => null)
      
      if (updateResult?.success && updateResult.updated > 0) {
        console.log(`[Staking] Auto-updated ${updateResult.updated} schedules to paid on mount`)
        // Refresh data setelah update
        await fetchData()
      }
    } catch (error) {
      console.log('[Staking] Error auto-updating schedule status on mount:', error)
    }
  }, 1000) // Delay 1 detik setelah mount
  
  // Auto-refresh staking data setiap 10 detik untuk update total_reward_earned
  stakingRefreshInterval = setInterval(async () => {
    try {
      // Refresh staking list untuk mendapatkan total_reward_earned terbaru
      const response = await $fetch('/api/admin/staking').catch(() => null)
      if (response?.success) {
        stakingList.value = response.data || []
        calculateStats()
      }
      
      // Refresh reward schedules untuk update status
      await fetchRewardSchedules().catch(() => null)
    } catch (error) {
      // Silent fail untuk auto-refresh
      console.log('[Staking] Auto-refresh error:', error)
    }
  }, 10000) // 10 detik
  
  // Auto-update schedule status setiap 30 detik (hanya update status)
  autoUpdateStatusInterval = setInterval(async () => {
    try {
      // Auto-update schedule status dari pending ke paid
      const updateResult = await $fetch('/api/admin/auto-update-schedule-status', {
        method: 'POST'
      }).catch(() => null) // Silent fail
      
      if (updateResult?.success && updateResult.updated > 0) {
        console.log(`[Staking] Auto-updated ${updateResult.updated} schedules to paid`)
        // Refresh reward schedules dan staking untuk update tampilan dan total reward
        await Promise.all([
          fetchRewardSchedules().catch(() => null),
          $fetch('/api/admin/staking').then(r => {
            if (r.success) {
              stakingList.value = r.data || []
              calculateStats()
            }
          }).catch(() => null)
        ])
      }
    } catch (error) {
      // Silent fail untuk auto-update
      console.log('[Staking] Auto-update schedule status error:', error)
    }
  }, 30000) // 30 detik
  
  // Auto-process pending rewards setiap 1 menit
  autoProcessPendingInterval = setInterval(async () => {
    try {
      // Process pending rewards
      const result = await $fetch('/api/admin/process-pending-rewards', {
        method: 'POST'
      }).catch(() => null) // Silent fail
      
      if (result?.success && result.processed > 0) {
        // Refresh data jika ada yang diproses (termasuk staking untuk update total_reward_earned)
        await Promise.all([
          $fetch('/api/admin/staking').then(r => {
            if (r.success) {
              stakingList.value = r.data || []
              calculateStats()
            }
          }).catch(() => null),
          fetchRewardSchedules().catch(() => null)
        ])
        console.log(`[Staking] Auto-processed ${result.processed} pending rewards`)
      }
    } catch (error) {
      // Silent fail untuk auto-process
      console.log('[Staking] Auto-process pending rewards error:', error)
    }
  }, 60000) // 1 menit
})

onBeforeUnmount(() => {
  if (stakingRefreshInterval) {
    clearInterval(stakingRefreshInterval)
  }
  if (autoUpdateStatusInterval) {
    clearInterval(autoUpdateStatusInterval)
  }
  if (autoProcessPendingInterval) {
    clearInterval(autoProcessPendingInterval)
  }
})
</script>
