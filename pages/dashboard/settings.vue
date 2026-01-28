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
            Pengaturan
          </h1>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <div class="max-w-4xl mx-auto space-y-6">
          <!-- Profile Settings -->
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 class="text-xl font-semibold text-gray-800 mb-6">Pengaturan Profil</h2>
            
            <!-- Success Message -->
            <div v-if="successMessage" class="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {{ successMessage }}
            </div>

            <!-- Error Message -->
            <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {{ errorMessage }}
            </div>

            <div v-if="isLoading" class="text-center py-8 text-gray-500">
              Memuat profil...
            </div>

            <div v-else class="space-y-6">
              <div>
                <label class="block text-sm font-medium mb-2 text-gray-700">Nama</label>
                <input
                  type="text"
                  v-model="profile.name"
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  placeholder="Nama"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2 text-gray-700">Email</label>
                <input
                  type="email"
                  v-model="profile.email"
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  placeholder="Email"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2 text-gray-700">Kata Sandi Baru</label>
                <div class="relative">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    v-model="profile.password"
                    class="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    placeholder="Kosongkan jika tidak ingin mengubah password"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    tabindex="-1"
                  >
                    <Icon 
                      :name="showPassword ? 'eye-slash' : 'eye'" 
                      size="md" 
                      class="text-gray-500"
                    />
                  </button>
                </div>
                <p class="mt-1 text-xs text-gray-500">Minimal 6 karakter. Kosongkan jika tidak ingin mengubah password.</p>
              </div>

              <div class="flex justify-end">
                <button
                  @click="saveProfile"
                  :disabled="isSaving"
                  class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isSaving ? 'Menyimpan...' : 'Simpan' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Preferences -->
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h2 class="text-xl font-semibold text-gray-800 mb-6">Preferensi</h2>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-800 font-medium">Notifikasi Email</p>
                  <p class="text-sm text-gray-500">Terima pembaruan email</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="preferences.emailNotifications" class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>


        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const isMobileMenuOpen = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const profile = ref({
  id: '',
  name: '',
  email: '',
  password: ''
})

const preferences = ref({
  emailNotifications: true
})

// Fetch profile on mount
const fetchProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const response = await $fetch('/api/admin/profile')
    if (response.success && response.data) {
      profile.value = {
        id: response.data.id || '',
        name: response.data.name || '',
        email: response.data.email || '',
        password: '' // Never show password
      }
    }
  } catch (error: any) {
    const errorMsg = error?.data?.message || error?.message || 'Gagal memuat profil'
    errorMessage.value = errorMsg
    
    // If unauthorized, redirect to login
    if (error?.statusCode === 401 || errorMsg.includes('Unauthorized')) {
      setTimeout(() => {
        navigateTo('/')
      }, 2000)
    }
    
    console.error('Failed to fetch profile:', error)
  } finally {
    isLoading.value = false
  }
}

const saveProfile = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isSaving.value = true

  try {
    // Prepare update data (only include fields that have values)
    const updateData: Record<string, string> = {}
    
    if (profile.value.name && profile.value.name.trim() !== '') {
      updateData.name = profile.value.name.trim()
    }
    
    if (profile.value.email && profile.value.email.trim() !== '') {
      updateData.email = profile.value.email.trim()
    }
    
    // Only update password if provided
    if (profile.value.password && profile.value.password.trim() !== '') {
      updateData.password = profile.value.password
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      errorMessage.value = 'Tidak ada perubahan untuk disimpan'
      return
    }

    const response = await $fetch('/api/admin/profile', {
      method: 'PUT',
      body: updateData
    })

    if (response.success) {
      successMessage.value = response.message || 'Profil berhasil diupdate'
      
      // Update profile data
      if (response.data) {
        profile.value = {
          ...profile.value,
          name: response.data.name || profile.value.name,
          email: response.data.email || profile.value.email,
          password: '' // Clear password field after save
        }
      }

      // Clear password field
      profile.value.password = ''

      // Clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  } catch (error: any) {
    const errorMsg = error?.data?.message || error?.message || 'Gagal menyimpan profil'
    errorMessage.value = errorMsg
    
    // If unauthorized, redirect to login
    if (error?.statusCode === 401 || errorMsg.includes('Unauthorized')) {
      setTimeout(() => {
        navigateTo('/')
      }, 2000)
    }
    
    console.error('Failed to save profile:', error)
  } finally {
    isSaving.value = false
  }
}

// Fetch profile on mount
onMounted(() => {
  fetchProfile()
})


</script>
