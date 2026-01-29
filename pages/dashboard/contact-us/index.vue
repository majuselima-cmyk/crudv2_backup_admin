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
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Hubungi Kami
          </h1>
          
          </div>
        </header>

      <!-- Page Content -->
      <main class="p-4 lg:p-8">
        <div class="space-y-6">
          <!-- Table Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 class="text-lg font-semibold text-gray-800">Daftar Pesan</h2>
              
              <div class="flex items-center gap-3 w-full sm:w-auto">
                <!-- Search -->
                <div class="relative flex-1 sm:flex-none">
                  <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    v-model="search"
                    type="text" 
                    placeholder="Cari pesan..." 
                    class="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-64"
                  >
                </div>

                 <!-- Add Data Button -->
                <button 
                  @click="openCreateModal"
                  class="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition text-sm whitespace-nowrap"
                >
                  <Icon name="plus" size="sm" />
                  <span>Tambah Data</span>
                </button>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-6 py-4 font-semibold text-gray-900">Tanggal</th>
                    <th class="px-6 py-4 font-semibold text-gray-900">Pengirim</th>
                    <th class="px-6 py-4 font-semibold text-gray-900">Subjek & Pesan</th>
                    <th class="px-6 py-4 font-semibold text-gray-900">Status</th>
                    <th class="px-6 py-4 font-semibold text-gray-900 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <template v-if="pending">
                    <tr v-for="i in 5" :key="i">
                      <td class="px-6 py-4"><div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div></td>
                      <td class="px-6 py-4">
                        <div class="space-y-2">
                          <div class="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div class="h-3 w-20 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                         <div class="space-y-2">
                          <div class="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                          <div class="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
                        </div>
                      </td>
                      <td class="px-6 py-4"><div class="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div></td>
                       <td class="px-6 py-4"><div class="h-8 w-16 bg-gray-200 rounded animate-pulse ml-auto"></div></td>
                    </tr>
                  </template>
                  
                  <template v-else-if="messages && messages.length > 0">
                    <tr v-for="msg in messages" :key="msg.id" class="hover:bg-gray-50/50 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{{ formatDate(msg.created_at) }}</div>
                        <div class="text-xs text-gray-500">{{ formatTime(msg.created_at) }}</div>
                      </td>
                      <td class="px-6 py-4">
                         <div class="text-sm font-medium text-gray-900">{{ msg.username }}</div>
                         <div class="text-xs text-gray-500">{{ msg.email }}</div>
                      </td>
                      <td class="px-6 py-4 max-w-sm">
                         <div class="text-sm font-medium text-gray-900 truncate">{{ msg.subject || 'No Subject' }}</div>
                         <div class="text-sm text-gray-600 line-clamp-2 mt-1">{{ msg.message }}</div>
                      </td>
                       <td class="px-6 py-4 whitespace-nowrap">
                        <span 
                          class="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase"
                        >
                          {{ msg.status || 'new' }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button 
                            @click="openViewModal(msg)"
                            title="Lihat Detail"
                            class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Icon name="eye" size="sm" />
                          </button>
                          <button 
                            @click="confirmDelete(msg)"
                            title="Hapus"
                            class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Icon name="delete" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </template>

                  <tr v-else>
                    <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <Icon name="inbox" class="text-gray-300 mb-2" size="xl" />
                        <p class="font-medium">Belum ada pesan</p>
                        <p class="text-sm">Pesan dari pengguna akan muncul di sini</p>
                       </div>
                       <!-- Empty state button -->
                       <div class="flex justify-center pb-6">
                          <button 
                            @click="openCreateModal"
                            class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 hover:underline"
                          >
                            <Icon name="plus" size="xs" />
                            Tambah Data Baru
                          </button>
                       </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span class="text-sm text-gray-600">
                Menampilkan {{ (currentPage - 1) * limit + 1 }} - {{ Math.min(currentPage * limit, totalCount) }} dari {{ totalCount }} data
              </span>
              <div class="flex gap-2">
                <button 
                  @click="prevPage" 
                  :disabled="currentPage === 1"
                  class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <button 
                  @click="nextPage" 
                  :disabled="currentPage >= totalPages"
                  class="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- View Detail Modal -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isViewModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeViewModal"></div>
        
        <!-- Modal Panel -->
        <Transition
          enter-active-class="transform transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transform transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Detail Pesan
              </h3>
              <button 
                @click="closeViewModal" 
                class="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition cursor-pointer"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            
            <!-- Body (Scrollable) -->
            <div class="p-6 overflow-y-auto">
              <div v-if="selectedMessage" class="space-y-4">
                <!-- Info Sender -->
                <div class="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Pengirim</p>
                      <p class="font-medium text-gray-900 text-lg">{{ selectedMessage.username }}</p>
                      <p class="text-sm text-blue-600">{{ selectedMessage.email }}</p>
                    </div>
                     <span 
                        class="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200 uppercase"
                      >
                        {{ selectedMessage.status || 'new' }}
                      </span>
                  </div>
                  <div class="pt-2 border-t border-gray-200/50">
                     <p class="text-xs text-gray-500 flex items-center gap-1">
                      <Icon name="clock" size="xs" />
                      {{ formatDate(selectedMessage.created_at) }} • {{ formatTime(selectedMessage.created_at) }}
                    </p>
                  </div>
                </div>

                <!-- Content -->
                <div class="space-y-2">
                  <p class="text-xs text-gray-500 uppercase tracking-wide font-semibold">Pesan</p>
                  <div class="bg-white border-l-4 border-blue-500 pl-4 py-2">
                     <h4 class="font-semibold text-gray-800 text-lg mb-2">{{ selectedMessage.subject }}</h4>
                     <p class="text-gray-600 whitespace-pre-wrap leading-relaxed">{{ selectedMessage.message }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                class="inline-flex justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all min-w-[80px]"
                @click="closeViewModal"
              >
                Tutup
              </button>
              <a
                v-if="selectedMessage"
                :href="`mailto:${selectedMessage.email}`"
                class="inline-flex justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 min-w-[100px]"
              >
                Balas Email
              </a>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Create Modal -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeCreateModal"></div>
        
        <!-- Modal Panel -->
        <Transition
          enter-active-class="transform transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transform transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 class="text-lg font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Tambah Pesan Baru
              </h3>
              <button 
                @click="closeCreateModal" 
                class="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition cursor-pointer"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
            
            <!-- Body (Form) -->
            <div class="p-6 overflow-y-auto">
              <!-- Error Alert -->
              <div v-if="createError" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                 <Icon name="info" size="sm" />
                 {{ createError }}
              </div>

              <form @submit.prevent="submitCreate" class="space-y-4">
                <!-- Member Selection -->
                <div class="relative">
                  <label class="block text-sm font-medium mb-1.5 text-gray-700">Pilih Member (Opsional)</label>
                  <div class="relative">
                     <input
                      type="text"
                      v-model="memberSearch"
                      @focus="onMemberSearchFocus"
                      class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200/50 transition-all placeholder:text-gray-400"
                      placeholder="Cari username atau email..."
                    />
                    <div 
                      v-if="isMemberDropdownOpen && (membersList.length > 0 || isFetchingMembers)" 
                      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                      <div v-if="isFetchingMembers" class="p-3 text-sm text-gray-500 text-center">Loading...</div>
                      <div v-else>
                         <button
                          v-for="member in membersList"
                          :key="member.id"
                          type="button"
                          @click="selectMember(member)"
                          class="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                         >
                            <p class="text-sm font-medium text-gray-900">{{ member.username }}</p>
                            <p class="text-xs text-gray-500">{{ member.email }}</p>
                         </button>
                      </div>
                    </div>
                  </div>
                   <p class="text-xs text-gray-500 mt-1">Pilih member untuk isi otomatis nama & email.</p>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1.5 text-gray-700">Username Pengirim <span class="text-red-500">*</span></label>
                  <input
                    type="text"
                    v-model="createForm.username"
                    required
                    class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200/50 transition-all placeholder:text-gray-400"
                    placeholder="Contoh: BudiSantoso"
                  />
                </div>

                <div>
                   <label class="block text-sm font-medium mb-1.5 text-gray-700">Email <span class="text-red-500">*</span></label>
                   <input
                    type="email"
                    v-model="createForm.email"
                    required
                    class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200/50 transition-all placeholder:text-gray-400"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                   <label class="block text-sm font-medium mb-1.5 text-gray-700">Subjek <span class="text-red-500">*</span></label>
                   <input
                    type="text"
                    v-model="createForm.subject"
                    required
                    class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200/50 transition-all placeholder:text-gray-400"
                    placeholder="Judul pesan..."
                  />
                </div>

                <div>
                   <label class="block text-sm font-medium mb-1.5 text-gray-700">Pesan <span class="text-red-500">*</span></label>
                   <textarea
                    v-model="createForm.message"
                    required
                    rows="4"
                    class="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200/50 transition-all placeholder:text-gray-400 resize-none"
                    placeholder="Tulis pesan lengkap di sini..."
                  ></textarea>
                </div>
              </form>
            </div>

            <!-- Footer -->
            <div class="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                class="inline-flex justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 transition-all min-w-[80px]"
                @click="closeCreateModal"
                :disabled="isCreating"
              >
                Batal
              </button>
              <button
                type="button"
                @click="submitCreate"
                :disabled="isCreating"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div v-if="isCreating" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{{ isCreating ? 'Menyimpan...' : 'Simpan Data' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const search = ref('')
const currentPage = ref(1)
const limit = 5
const debouncedSearch = ref(search.value)
let debounceTimer = null

watch(search, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = newVal
  }, 500)
})

// View Modal State
const isViewModalOpen = ref(false)
const selectedMessage = ref(null)

const openViewModal = (msg) => {
  selectedMessage.value = msg
  isViewModalOpen.value = true
}

const closeViewModal = () => {
  isViewModalOpen.value = false
  setTimeout(() => {
    selectedMessage.value = null
  }, 200)
}

// Create Modal State
const isCreateModalOpen = ref(false)
const isCreating = ref(false)
const createError = ref('')
const createForm = ref({
  member_id: null,
  username: '',
  email: '',
  subject: '',
  message: ''
})

// Member Selection Logic
const memberSearch = ref('')
const isMemberDropdownOpen = ref(false)
const membersList = ref([])
const isFetchingMembers = ref(false)

const debouncedMemberSearch = ref(memberSearch.value)
let memberSearchTimer = null

watch(memberSearch, (newVal) => {
  if (memberSearchTimer) clearTimeout(memberSearchTimer)
  memberSearchTimer = setTimeout(() => {
    debouncedMemberSearch.value = newVal
  }, 300)
})

const fetchMembers = async (search = '') => {
  isFetchingMembers.value = true
  try {
    const { data } = await $fetch('/api/admin/members-lite', {
      params: { search, limit: 5 }
    })
    membersList.value = data || []
  } catch (e) {
    console.error('Failed to fetch members', e)
    membersList.value = []
  } finally {
    isFetchingMembers.value = false
  }
}

const selectMember = (member) => {
  createForm.value.member_id = member.id
  createForm.value.username = member.username
  createForm.value.email = member.email
  memberSearch.value = member.username
  isMemberDropdownOpen.value = false
}

// Watch member search for autocomplete
watch(debouncedMemberSearch, (val) => {
  if (val && val !== createForm.value.username) {
     fetchMembers(val)
     isMemberDropdownOpen.value = true
  }
})

// Focus handler
const onMemberSearchFocus = () => {
    fetchMembers(memberSearch.value)
    isMemberDropdownOpen.value = true
}

const openCreateModal = () => {
  createForm.value = { member_id: null, username: '', email: '', subject: '', message: '' }
  memberSearch.value = ''
  membersList.value = []
  createError.value = ''
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  if (isCreating.value) return
  isCreateModalOpen.value = false
}

const submitCreate = async () => {
  createError.value = ''
  
  // Simple validation
  if (!createForm.value.username || !createForm.value.email || !createForm.value.subject || !createForm.value.message) {
    createError.value = 'Semua field wajib diisi'
    return
  }

  isCreating.value = true
  
  try {
    const response = await $fetch('/api/admin/contact-us', {
      method: 'POST',
      body: createForm.value
    })

    if (response.success) {
      // Success
      closeCreateModal()
      refresh() // Refresh list
    }
  } catch (error) {
    console.error(error)
    createError.value = error?.data?.statusMessage || 'Gagal menyimpan data'
  } finally {
    isCreating.value = false
  }
}

// Delete Logic
const confirmDelete = async (msg) => {
  if (confirm(`Apakah Anda yakin ingin menghapus pesan dari "${msg.username}"?`)) {
    try {
      const { error } = await useFetch('/api/admin/contact-us', {
        method: 'DELETE',
        body: { id: msg.id }
      })
      
      if (!error.value) {
        refresh() // Refresh list
      } else {
        alert('Gagal menghapus pesan')
      }
    } catch (e) {
      console.error(e)
      alert('Terjadi kesalahan saat menghapus pesan')
    }
  }
}

// Reset page on search
watch(debouncedSearch, () => {
  currentPage.value = 1
})

const { data, pending, refresh } = await useFetch('/api/admin/contact-us', {
  query: computed(() => ({
    page: currentPage.value,
    limit,
    offset: (currentPage.value - 1) * limit,
    search: debouncedSearch.value
  }))
})

// Computed
const messages = computed(() => data.value?.data || [])
const totalCount = computed(() => data.value?.count || 0)
const totalPages = computed(() => Math.ceil(totalCount.value / limit))

// Pagination logic
const visiblePages = computed(() => {
  const current = currentPage.value
  const total = totalPages.value
  const delta = 2
  const range = []
  
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 || 
      i === total || 
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i)
    } else if (
      (i === current - delta - 1) || 
      (i === current + delta + 1)
    ) {
      range.push('...')
    }
  }
  return range
})

// Methods
const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
