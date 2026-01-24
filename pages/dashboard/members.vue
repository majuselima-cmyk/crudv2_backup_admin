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
            Member
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
              @click="openCreateModal"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition whitespace-nowrap shadow-sm"
            >
              <Icon name="plus" size="sm" />
              Tambah Member
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage && !loading" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2">
            <Icon name="x-circle" size="md" class="text-red-600" />
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
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
        <div v-else-if="!loading" class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <!-- Table Header -->
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">
              Daftar Member ({{ totalCount }})
            </h2>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">No</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Username</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Password</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Referral Code</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Downline</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Balance</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Saldo Coin</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Coin Deposit</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Member Type</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Withdraw</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Tanggal Daftar</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <template v-for="(member, index) in filteredMembers" :key="member.id">
                <tr 
                  class="hover:bg-gray-50 transition cursor-pointer"
                  @click="toggleMemberDetail(member.id)"
                >
                  <td class="py-4 px-4 text-gray-600">
                    <div class="flex items-center gap-2">
                      <Icon 
                        :name="expandedMembers[member.id] ? 'chevron-down' : 'chevron-right'" 
                        size="sm" 
                        class="text-gray-400"
                      />
                      {{ index + 1 }}
                    </div>
                  </td>
                  <td class="py-4 px-4 text-gray-800">{{ member.email }}</td>
                  <td class="py-4 px-4 text-gray-800">{{ member.username }}</td>
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-sm text-gray-700">
                        {{ visiblePasswords[member.id] ? (memberPasswords[member.id] || 'Loading...') : '••••••••' }}
                      </span>
                      <button
                        type="button"
                        @click.stop="togglePasswordVisibility(member.id)"
                        class="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                        title="Toggle password visibility"
                      >
                        <Icon :name="visiblePasswords[member.id] ? 'eye-slash' : 'eye'" size="sm" />
                      </button>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-gray-600 font-mono text-sm">{{ member.referral_code || '-' }}</td>
                  <td class="py-4 px-4">
                    <button
                      @click.stop="openReferralsModal(member)"
                      :class="[
                        'px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer',
                        member.total_downline > 0
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-600 cursor-default'
                      ]"
                      :disabled="member.total_downline === 0"
                    >
                      {{ member.total_downline || 0 }}
                      <Icon v-if="member.total_downline > 0" name="arrow-right" size="sm" class="ml-1" />
                    </button>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-green-600">
                        {{ formatCurrency(member.remaining_balance || 0) }} USDT
                      </span>
                      <span class="text-xs text-gray-500">
                        Total Balance
                      </span>
                      <span class="text-xs text-gray-400 mt-0.5">
                        Deposit: {{ formatCurrency(member.total_balance || 0) }} | Withdraw: {{ formatCurrency(member.total_withdraw || 0) }}
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-blue-600">
                        {{ formatNumber(member.coin_balance || 0) }} Coin
                      </span>
                      <span class="text-xs text-gray-500">
                        Saldo Coin
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold text-purple-600">
                        {{ formatNumber(member.total_coin_from_deposits || 0) }} Coin
                      </span>
                      <span class="text-xs text-gray-500">
                        Total dari Deposit
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-semibold',
                        member.member_type === 'vip' 
                          ? 'bg-purple-100 text-purple-800' 
                          : member.member_type === 'leader'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      ]"
                    >
                      {{ member.member_type === 'vip' ? 'VIP' : member.member_type === 'leader' ? 'Leader' : 'Normal' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : member.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      {{ member.status === 'active' ? 'Aktif' : member.status === 'pending' ? 'Pending' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex flex-col gap-1">
                      <span 
                        :class="[
                          'px-2 py-0.5 rounded text-xs font-medium inline-block w-fit',
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
                          'px-2 py-0.5 rounded text-xs font-medium inline-block w-fit',
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
                  <td class="py-4 px-4 text-gray-600 text-sm">
                    {{ formatDate(member.created_at) }}
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                      <button 
                        @click.stop="openEditModal(member)"
                        class="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition text-sm font-medium"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        @click.stop="confirmDelete(member)"
                        class="flex items-center gap-1 text-red-600 hover:text-red-700 transition text-sm font-medium"
                      >
                        <Icon name="delete" size="sm" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Expanded Detail Row -->
                <tr v-if="expandedMembers[member.id]" class="bg-blue-50">
                  <td colspan="14" class="py-6 px-6">
                    <div v-if="loadingMemberBonus[member.id]" class="flex items-center justify-center py-4">
                      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span class="ml-3 text-sm text-gray-600">Memuat detail bonus...</span>
                    </div>
                    <div v-else-if="memberBonusDetails[member.id]" class="space-y-4">
                      <h3 class="text-lg font-semibold text-gray-800 mb-4">Detail Bonus Member</h3>
                      
                      <!-- Bonus Pasif -->
                      <div class="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 class="text-sm font-semibold text-gray-700 mb-2">Bonus Pasif</h4>
                        <p class="text-sm text-gray-600">
                          Persentase: <span class="font-semibold text-blue-600">15%</span>
                        </p>
                        <p class="text-xs text-gray-500 mt-1">
                          Reward per interval: {{ bonusSettings?.reward_percentage || 0.5 }}% ({{ bonusSettings?.reward_interval_minutes || 240 }} menit)
                        </p>
                      </div>

                      <!-- Referral Bonus -->
                      <div class="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3">Referral Bonus</h4>
                        <div class="space-y-3">
                          <!-- Total Deposit Downline -->
                          <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p class="text-xs text-gray-600 mb-1">Total Deposit dari Downline</p>
                            <p class="text-lg font-bold text-gray-800">
                              {{ formatCurrency(memberBonusDetails[member.id].total_downline_deposit || 0) }} USDT
                            </p>
                          </div>

                          <!-- Referral Percentage -->
                          <div class="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p class="text-xs text-gray-600 mb-1">Persentase Referral Bonus</p>
                            <p class="text-lg font-bold text-blue-600">
                              {{ memberBonusDetails[member.id].referral_percentage || bonusSettings?.referral_percentage || 15 }}%
                            </p>
                            <p class="text-xs text-gray-500 mt-1">
                              Dari total deposit downline
                            </p>
                          </div>

                          <!-- Total Referral Bonus (15%) -->
                          <div class="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                            <p class="text-xs text-gray-600 mb-1">Total Referral Bonus ({{ memberBonusDetails[member.id].referral_percentage || bonusSettings?.referral_percentage || 15 }}%)</p>
                            <p class="text-lg font-bold text-yellow-600">
                              {{ formatCurrency(memberBonusDetails[member.id].total_referral_bonus || 0) }} USDT
                            </p>
                            <p class="text-xs text-gray-500 mt-1">
                              = {{ formatCurrency(memberBonusDetails[member.id].total_downline_deposit || 0) }} × {{ memberBonusDetails[member.id].referral_percentage || bonusSettings?.referral_percentage || 15 }}%
                            </p>
                          </div>

                          <!-- Breakdown Alokasi -->
                          <div class="pt-2">
                            <p class="text-xs font-semibold text-gray-700 mb-2">Breakdown Alokasi:</p>
                            <div class="grid grid-cols-2 gap-3">
                              <div class="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p class="text-xs text-gray-600 mb-1">Alokasi ke USDT</p>
                                <p class="text-lg font-bold text-green-600">
                                  {{ formatCurrency(memberBonusDetails[member.id].referral_bonus_usdt || 0) }} USDT
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                  {{ memberBonusDetails[member.id].referral_balance_percentage || bonusSettings?.referral_balance_percentage || 80 }}% dari {{ formatCurrency(memberBonusDetails[member.id].total_referral_bonus || 0) }} USDT
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  = {{ formatCurrency(memberBonusDetails[member.id].total_referral_bonus || 0) }} × {{ memberBonusDetails[member.id].referral_balance_percentage || bonusSettings?.referral_balance_percentage || 80 }}%
                                </p>
                                <div class="mt-2 pt-2 border-t border-green-300">
                                  <p class="text-xs text-gray-600">
                                    Jika dikonversi ke Coin:
                                  </p>
                                  <p class="text-sm font-semibold text-green-700 mt-0.5">
                                    {{ formatNumber(memberBonusDetails[member.id].referral_bonus_usdt_to_coin || 0) }} Coin
                                  </p>
                                  <p class="text-xs text-gray-400 mt-0.5">
                                    = {{ formatCurrency(memberBonusDetails[member.id].referral_bonus_usdt || 0) }} ÷ {{ formatNumber(memberBonusDetails[member.id].coin_price || 0.5) }} USDT/Coin
                                  </p>
                                </div>
                              </div>
                              <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <p class="text-xs text-gray-600 mb-1">Alokasi ke Coin</p>
                                <p class="text-lg font-bold text-purple-600">
                                  {{ formatNumber(memberBonusDetails[member.id].referral_bonus_coin || 0) }} Coin
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                  {{ memberBonusDetails[member.id].referral_coin_percentage || bonusSettings?.referral_coin_percentage || 20 }}% dari {{ formatCurrency(memberBonusDetails[member.id].total_referral_bonus || 0) }} USDT
                                </p>
                                <p class="text-xs text-gray-400 mt-1">
                                  = {{ formatCurrency(memberBonusDetails[member.id].total_referral_bonus || 0) }} × {{ memberBonusDetails[member.id].referral_coin_percentage || bonusSettings?.referral_coin_percentage || 20 }}%
                                </p>
                                <div class="mt-2 pt-2 border-t border-purple-300">
                                  <p class="text-xs text-gray-600">
                                    Jika dikonversi ke USDT:
                                  </p>
                                  <p class="text-sm font-semibold text-purple-700 mt-0.5">
                                    {{ formatCurrency(memberBonusDetails[member.id].referral_bonus_coin_to_usdt || 0) }} USDT
                                  </p>
                                  <p class="text-xs text-gray-400 mt-0.5">
                                    = {{ formatNumber(memberBonusDetails[member.id].referral_bonus_coin || 0) }} × {{ formatNumber(memberBonusDetails[member.id].coin_price || 0.5) }} USDT/Coin
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Matching Bonus (Bonus Aktif) -->
                      <div v-if="memberBonusDetails[member.id].matching_bonus_details" class="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Icon name="lightning-bolt" size="sm" class="text-orange-500" />
                          Bonus Matching (Bonus Aktif)
                        </h4>
                        
                        <!-- Total Matching Bonus -->
                        <div class="bg-orange-50 rounded-lg p-3 border border-orange-200 mb-4">
                          <p class="text-xs text-gray-600 mb-1">Total Bonus Matching</p>
                          <p class="text-lg font-bold text-orange-600">
                            {{ formatCurrency(memberBonusDetails[member.id].total_matching_bonus || 0) }} USDT
                          </p>
                          <p class="text-xs text-gray-500 mt-1">
                            {{ memberBonusDetails[member.id].matching_bonus_details.explanation }}
                          </p>
                        </div>

                        <!-- Matching Breakdown Alokasi -->
                        <div class="mb-4">
                            <p class="text-xs font-semibold text-gray-700 mb-2">Breakdown Alokasi Matching:</p>
                            <div class="grid grid-cols-2 gap-3">
                              <div class="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p class="text-xs text-gray-600 mb-1">Alokasi ke USDT</p>
                                <p class="text-lg font-bold text-green-600">
                                  {{ formatCurrency(memberBonusDetails[member.id].matching_bonus_details.matching_bonus_usdt || 0) }} USDT
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                  {{ memberBonusDetails[member.id].referral_balance_percentage }}% dari Total Matching
                                </p>
                              </div>
                              <div class="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <p class="text-xs text-gray-600 mb-1">Alokasi ke Coin</p>
                                <p class="text-lg font-bold text-purple-600">
                                  {{ formatNumber(memberBonusDetails[member.id].matching_bonus_details.matching_bonus_coin || 0) }} Coin
                                </p>
                                <p class="text-xs text-gray-500 mt-1">
                                  {{ memberBonusDetails[member.id].referral_coin_percentage }}% dari Total Matching
                                </p>
                              </div>
                            </div>
                        </div>

                        <!-- Matching Levels Breakdown -->
                        <div class="space-y-3">
                          <p class="text-xs font-semibold text-gray-700 mb-2">Breakdown per Level Matching:</p>
                          
                          <div 
                            v-for="(level, index) in memberBonusDetails[member.id].matching_bonus_levels" 
                            :key="index"
                            class="border border-gray-200 rounded-lg p-3"
                            :class="{
                              'bg-green-50 border-green-200': level.matching_bonus > 0,
                              'bg-gray-50 border-gray-200': level.matching_bonus === 0
                            }"
                          >
                            <div class="flex items-center justify-between mb-2">
                              <h5 class="text-sm font-semibold text-gray-800">
                                Level {{ level.matching_level }} Matching
                                <span class="text-xs text-gray-500 font-normal">
                                  (dari Level {{ level.referral_level }} Referral)
                                </span>
                              </h5>
                              <span 
                                class="text-xs px-2 py-1 rounded font-medium"
                                :class="{
                                  'bg-green-100 text-green-700': level.matching_bonus > 0,
                                  'bg-gray-100 text-gray-600': level.matching_bonus === 0
                                }"
                              >
                                {{ level.percentage }}%
                              </span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <p class="text-gray-600">Member di Level ini:</p>
                                <p class="font-semibold text-gray-800">{{ level.member_count }} orang</p>
                              </div>
                              <div>
                                <p class="text-gray-600">Total Deposit Level:</p>
                                <p class="font-semibold text-gray-800">{{ formatCurrency(level.total_deposits) }} USDT</p>
                              </div>
                            </div>
                            
                            <div class="mt-2 pt-2 border-t border-gray-300">
                              <p class="text-xs text-gray-600">Total Bonus Matching Level Ini:</p>
                              <p class="text-sm font-bold" :class="{
                                'text-green-600': level.matching_bonus > 0,
                                'text-gray-600': level.matching_bonus === 0
                              }">
                                {{ formatCurrency(level.matching_bonus) }} USDT
                              </p>
                              <p class="text-xs text-gray-500 mt-1 mb-2">
                                = {{ formatCurrency(level.total_deposits) }} × {{ level.percentage }}%
                              </p>
                              
                              <!-- Breakdown Allocation Per Level -->
                              <div v-if="level.matching_bonus > 0" class="grid grid-cols-2 gap-2 mt-2 bg-white/50 p-2 rounded border border-gray-200">
                                <div>
                                    <p class="text-[10px] text-gray-500 uppercase">Ke Balance (USDT)</p>
                                    <p class="text-xs font-bold text-green-600">
                                      + {{ formatCurrency(level.matching_bonus_usdt || 0) }}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-[10px] text-gray-500 uppercase">Ke Coin</p>
                                    <p class="text-xs font-bold text-purple-600">
                                      + {{ formatNumber(level.matching_bonus_coin || 0) }} Coin
                                    </p>
                                </div>
                              </div>
                            </div>

                            <!-- Members List (collapsible) -->
                            <div v-if="level.members && level.members.length > 0" class="mt-3">
                              <button 
                                @click="toggleMatchingLevelMembers(member.id, index)"
                                class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition"
                              >
                                <Icon 
                                  :name="expandedMatchingLevels[`${member.id}_${index}`] ? 'chevron-down' : 'chevron-right'" 
                                  size="xs" 
                                />
                                {{ expandedMatchingLevels[`${member.id}_${index}`] ? 'Sembunyikan' : 'Tampilkan' }} Member ({{ level.members.length }})
                              </button>
                              
                              <div v-if="expandedMatchingLevels[`${member.id}_${index}`]" class="mt-2 space-y-1">
                                <div 
                                  v-for="levelMember in level.members" 
                                  :key="levelMember.id"
                                  class="bg-white rounded p-2 border border-gray-200 text-xs"
                                >
                                  <div class="flex items-center justify-between">
                                    <span class="font-medium text-gray-800">{{ levelMember.email }}</span>
                                    <span class="text-gray-600">{{ formatCurrency(levelMember.deposits) }} USDT</span>
                                  </div>
                                  <p class="text-gray-500 text-xs">{{ levelMember.username }}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Grand Total Summary -->
                      <div class="bg-gray-800 rounded-lg p-4 text-white">
                        <h4 class="text-sm font-semibold text-gray-300 mb-3">Ringkasan Total Bonus (Referral + Matching)</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <!-- Total USDT Breakdown -->
                          <div class="bg-gray-700 rounded p-3 border border-gray-600">
                            <p class="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Total Masuk ke Balance (USDT)</p>
                            <div class="space-y-1 mb-2">
                              <div class="flex justify-between text-xs text-gray-300">
                                <span>Referral (USDT):</span>
                                <span>+ {{ formatCurrency(memberBonusDetails[member.id].referral_bonus_usdt || 0) }}</span>
                              </div>
                              <div class="flex justify-between text-xs text-gray-300">
                                <span>Matching (USDT):</span>
                                <span>+ {{ formatCurrency(memberBonusDetails[member.id].matching_bonus_details?.matching_bonus_usdt || 0) }}</span>
                              </div>
                            </div>
                            <div class="border-t border-gray-600 pt-2 flex justify-between items-center">
                              <span class="text-xs text-gray-400">Total Penambahan:</span>
                              <span class="text-xl font-bold text-green-400">
                                + {{ formatCurrency(memberBonusDetails[member.id].grand_total_bonus_usdt || 0) }}
                              </span>
                            </div>
                          </div>

                          <!-- Total Coin Breakdown -->
                          <div class="bg-gray-700 rounded p-3 border border-gray-600">
                            <p class="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Total Masuk ke Coin</p>
                            <div class="space-y-1 mb-2">
                              <div class="flex justify-between text-xs text-gray-300">
                                <span>Referral (Coin):</span>
                                <span>+ {{ formatNumber(memberBonusDetails[member.id].referral_bonus_coin || 0) }}</span>
                              </div>
                              <div class="flex justify-between text-xs text-gray-300">
                                <span>Matching (Coin):</span>
                                <span>+ {{ formatNumber(memberBonusDetails[member.id].matching_bonus_details?.matching_bonus_coin || 0) }}</span>
                              </div>
                            </div>
                            <div class="border-t border-gray-600 pt-2 flex justify-between items-center">
                              <span class="text-xs text-gray-400">Total Penambahan:</span>
                              <span class="text-xl font-bold text-purple-400">
                                + {{ formatNumber(memberBonusDetails[member.id].grand_total_bonus_coin || 0) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div v-else class="text-center py-4 text-gray-500 text-sm">
                      Gagal memuat detail bonus
                    </div>
                  </td>
                </tr>
                </template>
                <tr v-if="filteredMembers.length === 0 && !loading">
                  <td colspan="14" class="py-8 px-4 text-center text-gray-400">
                    {{ searchQuery ? 'Tidak ada data member yang sesuai dengan pencarian' : 'Tidak ada data member' }}
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
                  <span class="font-semibold">{{ totalCount }}</span> member
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
      </main>
    </div>

    <!-- Create Member Modal -->
    <div 
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeCreateModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-800">Tambah Member Baru</h3>
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
            <label class="block text-sm font-medium text-gray-700 mb-2">Email <span class="text-red-500">*</span></label>
            <input
              v-model="createForm.email"
              type="email"
              required
              placeholder="contoh@email.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username <span class="text-red-500">*</span></label>
            <input
              v-model="createForm.username"
              type="text"
              required
              placeholder="min 3 karakter, huruf/angka/underscore"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="createForm.password"
                :type="showCreatePassword ? 'text' : 'password'"
                required
                minlength="6"
                placeholder="minimal 6 karakter"
                class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                @click="showCreatePassword = !showCreatePassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <Icon :name="showCreatePassword ? 'eye-slash' : 'eye'" size="sm" />
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Kode Referral</label>
            <input
              v-model="createForm.referral_code"
              type="text"
              placeholder="Kosongkan untuk auto-generate"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-mono"
            />
            <p class="text-xs text-gray-500 mt-1">3-20 karakter, huruf besar/angka/underscore. Kosongkan = auto-generate</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Referred By (opsional)</label>
            <input
              v-model="createForm.referred_by"
              type="text"
              placeholder="ID member atau kode referral upline"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Member Type</label>
            <select
              v-model="createForm.member_type"
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
              v-model="createForm.status"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div class="border-t border-gray-200 pt-4 space-y-4">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Bonus Aktif Withdraw</label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="createForm.bonus_aktif_withdraw_enabled" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm text-gray-700">{{ createForm.bonus_aktif_withdraw_enabled ? 'Enable' : 'Disable' }}</span>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700">Bonus Pasif Withdraw</label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="createForm.bonus_pasif_withdraw_enabled" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span class="ml-3 text-sm text-gray-700">{{ createForm.bonus_pasif_withdraw_enabled ? 'Enable' : 'Disable' }}</span>
              </label>
            </div>
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
              {{ isCreating ? 'Menyimpan...' : 'Tambah Member' }}
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

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div class="relative">
              <input
                v-model="editForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Kosongkan jika tidak ingin mengubah password"
                class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <Icon :name="showPassword ? 'eye-slash' : 'eye'" size="sm" />
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin mengubah password</p>
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

    <!-- Referrals Modal -->
    <div 
      v-if="showReferralsModal"
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      @click.self="closeReferralsModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-semibold text-gray-800">Data Referral / Downline</h3>
              <p class="text-sm text-gray-600 mt-1">
                Member: <strong>{{ selectedMember?.email }}</strong> 
                ({{ selectedMember?.username }})
              </p>
            </div>
            <button 
              @click="closeReferralsModal"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Loading State -->
          <div v-if="loadingReferrals" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600">Memuat data referral...</span>
          </div>

          <!-- Referrals List -->
          <div v-else-if="referralsData && referralsData.referrals && referralsData.referrals.length > 0" class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p class="text-sm text-blue-700">
                <strong>Total Referral:</strong> {{ referralsData.total_referrals }} member
              </p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50">
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">No</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Username</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Referral Code</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Downline</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Member Type</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr 
                    v-for="(referral, index) in referralsData.referrals" 
                    :key="referral.id"
                    class="hover:bg-gray-50 transition"
                  >
                    <td class="py-4 px-4 text-gray-600">{{ index + 1 }}</td>
                    <td class="py-4 px-4 text-gray-800">{{ referral.email }}</td>
                    <td class="py-4 px-4 text-gray-800">{{ referral.username }}</td>
                    <td class="py-4 px-4 text-gray-600 font-mono text-sm">{{ referral.referral_code || '-' }}</td>
                    <td class="py-4 px-4">
                      <button
                        v-if="referral.total_downline > 0"
                        @click="openReferralsModal(referral)"
                        class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition cursor-pointer"
                      >
                        {{ referral.total_downline }} 👁️
                      </button>
                      <span v-else class="text-gray-500">0</span>
                    </td>
                    <td class="py-4 px-4">
                      <span 
                        :class="[
                          'px-2 py-1 rounded text-xs font-medium',
                          referral.member_type === 'vip' 
                            ? 'bg-purple-100 text-purple-700' 
                            : referral.member_type === 'leader'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        ]"
                      >
                        {{ referral.member_type === 'vip' ? 'VIP' : referral.member_type === 'leader' ? 'Leader' : 'Normal' }}
                      </span>
                    </td>
                    <td class="py-4 px-4">
                      <span 
                        :class="[
                          'px-2 py-1 rounded text-xs font-medium',
                          referral.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : referral.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        ]"
                      >
                        {{ referral.status === 'active' ? 'Aktif' : referral.status === 'pending' ? 'Pending' : 'Tidak Aktif' }}
                      </span>
                    </td>
                    <td class="py-4 px-4 text-gray-600 text-sm">
                      {{ formatDate(referral.created_at) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-12">
            <p class="text-gray-400">Member ini belum memiliki referral/downline</p>
          </div>

          <!-- Error State -->
          <div v-if="referralsError" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-600">{{ referralsError }}</p>
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
const totalCount = ref(0)
const limit = ref(50)
const offset = ref(0)
const errorMessage = ref('')
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const updateError = ref('')
const showCreateModal = ref(false)
const isCreating = ref(false)
const createError = ref('')
const showCreatePassword = ref(false)
const createForm = ref({
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
const deleteError = ref('')
const memberToDelete = ref(null)
const showReferralsModal = ref(false)
const selectedMember = ref(null)
const loadingReferrals = ref(false)
const referralsData = ref(null)
const referralsError = ref('')
const showPassword = ref(false)
const visiblePasswords = ref({})
const memberPasswords = ref({}) // Store fetched passwords

// Expandable row states
const expandedMembers = ref({})
const loadingMemberBonus = ref({})
const memberBonusDetails = ref({})
const bonusSettings = ref(null)
const expandedMatchingLevels = ref({})

const editForm = ref({
  id: '',
  email: '',
  username: '',
  referral_code: '',
  member_type: 'normal',
  status: 'active',
  password: '',
  bonus_aktif_withdraw_enabled: true,
  bonus_pasif_withdraw_enabled: true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const openCreateModal = () => {
  resetCreateForm()
  createError.value = ''
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  resetCreateForm()
  createError.value = ''
}

const resetCreateForm = () => {
  createForm.value = {
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
}

const handleCreate = async () => {
  isCreating.value = true
  createError.value = ''

  try {
    const body = {
      email: createForm.value.email.trim(),
      username: createForm.value.username.trim(),
      password: createForm.value.password,
      member_type: createForm.value.member_type,
      status: createForm.value.status,
      bonus_aktif_withdraw_enabled: createForm.value.bonus_aktif_withdraw_enabled,
      bonus_pasif_withdraw_enabled: createForm.value.bonus_pasif_withdraw_enabled
    }
    if (createForm.value.referral_code && createForm.value.referral_code.trim() !== '') {
      body.referral_code = createForm.value.referral_code.trim()
    }
    if (createForm.value.referred_by && createForm.value.referred_by.trim() !== '') {
      body.referred_by = createForm.value.referred_by.trim()
    }

    const response = await $fetch('/api/admin/members', {
      method: 'POST',
      body
    })

    if (response.success) {
      closeCreateModal()
      await fetchMembers()
    } else {
      createError.value = response.message || 'Gagal menambah member'
    }
  } catch (error) {
    console.error('Error creating member:', error)
    createError.value = error?.data?.message || error?.message || 'Gagal menambah member'
  } finally {
    isCreating.value = false
  }
}

// Fetch members
const fetchMembers = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const params = {
      limit: limit.value,
      offset: offset.value
    }
    
    const response = await $fetch('/api/admin/members', { params })
    console.log('🔵 Members API Response:', response)
    
    if (response.success) {
      members.value = response.data || []
      totalCount.value = response.count || 0
      console.log('🔵 Members loaded:', members.value.length, 'of', totalCount.value)
      
      // Debug: Check all members' deposit stats
      members.value.forEach((member, index) => {
        console.log(`🔵 Member ${index + 1}:`, {
          id: member.id,
          email: member.email,
          total_balance: member.total_balance,
          total_coin_from_deposits: member.total_coin_from_deposits,
          coin_balance: member.coin_balance,
          total_coin: member.total_coin
        })
      })
      
      // Check if any member has deposits
      const membersWithDeposits = members.value.filter(m => m.total_balance > 0 || m.total_coin_from_deposits > 0)
      if (membersWithDeposits.length > 0) {
        console.log('✅ Found members with deposits:', membersWithDeposits.length)
      } else {
        console.log('⚠️ No members have deposits (total_balance or total_coin_from_deposits)')
      }
    } else {
      errorMessage.value = response.message || 'Gagal memuat data member'
    }
  } catch (error) {
    console.error('❌ Error fetching members:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data member'
    members.value = []
  } finally {
    loading.value = false
  }
}

// Filter members (client-side filtering after pagination)
const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(member => 
    member.email?.toLowerCase().includes(query) ||
    member.username?.toLowerCase().includes(query) ||
    member.referral_code?.toLowerCase().includes(query)
  )
})

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
    fetchMembers()
  }
}

const goToFirstPage = () => {
  offset.value = 0
  fetchMembers()
}

const goToLastPage = () => {
  offset.value = (totalPages.value - 1) * limit.value
  fetchMembers()
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    offset.value += limit.value
    fetchMembers()
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    offset.value = Math.max(0, offset.value - limit.value)
    fetchMembers()
  }
}

const handleLimitChange = () => {
  offset.value = 0
  fetchMembers()
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

// Format number
const formatNumber = (value) => {
  if (!value || value === 0) return '0.00'
  const numValue = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
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

// Referrals modal
const openReferralsModal = async (member) => {
  selectedMember.value = member
  showReferralsModal.value = true
  loadingReferrals.value = true
  referralsError.value = ''
  referralsData.value = null

  try {
    const response = await $fetch(`/api/admin/members/${member.id}/referrals`)
    if (response.success) {
      referralsData.value = response.data
    } else {
      referralsError.value = response.message || 'Gagal memuat data referral'
    }
  } catch (error) {
    console.error('Error fetching referrals:', error)
    referralsError.value = error?.data?.message || error?.message || 'Gagal memuat data referral'
  } finally {
    loadingReferrals.value = false
  }
}

const closeReferralsModal = () => {
  showReferralsModal.value = false
  selectedMember.value = null
  referralsData.value = null
  referralsError.value = ''
}

const togglePasswordVisibility = async (memberId) => {
  // Toggle visibility
  if (visiblePasswords.value[memberId]) {
    // Hide password
    delete visiblePasswords.value[memberId]
    // Trigger reactivity by reassigning
    visiblePasswords.value = { ...visiblePasswords.value }
  } else {
    // Show password - fetch if not already cached
    if (!memberPasswords.value[memberId]) {
      // Check if password exists in member data first
      const member = members.value.find(m => m.id === memberId)
      if (member?.password) {
        memberPasswords.value = {
          ...memberPasswords.value,
          [memberId]: member.password
        }
      } else {
        // Try to fetch password from API endpoint
        try {
          const response = await $fetch(`/api/admin/members/${memberId}/password`).catch(() => null)
          if (response?.success && response?.data?.password) {
            memberPasswords.value = {
              ...memberPasswords.value,
              [memberId]: response.data.password
            }
          } else {
            // Password not available - might be hashed or not returned
            memberPasswords.value = {
              ...memberPasswords.value,
              [memberId]: 'Password tidak tersedia (mungkin sudah di-hash)'
            }
          }
        } catch (error) {
          console.error('Error fetching password:', error)
          // Password might not be available from API
          memberPasswords.value = {
            ...memberPasswords.value,
            [memberId]: 'Password tidak tersedia'
          }
        }
      }
    }
    
    // Show password
    visiblePasswords.value = {
      ...visiblePasswords.value,
      [memberId]: true
    }
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
    password: '',
    bonus_aktif_withdraw_enabled: member.bonus_aktif_withdraw_enabled !== undefined ? member.bonus_aktif_withdraw_enabled : true,
    bonus_pasif_withdraw_enabled: member.bonus_pasif_withdraw_enabled !== undefined ? member.bonus_pasif_withdraw_enabled : true
  }
  updateError.value = ''
  showPassword.value = false
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
    password: '',
    bonus_aktif_withdraw_enabled: true,
    bonus_pasif_withdraw_enabled: true
  }
  updateError.value = ''
  showPassword.value = false
}

const handleUpdate = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    const body = {
      email: editForm.value.email,
      username: editForm.value.username,
      referral_code: editForm.value.referral_code || null,
      member_type: editForm.value.member_type,
      status: editForm.value.status,
      bonus_aktif_withdraw_enabled: editForm.value.bonus_aktif_withdraw_enabled,
      bonus_pasif_withdraw_enabled: editForm.value.bonus_pasif_withdraw_enabled
    }
    
    // Only include password if provided
    if (editForm.value.password && editForm.value.password.trim() !== '') {
      body.password = editForm.value.password
    }
    
    const response = await $fetch(`/api/admin/members/${editForm.value.id}`, {
      method: 'PUT',
      body
    })

    if (response.success) {
      // Update local data
      const index = members.value.findIndex(m => m.id === editForm.value.id)
      if (index !== -1) {
        members.value[index] = { ...members.value[index], ...editForm.value }
      }
      closeEditModal()
      // Refresh members to update total_downline
      await fetchMembers()
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

// Toggle member detail (expandable row)
const toggleMemberDetail = async (memberId) => {
  if (expandedMembers.value[memberId]) {
    // Collapse
    expandedMembers.value[memberId] = false
  } else {
    // Expand - fetch bonus details
    expandedMembers.value[memberId] = true
    
    // If bonus details not loaded yet, fetch them
    if (!memberBonusDetails.value[memberId]) {
      await fetchMemberBonusDetails(memberId)
    }
    
    // Fetch bonus settings if not loaded
    if (!bonusSettings.value) {
      await fetchBonusSettings()
    }
  }
}

// Fetch bonus settings
const fetchBonusSettings = async () => {
  try {
    const response = await $fetch('/api/admin/bonus')
    if (response.success && response.data) {
      bonusSettings.value = response.data
    }
  } catch (error) {
    console.error('Error fetching bonus settings:', error)
  }
}

// Fetch member bonus details
const fetchMemberBonusDetails = async (memberId) => {
  loadingMemberBonus.value[memberId] = true
  
  try {
    const response = await $fetch(`/api/admin/members/${memberId}/bonus-details`)
    if (response.success) {
      memberBonusDetails.value[memberId] = response.data
    } else {
      console.error('Failed to fetch bonus details:', response.message)
    }
  } catch (error) {
    console.error('Error fetching member bonus details:', error)
  } finally {
    loadingMemberBonus.value[memberId] = false
  }
}

// Toggle matching level members visibility
const toggleMatchingLevelMembers = (memberId, levelIndex) => {
  const key = `${memberId}_${levelIndex}`
  if (expandedMatchingLevels.value[key]) {
    delete expandedMatchingLevels.value[key]
  } else {
    expandedMatchingLevels.value[key] = true
  }
  // Trigger reactivity
  expandedMatchingLevels.value = { ...expandedMatchingLevels.value }
}

// Load data on mount
onMounted(() => {
  fetchMembers()
  fetchBonusSettings()
})
</script>

