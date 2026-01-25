<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar
      :is-mobile-menu-open="isMobileMenuOpen"
      @close-mobile-menu="isMobileMenuOpen = false"
    />

    <div class="lg:pl-64">
      <MobileHeader @toggle-menu="toggleMobileMenu" />

      <header class="hidden lg:block sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <h1 class="text-2xl font-bold text-blue-600">Daftar Staking Unstaked</h1>
            <p class="text-sm text-gray-500 mt-1">Data staking yang sudah unstaked</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="processingMultiplierRewards"
              @click="processMultiplierRewards"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ processingMultiplierRewards ? 'Memproses...' : 'Process Multiplier Rewards' }}
            </button>
            <button
              type="button"
              @click="fetchData"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main class="p-4 lg:p-8">
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <div class="flex items-center justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span class="ml-3 text-gray-600">Memuat data...</span>
          </div>
        </div>

        <div v-else-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm mb-4">
          <div class="flex items-start gap-3">
            <Icon name="x-circle" size="md" class="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-red-700 font-medium">{{ errorMessage }}</p>
              <button
                type="button"
                @click="fetchData"
                class="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                Coba lagi
              </button>
            </div>
          </div>
        </div>

        <div v-else>
          <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm mb-4">
            <p class="text-green-700 font-medium">{{ successMessage }}</p>
          </div>
          <!-- Stats -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Staking Unstaked</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ unstakedList.length }}</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-lg">
                  <Icon name="check-circle" size="md" class="text-gray-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Reward (Semua Unstaked)</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ formatCoinAmountWithCode(statsTotalReward) }}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-lg">
                  <Icon name="check-circle" size="md" class="text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <!-- Daftar Staking Unstaked -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-800">Daftar Staking Unstaked ({{ unstakedList.length }})</h2>
                <div class="flex items-center gap-2">
                  <label class="text-sm text-gray-600">Per halaman:</label>
                  <select
                    v-model="itemsPerPage"
                    class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @change="currentPage = 1"
                  >
                    <option :value="10">10</option>
                    <option :value="25">25</option>
                    <option :value="50">50</option>
                    <option :value="100">100</option>
                  </select>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mulai multiplier<br/><span class="text-xs text-gray-400">(UTC & WIB)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Selesai multiplier<br/><span class="text-xs text-gray-400">(UTC & WIB)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward<br/><span class="text-xs text-gray-400">(reward staking)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward multiplier<br/><span class="text-xs text-gray-400">(total paid)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status aktif staking multiplier</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr
                      v-for="s in paginatedUnstaked"
                      :key="s.id"
                      class="hover:bg-gray-50"
                    >
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center gap-2">
                            <span class="font-medium text-gray-900">{{ s.member?.username || '-' }}</span>
                            <span
                              v-if="s.member?.member_type"
                              :class="[
                                'px-2 py-1 text-xs font-semibold rounded',
                                s.member?.member_type === 'vip'
                                  ? 'bg-purple-100 text-purple-800'
                                  : s.member?.member_type === 'leader'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              ]"
                            >
                              {{ formatMemberType(s.member.member_type) }}
                            </span>
                          </div>
                          <div class="text-gray-500 text-xs">{{ s.member?.email || '' }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div v-if="s.bonus_staking_multipliyer?.started_at" class="flex flex-col gap-1">
                          <div>
                            <span class="text-xs text-gray-500 font-medium">UTC:</span>
                            <span class="font-medium ml-1">{{ formatDateTimeUTC(s.bonus_staking_multipliyer.started_at) }}</span>
                          </div>
                          <div>
                            <span class="text-xs text-gray-500 font-medium">WIB:</span>
                            <span class="font-medium ml-1 text-blue-600">{{ formatDateTimeWIB(s.bonus_staking_multipliyer.started_at) }}</span>
                          </div>
                        </div>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div v-if="s.bonus_staking_multipliyer?.unstaked_at" class="flex flex-col gap-1">
                          <div>
                            <span class="text-xs text-gray-500 font-medium">UTC:</span>
                            <span class="font-medium text-green-700 ml-1">{{ formatDateTimeUTC(s.bonus_staking_multipliyer.unstaked_at) }}</span>
                          </div>
                          <div>
                            <span class="text-xs text-gray-500 font-medium">WIB:</span>
                            <span class="font-medium text-green-600 ml-1">{{ formatDateTimeWIB(s.bonus_staking_multipliyer.unstaked_at) }}</span>
                          </div>
                          <span class="text-xs text-orange-600 mt-1">Sudah selesai</span>
                        </div>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-xs text-gray-500">Reward staking</span>
                          <span class="font-semibold text-green-600">{{ formatCoinAmountWithCode(s.total_reward_earned ?? s.total_reward_paid ?? 0) }}</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        {{ formatCoinAmountWithCode(getTotalPaidRewardForMultiplier(s.bonus_staking_multipliyer?.id)) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          v-if="s.bonus_staking_multipliyer && !s.bonus_staking_multipliyer.unstaked_at"
                          class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
                        >
                          Aktif
                        </span>
                        <span
                          v-else-if="s.bonus_staking_multipliyer"
                          class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700"
                        >
                          Tidak aktif
                        </span>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex flex-wrap items-center gap-2">
                          <button
                            v-if="s.bonus_staking_multipliyer && !s.bonus_staking_multipliyer.unstaked_at"
                            type="button"
                            class="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            @click="openUnstakeMultiplierModal(s)"
                          >
                            Unstake Multiplier
                          </button>
                          <button
                            v-if="s.bonus_staking_multipliyer"
                            type="button"
                            class="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            @click="openDeleteMultiplierModal(s)"
                          >
                            Delete
                          </button>
                          <button
                            v-if="s.bonus_staking_multipliyer && !s.bonus_staking_multipliyer.unstaked_at"
                            type="button"
                            disabled
                            class="inline-flex items-center px-3 py-1.5 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                          >
                            Sedang berjalan
                          </button>
                          <button
                            v-else
                            type="button"
                            class="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            @click="openStakingMultiplierModal(s)"
                          >
                            Staking Multiplier
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="paginatedUnstaked.length === 0">
                      <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                        Belum ada data staking unstaked.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div
                v-if="unstakedList.length > 0"
                class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200"
              >
                <p class="text-sm text-gray-600">
                  Menampilkan {{ paginationStart + 1 }}-{{ paginationEnd }} dari {{ unstakedList.length }} item
                  <span v-if="totalPages > 1">(Halaman {{ currentPage }} dari {{ totalPages }})</span>
                </p>
                <div v-if="totalPages > 1" class="flex gap-2">
                  <button
                    type="button"
                    :disabled="currentPage <= 1"
                    class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    @click="currentPage = Math.max(1, currentPage - 1)"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    :disabled="currentPage >= totalPages"
                    class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    @click="currentPage = Math.min(totalPages, currentPage + 1)"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modal Delete Multiplier -->
    <div
      v-if="showDeleteMultiplierModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDeleteMultiplierModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Delete Multiplier</h3>
          <p class="text-sm text-gray-500 mt-1">Apakah Anda yakin ingin menghapus data staking multiplier untuk member ini? Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div v-if="selectedRowForDelete" class="p-6 space-y-4">
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-600 mb-1">Member</p>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ selectedRowForDelete.member?.username || '-' }}</span>
              <span
                v-if="selectedRowForDelete.member?.member_type"
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded',
                  selectedRowForDelete.member?.member_type === 'vip'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedRowForDelete.member?.member_type === 'leader'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                ]"
              >
                {{ formatMemberType(selectedRowForDelete.member.member_type) }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ selectedRowForDelete.member?.email || '' }}</p>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeDeleteMultiplierModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitDeleteMultiplier"
              :disabled="deletingMultiplier"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ deletingMultiplier ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Unstake Multiplier -->
    <div
      v-if="showUnstakeMultiplierModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeUnstakeMultiplierModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Unstake Multiplier</h3>
          <p class="text-sm text-gray-500 mt-1">Apakah Anda yakin ingin unstake multiplier untuk member ini?</p>
        </div>
        <div v-if="selectedRowForMultiplier" class="p-6 space-y-4">
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-600 mb-1">Member</p>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ selectedRowForMultiplier.member?.username || '-' }}</span>
              <span
                v-if="selectedRowForMultiplier.member?.member_type"
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded',
                  selectedRowForMultiplier.member?.member_type === 'vip'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedRowForMultiplier.member?.member_type === 'leader'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                ]"
              >
                {{ formatMemberType(selectedRowForMultiplier.member.member_type) }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ selectedRowForMultiplier.member?.email || '' }}</p>
          </div>
          <div v-if="selectedRowForMultiplier.bonus_staking_multipliyer" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-sm text-gray-600 mb-1">Tanggal Mulai multiplier</p>
            <p class="text-sm font-medium text-gray-900">
              {{ formatDateTimeWIB(selectedRowForMultiplier.bonus_staking_multipliyer.started_at) }}
            </p>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeUnstakeMultiplierModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitUnstakeMultiplier"
              :disabled="unstakingMultiplier"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ unstakingMultiplier ? 'Memproses...' : 'Unstake' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Staking Multiplier -->
    <div
      v-if="showStakingMultiplierModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeStakingMultiplierModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Staking Multiplier</h3>
          <p class="text-sm text-gray-500 mt-1">Atur pengaturan multiplier staking (konsep sama seperti staking, tabel bonus_multiplier_staking)</p>
        </div>
        <form @submit.prevent="submitStakingMultiplier" class="p-6 space-y-4">
          <div v-if="multiplierValidationError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {{ multiplierValidationError }}
          </div>
          <div v-if="selectedRowForMultiplier" class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-600 mb-1">Member</p>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ selectedRowForMultiplier.member?.username || '-' }}</span>
              <span
                v-if="selectedRowForMultiplier.member?.member_type"
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded',
                  selectedRowForMultiplier.member?.member_type === 'vip'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedRowForMultiplier.member?.member_type === 'leader'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                ]"
              >
                {{ formatMemberType(selectedRowForMultiplier.member.member_type) }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ selectedRowForMultiplier.member?.email || '' }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Jumlah Koin</label>
            <input
              v-model="multiplierForm.coin_amount"
              type="number"
              step="0.00000001"
              min="0"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00000000"
            />
            <p v-if="selectedRowForMultiplier" class="mt-1 text-xs text-gray-500">
              Total reward staking (paid): {{ formatCoinAmount(selectedRowForMultiplier.total_reward_earned ?? selectedRowForMultiplier.total_reward_paid ?? 0) }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reward Bonus (%) = Multiplier Bonus Base (%)</label>
            <input
              v-model="multiplierForm.multiplier_bonus_base_percentage"
              type="number"
              step="0.01"
              min="0"
              max="100"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Reward Calculation Interval (multiplier)</label>
            <p class="text-xs text-gray-500 mb-1">Interval perhitungan reward untuk staking multiplier, dalam menit.</p>
            <input
              v-model="multiplierForm.multiplier_increment_interval_minutes"
              type="number"
              step="1"
              min="1"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10080"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Staking Duration = Multiplier Increment Interval (Menit) multiplier</label>
            <p class="text-xs text-gray-500 mb-1">Batas waktu staking multiplier, dalam menit (mis. 43200 = 1 bulan).</p>
            <div v-if="defaultStakingDurationMultiplier" class="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              💡 Default: {{ defaultStakingDurationMultiplier }} menit ({{ formatDuration(defaultStakingDurationMultiplier) }})
            </div>
            <input
              v-model="multiplierForm.multiplier_increment_period_minutes"
              type="number"
              step="1"
              :min="1"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="43200"
            />
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeStakingMultiplierModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="submittingMultiplier"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ submittingMultiplier ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isMobileMenuOpen = ref(false)
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const unstakedList = ref<any[]>([])
const coinCode = ref('')
const coinSettings = ref<{ coin_code?: string }>({})
const bonusSettings = ref<{ coin_code?: string; multiplier_percentage?: number; reward_interval_minutes?: number; multiplier_increment_percentage?: number; multiplier_increment_minutes?: number; default_staking_duration_minutes?: number }>({})
const currentPage = ref(1)
const itemsPerPage = ref(25)
const showStakingMultiplierModal = ref(false)
const showUnstakeMultiplierModal = ref(false)
const showDeleteMultiplierModal = ref(false)
const selectedRowForMultiplier = ref<any>(null)
const selectedRowForDelete = ref<any>(null)
const submittingMultiplier = ref(false)
const unstakingMultiplier = ref(false)
const deletingMultiplier = ref(false)
const multiplierValidationError = ref('')
const processingMultiplierRewards = ref(false)
const schedulesList = ref<any[]>([])

const multiplierForm = ref({
  coin_amount: '',
  multiplier_bonus_base_percentage: '',
  multiplier_increment_interval_minutes: '',
  multiplier_increment_period_minutes: ''
})

const defaultStakingDurationMultiplier = computed(() => {
  // Default Staking Duration = Multiplier Increment Interval (Menit) multiplier
  // Langsung dari field multiplier_increment_percentage di bonus_settings (INTEGER menit, bukan persen)
  const m = bonusSettings.value?.multiplier_increment_percentage
  if (m != null && Number(m) >= 1) return Number(m)
  return 43200
})

const isMultiplierFormValid = computed(() => {
  const c = parseFloat(String(multiplierForm.value.coin_amount || '0').trim())
  const b = parseFloat(String(multiplierForm.value.multiplier_bonus_base_percentage || '0').trim())
  const i = parseInt(String(multiplierForm.value.multiplier_increment_interval_minutes || '0').trim(), 10)
  const p = parseInt(String(multiplierForm.value.multiplier_increment_period_minutes || '0').trim(), 10)
  if (Number.isNaN(c) || c <= 0) return false
  if (Number.isNaN(b) || b < 0 || b > 100) return false
  if (Number.isNaN(i) || i < 1) return false
  if (Number.isNaN(p) || p < 1) return false
  return true
})

const getTotalPaidRewardForMultiplier = (multiplierStakingId: string | undefined) => {
  if (!multiplierStakingId) return 0
  return schedulesList.value
    .filter((s: any) => s.multiplier_staking_id === multiplierStakingId && s.status === 'paid')
    .reduce((sum: number, s: any) => sum + (parseFloat(String(s.reward_amount ?? 0)) || 0), 0)
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const openStakingMultiplierModal = (row: any) => {
  multiplierValidationError.value = ''
  selectedRowForMultiplier.value = row
  const totalReward = row?.total_reward_earned ?? row?.total_reward_paid ?? 0
  const b = bonusSettings.value
  const intervalRaw = b?.multiplier_increment_minutes ?? 10080
  const intervalMin = Math.max(1, Number(intervalRaw) || 10080)
  // Langsung dari multiplier_increment_percentage di DB; validasi disamakan API/DB (min 1 menit)
  const periodRaw = b?.multiplier_increment_percentage
  const periodFromDb = (periodRaw != null && periodRaw !== '' && !Number.isNaN(Number(periodRaw)))
    ? Number(periodRaw)
    : 43200
  const periodMin = Math.max(1, periodFromDb)
  multiplierForm.value = {
    coin_amount: String(totalReward ?? ''),
    multiplier_bonus_base_percentage: String(b?.multiplier_percentage ?? 10),
    multiplier_increment_interval_minutes: String(intervalMin),
    multiplier_increment_period_minutes: String(periodMin)
  }
  showStakingMultiplierModal.value = true
}

const openUnstakeMultiplierModal = (row: any) => {
  selectedRowForMultiplier.value = row
  showUnstakeMultiplierModal.value = true
}


const closeUnstakeMultiplierModal = () => {
  showUnstakeMultiplierModal.value = false
  selectedRowForMultiplier.value = null
}

const openDeleteMultiplierModal = (row: any) => {
  selectedRowForDelete.value = row
  showDeleteMultiplierModal.value = true
}

const closeDeleteMultiplierModal = () => {
  showDeleteMultiplierModal.value = false
  selectedRowForDelete.value = null
}

const submitDeleteMultiplier = async () => {
  const multiplierId = selectedRowForDelete.value?.bonus_staking_multipliyer?.id || selectedRowForDelete.value?.id
  if (!multiplierId) return
  try {
    deletingMultiplier.value = true
    errorMessage.value = ''
    await $fetch(`/api/admin/bonus-multiplier-staking/${multiplierId}`, {
      method: 'DELETE'
    })
    closeDeleteMultiplierModal()
    successMessage.value = 'Data staking multiplier berhasil dihapus'
    setTimeout(() => { successMessage.value = '' }, 5000)
    await fetchData()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? 'Gagal menghapus staking multiplier'
    setTimeout(() => { errorMessage.value = '' }, 5000)
  } finally {
    deletingMultiplier.value = false
  }
}

const submitUnstakeMultiplier = async () => {
  const multiplierId = selectedRowForMultiplier.value?.bonus_staking_multipliyer?.id || selectedRowForMultiplier.value?.id
  if (!multiplierId) return
  try {
    unstakingMultiplier.value = true
    errorMessage.value = ''
    await $fetch(`/api/admin/bonus-multiplier-staking/${multiplierId}`, {
      method: 'PUT',
      body: {
        unstaked_at: new Date().toISOString()
      }
    })
    closeUnstakeMultiplierModal()
    successMessage.value = 'Unstake multiplier berhasil'
    setTimeout(() => { successMessage.value = '' }, 5000)
    await fetchData()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? 'Gagal unstake multiplier'
    setTimeout(() => { errorMessage.value = '' }, 5000)
  } finally {
    unstakingMultiplier.value = false
  }
}

const closeStakingMultiplierModal = () => {
  showStakingMultiplierModal.value = false
  selectedRowForMultiplier.value = null
  multiplierValidationError.value = ''
  multiplierForm.value = { coin_amount: '', multiplier_bonus_base_percentage: '', multiplier_increment_interval_minutes: '', multiplier_increment_period_minutes: '' }
}

const submitStakingMultiplier = async () => {
  if (!selectedRowForMultiplier.value?.member_id) return
  if (!isMultiplierFormValid.value) {
    multiplierValidationError.value = 'Lengkapi form: Jumlah koin > 0, Reward bonus 0–100%, Interval ≥ 1 menit, Durasi ≥ 1 menit.'
    setTimeout(() => { multiplierValidationError.value = '' }, 5000)
    return
  }
  multiplierValidationError.value = ''
  try {
    submittingMultiplier.value = true
    await $fetch('/api/admin/bonus-multiplier-staking', {
      method: 'POST',
      body: {
        member_id: selectedRowForMultiplier.value.member_id,
        coin_amount: parseFloat(String(multiplierForm.value.coin_amount)),
        multiplier_bonus_base_percentage: parseFloat(String(multiplierForm.value.multiplier_bonus_base_percentage)),
        reward_interval_minutes: multiplierForm.value.multiplier_increment_interval_minutes ? parseInt(String(multiplierForm.value.multiplier_increment_interval_minutes), 10) : null, // Interval staking multiplier dari multiplier_increment_percentage
        multiplier_increment_period_minutes: multiplierForm.value.multiplier_increment_period_minutes ? parseInt(String(multiplierForm.value.multiplier_increment_period_minutes), 10) : null,
        started_at: new Date().toISOString()
      }
    })
    closeStakingMultiplierModal()
    errorMessage.value = ''
    successMessage.value = 'Staking multiplier berhasil dibuat'
    setTimeout(() => { successMessage.value = '' }, 5000)
    await fetchData()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? 'Gagal membuat staking multiplier'
    setTimeout(() => { errorMessage.value = '' }, 5000)
  } finally {
    submittingMultiplier.value = false
  }
}

const statsTotalReward = computed(() => {
  return unstakedList.value.reduce(
    (sum, s) => sum + (parseFloat(String(s.total_reward_earned ?? s.total_reward_paid ?? 0)) || 0),
    0
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(unstakedList.value.length / itemsPerPage.value)))
const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const paginationEnd = computed(() => Math.min(paginationStart.value + itemsPerPage.value, unstakedList.value.length))
const paginatedUnstaked = computed(() => {
  return unstakedList.value.slice(paginationStart.value, paginationStart.value + itemsPerPage.value)
})


const fetchData = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    const [stakingRes, bonusRes, coinRes] = await Promise.all([
      $fetch<{ success?: boolean; data?: any[] }>('/api/admin/staking', {
        params: { status: 'unstaked', limit: 1000, offset: 0 }
      }),
      $fetch<{ success?: boolean; data?: any }>('/api/admin/bonus').catch(() => ({ success: false, data: null })),
      $fetch<{ success?: boolean; data?: any }>('/api/admin/coin').catch(() => ({ success: false, data: null }))
    ])
    if (stakingRes?.success && Array.isArray(stakingRes.data)) {
      // Fetch all bonus_staking_multipliyer data at once
      try {
        const multiplierRes = await $fetch<{ success?: boolean; data?: any[] }>(
          '/api/admin/bonus-multiplier-staking',
          { params: { limit: 10000, offset: 0 } }
        ).catch(() => ({ success: false, data: [] }))
        
        // Map multiplier berdasarkan member_id (bonus_multiplier_staking tidak punya staking_id)
        // Ambil multiplier aktif (belum unstake) untuk setiap member
        const multiplierMapByMember = new Map()
        if (multiplierRes?.success && Array.isArray(multiplierRes.data)) {
          multiplierRes.data.forEach((m: any) => {
            if (m.member_id) {
              // Ambil multiplier aktif (belum unstake) untuk member ini
              // Jika sudah ada, prioritaskan yang belum unstake
              const existing = multiplierMapByMember.get(m.member_id)
              if (!existing || (!m.unstaked_at && existing.unstaked_at)) {
                multiplierMapByMember.set(m.member_id, m)
              }
            }
          })
        }
        
        // Map multiplier data to staking records berdasarkan member_id
        unstakedList.value = stakingRes.data.map((s: any) => {
          return {
            ...s,
            bonus_staking_multipliyer: s.member_id ? multiplierMapByMember.get(s.member_id) || null : null
          }
        })
      } catch {
        // If fetching multiplier fails, just use staking data without multiplier
        unstakedList.value = stakingRes.data.map((s: any) => ({
          ...s,
          bonus_staking_multipliyer: null
        }))
      }
      // Fetch bonus_multiplier_schedules untuk total paid (selalu saat ada data staking)
      try {
        const schedRes = await $fetch<{ success?: boolean; data?: any[] }>(
          '/api/admin/bonus-multiplier-schedules',
          { params: { limit: 10000, offset: 0 } }
        ).catch(() => ({ success: false, data: [] }))
        schedulesList.value = Array.isArray(schedRes?.data) ? schedRes.data : []
      } catch {
        schedulesList.value = []
      }
    } else {
      unstakedList.value = []
      schedulesList.value = []
    }
    if (bonusRes?.success && bonusRes.data) {
      const b = bonusRes.data
      coinCode.value = b.coin_code || b.coin_name || ''
      bonusSettings.value = {
        coin_code: b.coin_code || b.coin_name || '',
        multiplier_percentage: parseFloat(b.multiplier_percentage) || 10,
        reward_interval_minutes: parseInt(b.reward_interval_minutes, 10) || 60, // Untuk staking biasa
        multiplier_increment_percentage: (b.multiplier_increment_percentage != null && b.multiplier_increment_percentage !== '') ? parseInt(String(b.multiplier_increment_percentage), 10) : undefined, // Langsung dari DB; INTEGER menit (bukan persen)
        multiplier_increment_minutes: parseInt(b.multiplier_increment_minutes, 10) || null,
        default_staking_duration_minutes: parseInt(b.default_staking_duration_minutes, 10) || 43200
      }
    }
    if (coinRes?.success && coinRes.data) {
      coinSettings.value = { coin_code: coinRes.data.coin_code || '' }
      if (!coinCode.value && coinRes.data.coin_code) coinCode.value = coinRes.data.coin_code
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

const processMultiplierRewards = async () => {
  try {
    processingMultiplierRewards.value = true
    errorMessage.value = ''
    successMessage.value = ''
    const res = await $fetch<{ success?: boolean; message?: string; processed?: number; total?: number; errors?: string[] }>(
      '/api/admin/process-pending-multiplier-rewards',
      { method: 'POST' }
    )
    if (res?.success) {
      let msg = res.processed !== undefined && res.total !== undefined
        ? `${res.message || 'Selesai.'} (${res.processed}/${res.total})`
        : (res.message || 'Process multiplier rewards selesai.')
      if (res.errors?.length) msg += ` — ${res.errors.slice(0, 2).join('; ')}`
      successMessage.value = msg
      setTimeout(() => { successMessage.value = '' }, 6000)
      await fetchData()
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? 'Gagal process multiplier rewards'
    setTimeout(() => { errorMessage.value = '' }, 6000)
  } finally {
    processingMultiplierRewards.value = false
  }
}

const formatCoinAmount = (amount: unknown) => {
  if (amount == null) return '0'
  const num = parseFloat(String(amount))
  return Number.isNaN(num) ? '0' : num.toFixed(8).replace(/\.?0+$/, '')
}

const formatCoinAmountWithCode = (amount: unknown) => {
  const formatted = formatCoinAmount(amount)
  const code = coinSettings.value?.coin_code || coinCode.value || ''
  return code ? `${formatted} ${code}` : formatted
}

const parseAsUTC = (date: unknown) => {
  if (!date) return null
  if (typeof date === 'string') {
    if (!date.includes('Z') && !date.includes('+') && !date.includes('-', 10)) {
      const normalized = date.replace(' ', 'T') + 'Z'
      return new Date(normalized)
    }
  }
  return new Date(String(date))
}

const formatDateTimeUTC = (date: unknown) => {
  if (!date) return '-'
  const d = parseAsUTC(date)
  if (!d) return '-'
  const year = d.getUTCFullYear()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[d.getUTCMonth()]
  const day = d.getUTCDate().toString().padStart(2, '0')
  const hours = d.getUTCHours().toString().padStart(2, '0')
  const minutes = d.getUTCMinutes().toString().padStart(2, '0')
  const seconds = d.getUTCSeconds().toString().padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} UTC`
}

const formatDateTimeWIB = (date: unknown) => {
  if (!date) return '-'
  const d = parseAsUTC(date)
  if (!d) return '-'
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
  return `${day?.padStart(2, '0')} ${month} ${year}, ${hours?.padStart(2, '0')}:${minutes?.padStart(2, '0')}:${seconds?.padStart(2, '0')} WIB`
}

const formatDuration = (minutes: number) => {
  if (!minutes) return '-'
  const mins = parseInt(String(minutes), 10)
  if (Number.isNaN(mins)) return '-'
  const months = mins / 43200
  if (months >= 1) {
    const whole = Math.floor(months)
    const rem = mins - whole * 43200
    const days = Math.floor(rem / 1440)
    if (days > 0) return `${whole} bulan ${days} hari`
    return `${whole} bulan`
  }
  const days = Math.floor(mins / 1440)
  if (days >= 1) {
    const rem = mins - days * 1440
    const h = Math.floor(rem / 60)
    if (h > 0) return `${days} hari ${h} jam`
    return `${days} hari`
  }
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0) return `${h} jam ${m} menit`
  return `${m} menit`
}

const formatMemberType = (type: string) => {
  const types: Record<string, string> = { normal: 'Normal', leader: 'Leader', vip: 'VIP', presale: 'Presale' }
  return types[type] || type || 'Normal'
}

onMounted(() => fetchData())
</script>
