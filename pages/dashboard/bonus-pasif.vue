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
            Bonus Pasif - Staking
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

        <!-- Setup Required Error -->
        <div v-else-if="setupRequired" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
          <div class="flex items-start gap-4">
            <Icon name="alert-circle" size="lg" class="text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 class="text-lg font-semibold text-yellow-800 mb-2">Setup Diperlukan</h3>
              <p class="text-yellow-700 mb-4">
                Fitur Bonus Pasif memerlukan beberapa tabel database yang belum di-setup. 
              </p>
              <p class="text-sm text-yellow-600 mb-4">
                Silakan jalankan SQL migration di Supabase sesuai panduan: 
                <code class="bg-yellow-100 px-2 py-1 rounded">admin-package/BONUS_PASIF_SETUP.md</code>
              </p>
              <button
                @click="retryFetchData"
                class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>

        <!-- Content when not loading -->
        <template v-else-if="!setupRequired">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Staking Aktif</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ stats.totalActiveStaking }}</p>
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
                  <p class="text-sm text-gray-500">Total Reward</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCoinAmount(stats.totalReward) }}</p>
                </div>
                <div class="p-3 bg-yellow-100 rounded-lg">
                  <Icon name="star" size="md" class="text-yellow-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Reward Pending</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCoinAmount(stats.totalRewardPending) }}</p>
                </div>
                <div class="p-3 bg-orange-100 rounded-lg">
                  <Icon name="clock" size="md" class="text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
            <div class="border-b border-gray-200">
              <nav class="flex -mb-px">
                <button
                  @click="activeTab = 'member-list'"
                  :class="[
                    'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'member-list'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  List Member
                </button>
                <button
                  @click="activeTab = 'staking'"
                  :class="[
                    'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'staking'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  Staking
                </button>
                <button
                  @click="activeTab = 'reward-history'"
                  :class="[
                    'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === 'reward-history'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  ]"
                >
                  Reward History
                </button>
              </nav>
            </div>

            <!-- Member List Tab -->
            <div v-if="activeTab === 'member-list'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-800">Daftar Member dengan Coin Balance ({{ memberListWithCoins.length }})</h2>
              </div>

              <!-- Search -->
              <div class="mb-4">
                <div class="relative">
                  <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    v-model="memberSearchQuery"
                    type="text"
                    placeholder="Cari member (email, username)..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <!-- Member List Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">No</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Balance USDT</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Balance Coin</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staked Coin</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available Coin</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="filteredMemberList.length === 0">
                      <td colspan="8" class="px-6 py-12 text-center text-sm text-gray-500">
                        Belum ada data member
                      </td>
                    </tr>
                    <tr
                      v-for="(member, index) in filteredMemberList"
                      :key="member.member_id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {{ index + 1 }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div class="font-medium text-gray-900">{{ member.member?.username || 'N/A' }}</div>
                          <div class="text-gray-500 text-xs">{{ member.member?.email || '' }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          :class="[
                            'px-2 py-1 text-xs font-semibold rounded',
                            member.member?.member_type === 'vip'
                              ? 'bg-purple-100 text-purple-800'
                              : member.member?.member_type === 'leader'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          ]"
                        >
                          {{ formatMemberType(member.member?.member_type || 'normal') }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {{ formatCurrency(member.total_balance || 0) }} USDT
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                        {{ formatNumber(member.total_coin_balance || 0) }} Coin
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {{ formatNumber(member.staked_coins || 0) }} Coin
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {{ formatNumber(member.available_coins || 0) }} Coin
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          @click="openStakingForMember(member)"
                          :disabled="getAvailableCoins(member) <= 0"
                          :class="[
                            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                            getAvailableCoins(member) > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          ]"
                        >
                          Staking
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Staking Tab -->
            <div v-if="activeTab === 'staking'" class="p-6">
              <!-- Header with Actions -->
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-800">Daftar Staking ({{ stakingList.length }})</h2>
                <div class="flex gap-2">
                  <button
                    @click="calculateReward"
                    :disabled="calculatingReward"
                    :class="[
                      'flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg',
                      calculatingReward
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600'
                    ]"
                  >
                    <Icon name="refresh-cw" size="sm" :class="{ 'animate-spin': calculatingReward }" />
                    {{ calculatingReward ? 'Menghitung...' : 'Hitung Reward Harian' }}
                  </button>
                  <button
                    @click="openCreateStakingModal"
                    class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg"
                  >
                    <Icon name="plus" size="sm" />
                    Staking Baru
                  </button>

                </div>
              </div>

              <!-- Filters -->
              <div class="flex gap-4 mb-4">
                <select
                  v-model="stakingStatusFilter"
                  @change="fetchStaking"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="unstaked">Unstaked</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <!-- Staking Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Koin Staking</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward %</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reward</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Staking</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="stakingList.length === 0">
                      <td colspan="7" class="px-6 py-12 text-center text-sm text-gray-500">
                        Belum ada data staking
                      </td>
                    </tr>
                    <tr
                      v-for="staking in stakingList"
                      :key="staking.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div class="font-medium text-gray-900">{{ staking.member?.username || 'N/A' }}</div>
                          <div class="text-gray-500 text-xs">{{ staking.member?.email || '' }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {{ formatCoinAmount(staking.coin_amount) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ staking.reward_percentage }}%
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {{ formatCoinAmount(staking.total_reward_earned || 0) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          :class="[
                            'px-2 py-1 text-xs font-semibold rounded',
                            staking.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : staking.status === 'unstaked'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          ]"
                        >
                          {{ formatStatus(staking.status) }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {{ formatDate(staking.staked_at) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          v-if="staking.status === 'active'"
                          @click="confirmUnstake(staking)"
                          class="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                        >
                          Unstake
                        </button>
                        <span v-else class="text-gray-400 text-sm">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Reward History Tab -->
            <div v-if="activeTab === 'reward-history'" class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-800">Reward History ({{ rewardHistoryList.length }})</h2>
              </div>

              <!-- Filters -->
              <div class="flex gap-4 mb-4">
                <select
                  v-model="rewardStatusFilter"
                  @change="fetchRewardHistory"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input
                  v-model="rewardDateFilter"
                  type="date"
                  @change="fetchRewardHistory"
                  class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Summary -->
              <div v-if="rewardSummary" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <p class="text-sm text-blue-600">Total Reward</p>
                    <p class="text-lg font-bold text-blue-800">{{ formatCoinAmount(rewardSummary.total_reward) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-green-600">Total Paid</p>
                    <p class="text-lg font-bold text-green-800">{{ formatCoinAmount(rewardSummary.total_paid) }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-orange-600">Total Pending</p>
                    <p class="text-lg font-bold text-orange-800">{{ formatCoinAmount(rewardSummary.total_pending) }}</p>
                  </div>
                </div>
              </div>

              <!-- Reward History Table -->
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Koin Staking</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-if="rewardHistoryList.length === 0">
                      <td colspan="5" class="px-6 py-12 text-center text-sm text-gray-500">
                        Belum ada data reward history
                      </td>
                    </tr>
                    <tr
                      v-for="reward in rewardHistoryList"
                      :key="reward.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ formatDate(reward.reward_date) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div class="font-medium text-gray-900">{{ reward.member?.username || 'N/A' }}</div>
                          <div class="text-gray-500 text-xs">{{ reward.member?.email || '' }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ formatCoinAmount(reward.coin_amount_staked) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {{ formatCoinAmount(reward.reward_amount) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          :class="[
                            'px-2 py-1 text-xs font-semibold rounded',
                            reward.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : reward.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          ]"
                        >
                          {{ formatStatus(reward.status) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                  <span class="text-gray-500">Total Balance Coin:</span>
                  <p class="font-semibold text-gray-900">{{ formatCoinAmount(selectedMemberCoins.total_balance_coin || selectedMemberCoins.total_coins) }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Staked:</span>
                  <p class="font-semibold text-blue-600">{{ formatCoinAmount(selectedMemberCoins.staked_coins || 0) }}</p>
                </div>
                <div>
                  <span class="text-gray-500">Available:</span>
                  <p :class="parseFloat(selectedMemberCoins.available_coins || 0) <= 0 ? 'font-semibold text-red-600' : 'font-semibold text-green-600'">
                    {{ formatCoinAmount(selectedMemberCoins.available_coins || 0) }}
                  </p>
                </div>
              </div>
            </div>
            <div v-if="selectedMemberCoins && parseFloat(selectedMemberCoins.available_coins) <= 0" class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-600 font-medium">⚠️ Member tidak memiliki koin yang tersedia untuk di-staking</p>
            </div>
            <input
              v-model="stakingForm.coin_amount"
              type="number"
              step="0.00000001"
              min="0"
              required
              :max="selectedMemberCoins ? selectedMemberCoins.available_coins : undefined"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00000000"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reward Percentage (dari bonus_settings: {{ defaultRewardPercentage }}%)</label>
            <input
              v-model="stakingForm.reward_percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="defaultRewardPercentage"
            />
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeCreateStakingModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="creatingStaking || !isStakingFormValid"
              :class="[
                'flex-1 px-4 py-2 rounded-lg transition-colors font-semibold',
                isStakingFormValid && !creatingStaking
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              ]"
            >
              {{ creatingStaking ? 'Menyimpan...' : 'Stake' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50 max-w-md"
    >
      <div class="flex items-center gap-2">
        <Icon name="x-circle" size="md" class="text-red-600" />
        <p class="text-sm text-red-600">{{ errorMessage }}</p>
      </div>
    </div>

    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50 max-w-md"
    >
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
const setupRequired = ref(false)
const activeTab = ref('member-list')
const stakingList = ref([])
const rewardHistoryList = ref([])
const stakingStatusFilter = ref('')
const rewardStatusFilter = ref('')
const rewardDateFilter = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const creatingStaking = ref(false)
const calculatingReward = ref(false)
const showCreateStakingModal = ref(false)
const membersList = ref([])
const memberListWithCoins = ref([])
const memberSearchQuery = ref('')
const defaultRewardPercentage = ref(0.5)
const stakingForm = ref({
  member_id: '',
  coin_amount: '',
  reward_percentage: ''
})
const selectedMemberCoins = ref(null)
const stats = ref({
  totalActiveStaking: 0,
  totalStakedCoins: 0,
  totalReward: 0,
  totalRewardPending: 0
})
const rewardSummary = ref(null)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const retryFetchData = () => {
  setupRequired.value = false
  loading.value = true
  fetchMembers()
  fetchBonusSettings()
  fetchStaking()
}

const isStakingFormValid = computed(() => {
  if (!stakingForm.value.member_id) return false
  if (!selectedMemberCoins.value) return false
  
  const availableCoins = parseFloat(selectedMemberCoins.value.available_coins) || 0
  if (availableCoins <= 0) return false
  
  const coinAmount = parseFloat(stakingForm.value.coin_amount)
  if (!coinAmount || coinAmount <= 0) return false
  if (coinAmount > availableCoins) return false
  
  return true
})

const fetchMembers = async () => {
  try {
    const response = await $fetch('/api/admin/members', { params: { limit: 1000 } })
    if (response.success) {
      membersList.value = response.data || []
      setupRequired.value = false
    }
  } catch (error) {
    console.error('Gagal mengambil data members:', error)
    if (error?.data?.statusCode === 500) {
      setupRequired.value = true
    }
  }
}

const fetchBonusSettings = async () => {
  try {
    const response = await $fetch('/api/admin/bonus')
    if (response.success && response.data) {
      defaultRewardPercentage.value = parseFloat(response.data.reward_percentage) || 0.5
      setupRequired.value = false
    }
  } catch (error) {
    console.error('Gagal mengambil bonus settings:', error)
    if (error?.data?.statusCode === 500) {
      setupRequired.value = true
    }
  }
}

const fetchStaking = async () => {
  try {
    loading.value = true
    const params = {
      limit: 'all' // Get all staking records, not just first 50
    }
    if (stakingStatusFilter.value) {
      params.status = stakingStatusFilter.value
    }
    const response = await $fetch('/api/admin/staking', { params })
    if (response.success) {
      stakingList.value = response.data || []
      calculateStats()
      setupRequired.value = false
    }
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal mengambil data staking'
    if (error?.data?.statusCode === 500) {
      setupRequired.value = true
    }
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

const fetchRewardHistory = async () => {
  try {
    loading.value = true
    const params = {
      limit: 'all' // Get all reward history records
    }
    if (rewardStatusFilter.value) {
      params.status = rewardStatusFilter.value
    }
    if (rewardDateFilter.value) {
      params.start_date = rewardDateFilter.value
      params.end_date = rewardDateFilter.value
    }
    const response = await $fetch('/api/admin/reward-history', { params })
    if (response.success) {
      rewardHistoryList.value = response.data || []
      rewardSummary.value = response.summary || null
    }
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal mengambil data reward history'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

const calculateStats = () => {
  const activeStaking = stakingList.value.filter(s => s.status === 'active')
  stats.value.totalActiveStaking = activeStaking.length
  stats.value.totalStakedCoins = activeStaking.reduce((sum, s) => sum + (parseFloat(s.coin_amount) || 0), 0)
  stats.value.totalReward = stakingList.value.reduce((sum, s) => sum + (parseFloat(s.total_reward_earned) || 0), 0)
  stats.value.totalRewardPending = rewardHistoryList.value
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (parseFloat(r.reward_amount) || 0), 0)
}

const openCreateStakingModal = () => {
  stakingForm.value = {
    member_id: '',
    coin_amount: '',
    reward_percentage: ''
  }
  showCreateStakingModal.value = true
}

const closeCreateStakingModal = () => {
  showCreateStakingModal.value = false
  selectedMemberCoins.value = null
  stakingForm.value = {
    member_id: '',
    coin_amount: '',
    reward_percentage: ''
  }
}

const onMemberSelected = async (member) => {
  // Fetch member coin data untuk mendapatkan staked coins
  await fetchMemberCoins(member.id)
  // Jika member ada di list, gunakan total_coin_balance dari list
  const memberFromList = memberListWithCoins.value.find(m => m.member_id === member.id)
  if (selectedMemberCoins.value) {
    let totalBalanceCoin = 0
    if (memberFromList) {
      // Gunakan total_coin_balance dari list
      totalBalanceCoin = parseFloat(memberFromList.total_coin_balance || 0)
    } else {
      // Jika tidak ada di list, fetch dari bonus-active-report atau gunakan total_coins dari member_coins
      try {
        const bonusReport = await $fetch('/api/admin/bonus-active-report')
        if (bonusReport.success && bonusReport.data) {
          const memberBonus = bonusReport.data.find(m => m.member_id === member.id)
          if (memberBonus) {
            totalBalanceCoin = parseFloat(memberBonus.total_coin_balance || 0)
          } else {
            // Fallback: gunakan total_coins dari member_coins
            totalBalanceCoin = parseFloat(selectedMemberCoins.value.total_coins || 0)
          }
        } else {
          // Fallback: gunakan total_coins dari member_coins
          totalBalanceCoin = parseFloat(selectedMemberCoins.value.total_coins || 0)
        }
      } catch (error) {
        console.error('[bonus-pasif] Error fetching bonus report:', error)
        // Fallback: gunakan total_coins dari member_coins
        totalBalanceCoin = parseFloat(selectedMemberCoins.value.total_coins || 0)
      }
    }
    
    const stakedCoins = parseFloat(selectedMemberCoins.value.staked_coins || 0)
    const availableCoins = Math.max(0, totalBalanceCoin - stakedCoins)
    
    selectedMemberCoins.value = {
      ...selectedMemberCoins.value,
      total_balance_coin: totalBalanceCoin,
      total_coins: totalBalanceCoin, // Untuk backward compatibility
      available_coins: availableCoins
    }
    
    // Auto-fill input dengan available coins
    if (availableCoins > 0) {
      stakingForm.value.coin_amount = availableCoins.toString()
    } else {
      stakingForm.value.coin_amount = ''
    }
  }
}

const fetchMemberCoins = async (memberId) => {
  try {
    selectedMemberCoins.value = null
    console.log(`[bonus-pasif] Fetching coins for member: ${memberId}`)
    
    const response = await $fetch(`/api/admin/member-coins/${memberId}`)
    console.log(`[bonus-pasif] API response:`, response)
    console.log(`[bonus-pasif] Debug info:`, response.debug)
    
    if (response.success && response.data) {
      selectedMemberCoins.value = response.data
      console.log(`[bonus-pasif] Got coin data - Total: ${response.data.total_coins}, Staked: ${response.data.staked_coins}, Available: ${response.data.available_coins}`)
      // Auto-fill dengan available coins
      const availableCoins = parseFloat(response.data.available_coins || 0)
      if (availableCoins > 0) {
        stakingForm.value.coin_amount = availableCoins.toString()
      } else {
        stakingForm.value.coin_amount = ''
      }
    } else {
      console.error('[bonus-pasif] Invalid response:', response)
      selectedMemberCoins.value = null
    }
  } catch (error) {
    console.error('[bonus-pasif] Error fetching coin data:', error)
    selectedMemberCoins.value = null
  }
}

const createStaking = async () => {
  try {
    // Validation
    if (!stakingForm.value.member_id) {
      errorMessage.value = 'Pilih member terlebih dahulu'
      setTimeout(() => errorMessage.value = '', 5000)
      return
    }

    if (!selectedMemberCoins.value) {
      errorMessage.value = 'Data coin member tidak ditemukan'
      setTimeout(() => errorMessage.value = '', 5000)
      return
    }

    const availableCoins = parseFloat(selectedMemberCoins.value.available_coins) || 0
    if (availableCoins <= 0) {
      errorMessage.value = `Member tidak memiliki koin yang tersedia untuk di-staking`
      setTimeout(() => errorMessage.value = '', 5000)
      return
    }

    const coinAmount = parseFloat(stakingForm.value.coin_amount)
    if (!coinAmount || coinAmount <= 0) {
      errorMessage.value = 'Jumlah koin harus lebih dari 0'
      setTimeout(() => errorMessage.value = '', 5000)
      return
    }

    if (coinAmount > availableCoins) {
      errorMessage.value = `Koin yang diminta (${coinAmount}) melebihi yang tersedia (${availableCoins})`
      setTimeout(() => errorMessage.value = '', 5000)
      return
    }

    creatingStaking.value = true
    errorMessage.value = ''
    const body = {
      member_id: stakingForm.value.member_id,
      coin_amount: coinAmount
    }
    // If reward_percentage is empty, use the default from bonus_settings
    if (stakingForm.value.reward_percentage) {
      body.reward_percentage = parseFloat(stakingForm.value.reward_percentage)
    } else {
      body.reward_percentage = defaultRewardPercentage.value
    }
    const response = await $fetch('/api/admin/staking', {
      method: 'POST',
      body
    })
    if (response.success) {
      successMessage.value = 'Staking berhasil dibuat'
      setTimeout(() => successMessage.value = '', 5000)
      closeCreateStakingModal()
      fetchStaking()
    }
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal membuat staking'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    creatingStaking.value = false
  }
}

const confirmUnstake = async (staking) => {
  if (!confirm(`Yakin ingin unstake ${formatCoinAmount(staking.coin_amount)} koin untuk member ${staking.member?.username || staking.member_id}?`)) {
    return
  }
  try {
    errorMessage.value = ''
    const response = await $fetch(`/api/admin/staking/${staking.id}/unstake`, {
      method: 'PUT'
    })
    if (response.success) {
      successMessage.value = 'Unstaking berhasil dilakukan'
      setTimeout(() => successMessage.value = '', 5000)
      fetchStaking()
    }
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal melakukan unstaking'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

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

const formatCoinAmount = (amount) => {
  if (!amount) return '0'
  const num = parseFloat(amount)
  if (isNaN(num)) return '0'
  return num.toFixed(8).replace(/\.?0+$/, '')
}

const formatStatus = (status) => {
  const statusMap = {
    active: 'Aktif',
    unstaked: 'Unstaked',
    cancelled: 'Dibatalkan',
    pending: 'Pending',
    paid: 'Dibayar'
  }
  return statusMap[status] || status
}

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
    maximumFractionDigits: 8
  }).format(numValue)
}

const formatMemberType = (type) => {
  const types = {
    normal: 'Normal',
    leader: 'Leader',
    vip: 'VIP'
  }
  return types[type] || type || 'Normal'
}

const getAvailableCoins = (member) => {
  if (!member || member.available_coins === undefined || member.available_coins === null) {
    return 0
  }
  const value = typeof member.available_coins === 'string' 
    ? parseFloat(member.available_coins.replace(/,/g, '')) 
    : parseFloat(member.available_coins)
  return isNaN(value) ? 0 : value
}

const filteredMemberList = computed(() => {
  let filtered = memberListWithCoins.value
  
  // Sort by created_at descending (newest first) - data terbaru jadi nomor 1
  // If created_at not available, use member_id as fallback (assuming newer members have newer IDs)
  filtered = [...filtered].sort((a, b) => {
    // Try to get created_at from member object
    const dateA = a.member?.created_at ? new Date(a.member.created_at).getTime() : 
                  (a.created_at ? new Date(a.created_at).getTime() : 0)
    const dateB = b.member?.created_at ? new Date(b.member.created_at).getTime() : 
                  (b.created_at ? new Date(b.created_at).getTime() : 0)
    
    // If both have dates, sort by date (newest first)
    if (dateA > 0 && dateB > 0) {
      return dateB - dateA // Descending: newest first
    }
    
    // Fallback: sort by member_id (assuming UUIDs are sortable)
    const idA = a.member_id || ''
    const idB = b.member_id || ''
    return idB.localeCompare(idA) // Descending
  })
  
  // Apply search filter
  if (memberSearchQuery.value) {
    const query = memberSearchQuery.value.toLowerCase()
    filtered = filtered.filter(member => {
      const username = (member.member?.username || '').toLowerCase()
      const email = (member.member?.email || '').toLowerCase()
      return username.includes(query) || email.includes(query)
    })
  }
  
  return filtered
})

const fetchMemberListWithCoins = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/admin/bonus-active-report')
    if (response.success && response.data) {
      // Get member coins data for each member
      const membersWithCoins = await Promise.all(
        (response.data || []).map(async (memberBonus) => {
          try {
            const coinsResponse = await $fetch(`/api/admin/member-coins/${memberBonus.member_id}`)
            if (coinsResponse.success && coinsResponse.data) {
              const stakedCoins = parseFloat(coinsResponse.data.staked_coins || 0)
              // Available coins = Total Balance Coin - Staked Coin (yang sudah di-staking)
              // Yang siap di-staking adalah yang belum di-staking
              const totalCoinBalance = parseFloat(memberBonus.total_coin_balance || 0)
              const availableCoins = Math.max(0, totalCoinBalance - stakedCoins)
              console.log(`[fetchMemberListWithCoins] Member ${memberBonus.member_id}: total_coin=${totalCoinBalance}, staked=${stakedCoins}, available=${availableCoins}`)
              return {
                ...memberBonus,
                staked_coins: stakedCoins,
                available_coins: availableCoins
              }
            }
            console.log(`[fetchMemberListWithCoins] No coins data for member ${memberBonus.member_id}`)
            // Jika tidak ada data member_coins, gunakan total_coin_balance sebagai available
            const totalCoinBalance = parseFloat(memberBonus.total_coin_balance || 0)
            return {
              ...memberBonus,
              staked_coins: 0,
              available_coins: totalCoinBalance
            }
          } catch (error) {
            console.error(`Error fetching coins for member ${memberBonus.member_id}:`, error)
            // Jika error, gunakan total_coin_balance sebagai available
            const totalCoinBalance = parseFloat(memberBonus.total_coin_balance || 0)
            return {
              ...memberBonus,
              staked_coins: 0,
              available_coins: totalCoinBalance
            }
          }
        })
      )
      memberListWithCoins.value = membersWithCoins
      console.log('[fetchMemberListWithCoins] Total members:', membersWithCoins.length)
    }
  } catch (error) {
    console.error('Error fetching member list with coins:', error)
    errorMessage.value = error.data?.message || 'Gagal mengambil data member'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

const openStakingForMember = async (member) => {
  // Set member in form
  stakingForm.value.member_id = member.member_id
  // Fetch member coins data untuk mendapatkan staked coins
  await fetchMemberCoins(member.member_id)
  // Update selectedMemberCoins dengan data dari list member (total_coin_balance)
  if (selectedMemberCoins.value) {
    const totalBalanceCoin = parseFloat(member.total_coin_balance || 0)
    const stakedCoins = parseFloat(selectedMemberCoins.value.staked_coins || 0)
    const availableCoins = Math.max(0, totalBalanceCoin - stakedCoins)
    
    selectedMemberCoins.value = {
      ...selectedMemberCoins.value,
      total_balance_coin: totalBalanceCoin,
      total_coins: totalBalanceCoin, // Untuk backward compatibility
      available_coins: availableCoins
    }
    
    // Auto-fill input dengan available coins
    if (availableCoins > 0) {
      stakingForm.value.coin_amount = availableCoins.toString()
    } else {
      stakingForm.value.coin_amount = ''
    }
  }
  // Open modal
  showCreateStakingModal.value = true
}

// Watch tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'reward-history' && rewardHistoryList.value.length === 0) {
    fetchRewardHistory()
  }
  if (newTab === 'member-list' && memberListWithCoins.value.length === 0) {
    fetchMemberListWithCoins()
  }
})

// Calculate reward manually
const calculateReward = async () => {
  try {
    calculatingReward.value = true
    errorMessage.value = ''
    const response = await $fetch('/api/admin/calculate-daily-reward', {
      method: 'POST',
      body: {}
    })
    if (response.success) {
      successMessage.value = `Reward berhasil dihitung! Diproses: ${response.data.processed}, Dilewati: ${response.data.skipped}`
      setTimeout(() => successMessage.value = '', 5000)
      // Refresh staking and reward history
      await fetchStaking()
      if (activeTab.value === 'reward-history') {
        await fetchRewardHistory()
      }
    }
  } catch (error) {
    errorMessage.value = error.data?.message || 'Gagal menghitung reward harian'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    calculatingReward.value = false
  }
}

// Auto calculate reward when page loads (background, tidak blocking)
const autoCalculateRewardOnLoad = async () => {
  try {
    // Run in background, tidak perlu menunggu hasilnya
    await $fetch('/api/admin/calculate-daily-reward', {
      method: 'POST',
      body: {}
    }).catch(err => {
      // Silent fail, karena ini background process
      console.log('[Bonus Pasif] Auto calculate reward skipped:', err)
    })
  } catch (error) {
    // Silent fail
    console.log('[Bonus Pasif] Auto calculate reward error:', error)
  }
}

// Initial load
onMounted(() => {
  fetchMembers()
  fetchBonusSettings()
  fetchStaking()
  fetchMemberListWithCoins()
  // Auto calculate reward saat halaman dibuka (background process)
  autoCalculateRewardOnLoad()
})
</script>

