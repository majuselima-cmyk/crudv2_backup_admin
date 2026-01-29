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
      <header class="hidden lg:block sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-lg">
        <div class="flex items-center justify-between px-6 py-4">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Dashboard Admin
          </h1>
        </div>
      </header>

      <!-- Dashboard Content -->
      <main class="p-4 lg:p-8">
        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Total Members Card -->
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-2">
              <div class="p-3 bg-white/20 rounded-lg">
                <Icon name="users" size="lg" class="text-white" />
              </div>
              <span class="text-blue-100 text-sm font-medium">Total Member</span>
            </div>
            <div class="mt-2">
              <p class="text-3xl font-bold">{{ formatNumber(stats.totalMembers || 0) }}</p>
              <p class="text-blue-100 text-xs mt-1">Jumlah member terdaftar</p>
            </div>
          </div>

          <!-- Total Deposit Card -->
          <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-2">
              <div class="p-3 bg-white/20 rounded-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
              <span class="text-emerald-100 text-sm font-medium">Total Deposit</span>
            </div>
            <div class="mt-2">
              <p class="text-3xl font-bold">{{ formatCurrency(stats.totalDeposit || 0) }}</p>
              <p class="text-emerald-100 text-xs mt-1">USDT dari deposit</p>
            </div>
          </div>

          <!-- Total Withdraw Card -->
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div class="flex items-center justify-between mb-2">
              <div class="p-3 bg-white/20 rounded-lg">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </div>
              <span class="text-purple-100 text-sm font-medium">Total Withdraw</span>
            </div>
            <div class="mt-2">
              <p class="text-3xl font-bold">{{ formatCurrency(stats.totalWithdraw || 0) }}</p>
              <p class="text-purple-100 text-xs mt-1">USDT yang di-withdraw</p>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Deposit Chart Card -->
          <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50/50 to-transparent">
              <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div class="w-1 h-6 bg-gradient-to-b from-emerald-600 to-emerald-500 rounded-full"></div>
                Grafik Depo
              </h2>
            </div>

            <div class="p-6">
              <div v-if="loadingChart" class="flex items-center justify-center py-12">
                <div class="text-gray-400">Memuat data...</div>
              </div>
              <div v-else-if="depositChartData.length === 0" class="flex items-center justify-center py-12">
                <div class="text-center">
                  <Icon name="document-text" size="lg" class="text-gray-300 mx-auto mb-2" />
                  <p class="text-gray-400">Tidak ada data deposit</p>
                </div>
              </div>
              <div v-else class="space-y-4">
              <!-- Chart Container -->
              <div class="relative h-64">
                <!-- Line SVG -->
                <svg class="absolute inset-0 w-full h-full overflow-visible z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <!-- Completed Area -->
                  <path
                    :d="getChartAreaPath(depositChartData, 'heightCompleted')"
                    class="text-emerald-500 opacity-10"
                    fill="currentColor"
                    stroke="none"
                  />
                  <!-- Completed Line -->
                  <path
                    :d="getChartPath(depositChartData, 'heightCompleted')"
                    fill="none"
                    stroke="#10B981" 
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                    class="z-10 relative"
                  />
                  <!-- Pending Line -->
                  <path
                    :d="getChartPath(depositChartData, 'heightPending')"
                    fill="none"
                    stroke="#fbbf24" 
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-dasharray="4 4"
                    vector-effect="non-scaling-stroke"
                    class="z-10 relative"
                  />
                </svg>

                <!-- Interaction Layer -->
                <div class="absolute inset-0 flex items-end justify-between z-10 w-full h-full">
                  <div 
                    v-for="(item, index) in depositChartData" 
                    :key="index"
                    class="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <!-- Dot on Completed line -->
                    <div 
                      class="absolute w-3 h-3 bg-white border-2 border-emerald-500 rounded-full transition-transform group-hover:scale-125 z-20"
                      :style="{ bottom: `${item.heightCompleted}%`, marginBottom: '-6px' }"
                    ></div>
                    
                     <!-- Dot on Pending line (only if value > 0) -->
                    <div 
                      v-if="item.amountPending > 0"
                      class="absolute w-2 h-2 bg-white border-2 border-amber-400 rounded-full transition-transform group-hover:scale-125 z-20"
                      :style="{ bottom: `${item.heightPending}%`, marginBottom: '-4px' }"
                    ></div>

                    <!-- Vertical Hover Line -->
                    <div class="absolute bottom-0 w-px bg-gray-300 border-l border-gray-300 border-dashed h-full opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none z-0"></div>

                    <!-- Tooltip -->
                    <div class="absolute bottom-[calc(100%-2rem)] mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none" :style="{ bottom: `${Math.max(item.heightCompleted, item.heightPending)}%`, marginBottom: '12px' }">
                      <div class="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div class="font-semibold border-b border-gray-700 pb-1 mb-1">{{ item.date }}</div>
                        <div class="flex items-center justify-between gap-3 text-emerald-300">
                          <span>Completed:</span>
                          <span class="font-mono">{{ formatCurrency(item.amountCompleted) }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3 text-amber-400">
                          <span>Pending:</span>
                          <span class="font-mono">{{ formatCurrency(item.amountPending) }}</span>
                        </div>
                      </div>
                      <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                    
                    <!-- Label -->
                    <div class="mt-4 text-xs text-gray-600 font-medium text-center absolute -bottom-6 w-full">
                      <div>{{ item.label }}</div>
                      <div class="text-gray-500 font-semibold">{{ item.dayNum }}</div>
                    </div>
                  </div>
                </div>
              </div>

               <!-- Spacer for labels -->
               <div class="h-6"></div>
               
               <!-- Legend -->
               <div class="flex items-center justify-center gap-4 mt-2 text-xs">
                 <div class="flex items-center gap-1.5">
                   <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span class="text-gray-600">Completed</span>
                 </div>
                 <div class="flex items-center gap-1.5">
                   <div class="w-2 h-2 rounded-full bg-amber-400 border border-amber-400"></div>
                   <span class="text-gray-600">Pending</span>
                 </div>
               </div>

              <!-- Summary -->
              <div class="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 mt-2">
                <div class="text-center">
                  <div class="text-lg font-bold text-emerald-600">{{ formatCurrency(chartSummary.total) }} <span class="text-xs text-gray-400 font-normal">USDT</span></div>
                  <div class="text-[10px] text-gray-500 mt-1">Total Completed</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-blue-600">{{ formatCurrency(chartSummary.average) }} <span class="text-xs text-gray-400 font-normal">USDT</span></div>
                  <div class="text-[10px] text-gray-500 mt-1">Avg Completed</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-amber-500">{{ formatCurrency(chartSummary.pendingTotal) }} <span class="text-xs text-gray-400 font-normal">USDT</span></div>
                  <div class="text-[10px] text-gray-500 mt-1">Total Pending</div>
                </div>
              </div>
            </div>
            </div>
          </div>

          <!-- Withdraw Chart Card -->
          <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
            <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50/50 to-transparent">
              <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <div class="w-1 h-6 bg-gradient-to-b from-purple-600 to-purple-500 rounded-full"></div>
                Grafik WD
              </h2>
            </div>

            <div class="p-6">
              <div v-if="loadingWithdrawChart" class="flex items-center justify-center py-12">
                <div class="text-gray-400">Memuat data...</div>
              </div>
              <div v-else-if="withdrawChartData.length === 0" class="flex items-center justify-center py-12">
                <div class="text-center">
                  <Icon name="document-text" size="lg" class="text-gray-300 mx-auto mb-2" />
                  <p class="text-gray-400">Tidak ada data withdraw</p>
                </div>
              </div>
              <div v-else class="space-y-4">
              <!-- Chart Container -->
              <div class="relative h-64">
                <!-- Line SVG -->
                 <svg class="absolute inset-0 w-full h-full overflow-visible z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <!-- Completed Area -->
                  <path
                    :d="getChartAreaPath(withdrawChartData, 'heightCompleted')"
                    class="text-purple-500 opacity-10"
                    fill="currentColor"
                    stroke="none"
                  />
                  <!-- Completed Line -->
                  <path
                    :d="getChartPath(withdrawChartData, 'heightCompleted')"
                    fill="none"
                    stroke="#9333EA" 
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                    class="z-10 relative"
                  />
                   <!-- Pending Line -->
                  <path
                    :d="getChartPath(withdrawChartData, 'heightPending')"
                    fill="none"
                    stroke="#F97316" 
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-dasharray="4 4"
                    vector-effect="non-scaling-stroke"
                    class="z-10 relative"
                  />
                </svg>

                <!-- Interaction Layer -->
                <div class="absolute inset-0 flex items-end justify-between z-10 w-full h-full">
                  <div 
                    v-for="(item, index) in withdrawChartData" 
                    :key="index"
                    class="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    <!-- Dot on Completed line -->
                    <div 
                      class="absolute w-3 h-3 bg-white border-2 border-purple-500 rounded-full transition-transform group-hover:scale-125 z-20"
                      :style="{ bottom: `${item.heightCompleted}%`, marginBottom: '-6px' }"
                    ></div>
                    
                    <!-- Dot on Pending line -->
                    <div 
                      v-if="item.amountPending > 0"
                      class="absolute w-2 h-2 bg-white border-2 border-orange-500 rounded-full transition-transform group-hover:scale-125 z-20"
                      :style="{ bottom: `${item.heightPending}%`, marginBottom: '-4px' }"
                    ></div>

                    <!-- Vertical Hover Line -->
                     <div class="absolute bottom-0 w-px bg-gray-300 border-l border-gray-300 border-dashed h-full opacity-0 group-hover:opacity-50 transition-opacity pointer-events-none z-0"></div>

                    <!-- Tooltip -->
                    <div class="absolute bottom-[calc(100%-2rem)] mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none" :style="{ bottom: `${Math.max(item.heightCompleted, item.heightPending)}%`, marginBottom: '12px' }">
                      <div class="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div class="font-semibold border-b border-gray-700 pb-1 mb-1">{{ item.date }}</div>
                         <div class="flex items-center justify-between gap-3 text-purple-300">
                          <span>Completed:</span>
                          <span class="font-mono">{{ formatCurrency(item.amountCompleted) }}</span>
                        </div>
                        <div class="flex items-center justify-between gap-3 text-orange-400">
                          <span>Pending:</span>
                          <span class="font-mono">{{ formatCurrency(item.amountPending) }}</span>
                        </div>
                      </div>
                      <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                    
                    <!-- Label -->
                    <div class="mt-4 text-xs text-gray-600 font-medium text-center absolute -bottom-6 w-full">
                      <div>{{ item.label }}</div>
                      <div class="text-gray-500 font-semibold">{{ item.dayNum }}</div>
                    </div>
                  </div>
                </div>
              </div>

               <!-- Spacer for labels -->
               <div class="h-6"></div>
               
                <!-- Legend -->
               <div class="flex items-center justify-center gap-4 mt-2 text-xs">
                 <div class="flex items-center gap-1.5">
                   <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                   <span class="text-gray-600">Completed</span>
                 </div>
                 <div class="flex items-center gap-1.5">
                   <div class="w-2 h-2 rounded-full bg-orange-500 border border-orange-500"></div>
                   <span class="text-gray-600">Pending</span>
                 </div>
               </div>

              <!-- Summary -->
              <div class="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 mt-2">
                <div class="text-center">
                  <div class="text-lg font-bold text-purple-600">{{ formatCurrency(withdrawChartSummary.total) }} <span class="text-xs text-gray-400 font-normal">USDT</span></div>
                  <div class="text-[10px] text-gray-500 mt-1">Total Completed</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-blue-600">{{ formatCurrency(withdrawChartSummary.average) }} <span class="text-xs text-gray-400 font-normal">USDT</span></div>
                  <div class="text-[10px] text-gray-500 mt-1">Avg Completed</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-bold text-pink-600">{{ formatCurrency(withdrawChartSummary.pendingTotal) }} <span class="text-xs text-gray-400 font-normal">USDT</span></div>
                  <div class="text-[10px] text-gray-500 mt-1">Total Pending</div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
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
const loadingChart = ref(true)
const loadingWithdrawChart = ref(true)

// Statistics data
const stats = ref({
  totalMembers: 0,
  totalDeposit: 0,
  totalWithdraw: 0
})

// Deposit chart data (last 7 days)
const depositChartData = ref([])
const chartSummary = ref({
  total: 0,
  average: 0,
  max: 0,
  pendingTotal: 0
})

// Withdraw chart data
const withdrawChartData = ref([])
const withdrawChartSummary = ref({
  total: 0,
  average: 0,
  max: 0,
  pendingTotal: 0
})

const toggleMobileMenu = () => {
  console.log('Toggle menu function called, current value:', isMobileMenuOpen.value)
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  console.log('New value:', isMobileMenuOpen.value)
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
    if (value === null || value === undefined || value === '') return '0'
    if (value === 0) return '0'
    const numValue = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(numValue)) return '0'
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue)
  } catch (error) {
    console.error('Error formatting number:', error)
    return '0'
  }
}

// Fetch statistics
const fetchStats = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/withdraw-stats')
    if (response.success && response.data) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
  } finally {
    loading.value = false
  }
}

// Fetch deposit chart data (last 7 days)
const fetchDepositChart = async () => {
  loadingChart.value = true
  try {
    // Get deposits from last 7 days (all statuses)
    const response = await $fetch('/api/admin/deposits', {
      params: {
        limit: 1000
      }
    })

    if (response && response.success && response.data) {
      const deposits = response.data || []
      
      // Get last 7 days
      const today = new Date()
      const last7Days = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const dateStr = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' })
        const dayNum = date.getDate()
        
        // Filter deposits by date
        const dayDeposits = deposits.filter(deposit => {
          const depositDate = new Date(deposit.created_at)
          depositDate.setHours(0, 0, 0, 0)
          return depositDate.getTime() === date.getTime()
        })
        
        // Calculate totals
        const totalCompleted = dayDeposits
          .filter(d => d.status === 'completed')
          .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
          
        const totalPending = dayDeposits
          .filter(d => d.status === 'pending' || d.status === 'verify')
          .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
        
        last7Days.push({
          date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          label: dayName,
          dayNum: dayNum,
          amountCompleted: totalCompleted,
          amountPending: totalPending,
          count: dayDeposits.length
        })
      }
      
      // Calculate max for height percentage (checks both completed and pending to scale chart correctly)
      const maxCompleted = Math.max(...last7Days.map(d => d.amountCompleted), 0)
      const maxPending = Math.max(...last7Days.map(d => d.amountPending), 0)
      const maxAmount = Math.max(maxCompleted, maxPending, 1) // Ensure min 1 to avoid division by zero
      
      depositChartData.value = last7Days.map(item => ({
        ...item,
        heightCompleted: (item.amountCompleted / maxAmount) * 100,
        heightPending: (item.amountPending / maxAmount) * 100
      }))
      
      // Calculate summary
      const totalCompleted = last7Days.reduce((sum, d) => sum + d.amountCompleted, 0)
      chartSummary.value = {
        total: totalCompleted,
        average: totalCompleted / 7,
        pendingTotal: last7Days.reduce((sum, d) => sum + d.amountPending, 0),
        max: maxCompleted
      }
    }
  } catch (error) {
    console.error('Failed to fetch deposit chart:', error)
    depositChartData.value = []
  } finally {
    loadingChart.value = false
  }
}

// Fetch withdraw chart data (last 7 days)
const fetchWithdrawChart = async () => {
  loadingWithdrawChart.value = true
  try {
    // Get withdraws from last 7 days (all statuses)
    const response = await $fetch('/api/admin/withdraws', {
      params: {
        limit: 1000
      }
    })

    if (response && response.success && response.data) {
      const withdraws = response.data || []
      
      // Get last 7 days
      const today = new Date()
      const last7Days = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const dateStr = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' })
        const dayNum = date.getDate()
        
        // Filter withdraws by date
        const dayWithdraws = withdraws.filter(w => {
          const wDate = new Date(w.created_at)
          wDate.setHours(0, 0, 0, 0)
          return wDate.getTime() === date.getTime()
        })
        
        // Calculate totals
        const totalCompleted = dayWithdraws
          .filter(w => w.status === 'completed')
          .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)

        const totalPending = dayWithdraws
          .filter(w => w.status === 'pending' || w.status === 'verify')
          .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)
        
        last7Days.push({
          date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          label: dayName,
          dayNum: dayNum,
          amountCompleted: totalCompleted,
          amountPending: totalPending,
          count: dayWithdraws.length
        })
      }
      
      // Calculate max for height percentage
      const maxCompleted = Math.max(...last7Days.map(d => d.amountCompleted), 0)
      const maxPending = Math.max(...last7Days.map(d => d.amountPending), 0)
      const maxAmount = Math.max(maxCompleted, maxPending, 1)
      
      withdrawChartData.value = last7Days.map(item => ({
        ...item,
        heightCompleted: (item.amountCompleted / maxAmount) * 100,
        heightPending: (item.amountPending / maxAmount) * 100
      }))
      
      // Calculate summary
      const totalCompleted = last7Days.reduce((sum, d) => sum + d.amountCompleted, 0)
      withdrawChartSummary.value = {
        total: totalCompleted,
        average: totalCompleted / 7,
        pendingTotal: last7Days.reduce((sum, d) => sum + d.amountPending, 0),
        max: maxCompleted
      }
    }
  } catch (error) {
    console.error('Failed to fetch withdraw chart:', error)
    withdrawChartData.value = []
  } finally {
    loadingWithdrawChart.value = false
  }
}

// Load data on mount
onMounted(() => {
  fetchStats()
  fetchDepositChart()
  fetchWithdrawChart()
  fetchWithdrawChart()
})

// SVG Helpers
const getChartPath = (data, key = 'height') => {
  if (!data || data.length === 0) return ''
  return data.map((item, index) => {
    // Aligns with the center of flex-1 columns
    const x = ((index + 0.5) / data.length) * 100
    const y = 100 - (item[key] || 0)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
}

const getChartAreaPath = (data, key = 'height') => {
  if (!data || data.length === 0) return ''
  const linePath = getChartPath(data, key)
  
  // Start from first point X, go down to 100, go to last point X
  const firstX = (0.5 / data.length) * 100
  const lastX = ((data.length - 0.5) / data.length) * 100
  
  return `${linePath} L ${lastX} 100 L ${firstX} 100 Z`
}
</script>
