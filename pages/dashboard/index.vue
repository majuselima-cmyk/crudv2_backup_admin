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
            Dashboard Admin
          </h1>
        </div>
      </header>

      <!-- Dashboard Content -->
      <main class="p-4 lg:p-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-500">Total Data</h3>
              <Icon name="check-circle" size="md" class="text-blue-600" />
            </div>
            <p class="text-3xl font-bold text-gray-800 mb-1">0</p>
            <p class="text-xs text-gray-500">Total items</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-500">Aktif</h3>
              <Icon name="check-circle" size="md" class="text-green-600" />
            </div>
            <p class="text-3xl font-bold text-blue-600 mb-1">0</p>
            <p class="text-xs text-gray-500">Active items</p>
          </div>

          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-medium text-gray-500">Tidak Aktif</h3>
              <Icon name="x-circle" size="md" class="text-red-600" />
            </div>
            <p class="text-3xl font-bold text-red-600 mb-1">0</p>
            <p class="text-xs text-gray-500">Inactive items</p>
          </div>
        </div>

        <!-- Data Table Card -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">Manajemen Data</h2>
            <button 
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md"
            >
              <Icon name="plus" size="sm" />
              Tambah Data
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">No</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Nama</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr 
                  v-for="(item, index) in sampleData" 
                  :key="index"
                  class="hover:bg-gray-50 transition"
                >
                  <td class="py-4 px-4 text-gray-600">{{ index + 1 }}</td>
                  <td class="py-4 px-4 text-gray-800">-</td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        item.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      {{ item.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                      <button 
                        class="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition text-sm"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        class="flex items-center gap-1 text-red-600 hover:text-red-700 transition text-sm"
                      >
                        <Icon name="delete" size="sm" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="sampleData.length === 0">
                  <td colspan="4" class="py-8 px-4 text-center text-gray-400">
                    Tidak ada data
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
