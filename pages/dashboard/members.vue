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
            Konten Member
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
                  placeholder="Cari email, username..."
                  class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <button 
              @click="openAddModal"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition whitespace-nowrap shadow-sm"
            >
              <Icon name="plus" size="sm" />
              Tambah Member
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

        <!-- Data Table Card -->
        <div v-else class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <!-- Table Header -->
          <div class="p-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-800">
                Daftar Member ({{ filteredMembers.length }})
              </h2>
              <div v-if="coinInfo" class="flex items-center gap-3 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">Coin:</span>
                  <span class="font-semibold text-gray-800">{{ coinInfo.coin_name }}</span>
                  <span class="text-gray-500">({{ coinInfo.coin_code }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-center py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-16">No</th>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Member</th>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Referral Code</th>
                  <th class="text-center py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Referral</th>
                  <th class="text-center py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
                  <th class="text-center py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Withdraw</th>
                  <th class="text-right py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Deposit USDT</th>
                  <th class="text-right py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Coin Deposit {{ coinInfo ? coinInfo.coin_code : '' }}
                  </th>
                  <th class="text-right py-3.5 px-4 text-sm font-bold text-gray-800 uppercase tracking-wider border-2 border-purple-300 bg-purple-100 min-w-[180px]">Bonus Aktif</th>
                  <th class="text-right py-3.5 px-4 text-sm font-bold text-gray-800 uppercase tracking-wider border-2 border-emerald-300 bg-emerald-100 min-w-[180px]">Bonus Pasif</th>
                  <th class="text-right py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Status Coin Withdraw
                  </th>
                  <th class="text-right py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Status Bonus Referral Withdraw
                  </th>
                  <th class="text-right py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Status Coin Staking
                  </th>
                  <th class="text-left py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">Tanggal Daftar</th>
                  <th class="text-center py-3.5 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Aksi</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="(member, index) in paginatedMembers" 
                  :key="member.id"
                  class="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td class="py-4 px-4 text-sm text-gray-600 font-medium text-center">{{ paginationStart + index + 1 }}</td>
                  <td class="py-4 px-5">
                    <div class="flex flex-col gap-1.5">
                      <div class="flex items-center gap-2">
                        <div class="text-gray-900 font-semibold text-sm">{{ member.username }}</div>
                        <span 
                          :class="[
                            'px-2.5 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap',
                            member.member_type === 'vip' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : member.member_type === 'leader'
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          ]"
                        >
                          {{ member.member_type === 'vip' ? 'VIP' : member.member_type === 'leader' ? 'Leader' : 'Normal' }}
                        </span>
                      </div>
                      <div class="text-gray-600 text-xs">{{ member.email }}</div>
                    </div>
                  </td>
                  <td class="py-4 px-5 text-gray-600 font-mono text-sm whitespace-nowrap">{{ member.referral_code || '-' }}</td>
                  <td class="py-4 px-4 text-center">
                    <button
                      v-if="member.total_downline > 0"
                      @click="openReferralsModal(member)"
                      class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition cursor-pointer flex items-center gap-1 mx-auto"
                      title="Klik untuk melihat daftar referral"
                    >
                      <Icon name="users" size="sm" />
                      {{ member.total_downline }}
                    </button>
                    <span v-else class="text-gray-400 text-sm">0</span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <span 
                      :class="[
                        'px-2.5 py-1 rounded-full text-xs font-semibold inline-block',
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : member.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      ]"
                    >
                      {{ member.status === 'active' ? 'Aktif' : member.status === 'pending' ? 'Pending' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-center">
                    <div class="flex flex-col gap-1 items-center">
                      <span 
                        :class="[
                          'px-2 py-0.5 rounded text-xs font-medium inline-block whitespace-nowrap',
                          member.bonus_aktif_withdraw_enabled !== false
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        ]"
                        title="Bonus Aktif Withdraw"
                      >
                        Aktif: {{ member.bonus_aktif_withdraw_enabled !== false ? 'Enable' : 'Disable' }}
                      </span>
                      <span 
                        :class="[
                          'px-2 py-0.5 rounded text-xs font-medium inline-block whitespace-nowrap',
                          member.bonus_pasif_withdraw_enabled !== false
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        ]"
                        title="Bonus Pasif Withdraw"
                      >
                        Pasif: {{ member.bonus_pasif_withdraw_enabled !== false ? 'Enable' : 'Disable' }}
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-gray-800 font-medium whitespace-nowrap text-right" title="Total deposit USDT dari tabel deposits (status: completed)">
                    <span class="font-semibold">{{ formatCurrency(member.total_deposit_usdt || 0) }}</span>
                  </td>
                  <td class="py-4 px-4 text-gray-800 font-medium whitespace-nowrap text-right" title="Coin dari deposit saja">
                    <span class="font-semibold">{{ formatCoin(member.total_coin_from_deposits || 0) }}</span>
                    <span v-if="coinInfo" class="text-gray-500 text-xs ml-1">{{ coinInfo.coin_code }}</span>
                  </td>
                  <td class="py-4 px-4 bg-purple-50/50 border-2 border-purple-200 min-w-[180px]">
                    <div class="flex flex-col gap-2">
                      <!-- USDT (selalu tampilkan, termasuk 0) + convert ke coin -->
                      <div 
                        class="text-xs flex flex-col items-end gap-0.5"
                        title="Bonus Aktif USDT (Referral 80% + Matching 80%)"
                      >
                        <div class="flex items-center justify-end gap-1.5">
                          <span class="text-blue-600 font-bold whitespace-nowrap">USDT:</span> 
                          <span class="text-gray-800 font-semibold">{{ formatCurrency((member.referral_bonus_usdt || 0) + (member.matching_bonus_usdt || 0)) }}</span>
                        </div>
                        <div class="flex items-center justify-end gap-1 text-gray-500 text-xs">
                          <span>convert ke coin =</span>
                          <span class="font-medium">{{ formatCoin(getMemberCoinPrice(member) > 0 ? ((member.referral_bonus_usdt || 0) + (member.matching_bonus_usdt || 0)) / getMemberCoinPrice(member) : 0) }}</span>
                        </div>
                      </div>
                      <!-- Coin (selalu tampilkan, termasuk 0) -->
                      <div 
                        class="text-xs flex items-center justify-end gap-1.5"
                        title="Bonus Aktif Coin (Referral 20% + Matching 20%)"
                      >
                        <span class="text-purple-600 font-bold whitespace-nowrap">Coin {{ coinInfo ? coinInfo.coin_code : '' }}:</span> 
                        <span class="text-gray-800 font-semibold">{{ formatCoin((member.referral_bonus_coin || 0) + (member.matching_bonus_coin || 0)) }}</span>
                      </div>
                      <!-- Loyalty (selalu tampilkan, termasuk 0) -->
                      <div 
                        class="text-xs flex items-center justify-end gap-1.5"
                        title="Bonus Loyalty (dari multiplier rewards downline)"
                      >
                        <span class="text-orange-600 font-bold whitespace-nowrap">Loyalty:</span> 
                        <span class="text-gray-800 font-semibold">{{ formatCoin(member.loyalty_bonus || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs">{{ coinInfo.coin_code }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4 bg-emerald-50/50 border-2 border-emerald-200 min-w-[180px]">
                    <div class="flex flex-col gap-2">
                      <!-- Staking Reward -->
                      <div 
                        class="text-xs flex items-center justify-end gap-1.5"
                        title="Reward Staking (total dari staking yang sudah paid)"
                      >
                        <span class="text-green-600 font-bold whitespace-nowrap">Reward Staking:</span> 
                        <span class="text-gray-800 font-semibold">{{ formatCoin(member.staking_reward_paid || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs">{{ coinInfo.coin_code }}</span>
                      </div>
                      <!-- Staking Multiplier Reward -->
                      <div 
                        class="text-xs flex items-center justify-end gap-1.5"
                        title="Reward Staking Multiplier (total dari staking multiplier yang sudah paid)"
                      >
                        <span class="text-indigo-600 font-bold whitespace-nowrap">Reward Staking Multiplier:</span> 
                        <span class="text-gray-800 font-semibold">{{ formatCoin(member.staking_multiplier_reward_paid || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs">{{ coinInfo.coin_code }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col gap-2 text-right">
                      <div class="text-xs flex items-center justify-end gap-1.5">
                        <span class="text-gray-600 font-medium">Coin Ready WD:</span>
                        <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold inline-flex items-center gap-1">
                          <span>{{ formatCoin(Math.max(0, (member.total_coin_member || 0) - ((member.total_staking_coin || 0) + (member.total_staking_multiplier_coin || 0)))) }}</span>
                          <span v-if="coinInfo" class="text-green-600">{{ coinInfo.coin_code }}</span>
                        </span>
                      </div>
                      <div class="text-xs">
                        <span class="text-gray-600 font-medium">WD Coin:</span>
                        <span class="text-gray-800 font-semibold ml-1.5">{{ formatCoin(member.withdraw_coin || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs ml-1">{{ coinInfo.coin_code }}</span>
                      </div>
                      <div class="text-xs flex items-center justify-end gap-1.5">
                        <span class="text-gray-600 font-medium">Sisa Coin:</span>
                        <span class="text-gray-800 font-semibold ml-1.5">{{ formatCoin(Math.max(0, (Math.max(0, (member.total_coin_member || 0) - ((member.total_staking_coin || 0) + (member.total_staking_multiplier_coin || 0)))) - (member.withdraw_coin || 0))) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs ml-1">{{ coinInfo.coin_code }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col gap-2 text-right">
                      <div class="text-xs">
                        <span class="text-gray-600 font-medium">Saldo Bonus Referral USDT:</span>
                        <span class="text-blue-600 font-semibold ml-1.5">{{ formatCurrency((member.referral_bonus_usdt || 0) + (member.matching_bonus_usdt || 0)) }}</span>
                      </div>
                      <div class="text-xs">
                        <span class="text-gray-600 font-medium">Total USDT WD:</span>
                        <span class="text-gray-800 font-semibold ml-1.5">{{ formatCurrency(member.withdraw_bonus_referral_usdt || 0) }}</span>
                      </div>
                      <div class="text-xs pb-2 border-b border-gray-200">
                        <span class="text-gray-600 font-medium">Sisa Bonus Referral:</span>
                        <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold inline-flex items-center gap-1">
                          <span>{{ formatCurrency(Math.max(0, ((member.referral_bonus_usdt || 0) + (member.matching_bonus_usdt || 0)) - (member.withdraw_bonus_referral_usdt || 0))) }}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col gap-2 text-right">
                      <div class="text-xs pb-2 border-b border-gray-200">
                        <span class="text-gray-600 font-medium">Total Coin Member:</span>
                        <span class="text-gray-800 font-semibold ml-1.5">{{ formatCoin(member.total_coin_member || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs ml-1">{{ coinInfo.coin_code }}</span>
                      </div>
                      <div class="text-xs">
                        <span class="text-gray-600 font-medium">Staking:</span>
                        <span class="text-gray-800 font-semibold ml-1.5">{{ formatCoin(member.total_staking_coin || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs ml-1">{{ coinInfo.coin_code }}</span>
                      </div>
                      <div class="text-xs">
                        <span class="text-gray-600 font-medium">Multiplier:</span>
                        <span class="text-gray-800 font-semibold ml-1.5">{{ formatCoin(member.total_staking_multiplier_coin || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs ml-1">{{ coinInfo.coin_code }}</span>
                      </div>
                      <div class="text-xs">
                        <span class="text-gray-600 font-medium">Free:</span>
                        <span class="text-gray-800 font-semibold ml-1.5">{{ formatCoin(member.free_coins || 0) }}</span>
                        <span v-if="coinInfo" class="text-gray-500 text-xs ml-1">{{ coinInfo.coin_code }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-gray-600 text-sm whitespace-nowrap">
                    {{ formatDate(member.created_at) }}
                  </td>
                  <td class="py-4 px-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button 
                        @click="openEditModal(member)"
                        class="flex items-center gap-1 px-2 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition text-sm font-medium"
                        title="Edit Member"
                      >
                        <Icon name="edit" size="sm" />
                        <span class="hidden sm:inline">Edit</span>
                      </button>
                      <button 
                        @click="confirmDelete(member)"
                        class="flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition text-sm font-medium"
                        title="Hapus Member"
                      >
                        <Icon name="delete" size="sm" />
                        <span class="hidden sm:inline">Hapus</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredMembers.length === 0">
                  <td colspan="15" class="py-12 px-5 text-center text-gray-400 text-sm">
                    {{ errorMessage || 'Tidak ada data member' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredMembers.length > 0" class="px-6 py-4 border-t border-gray-200">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
              <!-- Info & Items Per Page -->
              <div class="flex flex-col sm:flex-row items-center gap-4">
                <div class="text-sm text-gray-700">
                  Menampilkan <span class="font-semibold">{{ paginationStart + 1 }}</span> - 
                  <span class="font-semibold">{{ Math.min(paginationEnd, filteredMembers.length) }}</span> dari 
                  <span class="font-semibold">{{ filteredMembers.length }}</span> member
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
      </main>
    </div>

    <!-- Add Member Modal -->
    <div 
      v-if="showAddModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeAddModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Tambah Member Baru</h3>
        </div>
        <form @submit.prevent="handleAddMember" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              v-model="addForm.email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username *</label>
            <input
              v-model="addForm.username"
              type="text"
              required
              minlength="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              placeholder="username"
            />
            <p class="text-xs text-gray-500 mt-1">Minimal 3 karakter, hanya huruf, angka, dan underscore</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <input
              v-model="addForm.password"
              type="password"
              required
              minlength="6"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Referral Code</label>
            <input
              v-model="addForm.referral_code"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              placeholder="Kosongkan untuk auto-generate"
            />
            <p class="text-xs text-gray-500 mt-1">Kosongkan untuk auto-generate, atau masukkan kode unik</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Referred By (ID atau Referral Code)</label>
            <input
              v-model="addForm.referred_by"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              placeholder="UUID atau referral code"
            />
            <p class="text-xs text-gray-500 mt-1">Opsional: ID member atau referral code yang mereferensikan member ini</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
            <select
              v-model="addForm.member_type"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="normal">Normal</option>
              <option value="leader">Leader</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="addForm.status"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <!-- Withdraw Settings -->
          <div class="border-t border-gray-200 pt-4 mt-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Withdraw Settings</h3>
            
            <!-- Bonus Aktif Withdraw -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">
                  Bonus Aktif Withdraw
                </label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="addForm.bonus_aktif_withdraw_enabled"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span class="ml-3 text-sm text-gray-700">
                    {{ addForm.bonus_aktif_withdraw_enabled ? 'Enable' : 'Disable' }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Bonus Pasif Withdraw -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">
                  Bonus Pasif Withdraw
                </label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="addForm.bonus_pasif_withdraw_enabled"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span class="ml-3 text-sm text-gray-700">
                    {{ addForm.bonus_pasif_withdraw_enabled ? 'Enable' : 'Disable' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div v-if="addError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ addError }}</p>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <button
              type="submit"
              :disabled="isAdding"
              class="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {{ isAdding ? 'Menambahkan...' : 'Tambah Member' }}
            </button>
            <button
              type="button"
              @click="closeAddModal"
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
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-800">Edit Member</h3>
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
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              v-model="editForm.email"
              type="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              v-model="editForm.username"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Kode Referral</label>
            <input
              v-model="editForm.referral_code"
              type="text"
              placeholder="Masukkan kode referral"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono"
            />
            <p class="text-xs text-gray-500 mt-1">Kode referral harus unik</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
            <select
              v-model="editForm.member_type"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="normal">Normal</option>
              <option value="leader">Leader</option>
              <option value="vip">VIP</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">VIP and Leader members get special benefits</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="editForm.status"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <!-- Withdraw Settings -->
          <div class="border-t border-gray-200 pt-4 mt-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Withdraw Settings</h3>
            
            <!-- Bonus Aktif Withdraw -->
            <div class="mb-4">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">
                  Bonus Aktif Withdraw
                </label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="editForm.bonus_aktif_withdraw_enabled"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span class="ml-3 text-sm text-gray-700">
                    {{ editForm.bonus_aktif_withdraw_enabled ? 'Enable' : 'Disable' }}
                  </span>
                </label>
              </div>
              <p class="text-xs text-gray-500">
                {{ editForm.bonus_aktif_withdraw_enabled ? 'Member bisa withdraw bonus aktif' : 'Member tidak bisa withdraw bonus aktif' }}
              </p>
            </div>

            <!-- Bonus Pasif Withdraw -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-gray-700">
                  Bonus Pasif Withdraw
                </label>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    v-model="editForm.bonus_pasif_withdraw_enabled"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span class="ml-3 text-sm text-gray-700">
                    {{ editForm.bonus_pasif_withdraw_enabled ? 'Enable' : 'Disable' }}
                  </span>
                </label>
              </div>
              <p class="text-xs text-gray-500">
                {{ editForm.bonus_pasif_withdraw_enabled ? 'Member bisa withdraw bonus pasif' : 'Member tidak bisa withdraw bonus pasif' }}
              </p>
            </div>
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

    <!-- Referrals Modal -->
    <MembersReferralsModal
      :show="showReferralsModal"
      :member="selectedMember"
      :referrals="referralsList"
      :loading="loadingReferrals"
      :error="referralsError"
      :history="referralsHistory"
      @close="closeReferralsModal"
      @view-referrals="viewNestedReferrals"
      @navigate-back="navigateBackReferrals"
    />

    <!-- Delete Confirmation Modal -->
    <div 
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div class="p-6">
          <h3 class="text-xl font-semibold text-gray-800 mb-2">Hapus Member</h3>
          <p class="text-gray-600 mb-6">
            Apakah Anda yakin ingin menghapus member <strong>{{ memberToDelete?.email }}</strong>? 
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
const searchQuery = ref('')
const loading = ref(true)
const members = ref([])
const errorMessage = ref('')
const coinInfo = ref(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isAdding = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const addError = ref('')
const updateError = ref('')
const deleteError = ref('')
const memberToDelete = ref(null)

// Referrals Modal
const showReferralsModal = ref(false)
const selectedMember = ref(null)
const referralsList = ref([])
const loadingReferrals = ref(false)
const referralsError = ref('')
const referralsHistory = ref([]) // Stack untuk nested referrals

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(25)

const addForm = ref({
  email: '',
  username: '',
  password: '',
  referral_code: '',
  referred_by: '',
  member_type: 'normal',
  status: 'active',
  bonus_aktif_withdraw_enabled: true,
  bonus_pasif_withdraw_enabled: true
})

const editForm = ref({
  id: '',
  email: '',
  username: '',
  referral_code: '',
  member_type: 'normal',
  status: 'active',
  bonus_aktif_withdraw_enabled: true,
  bonus_pasif_withdraw_enabled: true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Fetch members
const fetchMembers = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/members')
    if (response.success) {
      members.value = response.data || []
      coinInfo.value = response.coin_info || null
    } else {
      errorMessage.value = response.message || 'Gagal memuat data member'
    }
  } catch (error) {
    console.error('Error fetching members:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data member'
    members.value = []
  } finally {
    loading.value = false
  }
}

// Filter members
const filteredMembers = computed(() => {
  let result = members.value.map(member => ({
    ...member,
    withdraw_coin: member.withdraw_coin || 0,
    convert_withdraw_usdt: member.convert_withdraw_usdt || 0,
    status_coin_staking: member.status_coin_staking || 0,
    total_staking_coin: member.total_staking_coin || 0,
    total_staking_multiplier_coin: member.total_staking_multiplier_coin || 0,
    free_coins: member.free_coins || 0,
    total_coin_member: member.total_coin_member || 0,
    total_coin_pasif: member.total_coin_pasif || 0,
    total_coin_aktif: member.total_coin_aktif || 0
  }))
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(member => 
      member.email?.toLowerCase().includes(query) ||
      member.username?.toLowerCase().includes(query) ||
      member.referral_code?.toLowerCase().includes(query)
    )
  }
  // Reset to first page when search changes
  if (currentPage.value > 1 && Math.ceil(result.length / itemsPerPage.value) < currentPage.value) {
    currentPage.value = 1
  }
  return result
})

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

// Format currency
const formatCurrency = (amount) => {
  if (!amount || amount === 0) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format coin
const formatCoin = (amount) => {
  if (!amount || amount === 0) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Get coin price for member based on member_type
const getMemberCoinPrice = (member) => {
  if (!coinInfo.value || !member) return 0.5 // default
  
  if (member.member_type === 'vip' && coinInfo.value.vip_price_usdt) {
    return parseFloat(coinInfo.value.vip_price_usdt) || 0.5
  } else if (member.member_type === 'leader' && coinInfo.value.leader_price_usdt) {
    return parseFloat(coinInfo.value.leader_price_usdt) || 0.5
  } else {
    return parseFloat(coinInfo.value.normal_price_usdt) || 0.5
  }
}

// Add modal
const openAddModal = () => {
  addForm.value = {
    email: '',
    username: '',
    password: '',
    referral_code: '',
    referred_by: '',
    member_type: 'normal',
    status: 'active',
    bonus_aktif_withdraw_enabled: true,
    bonus_pasif_withdraw_enabled: true
  }
  addError.value = ''
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  addError.value = ''
}

const handleAddMember = async () => {
  isAdding.value = true
  addError.value = ''
  
  try {
    const response = await $fetch('/api/admin/members', {
      method: 'POST',
      body: {
        email: addForm.value.email,
        username: addForm.value.username,
        password: addForm.value.password,
        referral_code: addForm.value.referral_code || undefined,
        referred_by: addForm.value.referred_by || undefined,
        member_type: addForm.value.member_type,
        status: addForm.value.status,
        bonus_aktif_withdraw_enabled: addForm.value.bonus_aktif_withdraw_enabled,
        bonus_pasif_withdraw_enabled: addForm.value.bonus_pasif_withdraw_enabled
      }
    })
    
    if (response.success) {
      closeAddModal()
      await fetchMembers()
    }
  } catch (error) {
    console.error('Error adding member:', error)
    addError.value = error?.data?.message || error?.message || 'Gagal menambahkan member'
  } finally {
    isAdding.value = false
  }
}

// Edit modal
const openEditModal = (member) => {
  editForm.value = {
    id: member.id,
    email: member.email,
    username: member.username,
    referral_code: member.referral_code || '',
    member_type: member.member_type || 'normal',
    status: member.status || 'active',
    bonus_aktif_withdraw_enabled: member.bonus_aktif_withdraw_enabled !== undefined ? member.bonus_aktif_withdraw_enabled : true,
    bonus_pasif_withdraw_enabled: member.bonus_pasif_withdraw_enabled !== undefined ? member.bonus_pasif_withdraw_enabled : true
  }
  updateError.value = ''
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editForm.value = {
    id: '',
    email: '',
    username: '',
    referral_code: '',
    member_type: 'normal',
    status: 'active',
    bonus_aktif_withdraw_enabled: true,
    bonus_pasif_withdraw_enabled: true
  }
  updateError.value = ''
}

const handleUpdate = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    const response = await $fetch(`/api/admin/members/${editForm.value.id}`, {
      method: 'PUT',
      body: {
        email: editForm.value.email,
        username: editForm.value.username,
        referral_code: editForm.value.referral_code || null,
        member_type: editForm.value.member_type,
        status: editForm.value.status,
        bonus_aktif_withdraw_enabled: editForm.value.bonus_aktif_withdraw_enabled,
        bonus_pasif_withdraw_enabled: editForm.value.bonus_pasif_withdraw_enabled
      }
    })

    if (response.success) {
      // Update local data
      const index = members.value.findIndex(m => m.id === editForm.value.id)
      if (index !== -1) {
        members.value[index] = { ...members.value[index], ...editForm.value }
      }
      closeEditModal()
    } else {
      updateError.value = response.message || 'Gagal mengupdate member'
    }
  } catch (error) {
    console.error('Error updating member:', error)
    updateError.value = error?.data?.message || error?.message || 'Gagal mengupdate member'
  } finally {
    isUpdating.value = false
  }
}

// Delete modal
const confirmDelete = (member) => {
  memberToDelete.value = member
  deleteError.value = ''
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  memberToDelete.value = null
  deleteError.value = ''
}

const handleDelete = async () => {
  if (!memberToDelete.value) return

  isDeleting.value = true
  deleteError.value = ''

  try {
    const response = await $fetch(`/api/admin/members/${memberToDelete.value.id}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // Remove from local data
      members.value = members.value.filter(m => m.id !== memberToDelete.value.id)
      closeDeleteModal()
    } else {
      deleteError.value = response.message || 'Gagal menghapus member'
    }
  } catch (error) {
    console.error('Error deleting member:', error)
    deleteError.value = error?.data?.message || error?.message || 'Gagal menghapus member'
  } finally {
    isDeleting.value = false
  }
}

// Pagination computed properties
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredMembers.value.length / itemsPerPage.value))
})

const paginationStart = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value
})

const paginationEnd = computed(() => {
  return paginationStart.value + itemsPerPage.value
})

const paginatedMembers = computed(() => {
  return filteredMembers.value.slice(paginationStart.value, paginationEnd.value)
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
    if (current <= 4) {
      // Show first 5 pages
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
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

// Referrals Modal Functions
const openReferralsModal = async (member) => {
  console.log('Opening referrals modal for member:', member)
  if (!member || !member.id) {
    console.error('Invalid member data:', member)
    return
  }
  // Reset state
  referralsList.value = []
  referralsError.value = ''
  selectedMember.value = member
  referralsHistory.value = [{ member, level: 0 }]
  showReferralsModal.value = true
  loadingReferrals.value = true
  await fetchReferrals(member.id)
}

const closeReferralsModal = () => {
  showReferralsModal.value = false
  selectedMember.value = null
  referralsList.value = []
  referralsHistory.value = []
  referralsError.value = ''
}

const fetchReferrals = async (memberId) => {
  console.log('Fetching referrals for memberId:', memberId)
  loadingReferrals.value = true
  referralsError.value = ''
  referralsList.value = []
  
  try {
    const response = await $fetch(`/api/admin/members/${memberId}/referrals`)
    console.log('Referrals response:', response)
    if (response.success) {
      referralsList.value = response.data?.referrals || []
      console.log('Referrals list:', referralsList.value)
    } else {
      referralsError.value = response.message || 'Gagal memuat data referral'
      console.error('Failed to fetch referrals:', response.message)
    }
  } catch (error) {
    console.error('Error fetching referrals:', error)
    referralsError.value = error?.data?.message || error?.message || 'Gagal memuat data referral'
    referralsList.value = []
  } finally {
    loadingReferrals.value = false
  }
}

const viewNestedReferrals = async (referral) => {
  // Add to history
  referralsHistory.value.push({ member: referral, level: referralsHistory.value.length })
  selectedMember.value = referral
  await fetchReferrals(referral.id)
}

const navigateBackReferrals = async (index) => {
  // Navigate back to specific level
  if (index >= 0 && index < referralsHistory.value.length) {
    referralsHistory.value = referralsHistory.value.slice(0, index + 1)
    const targetMember = referralsHistory.value[index].member
    selectedMember.value = targetMember
    await fetchReferrals(targetMember.id)
  }
}

// Load data on mount
onMounted(() => {
  fetchMembers()
})
</script>
