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
            Email Management
          </h1>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Actions & Loading -->
        <div v-if="loading" class="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-500">Memuat data member...</p>
        </div>

        <div v-else class="space-y-6">
          <!-- Member List Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div class="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 class="text-lg font-semibold text-gray-800">Daftar Member</h2>
              
              <div class="flex items-center gap-3 w-full sm:w-auto">
                <!-- Search -->
                <div class="relative flex-1 sm:flex-none">
                  <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Cari member..." 
                    class="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                </div>
                
                <button 
                  @click="openEmailModal(null, 'general')"
                  class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <Icon name="email" size="sm" />
                  Broadcast
                </button>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-6 py-4 font-semibold text-gray-900 w-16">No</th>
                    <th class="px-6 py-4 font-semibold text-gray-900">Member</th>
                    <th class="px-6 py-4 font-semibold text-gray-900">Email</th>
                    <th class="px-6 py-4 font-semibold text-gray-900 text-center">Status</th>
                    <th class="px-6 py-4 font-semibold text-gray-900 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <template v-for="(member, index) in paginatedMembers" :key="member.id">
                    <tr class="hover:bg-gray-50 transition cursor-pointer" @click="toggleHistory(member.id)">
                      <td class="px-6 py-4 text-gray-500 font-mono text-xs">
                        {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                      </td>
                      <td class="px-6 py-4 font-medium text-gray-900">
                        <div class="flex items-center gap-3">
                           <button 
                            class="p-1 rounded border-2 border-gray-300 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                            title="Lihat Riwayat"
                          >
                             <Icon 
                              :name="expandedMemberId === member.id ? 'chevron-up' : 'chevron-down'" 
                              size="xs" 
                            />
                          </button>
                          {{ member.username }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-gray-600">{{ member.email }}</td>
                      <td class="px-6 py-4 text-center">
                        <span 
                          class="px-2 py-1 rounded-full text-xs font-medium"
                          :class="member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                        >
                          {{ member.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex justify-center gap-2">
                          <button 
                            @click.stop="openEmailModal(member, 'activation')"
                            class="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-semibold"
                            title="Email Aktivasi"
                          >
                            Aktivasi
                          </button>
                          <button 
                            @click.stop="openEmailModal(member, 'deposit')"
                            class="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-semibold"
                            title="Email Deposit"
                          >
                            Deposit
                          </button>
                          <button 
                            @click.stop="openEmailModal(member, 'withdraw')"
                            class="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-xs font-semibold"
                            title="Email Withdraw"
                          >
                            Withdraw
                          </button>
                           <button 
                            @click.stop="openEmailModal(member, 'general')"
                            class="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-semibold"
                            title="Custom Email"
                          >
                            <Icon name="edit" size="xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <!-- History Row -->
                    <tr v-if="expandedMemberId === member.id" class="bg-blue-50">
                      <td colspan="5" class="px-6 py-4">
                        <div class="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
                          <h4 class="font-semibold text-gray-800 mb-3 text-sm">Riwayat Email</h4>
                          
                          <div v-if="loadingHistory" class="text-center py-4">
                            <div class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          </div>
                          
                          <div v-else-if="memberEmailHistory.length > 0" class="overflow-x-auto">
                            <table class="w-full text-xs text-left">
                              <thead class="bg-gray-50 border-b border-gray-100 text-gray-500">
                                <tr>
                                  <th class="px-3 py-2 font-medium w-10">No</th>
                                  <th class="px-3 py-2 font-medium">Tanggal</th>
                                  <th class="px-3 py-2 font-medium">Kategori</th>
                                  <th class="px-3 py-2 font-medium">Subjek</th>
                                  <th class="px-3 py-2 font-medium">Pesan</th>
                                </tr>
                              </thead>
                              <tbody class="divide-y divide-gray-100">
                                <tr v-for="(log, index) in memberEmailHistory" :key="log.id">
                                  <td class="px-3 py-2 text-gray-500 font-mono">
                                    {{ index + 1 }}
                                  </td>
                                  <td class="px-3 py-2 text-gray-600 whitespace-nowrap">
                                    {{ new Date(log.created_at).toLocaleString() }}
                                  </td>
                                  <td class="px-3 py-2">
                                    <span class="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider"
                                      :class="{
                                        'bg-green-100 text-green-700': log.category === 'activation',
                                        'bg-blue-100 text-blue-700': log.category === 'deposit',
                                        'bg-orange-100 text-orange-700': log.category === 'withdraw',
                                        'bg-gray-100 text-gray-700': log.category === 'general'
                                      }"
                                    >
                                      {{ log.category }}
                                    </span>
                                  </td>
                                  <td class="px-3 py-2 text-gray-800 font-medium">{{ log.subject }}</td>
                                  <td class="px-3 py-2 text-gray-500 truncate max-w-xs" :title="log.message">
                                    {{ log.message }}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <p v-else class="text-gray-500 text-sm text-center py-2">Belum ada riwayat email.</p>
                        </div>
                      </td>
                    </tr>
                  </template>
                  <tr v-if="paginatedMembers.length === 0">
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                      {{ searchQuery ? 'Tidak ada member yang cocok' : 'Tidak ada data member' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span class="text-sm text-gray-600">
                Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredMembers.length) }} dari {{ filteredMembers.length }} member
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



      <!-- Email Modal -->
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="closeModal">
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
          <div class="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 class="text-xl font-bold text-gray-900">Kirim Email {{ emailTypeLabel }}</h3>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
               <Icon name="close" size="md" />
            </button>
          </div>
          
          <form @submit.prevent="sendEmail" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Penerima</label>
              <input 
                type="text" 
                :value="selectedMember ? `${selectedMember.username} <${selectedMember.email}>` : 'Broadcast (Semua Member)'" 
                readonly 
                class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Subjek</label>
              <input 
                v-model="emailForm.subject" 
                type="text" 
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Subjek Email"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
              <textarea 
                v-model="emailForm.message" 
                rows="6" 
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Tulis pesan email di sini..."
              ></textarea>
            </div>

            <div v-if="errorMessage" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {{ errorMessage }}
            </div>
             <div v-if="successMessage" class="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-200">
              {{ successMessage }}
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                @click="closeModal"
                class="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button 
                type="submit" 
                :disabled="isSending"
                class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <div v-if="isSending" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                {{ isSending ? 'Mengirim...' : 'Kirim Email' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const searchQuery = ref('')
const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
const loading = ref(false)
const members = ref([])
const currentPage = ref(1)
const itemsPerPage = ref(10)

const showModal = ref(false)
const selectedMember = ref(null)
const emailType = ref('general')
const isSending = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const emailForm = ref({
  subject: '',
  message: ''
})

const emailTypeLabel = computed(() => {
  switch(emailType.value) {
    case 'activation': return 'Aktivasi'
    case 'deposit': return 'Deposit'
    case 'withdraw': return 'Withdraw'
    default: return 'Umum'
  }
})

// Fetch Members
const fetchMembers = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/members')
    if (response.success) {
      members.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch members:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMembers()
})

// Computed: Filtered & Paginated Members
const filteredMembers = computed(() => {
  let result = members.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(member => 
      member.email?.toLowerCase().includes(query) ||
      member.username?.toLowerCase().includes(query)
    )
  }
  
  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredMembers.value.length / itemsPerPage.value)
})

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredMembers.value.slice(start, end)
})

// Pagination Methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

// Modal & Email Logic
const openEmailModal = (member, type = 'general') => {
  selectedMember.value = member
  emailType.value = type
  errorMessage.value = ''
  successMessage.value = ''
  
  // Pre-fill content based on type
  if (type === 'activation') {
    emailForm.value.subject = 'Aktivasi Akun Member'
    emailForm.value.message = `Halo ${member.username},\n\nAkun Anda telah berhasil diaktivasi. Selamat bergabung!\n\nSalam,\nAdmin`
  } else if (type === 'deposit') {
    emailForm.value.subject = 'Konfirmasi Deposit'
    emailForm.value.message = `Halo ${member.username},\n\nDeposit Anda telah kami terima dan sedang diproses.\n\nSalam,\nAdmin`
  } else if (type === 'withdraw') {
    emailForm.value.subject = 'Konfirmasi Withdraw'
    emailForm.value.message = `Halo ${member.username},\n\nPermintaan withdraw Anda telah disetujui dan dananya sedang dikirim.\n\nSalam,\nAdmin`
  } else {
    emailForm.value.subject = ''
    emailForm.value.message = ''
  }

  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  emailForm.value = { subject: '', message: '' }
}

const sendEmail = async () => {
  isSending.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await $fetch('/api/admin/email/send', {
      method: 'POST',
      body: {
        memberId: selectedMember.value?.id, // null if broadcast
        to: selectedMember.value?.email, // null if broadcast
        subject: emailForm.value.subject,
        message: emailForm.value.message,
        type: emailType.value
      }
    })

    if (response.success) {
      successMessage.value = 'Email berhasil dikirim!'
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else {
      errorMessage.value = response.message || 'Gagal mengirim email'
    }
  } catch (error) {
    errorMessage.value = error?.data?.message || 'Terjadi kesalahan saat mengirim email'
  } finally {
    isSending.value = false
  }
}

// History Logic
const expandedMemberId = ref(null)
const memberEmailHistory = ref([])
const loadingHistory = ref(false)

const toggleHistory = async (memberId) => {
  if (expandedMemberId.value === memberId) {
    expandedMemberId.value = null
    memberEmailHistory.value = []
    return
  }

  expandedMemberId.value = memberId
  loadingHistory.value = true
  memberEmailHistory.value = []

  try {
    const response = await $fetch(`/api/admin/members/${memberId}/emails`)
    if (response.success) {
      memberEmailHistory.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch history:', error)
  } finally {
    loadingHistory.value = false
  }
}
</script>
