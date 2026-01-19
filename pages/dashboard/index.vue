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
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="group relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-500">Total Data</h3>
                <div class="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Icon name="check-circle" size="md" class="text-blue-600" />
                </div>
              </div>
              <p class="text-3xl font-bold text-gray-800 mb-1">0</p>
              <p class="text-xs text-gray-500">Total items</p>
            </div>
          </div>

          <div class="group relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-500">Aktif</h3>
                <div class="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <Icon name="check-circle" size="md" class="text-green-600" />
                </div>
              </div>
              <p class="text-3xl font-bold text-blue-600 mb-1">0</p>
              <p class="text-xs text-gray-500">Active items</p>
            </div>
          </div>

          <div class="group relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-medium text-gray-500">Tidak Aktif</h3>
                <div class="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  <Icon name="x-circle" size="md" class="text-red-600" />
                </div>
              </div>
              <p class="text-3xl font-bold text-red-600 mb-1">0</p>
              <p class="text-xs text-gray-500">Inactive items</p>
            </div>
          </div>
        </div>

        <!-- Data Table Card -->
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-transparent">
            <h2 class="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <div class="w-1 h-6 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full"></div>
              Manajemen Data
            </h2>
            <button 
              class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-sm hover:shadow-lg transform hover:scale-105"
            >
              <Icon name="plus" size="sm" />
              Tambah Data
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">No</th>
                  <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nama</th>
                  <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr 
                  v-for="(item, index) in sampleData" 
                  :key="index"
                  class="hover:bg-blue-50/50 transition-all duration-200"
                >
                  <td class="py-4 px-4 text-gray-600 font-medium">{{ index + 1 }}</td>
                  <td class="py-4 px-4 text-gray-800 font-medium">-</td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-3 py-1 rounded-lg text-xs font-medium border',
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-red-100 text-red-700 border-red-200'
                      ]"
                    >
                      {{ item.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                      <button 
                        class="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-sm font-medium"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        class="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium"
                      >
                        <Icon name="delete" size="sm" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="sampleData.length === 0">
                  <td colspan="4" class="py-12 px-4 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                      <Icon name="document-text" size="lg" class="text-gray-400" />
                    </div>
                    <p class="text-gray-400 font-medium">Tidak ada data</p>
                  </td>
                </tr>
              </tbody>
            </table>
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

const toggleMobileMenu = () => {
  console.log('Toggle menu function called, current value:', isMobileMenuOpen.value)
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  console.log('New value:', isMobileMenuOpen.value)
}

// Sample data - replace with actual data
const sampleData = ref([])
</script>
