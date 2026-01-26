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
              <!-- Calculate Loyalty Bonus Button -->
              <button
                @click="calculateLoyaltyBonus"
                :disabled="isCalculatingLoyalty"
                class="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                title="Hitung bonus loyalty dari multiplier rewards downline"
              >
                <Icon name="star" size="sm" />
                {{ isCalculatingLoyalty ? 'Menghitung...' : 'Hitung Loyalty Bonus' }}
              </button>
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
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonus Referral</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Level 1</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Level 2</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matching Level 3</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bonus Pasif</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="bonusList.length === 0" class="hover:bg-gray-50">
                    <td colspan="7" class="px-6 py-12 text-center text-sm text-gray-500">
                      Belum ada data member
                    </td>
                  </tr>
                  <tr v-else-if="filteredBonusList.length === 0" class="hover:bg-gray-50">
                    <td colspan="7" class="px-6 py-12 text-center text-sm text-gray-500">
                      {{ searchQuery || selectedMemberType || selectedBonusFilter ? 'Tidak ada data member yang sesuai dengan filter' : 'Tidak ada data untuk halaman ini' }}
                    </td>
                  </tr>
                  <template v-for="memberBonus in paginatedBonusList" :key="memberBonus.member_id">
                    <tr
                      @click="toggleExpanded(memberBonus.member_id)"
                      class="hover:bg-gray-50 transition-colors cursor-pointer"
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="flex flex-col gap-1.5">
                        <!-- USDT -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Bonus Referral USDT ({{ bonusPercentages.referral_percentage }}%)"
                        >
                          <span class="text-purple-600 font-semibold">USDT:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCurrency(memberBonus.total_bonus_balance || 0) }}</span>
                        </div>
                        <!-- Coin -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Bonus Referral Coin ({{ bonusPercentages.referral_percentage }}%)"
                        >
                          <span class="text-purple-600 font-semibold">Coin {{ coinInfo ? coinInfo.coin_code : '' }}:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCoin(memberBonus.total_bonus_coin || 0) }}</span>
                        </div>
                        <!-- Total -->
                        <div class="text-xs text-gray-500 font-normal mt-0.5">
                          Total: {{ formatCurrency(memberBonus.total_bonus || 0) }} ({{ bonusPercentages.referral_percentage }}%)
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="flex flex-col gap-1.5">
                        <!-- USDT -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Matching Level 1 USDT ({{ bonusPercentages.matching_level1_percentage }}%)"
                        >
                          <span class="text-orange-600 font-semibold">USDT:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCurrency(memberBonus.total_matching_level1_balance || 0) }}</span>
                        </div>
                        <!-- Coin -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Matching Level 1 Coin ({{ bonusPercentages.matching_level1_percentage }}%)"
                        >
                          <span class="text-purple-600 font-semibold">Coin {{ coinInfo ? coinInfo.coin_code : '' }}:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCoin(memberBonus.total_matching_level1_coin || 0) }}</span>
                        </div>
                        <!-- Total -->
                        <div class="text-xs text-gray-500 font-normal mt-0.5">
                          Total: {{ formatCurrency(memberBonus.total_matching_level1 || 0) }} ({{ bonusPercentages.matching_level1_percentage }}%)
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="flex flex-col gap-1.5">
                        <!-- USDT -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Matching Level 2 USDT ({{ bonusPercentages.matching_level2_percentage }}%)"
                        >
                          <span class="text-amber-600 font-semibold">USDT:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCurrency(memberBonus.total_matching_level2_balance || 0) }}</span>
                        </div>
                        <!-- Coin -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Matching Level 2 Coin ({{ bonusPercentages.matching_level2_percentage }}%)"
                        >
                          <span class="text-purple-600 font-semibold">Coin {{ coinInfo ? coinInfo.coin_code : '' }}:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCoin(memberBonus.total_matching_level2_coin || 0) }}</span>
                        </div>
                        <!-- Total -->
                        <div class="text-xs text-gray-500 font-normal mt-0.5">
                          Total: {{ formatCurrency(memberBonus.total_matching_level2 || 0) }} ({{ bonusPercentages.matching_level2_percentage }}%)
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="flex flex-col gap-1.5">
                        <!-- USDT -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Matching Level 3 USDT ({{ bonusPercentages.matching_level3_percentage }}%)"
                        >
                          <span class="text-yellow-600 font-semibold">USDT:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCurrency(memberBonus.total_matching_level3_balance || 0) }}</span>
                        </div>
                        <!-- Coin -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Matching Level 3 Coin ({{ bonusPercentages.matching_level3_percentage }}%)"
                        >
                          <span class="text-purple-600 font-semibold">Coin {{ coinInfo ? coinInfo.coin_code : '' }}:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCoin(memberBonus.total_matching_level3_coin || 0) }}</span>
                        </div>
                        <!-- Total -->
                        <div class="text-xs text-gray-500 font-normal mt-0.5">
                          Total: {{ formatCurrency(memberBonus.total_matching_level3 || 0) }} ({{ bonusPercentages.matching_level3_percentage }}%)
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      <div class="flex flex-col gap-1.5">
                        <!-- USDT -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Bonus Pasif USDT (Referral 80% + Matching 80%)"
                        >
                          <span class="text-blue-600 font-semibold">USDT:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCurrency(memberBonus.bonus_pasif_usdt || 0) }}</span>
                        </div>
                        <!-- Coin -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Bonus Pasif Coin (Referral 20% + Matching 20%)"
                        >
                          <span class="text-purple-600 font-semibold">Coin {{ coinInfo ? coinInfo.coin_code : '' }}:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCoin(memberBonus.bonus_pasif_coin || 0) }}</span>
                        </div>
                        <!-- Loyalty -->
                        <div 
                          class="text-xs flex items-center gap-1"
                          title="Bonus Loyalty"
                        >
                          <span class="text-orange-600 font-semibold">Loyalty:</span> 
                          <span class="text-gray-800 font-medium">{{ formatCurrency(memberBonus.bonus_pasif_loyalty || 0) }}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Expanded Detail Row -->
                  <tr v-if="expandedRows.has(memberBonus.member_id)" class="bg-gradient-to-r from-gray-50 to-gray-100">
                    <td colspan="7" class="px-6 py-4">
                      <div class="space-y-4">
                        <!-- Member Info Summary - Compact -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div class="bg-white rounded-lg p-3 border-l-4 border-blue-500 shadow-sm">
                            <div class="text-xs text-gray-500 mb-1">Jenis Member</div>
                            <div class="font-semibold text-gray-800 text-sm">
                              {{ formatMemberType(memberBonus.member?.member_type || 'normal') }}
                            </div>
                          </div>
                          <div class="bg-white rounded-lg p-3 border-l-4 border-green-500 shadow-sm">
                            <div class="text-xs text-gray-500 mb-1">Total Downline</div>
                            <div class="font-semibold text-gray-800 text-sm">{{ memberBonus.total_downline_count || 0 }}</div>
                          </div>
                          <div class="bg-white rounded-lg p-3 border-l-4 border-purple-500 shadow-sm">
                            <div class="text-xs text-gray-500 mb-1">Deposit Downline</div>
                            <div class="font-semibold text-gray-800 text-sm">{{ formatCurrency(memberBonus.total_downline_deposit || 0) }} USDT</div>
                          </div>
                          <div class="bg-white rounded-lg p-3 border-l-4 border-emerald-500 shadow-sm">
                            <div class="text-xs text-gray-500 mb-1">Total Balance</div>
                            <div class="font-semibold text-emerald-600 text-sm">{{ formatCurrency(memberBonus.total_balance || 0) }} USDT</div>
                          </div>
                        </div>

                        <!-- Bonus Cards Grid -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <!-- Bonus Referral Card -->
                          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300 shadow-md overflow-hidden">
                            <div class="bg-purple-600 px-4 py-2">
                              <h4 class="font-bold text-white text-sm flex items-center gap-2">
                                <Icon name="gift" size="sm" />
                                Bonus Referral ({{ bonusPercentages.referral_percentage }}%)
                              </h4>
                            </div>
                            <div class="p-4">
                              <div class="grid grid-cols-3 gap-3 mb-3">
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Total</div>
                                  <div class="font-bold text-purple-700 text-sm">{{ formatCurrency(memberBonus.total_bonus || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">USDT</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCurrency(memberBonus.total_bonus_balance || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Coin</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCoin(memberBonus.total_bonus_coin || 0) }}</div>
                                </div>
                              </div>
                              <div class="bg-white/50 rounded border border-purple-200/50 overflow-hidden">
                                <div class="max-h-48 overflow-y-auto">
                                  <table class="w-full text-xs">
                                    <thead class="bg-purple-50/50 sticky top-0">
                                      <tr>
                                        <th class="px-2 py-1.5 text-left font-semibold text-purple-700">Tanggal (UTC / WIB)</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-purple-700">USDT</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-purple-700">Coin</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-purple-700">Downline</th>
                                      </tr>
                                    </thead>
                                    <tbody class="divide-y divide-purple-100/30">
                                      <tr v-if="getReferralTransactions(memberBonus).length === 0">
                                        <td colspan="4" class="px-2 py-3 text-center text-gray-400 text-xs">Tidak ada data</td>
                                      </tr>
                                      <tr v-for="tx in getReferralTransactions(memberBonus)" :key="tx.id" class="hover:bg-purple-50/30">
                                        <td class="px-2 py-1.5">
                                          <div class="text-xs">{{ formatDateWithTimezone(tx.created_at) }}</div>
                                        </td>
                                        <td class="px-2 py-1.5 font-medium">{{ formatCurrency(tx.bonus_balance || 0) }}</td>
                                        <td class="px-2 py-1.5">{{ formatCoin(tx.bonus_coin || 0) }}</td>
                                        <td class="px-2 py-1.5 text-xs">
                                          <span v-if="tx.downline_member" class="text-purple-700 font-medium">{{ tx.downline_member.username }}</span>
                                          <span v-else class="text-gray-400">-</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Matching Level 1 Card -->
                          <div class="bg-gradient-to-br from-orange-50/30 to-orange-100/30 rounded-lg border border-orange-200 shadow-sm overflow-hidden">
                            <div class="bg-orange-500/80 px-4 py-2">
                              <h4 class="font-bold text-white text-sm flex items-center gap-2">
                                <Icon name="users" size="sm" />
                                Matching Level 1 ({{ bonusPercentages.matching_level1_percentage }}%)
                              </h4>
                            </div>
                            <div class="p-4">
                              <div class="grid grid-cols-3 gap-3 mb-3">
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Total</div>
                                  <div class="font-bold text-orange-700 text-sm">{{ formatCurrency(memberBonus.total_matching_level1 || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">USDT</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCurrency(memberBonus.total_matching_level1_balance || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Coin</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCoin(memberBonus.total_matching_level1_coin || 0) }}</div>
                                </div>
                              </div>
                              <div class="bg-white/50 rounded border border-orange-200/50 overflow-hidden">
                                <div class="max-h-48 overflow-y-auto">
                                  <table class="w-full text-xs">
                                    <thead class="bg-orange-50/50 sticky top-0">
                                      <tr>
                                        <th class="px-2 py-1.5 text-left font-semibold text-orange-700">Tanggal (UTC / WIB)</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-orange-700">USDT</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-orange-700">Coin</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-orange-700">Downline</th>
                                      </tr>
                                    </thead>
                                    <tbody class="divide-y divide-orange-100/30">
                                      <tr v-if="getMatchingTransactions(memberBonus, 1).length === 0">
                                        <td colspan="4" class="px-2 py-3 text-center text-gray-400 text-xs">Tidak ada data</td>
                                      </tr>
                                      <tr v-for="tx in getMatchingTransactions(memberBonus, 1)" :key="tx.id" class="hover:bg-orange-50/30">
                                        <td class="px-2 py-1.5">
                                          <div class="text-xs">{{ formatDateWithTimezone(tx.created_at) }}</div>
                                        </td>
                                        <td class="px-2 py-1.5 font-medium">{{ formatCurrency(tx.bonus_balance || 0) }}</td>
                                        <td class="px-2 py-1.5">{{ formatCoin(tx.bonus_coin || 0) }}</td>
                                        <td class="px-2 py-1.5 text-xs">
                                          <span v-if="tx.downline_member" class="text-orange-700 font-medium">{{ tx.downline_member.username }}</span>
                                          <span v-else class="text-gray-400">-</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Matching Level 2 Card -->
                          <div class="bg-gradient-to-br from-amber-50/30 to-amber-100/30 rounded-lg border border-amber-200 shadow-sm overflow-hidden">
                            <div class="bg-amber-500/80 px-4 py-2">
                              <h4 class="font-bold text-white text-sm flex items-center gap-2">
                                <Icon name="users" size="sm" />
                                Matching Level 2 ({{ bonusPercentages.matching_level2_percentage }}%)
                              </h4>
                            </div>
                            <div class="p-4">
                              <div class="grid grid-cols-3 gap-3 mb-3">
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Total</div>
                                  <div class="font-bold text-amber-700 text-sm">{{ formatCurrency(memberBonus.total_matching_level2 || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">USDT</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCurrency(memberBonus.total_matching_level2_balance || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Coin</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCoin(memberBonus.total_matching_level2_coin || 0) }}</div>
                                </div>
                              </div>
                              <div class="bg-white rounded border border-amber-200 overflow-hidden">
                                <div class="max-h-48 overflow-y-auto">
                                  <table class="w-full text-xs">
                                    <thead class="bg-amber-100 sticky top-0">
                                      <tr>
                                        <th class="px-2 py-1.5 text-left font-semibold text-amber-700">Tanggal</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-amber-700">USDT</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-amber-700">Coin</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-amber-700">Downline</th>
                                      </tr>
                                    </thead>
                                    <tbody class="divide-y divide-amber-100/30">
                                      <tr v-if="getMatchingTransactions(memberBonus, 2).length === 0">
                                        <td colspan="4" class="px-2 py-3 text-center text-gray-400 text-xs">Tidak ada data</td>
                                      </tr>
                                      <tr v-for="tx in getMatchingTransactions(memberBonus, 2)" :key="tx.id" class="hover:bg-amber-50/30">
                                        <td class="px-2 py-1.5">
                                          <div class="text-xs">{{ formatDateWithTimezone(tx.created_at) }}</div>
                                        </td>
                                        <td class="px-2 py-1.5 font-medium">{{ formatCurrency(tx.bonus_balance || 0) }}</td>
                                        <td class="px-2 py-1.5">{{ formatCoin(tx.bonus_coin || 0) }}</td>
                                        <td class="px-2 py-1.5 text-xs">
                                          <span v-if="tx.downline_member" class="text-amber-700 font-medium">{{ tx.downline_member.username }}</span>
                                          <span v-else class="text-gray-400">-</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Matching Level 3 Card -->
                          <div class="bg-gradient-to-br from-yellow-50/30 to-yellow-100/30 rounded-lg border border-yellow-200 shadow-sm overflow-hidden">
                            <div class="bg-yellow-500/80 px-4 py-2">
                              <h4 class="font-bold text-white text-sm flex items-center gap-2">
                                <Icon name="users" size="sm" />
                                Matching Level 3 ({{ bonusPercentages.matching_level3_percentage }}%)
                              </h4>
                            </div>
                            <div class="p-4">
                              <div class="grid grid-cols-3 gap-3 mb-3">
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Total</div>
                                  <div class="font-bold text-yellow-700 text-sm">{{ formatCurrency(memberBonus.total_matching_level3 || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">USDT</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCurrency(memberBonus.total_matching_level3_balance || 0) }}</div>
                                </div>
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Coin</div>
                                  <div class="font-bold text-gray-800 text-sm">{{ formatCoin(memberBonus.total_matching_level3_coin || 0) }}</div>
                                </div>
                              </div>
                              <div class="bg-white/50 rounded border border-yellow-200/50 overflow-hidden">
                                <div class="max-h-48 overflow-y-auto">
                                  <table class="w-full text-xs">
                                    <thead class="bg-yellow-50/50 sticky top-0">
                                      <tr>
                                        <th class="px-2 py-1.5 text-left font-semibold text-yellow-700">Tanggal (UTC / WIB)</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-yellow-700">USDT</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-yellow-700">Coin</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-yellow-700">Downline</th>
                                      </tr>
                                    </thead>
                                    <tbody class="divide-y divide-yellow-100">
                                      <tr v-if="getMatchingTransactions(memberBonus, 3).length === 0">
                                        <td colspan="4" class="px-2 py-3 text-center text-gray-400 text-xs">Tidak ada data</td>
                                      </tr>
                                      <tr v-for="tx in getMatchingTransactions(memberBonus, 3)" :key="tx.id" class="hover:bg-yellow-50/30">
                                        <td class="px-2 py-1.5">
                                          <div class="text-xs">{{ formatDateWithTimezone(tx.created_at) }}</div>
                                        </td>
                                        <td class="px-2 py-1.5 font-medium">{{ formatCurrency(tx.bonus_balance || 0) }}</td>
                                        <td class="px-2 py-1.5">{{ formatCoin(tx.bonus_coin || 0) }}</td>
                                        <td class="px-2 py-1.5 text-xs">
                                          <span v-if="tx.downline_member" class="text-yellow-700 font-medium">{{ tx.downline_member.username }}</span>
                                          <span v-else class="text-gray-400">-</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>

                          <!-- Bonus Loyalty Card -->
                          <div class="bg-gradient-to-br from-emerald-50/30 to-emerald-100/30 rounded-lg border border-emerald-200 shadow-sm overflow-hidden">
                            <div class="bg-emerald-500/80 px-4 py-2">
                              <h4 class="font-bold text-white text-sm flex items-center gap-2">
                                <Icon name="star" size="sm" />
                                Bonus Loyalty
                              </h4>
                            </div>
                            <div class="p-4">
                              <div class="grid grid-cols-1 gap-3 mb-3">
                                <div class="bg-white/60 rounded p-2">
                                  <div class="text-xs text-gray-600">Total Loyalty</div>
                                  <div class="font-bold text-emerald-700 text-sm">{{ formatCoin(memberBonus.bonus_pasif_loyalty || 0) }} {{ coinInfo ? coinInfo.coin_code : '' }}</div>
                                </div>
                              </div>
                              
                              <!-- Loyalty Breakdown by Downline Level -->
                              <div class="bg-white/50 rounded border border-emerald-200/50 overflow-hidden mb-3">
                                <div class="bg-emerald-100/50 px-3 py-2 border-b border-emerald-200/50">
                                  <h5 class="text-xs font-bold text-emerald-800">Detail Perhitungan per Downline</h5>
                                </div>
                                <div class="max-h-64 overflow-y-auto">
                                  <table class="w-full text-xs">
                                    <thead class="bg-emerald-50/50 sticky top-0">
                                      <tr>
                                        <th class="px-2 py-1.5 text-left font-semibold text-emerald-700">No</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-emerald-700">Member</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-emerald-700">Level</th>
                                        <th class="px-2 py-1.5 text-right font-semibold text-emerald-700">%</th>
                                        <th class="px-2 py-1.5 text-right font-semibold text-emerald-700">Multiplier Reward</th>
                                        <th class="px-2 py-1.5 text-right font-semibold text-emerald-700">Loyalty Bonus</th>
                                      </tr>
                                    </thead>
                                    <tbody class="divide-y divide-emerald-100/30">
                                      <tr v-if="!memberBonus.loyalty_breakdown || memberBonus.loyalty_breakdown.length === 0">
                                        <td colspan="6" class="px-2 py-3 text-center text-gray-400 text-xs">Tidak ada downline dengan multiplier reward</td>
                                      </tr>
                                      <tr v-for="breakdown in (memberBonus.loyalty_breakdown || [])" :key="`${breakdown.member_id}-${breakdown.level}`" class="hover:bg-emerald-50/30">
                                        <td class="px-2 py-1.5 font-medium text-emerald-700">{{ breakdown.index }}</td>
                                        <td class="px-2 py-1.5">
                                          <div class="flex flex-col">
                                            <span class="font-semibold text-gray-800">{{ breakdown.member_username }}</span>
                                            <span class="text-xs text-gray-500">{{ breakdown.member_email }}</span>
                                          </div>
                                        </td>
                                        <td class="px-2 py-1.5">
                                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                            :class="breakdown.level === 0 ? 'bg-blue-100 text-blue-800' : 
                                                    breakdown.level === 1 ? 'bg-purple-100 text-purple-800' : 
                                                    breakdown.level === 2 ? 'bg-orange-100 text-orange-800' : 
                                                    'bg-gray-100 text-gray-800'">
                                            Level {{ breakdown.level }}
                                          </span>
                                        </td>
                                        <td class="px-2 py-1.5 text-right font-medium">
                                          <span :class="breakdown.level === 0 || breakdown.level === 1 ? 'text-blue-700 font-bold' : 'text-orange-700 font-bold'">
                                            {{ breakdown.percentage.toFixed(2) }}%
                                          </span>
                                        </td>
                                        <td class="px-2 py-1.5 text-right font-medium">{{ formatCurrency(breakdown.multiplier_reward || 0) }}</td>
                                        <td class="px-2 py-1.5 text-right font-bold text-emerald-700">{{ formatCoin(breakdown.loyalty_bonus || 0) }} {{ coinInfo ? coinInfo.coin_code : '' }}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <!-- Loyalty Reward History -->
                              <div class="bg-white/50 rounded border border-emerald-200/50 overflow-hidden">
                                <div class="bg-emerald-100/50 px-3 py-2 border-b border-emerald-200/50">
                                  <h5 class="text-xs font-bold text-emerald-800">Riwayat Reward Loyalty</h5>
                                </div>
                                <div class="max-h-48 overflow-y-auto">
                                  <table class="w-full text-xs">
                                    <thead class="bg-emerald-50/50 sticky top-0">
                                      <tr>
                                        <th class="px-2 py-1.5 text-left font-semibold text-emerald-700">Tanggal (UTC / WIB)</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-emerald-700">Reward Amount</th>
                                        <th class="px-2 py-1.5 text-left font-semibold text-emerald-700">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody class="divide-y divide-emerald-100/30">
                                      <tr v-if="getLoyaltyTransactions(memberBonus).length === 0">
                                        <td colspan="3" class="px-2 py-3 text-center text-gray-400 text-xs">Tidak ada data</td>
                                      </tr>
                                      <tr v-for="tx in getLoyaltyTransactions(memberBonus)" :key="tx.id" class="hover:bg-emerald-50/30">
                                        <td class="px-2 py-1.5">
                                          <div class="text-xs">{{ formatDateWithTimezone(tx.created_at || tx.reward_date) }}</div>
                                        </td>
                                        <td class="px-2 py-1.5 font-medium text-emerald-700">{{ formatCoin(tx.reward_amount || 0) }} {{ coinInfo ? coinInfo.coin_code : '' }}</td>
                                        <td class="px-2 py-1.5">
                                          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Paid</span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Bonus Pasif Summary - Full Width -->
                        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg overflow-hidden">
                          <div class="px-4 py-3 bg-blue-700/30">
                            <h4 class="font-bold text-white text-sm flex items-center gap-2">
                              <Icon name="currency-dollar" size="sm" />
                              Total Bonus Pasif
                            </h4>
                          </div>
                          <div class="p-4">
                            <div class="grid grid-cols-3 gap-4">
                              <div class="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                                <div class="text-xs text-blue-100 mb-1">USDT</div>
                                <div class="font-bold text-white text-lg">{{ formatCurrency(memberBonus.bonus_pasif_usdt || 0) }}</div>
                                <div class="text-xs text-blue-100 mt-1">Referral + Matching</div>
                              </div>
                              <div class="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                                <div class="text-xs text-blue-100 mb-1">Coin {{ coinInfo ? coinInfo.coin_code : '' }}</div>
                                <div class="font-bold text-white text-lg">{{ formatCoin(memberBonus.bonus_pasif_coin || 0) }}</div>
                                <div class="text-xs text-blue-100 mt-1">Referral + Matching</div>
                              </div>
                              <div class="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                                <div class="text-xs text-blue-100 mb-1">Loyalty</div>
                                <div class="font-bold text-white text-lg">{{ formatCoin(memberBonus.bonus_pasif_loyalty || 0) }} {{ coinInfo ? coinInfo.coin_code : '' }}</div>
                                <div class="text-xs text-blue-100 mt-1">Dari Multiplier Downline</div>
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
const coinInfo = ref(null)
// Search and Filters
const searchQuery = ref('')
const searchTimeout = ref(null)
const selectedMemberType = ref('')
const selectedBonusFilter = ref('')

// Expanded Rows
const expandedRows = ref(new Set())

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(25)

// Calculate Loyalty Bonus
const isCalculatingLoyalty = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Fetch bonus report
const fetchBonusReport = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch('/api/admin/bonus-active-report')
    
    console.log('Bonus report response:', response)
    
    if (response && response.success) {
      bonusList.value = response.data || []
      summary.value = response.summary || { total_bonus: 0, total_members: 0, total_balance: 0 }
      bonusPercentages.value = response.bonus_percentages || {
        referral_percentage: 15,
        matching_level1_percentage: 10,
        matching_level2_percentage: 5,
        matching_level3_percentage: 2
      }
      coinInfo.value = response.coin_info || null
      console.log('Loaded bonus list:', bonusList.value.length, 'members')
      console.log('Summary:', summary.value)
      // Reset to first page when new data is loaded
      currentPage.value = 1
    } else {
      errorMessage.value = response?.message || 'Gagal memuat data bonus'
      console.error('API returned unsuccessful response:', response)
    }
  } catch (error) {
    console.error('Error fetching bonus report:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data bonus'
  } finally {
    loading.value = false
  }
}

// Calculate Loyalty Bonus
const calculateLoyaltyBonus = async () => {
  if (isCalculatingLoyalty.value) return
  
  isCalculatingLoyalty.value = true
  errorMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/calculate-loyalty-bonus', {
      method: 'POST'
    })
    
    if (response && response.success) {
      // Show success message
      alert(`Berhasil menghitung bonus loyalty untuk ${response.processed || 0} member`)
      // Refresh bonus report to show updated loyalty bonuses
      await fetchBonusReport()
    } else {
      errorMessage.value = response?.message || 'Gagal menghitung bonus loyalty'
    }
  } catch (error) {
    console.error('Error calculating loyalty bonus:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal menghitung bonus loyalty'
    alert('Error: ' + (error?.data?.message || error?.message || 'Gagal menghitung bonus loyalty'))
  } finally {
    isCalculatingLoyalty.value = false
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

const formatCoin = (amount) => {
  if (!amount || amount === 0) return '0.00'
  const numValue = typeof amount === 'number' ? amount : parseFloat(amount)
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

const formatDateWithTimezone = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  
  // Format UTC
  const utcDate = date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC',
    hour12: false
  }).replace(/,/g, '')
  
  // Format WIB (Asia/Jakarta = UTC+7)
  const wibDate = date.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Jakarta',
    hour12: false
  })
  
  return `${utcDate} UTC / ${wibDate} WIB`
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

// Toggle Expanded Row
const toggleExpanded = (memberId) => {
  if (expandedRows.value.has(memberId)) {
    expandedRows.value.delete(memberId)
  } else {
    expandedRows.value.add(memberId)
  }
}

// Helper functions untuk filter transactions
const getReferralTransactions = (memberBonus) => {
  if (!memberBonus || !memberBonus.transactions) return []
  return memberBonus.transactions.filter(tx => tx.bonus_type === 'referral')
}

const getMatchingTransactions = (memberBonus, level) => {
  if (!memberBonus || !memberBonus.transactions) return []
  return memberBonus.transactions.filter(tx => tx.bonus_type === `matching_level${level}` || (tx.level === level && tx.bonus_type?.includes('matching')))
}

const getLoyaltyTransactions = (memberBonus) => {
  if (!memberBonus || !memberBonus.transactions) return []
  return memberBonus.transactions.filter(tx => tx.bonus_type === 'loyalty')
}

// Load data on mount
onMounted(() => {
  fetchBonusReport()
})
</script>

