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

        <!-- Deposit Chart Card -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 mb-8">
          <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50/50 to-transparent">
            <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <div class="w-1 h-6 bg-gradient-to-b from-emerald-600 to-emerald-500 rounded-full"></div>
              Grafik Deposit (7 Hari Terakhir)
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
              <div class="relative h-64 flex items-end justify-between gap-2">
                <div 
                  v-for="(item, index) in depositChartData" 
                  :key="index"
                  class="flex-1 flex flex-col items-center group"
                >
                  <div class="relative w-full flex flex-col items-center">
                    <!-- Tooltip -->
                    <div class="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <div class="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                        <div class="font-semibold">{{ item.date }}</div>
                        <div class="text-emerald-300">{{ formatCurrency(item.amount) }} USDT</div>
                      </div>
                      <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                    
                    <!-- Bar -->
                    <div 
                      class="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg hover:from-emerald-600 hover:to-emerald-500 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                      :style="{ height: `${item.height}%`, minHeight: item.amount > 0 ? '4px' : '0' }"
                    ></div>
                  </div>
                  
                  <!-- Label -->
                  <div class="mt-2 text-xs text-gray-600 font-medium text-center">
                    <div>{{ item.label }}</div>
                    <div class="text-gray-500 font-semibold">{{ item.dayNum }}</div>
                  </div>
                </div>
              </div>

              <!-- Summary -->
              <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div class="text-center">
                  <div class="text-2xl font-bold text-emerald-600">{{ formatCurrency(chartSummary.total) }}</div>
                  <div class="text-xs text-gray-500 mt-1">Total 7 Hari</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-blue-600">{{ formatCurrency(chartSummary.average) }}</div>
                  <div class="text-xs text-gray-500 mt-1">Rata-rata/Hari</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-purple-600">{{ formatCurrency(chartSummary.max) }}</div>
                  <div class="text-xs text-gray-500 mt-1">Tertinggi</div>
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
  max: 0
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
    // Get deposits from last 7 days
    const response = await $fetch('/api/admin/deposits', {
      params: {
        limit: 1000,
        status: 'completed'
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
        
        // Calculate total deposit for this day
        const dayDeposits = deposits.filter(deposit => {
          const depositDate = new Date(deposit.created_at)
          depositDate.setHours(0, 0, 0, 0)
          return depositDate.getTime() === date.getTime()
        })
        
        const totalAmount = dayDeposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
        
        last7Days.push({
          date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          label: dayName,
          dayNum: dayNum,
          amount: totalAmount,
          count: dayDeposits.length
        })
      }
      
      // Calculate max for height percentage
      const maxAmount = Math.max(...last7Days.map(d => d.amount), 1)
      
      depositChartData.value = last7Days.map(item => ({
        ...item,
        height: maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0
      }))
      
      // Calculate summary
      const total = last7Days.reduce((sum, d) => sum + d.amount, 0)
      chartSummary.value = {
        total: total,
        average: total / 7,
        max: maxAmount
      }
    }
  } catch (error) {
    console.error('Failed to fetch deposit chart:', error)
    depositChartData.value = []
  } finally {
    loadingChart.value = false
  }
}

// Load data on mount
onMounted(() => {
  fetchStats()
  fetchDepositChart()
})
</script>
