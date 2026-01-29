<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar :is-mobile-menu-open="isMobileMenuOpen" @close-mobile-menu="isMobileMenuOpen = false" />
    <div class="lg:pl-64">
      <MobileHeader @toggle-menu="isMobileMenuOpen = !isMobileMenuOpen" />
      <header class="hidden lg:block sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-lg">
        <div class="flex items-center gap-4 px-6 py-4">
          <NuxtLink to="/dashboard/tools" class="p-2 hover:bg-gray-100 rounded-lg transition">
            <Icon name="arrow-left" size="sm" class="text-gray-600" />
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-800">Add New Tool</h1>
        </div>
      </header>
      
      <main class="p-4 lg:p-8">
        <div class="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          <form @submit.prevent="submitForm" class="space-y-6">
            
            <!-- Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <div class="grid grid-cols-3 gap-4">
                 <label 
                   v-for="type in types" 
                   :key="type.value"
                   class="cursor-pointer border rounded-lg p-4 flex flex-col items-center gap-2 transition-all"
                   :class="formData.type === type.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'"
                 >
                   <input type="radio" v-model="formData.type" :value="type.value" class="sr-only">
                   <Icon :name="type.icon" size="md" :class="formData.type === type.value ? 'text-blue-600' : 'text-gray-400'" />
                   <span class="text-sm font-medium" :class="formData.type === type.value ? 'text-blue-700' : 'text-gray-600'">{{ type.label }}</span>
                 </label>
              </div>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input v-model="formData.title" type="text" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="e.g. Q1 2024 Presentation" required />
            </div>

            <!-- Upload Method -->
            <div>
               <label class="block text-sm font-medium text-gray-700 mb-2">File Source</label>
               <div class="flex gap-4 mb-4">
                 <button type="button" @click="uploadMethod = 'file'" class="px-4 py-2 rounded-lg text-sm font-medium transition" :class="uploadMethod === 'file' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">Upload File</button>
                 <button type="button" @click="uploadMethod = 'url'" class="px-4 py-2 rounded-lg text-sm font-medium transition" :class="uploadMethod === 'url' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">Direct URL</button>
               </div>
               
               <div v-if="uploadMethod === 'file'">
                 <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                   <input type="file" @change="handleFileChange" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf,.ppt,.pptx,.doc,.docx" />
                   <Icon name="cloud-upload" size="xl" class="text-gray-400 mb-3 mx-auto" />
                   <p class="text-sm text-gray-600 font-medium" v-if="!selectedFile">Click to upload or drag and drop</p>
                   <p class="text-sm text-blue-600 font-medium truncate px-4" v-else>{{ selectedFile.name }}</p>
                   <p class="text-xs text-gray-400 mt-1">Max 50MB</p>
                 </div>
               </div>
               
               <div v-else>
                 <input v-model="formData.file_url" type="url" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="https://example.com/file.pdf" />
               </div>
            </div>

            <!-- Status & Notes -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="formData.status" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea v-model="formData.notes" rows="3" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Additional info..."></textarea>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <NuxtLink to="/dashboard/tools" class="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition">Cancel</NuxtLink>
               <button type="submit" :disabled="isSubmitting" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
                 <Icon v-if="isSubmitting" name="refresh" class="animate-spin" />
                 <span>{{ isSubmitting ? 'Saving...' : 'Create Tool' }}</span>
               </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })

const isMobileMenuOpen = ref(false)
const isSubmitting = ref(false)
const uploadMethod = ref('file') // 'file' or 'url'
const selectedFile = ref(null)

const types = [
  { value: 'ppt', label: 'PPT / Slides', icon: 'presentation-chart-bar' },
  { value: 'whitepaper', label: 'Whitepaper', icon: 'document-text' },
  { value: 'roadmap', label: 'Roadmap', icon: 'map' }
]

const formData = ref({
  title: '',
  type: 'ppt',
  status: 'active',
  file_url: '',
  notes: ''
})

const handleFileChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 50 * 1024 * 1024) {
      alert('File size exceeds 50MB')
      e.target.value = ''
      return
    }
    selectedFile.value = file
  }
}

const submitForm = async () => {
  if (uploadMethod.value === 'file' && !selectedFile.value) {
    alert('Please select a file')
    return
  }
  if (uploadMethod.value === 'url' && !formData.value.file_url) {
    alert('Please enter a URL')
    return
  }

  isSubmitting.value = true
  try {
    const body = new FormData()
    body.append('title', formData.value.title)
    body.append('type', formData.value.type)
    body.append('status', formData.value.status)
    body.append('notes', formData.value.notes || '')
    
    if (uploadMethod.value === 'file') {
      body.append('file', selectedFile.value)
      body.append('filename', selectedFile.value.name)
    } else {
      body.append('file_url', formData.value.file_url)
      // Extract filename from URL as fallback name
      const urlName = formData.value.file_url.split('/').pop() || 'external-link'
      body.append('filename', urlName) 
    }

    const response = await $fetch('/api/admin/tools', {
      method: 'POST',
      body: body
    })

    if (response.success) {
      navigateTo('/dashboard/tools')
    }
  } catch (err) {
    console.error('Failed to create tool:', err)
    alert(err.message || 'Failed to create tool')
  } finally {
    isSubmitting.value = false
  }
}
</script>
