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
            Manajemen Data
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
                  placeholder="Cari..."
                  class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <button 
              @click="showAddModal = true"
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition whitespace-nowrap shadow-sm hover:shadow-md"
            >
              <Icon name="plus" size="sm" />
              Tambah Data
            </button>
          </div>
        </div>

        <!-- Data Table Card -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <!-- Table Header -->
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">
              Data Anda
            </h2>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">No</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Nama</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr 
                  v-for="(item, index) in filteredData" 
                  :key="item.id"
                  class="hover:bg-gray-50 transition"
                >
                  <td class="py-4 px-4 text-gray-600">{{ index + 1 }}</td>
                  <td class="py-4 px-4 text-gray-800">{{ item.name }}</td>
                  <td class="py-4 px-4 text-gray-600">{{ item.email }}</td>
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
                        @click="editItem(item)"
                        class="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition text-sm"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        @click="deleteItem(item.id)"
                        class="flex items-center gap-1 text-red-600 hover:text-red-700 transition text-sm"
                      >
                        <Icon name="delete" size="sm" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredData.length === 0">
                  <td colspan="5" class="py-8 px-4 text-center text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredData.length > 0" class="p-4 border-t border-gray-200 flex items-center justify-between">
            <p class="text-sm text-gray-500">
              Menampilkan {{ filteredData.length }} dari {{ filteredData.length }} item
            </p>
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
const searchQuery = ref('')
const showAddModal = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Sample data - replace with actual API call
const dataItems = ref([
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'inactive'
  }
])

const filteredData = computed(() => {
  if (!searchQuery.value) return dataItems.value
  const query = searchQuery.value.toLowerCase()
  return dataItems.value.filter(item => 
    item.name.toLowerCase().includes(query) ||
    item.email.toLowerCase().includes(query)
  )
})

const editItem = (item) => {
  // Handle edit logic
  console.log('Edit:', item)
  alert(`Edit: ${item.name}`)
}

const deleteItem = (id) => {
  // Handle delete logic
  if (confirm('Hapus?')) {
    dataItems.value = dataItems.value.filter(item => item.id !== id)
  }
}
</script>
