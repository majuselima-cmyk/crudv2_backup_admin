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
            Konten Member
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
              disabled
              class="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed opacity-50 whitespace-nowrap shadow-sm"
            >
              <Icon name="plus" size="sm" />
              Tambah Member
            </button>
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
        <div v-else class="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <!-- Table Header -->
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-semibold text-gray-800">
              Daftar Member ({{ filteredMembers.length }})
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
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Referral Code</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Member Type</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Withdraw</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Tanggal Daftar</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr 
                  v-for="(member, index) in filteredMembers" 
                  :key="member.id"
                  class="hover:bg-gray-50 transition"
                >
                  <td class="py-4 px-4 text-gray-600">{{ index + 1 }}</td>
                  <td class="py-4 px-4 text-gray-800">{{ member.email }}</td>
                  <td class="py-4 px-4 text-gray-800">{{ member.username }}</td>
                  <td class="py-4 px-4 text-gray-600 font-mono text-sm">{{ member.referral_code || '-' }}</td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        member.member_type === 'vip' 
                          ? 'bg-purple-100 text-purple-700' 
                          : member.member_type === 'leader'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
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
                        @click="openEditModal(member)"
                        class="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition text-sm font-medium"
                      >
                        <Icon name="edit" size="sm" />
                        Edit
                      </button>
                      <button 
                        @click="confirmDelete(member)"
                        class="flex items-center gap-1 text-red-600 hover:text-red-700 transition text-sm font-medium"
                      >
                        <Icon name="delete" size="sm" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredMembers.length === 0">
                  <td colspan="9" class="py-8 px-4 text-center text-gray-400">
                    {{ errorMessage || 'Tidak ada data member' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
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
const errorMessage = ref('')
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const isUpdating = ref(false)
const isDeleting = ref(false)
const updateError = ref('')
const deleteError = ref('')
const memberToDelete = ref(null)

const editForm = ref({
  id: '',
  email: '',
  username: '',
  referral_code: '',
  member_type: 'normal',
  status: 'active',
  bonus_aktif_withdraw_enabled: true,
  bonus_pasif_withdraw_enabled: true
})

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Fetch members
const fetchMembers = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/members')
    if (response.success) {
      members.value = response.data || []
    } else {
      errorMessage.value = response.message || 'Gagal memuat data member'
    }
  } catch (error) {
    console.error('Error fetching members:', error)
    errorMessage.value = error?.data?.message || error?.message || 'Gagal memuat data member'
    members.value = []
  } finally {
    loading.value = false
  }
}

// Filter members
const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(member => 
    member.email?.toLowerCase().includes(query) ||
    member.username?.toLowerCase().includes(query) ||
    member.referral_code?.toLowerCase().includes(query)
  )
})

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

// Edit modal
const openEditModal = (member) => {
  editForm.value = {
    id: member.id,
    email: member.email,
    username: member.username,
    referral_code: member.referral_code || '',
    member_type: member.member_type || 'normal',
    status: member.status || 'active',
    bonus_aktif_withdraw_enabled: member.bonus_aktif_withdraw_enabled !== undefined ? member.bonus_aktif_withdraw_enabled : true,
    bonus_pasif_withdraw_enabled: member.bonus_pasif_withdraw_enabled !== undefined ? member.bonus_pasif_withdraw_enabled : true
  }
  updateError.value = ''
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
    bonus_aktif_withdraw_enabled: true,
    bonus_pasif_withdraw_enabled: true
  }
  updateError.value = ''
}

const handleUpdate = async () => {
  isUpdating.value = true
  updateError.value = ''

  try {
    const response = await $fetch(`/api/admin/members/${editForm.value.id}`, {
      method: 'PUT',
      body: {
        email: editForm.value.email,
        username: editForm.value.username,
        referral_code: editForm.value.referral_code || null,
        member_type: editForm.value.member_type,
        status: editForm.value.status,
        bonus_aktif_withdraw_enabled: editForm.value.bonus_aktif_withdraw_enabled,
        bonus_pasif_withdraw_enabled: editForm.value.bonus_pasif_withdraw_enabled
      }
    })

    if (response.success) {
      // Update local data
      const index = members.value.findIndex(m => m.id === editForm.value.id)
      if (index !== -1) {
        members.value[index] = { ...members.value[index], ...editForm.value }
      }
      closeEditModal()
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

// Load data on mount
onMounted(() => {
  fetchMembers()
})
</script>

