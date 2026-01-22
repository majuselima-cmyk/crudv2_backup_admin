<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold mb-2 text-gray-900">
            Login Admin
          </h1>
          <p class="text-gray-600">Masuk ke akun admin Anda</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <div>
            <label class="block text-sm font-medium mb-2 text-gray-700">Email</label>
            <input
              type="email"
              v-model="email"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition"
              placeholder="Email"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2 text-gray-700">Kata Sandi</label>
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                class="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition"
                placeholder="Kata Sandi"
                required
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
          </div>
          
          <div class="flex items-center">
            <label class="flex items-center cursor-pointer">
              <input type="checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <span class="ml-2 text-sm text-gray-600">Ingat saya</span>
            </label>
          </div>
          
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Memproses...' : 'Masuk' }}
          </button>

          <!-- Test Connection Button -->
          <div class="pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="testConnection"
              :disabled="isTestingConnection"
              class="w-full py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isTestingConnection ? 'Testing...' : 'Test Koneksi Supabase' }}
            </button>
            
            <!-- Connection Test Result -->
            <div v-if="connectionTest" class="mt-4 p-4 rounded-lg text-sm" :class="connectionTest.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'">
              <p class="font-medium mb-2">{{ connectionTest.message }}</p>
              <details v-if="connectionTest.envCheck" class="mt-2">
                <summary class="cursor-pointer text-xs opacity-75">Detail Environment Variables</summary>
                <pre class="mt-2 text-xs bg-white p-2 rounded overflow-auto">{{ JSON.stringify(connectionTest.envCheck, null, 2) }}</pre>
              </details>
              <div v-if="connectionTest.instructions" class="mt-2">
                <p class="font-medium text-xs mb-1">Instruksi:</p>
                <ul class="text-xs list-disc list-inside space-y-1">
                  <li v-for="(instruction, index) in connectionTest.instructions" :key="index">{{ instruction }}</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const connectionTest = ref(null)
const isTestingConnection = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const response = await $fetch('/api/admin/login', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value
      }
    })

    if (response.success) {
      // Redirect to dashboard after successful login
      navigateTo('/dashboard')
    }
  } catch (error) {
    errorMessage.value = error?.data?.message || error?.message || 'Login gagal. Silakan coba lagi.'
    console.error('Login error:', error)
  } finally {
    isLoading.value = false
  }
}

const testConnection = async () => {
  isTestingConnection.value = true
  connectionTest.value = null
  
  try {
    const response = await $fetch('/api/test/connection')
    connectionTest.value = response
  } catch (error) {
    connectionTest.value = {
      success: false,
      message: 'Error saat test koneksi',
      error: error?.message || 'Unknown error'
    }
  } finally {
    isTestingConnection.value = false
  }
}
</script>

