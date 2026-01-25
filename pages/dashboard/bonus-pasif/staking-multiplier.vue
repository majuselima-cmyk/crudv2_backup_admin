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
            <h1 class="text-2xl font-bold text-blue-600">Daftar Staking Multiplier</h1>
            <p class="text-sm text-gray-500 mt-1">Data semua staking multiplier</p>
          </div>
          <div class="flex items-center gap-2">
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
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Total Staking Multiplier</p>
                  <p class="text-2xl font-bold text-gray-800 mt-1">{{ multiplierList.length }}</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-lg">
                  <Icon name="check-circle" size="md" class="text-gray-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Aktif</p>
                  <p class="text-2xl font-bold text-green-600 mt-1">{{ activeMultiplierCount }}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-lg">
                  <Icon name="check-circle" size="md" class="text-green-600" />
                </div>
              </div>
            </div>
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">Tidak Aktif</p>
                  <p class="text-2xl font-bold text-gray-600 mt-1">{{ inactiveMultiplierCount }}</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-lg">
                  <Icon name="x-circle" size="md" class="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          <!-- Daftar Staking Multiplier -->
          <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-gray-800">Daftar Staking Multiplier ({{ multiplierList.length }})</h2>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coin Amount</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus Base (%)</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durasi Staking Multiplier</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Reward Multiplier (Paid)</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Mulai<br/><span class="text-xs text-gray-400">(UTC & WIB)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Selesai<br/><span class="text-xs text-gray-400">(UTC & WIB)</span></th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-if="paginatedMultiplier.length === 0">
                      <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                        Belum ada data staking multiplier.
                      </td>
                    </tr>
                    <template v-for="m in paginatedMultiplier" :key="m.id">
                    <tr class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center gap-2">
                            <span class="font-medium text-gray-900">{{ m.member?.username || '-' }}</span>
                            <span
                              v-if="m.member?.member_type"
                              :class="[
                                'px-2 py-1 text-xs font-semibold rounded',
                                m.member?.member_type === 'vip'
                                  ? 'bg-purple-100 text-purple-800'
                                  : m.member?.member_type === 'leader'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              ]"
                            >
                              {{ formatMemberType(m.member.member_type) }}
                            </span>
                          </div>
                          <div class="text-gray-500 text-xs">{{ m.member?.email || '' }}</div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {{ formatCoinAmountWithCode(m.coin_amount ?? 0) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {{ m.multiplier_bonus_base_percentage ?? 0 }}%
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="font-medium text-gray-900">{{ calculateDuration(m) }}</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {{ formatCoinAmountWithCode(getTotalPaidRewardForMultiplier(m.id)) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div v-if="m.started_at" class="flex flex-col gap-1">
                          <div>
                            <span class="text-xs text-gray-500 font-medium">UTC:</span>
                            <span class="font-medium ml-1">{{ formatDateTimeUTC(m.started_at) }}</span>
                          </div>
                          <div>
                            <span class="text-xs text-gray-500 font-medium">WIB:</span>
                            <span class="font-medium ml-1 text-blue-600">{{ formatDateTimeWIB(m.started_at) }}</span>
                          </div>
                        </div>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div v-if="calculateMultiplierEndDate(m)" class="flex flex-col gap-1">
                          <div>
                            <span class="text-xs text-gray-500 font-medium">UTC:</span>
                            <span :class="['font-medium ml-1', m.unstaked_at ? 'text-green-700' : 'text-gray-700']">
                              {{ formatDateTimeUTC(calculateMultiplierEndDate(m)) }}
                            </span>
                          </div>
                          <div>
                            <span class="text-xs text-gray-500 font-medium">WIB:</span>
                            <span :class="['font-medium ml-1', m.unstaked_at ? 'text-green-600' : 'text-blue-600']">
                              {{ formatDateTimeWIB(calculateMultiplierEndDate(m)) }}
                            </span>
                          </div>
                          <span v-if="m.unstaked_at" class="text-xs text-orange-600 mt-1">Sudah selesai</span>
                        </div>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          v-if="!m.unstaked_at && (m.status === 'active' || !m.status)"
                          class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
                        >
                          Aktif
                        </span>
                        <span
                          v-else
                          class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700"
                        >
                          Tidak aktif
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            class="inline-flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                            title="Lihat Jadwal Reward"
                            @click="toggleScheduleRow(m.id)"
                          >
                            {{ expandedScheduleRows.has(m.id) ? '▼ Sembunyikan' : '▶ Jadwal' }}
                          </button>
                          <button
                            v-if="!m.unstaked_at"
                            type="button"
                            class="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            @click="openUnstakeModal(m)"
                          >
                            Unstake
                          </button>
                          <button
                            type="button"
                            class="inline-flex items-center px-3 py-1.5 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            @click="openDeleteModal(m)"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    <!-- Expanded Row: Jadwal Reward Multiplier -->
                    <tr v-if="m.id && expandedScheduleRows.has(m.id)">
                      <td colspan="9" class="px-6 py-4 bg-gray-50">
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                          <h4 class="text-sm font-semibold text-gray-800 mb-3">📅 Jadwal Pembagian Reward Multiplier</h4>
                          <div v-if="getSchedulesForMultiplier(m.id).length === 0" class="text-sm text-gray-500 text-center py-4">
                            Belum ada jadwal reward untuk staking multiplier ini
                          </div>
                          <div v-else class="space-y-3">
                            <div class="bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto border border-gray-200">
                              <div class="space-y-1">
                                <div
                                  v-for="(schedule, index) in getSchedulesForMultiplier(m.id)"
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
              <div
                v-if="multiplierList.length > 0"
                class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200"
              >
                <p class="text-sm text-gray-600">
                  Menampilkan {{ paginationStart + 1 }}-{{ paginationEnd }} dari {{ multiplierList.length }} item
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
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Delete Multiplier</h3>
          <p class="text-sm text-gray-500 mt-1">Apakah Anda yakin ingin menghapus data staking multiplier untuk member ini? Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <div v-if="selectedMultiplier" class="p-6 space-y-4">
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-600 mb-1">Member</p>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ selectedMultiplier.member?.username || '-' }}</span>
              <span
                v-if="selectedMultiplier.member?.member_type"
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded',
                  selectedMultiplier.member?.member_type === 'vip'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedMultiplier.member?.member_type === 'leader'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                ]"
              >
                {{ formatMemberType(selectedMultiplier.member.member_type) }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ selectedMultiplier.member?.email || '' }}</p>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeDeleteModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitDelete"
              :disabled="deleting"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ deleting ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Unstake Multiplier -->
    <div
      v-if="showUnstakeModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeUnstakeModal"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-xl font-semibold text-gray-800">Unstake Multiplier</h3>
          <p class="text-sm text-gray-500 mt-1">Apakah Anda yakin ingin unstake multiplier untuk member ini?</p>
        </div>
        <div v-if="selectedMultiplier" class="p-6 space-y-4">
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="text-sm text-gray-600 mb-1">Member</p>
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900">{{ selectedMultiplier.member?.username || '-' }}</span>
              <span
                v-if="selectedMultiplier.member?.member_type"
                :class="[
                  'px-2 py-1 text-xs font-semibold rounded',
                  selectedMultiplier.member?.member_type === 'vip'
                    ? 'bg-purple-100 text-purple-800'
                    : selectedMultiplier.member?.member_type === 'leader'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                ]"
              >
                {{ formatMemberType(selectedMultiplier.member.member_type) }}
              </span>
            </div>
            <p class="text-sm text-gray-500 mt-1">{{ selectedMultiplier.member?.email || '' }}</p>
          </div>
          <div v-if="selectedMultiplier.started_at" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p class="text-sm text-gray-600 mb-1">Tanggal Mulai multiplier</p>
            <p class="text-sm font-medium text-gray-900">
              {{ formatDateTimeWIB(selectedMultiplier.started_at) }}
            </p>
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeUnstakeModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="button"
              @click="submitUnstake"
              :disabled="unstaking"
              class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ unstaking ? 'Memproses...' : 'Unstake' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isMobileMenuOpen = ref(false)
const loading = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const multiplierList = ref<any[]>([])
const coinCode = ref('')
const coinSettings = ref<{ coin_code?: string }>({})
const currentPage = ref(1)
const itemsPerPage = ref(25)
const showUnstakeModal = ref(false)
const showDeleteModal = ref(false)
const selectedMultiplier = ref<any>(null)
const unstaking = ref(false)
const deleting = ref(false)
const schedulesList = ref<any[]>([])
const expandedScheduleRows = ref<Set<string>>(new Set())

const totalPages = computed(() => Math.max(1, Math.ceil(multiplierList.value.length / itemsPerPage.value)))
const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const paginationEnd = computed(() => Math.min(paginationStart.value + itemsPerPage.value, multiplierList.value.length))
const paginatedMultiplier = computed(() => {
  return multiplierList.value.slice(paginationStart.value, paginationStart.value + itemsPerPage.value)
})

const activeMultiplierCount = computed(() => {
  return multiplierList.value.filter(m => !m.unstaked_at && (m.status === 'active' || !m.status)).length
})

const inactiveMultiplierCount = computed(() => {
  return multiplierList.value.filter(m => m.unstaked_at || m.status !== 'active').length
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const openUnstakeModal = (multiplier: any) => {
  selectedMultiplier.value = multiplier
  showUnstakeModal.value = true
}

const closeUnstakeModal = () => {
  showUnstakeModal.value = false
  selectedMultiplier.value = null
}

const openDeleteModal = (multiplier: any) => {
  selectedMultiplier.value = multiplier
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  selectedMultiplier.value = null
}

const toggleScheduleRow = (multiplierId: string) => {
  const set = new Set(expandedScheduleRows.value)
  if (set.has(multiplierId)) {
    set.delete(multiplierId)
  } else {
    set.add(multiplierId)
    if (schedulesList.value.length === 0) fetchSchedulesList()
  }
  expandedScheduleRows.value = set
}

const fetchSchedulesList = async () => {
  try {
    const res = await $fetch<{ success?: boolean; data?: any[] }>(
      '/api/admin/bonus-multiplier-schedules',
      { params: { limit: 10000, offset: 0 } }
    )
    if (res?.success && Array.isArray(res.data)) {
      schedulesList.value = res.data
    } else {
      schedulesList.value = []
    }
  } catch {
    schedulesList.value = []
  }
}

const getSchedulesForMultiplier = (multiplierStakingId: string) => {
  const list = schedulesList.value.filter(
    (s: any) => s.multiplier_staking_id === multiplierStakingId
  )
  return list.sort((a: any, b: any) =>
    new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime()
  )
}

const getTotalPaidRewardForMultiplier = (multiplierStakingId: string) => {
  return schedulesList.value
    .filter((s: any) => s.multiplier_staking_id === multiplierStakingId && s.status === 'paid')
    .reduce((sum: number, s: any) => sum + (parseFloat(String(s.reward_amount ?? 0)) || 0), 0)
}

const formatScheduleStatus = (status: string) => {
  if (status === 'paid') return 'Paid'
  if (status === 'pending') return 'Pending'
  return status || 'Pending'
}

const formatDateTimeUTCCompact = (date: unknown) => {
  if (!date) return '-'
  const d = parseAsUTC(date) as Date
  if (!d) return '-'
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const h = String(d.getUTCHours()).padStart(2, '0')
  const min = String(d.getUTCMinutes()).padStart(2, '0')
  const s = String(d.getUTCSeconds()).padStart(2, '0')
  return `${day}/${m}/${y} ${h}:${min}:${s}`
}

const formatDateTimeWIBCompact = (date: unknown) => {
  if (!date) return '-'
  const d = parseAsUTC(date) as Date | null
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
  return `${day?.padStart(2, '0')} ${month} ${year}, ${hours?.padStart(2, '0')}:${minutes?.padStart(2, '0')}:${seconds?.padStart(2, '0')}`
}

const submitUnstake = async () => {
  if (!selectedMultiplier.value?.id) return
  try {
    unstaking.value = true
    errorMessage.value = ''
    await $fetch(`/api/admin/bonus-multiplier-staking/${selectedMultiplier.value.id}`, {
      method: 'PUT',
      body: {
        unstaked_at: new Date().toISOString()
      }
    })
    closeUnstakeModal()
    successMessage.value = 'Unstake multiplier berhasil'
    setTimeout(() => { successMessage.value = '' }, 5000)
    await fetchData()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? 'Gagal unstake multiplier'
    setTimeout(() => { errorMessage.value = '' }, 5000)
  } finally {
    unstaking.value = false
  }
}

const submitDelete = async () => {
  if (!selectedMultiplier.value?.id) return
  try {
    deleting.value = true
    errorMessage.value = ''
    await $fetch(`/api/admin/bonus-multiplier-staking/${selectedMultiplier.value.id}`, {
      method: 'DELETE'
    })
    closeDeleteModal()
    successMessage.value = 'Data staking multiplier berhasil dihapus'
    setTimeout(() => { successMessage.value = '' }, 5000)
    await fetchData()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? 'Gagal menghapus staking multiplier'
    setTimeout(() => { errorMessage.value = '' }, 5000)
  } finally {
    deleting.value = false
  }
}

const fetchData = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    const [multiplierRes, coinRes] = await Promise.all([
      $fetch<{ success?: boolean; data?: any[] }>(
        '/api/admin/bonus-multiplier-staking',
        { params: { limit: 10000, offset: 0 } }
      ).catch(() => ({ success: false, data: [] })),
      $fetch<{ success?: boolean; data?: any }>('/api/admin/coin').catch(() => ({ success: false, data: null }))
    ])
    
    if (multiplierRes?.success && Array.isArray(multiplierRes.data)) {
      multiplierList.value = multiplierRes.data
    } else {
      multiplierList.value = []
    }
    
    if (coinRes?.success && coinRes.data) {
      coinSettings.value = { coin_code: coinRes.data.coin_code || '' }
      if (!coinCode.value && coinRes.data.coin_code) coinCode.value = coinRes.data.coin_code
    }
    
    await fetchSchedulesList()
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Gagal memuat data'
  } finally {
    loading.value = false
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

const formatMemberType = (type: string) => {
  const types: Record<string, string> = { normal: 'Normal', leader: 'Leader', vip: 'VIP', presale: 'Presale' }
  return types[type] || type || 'Normal'
}

const calculateDuration = (multiplier: any) => {
  // Ambil durasi dari field multiplier_increment_period_minutes
  const periodMinutes = multiplier.multiplier_increment_period_minutes
  
  if (!periodMinutes || periodMinutes <= 0) return '-'
  
  const minutes = parseInt(String(periodMinutes), 10)
  if (Number.isNaN(minutes)) return '-'
  
  return formatDuration(minutes)
}

const calculateMultiplierEndDate = (multiplier: any) => {
  // Jika sudah unstaked, gunakan unstaked_at
  if (multiplier.unstaked_at) {
    return parseAsUTC(multiplier.unstaked_at) as Date | null
  }
  
  // Jika belum unstaked, hitung dari started_at + multiplier_increment_period_minutes
  if (!multiplier.started_at || !multiplier.multiplier_increment_period_minutes) return null
  
  const startDate = parseAsUTC(multiplier.started_at) as Date | null
  if (!startDate) return null
  
  const periodMinutes = parseInt(String(multiplier.multiplier_increment_period_minutes), 10)
  if (Number.isNaN(periodMinutes) || periodMinutes <= 0) return null
  
  return new Date(startDate.getTime() + periodMinutes * 60 * 1000)
}

const formatDuration = (minutes: number) => {
  if (!minutes || minutes < 0) return '-'
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

let autoUpdateMultiplierPaidInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchData()

  // Auto-update multiplier schedule status (pending → paid) saat pertama kali load
  setTimeout(async () => {
    try {
      const res = await $fetch<{ success?: boolean; processed?: number }>(
        '/api/admin/process-pending-multiplier-rewards',
        { method: 'POST' }
      ).catch(() => null)
      if (res?.success && (res.processed ?? 0) > 0) {
        await fetchSchedulesList()
        await fetchData()
      }
    } catch {
      /* silent */
    }
  }, 1000)

  // Auto-update hanya saat tab aktif, setiap 90 detik (lebih ringan untuk server)
  const runProcessPending = async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    try {
      const res = await $fetch<{ success?: boolean; processed?: number }>(
        '/api/admin/process-pending-multiplier-rewards',
        { method: 'POST' }
      ).catch(() => null)
      if (res?.success && (res.processed ?? 0) > 0) {
        await fetchSchedulesList()
        await fetchData()
      }
    } catch {
      /* silent */
    }
  }
  autoUpdateMultiplierPaidInterval = setInterval(runProcessPending, 90000)
})

onBeforeUnmount(() => {
  if (autoUpdateMultiplierPaidInterval) {
    clearInterval(autoUpdateMultiplierPaidInterval)
    autoUpdateMultiplierPaidInterval = null
  }
})
</script>
