<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar :is-mobile-menu-open="isMobileMenuOpen" @close-mobile-menu="isMobileMenuOpen = false" />
    <div class="lg:pl-64">
      <MobileHeader @toggle-menu="isMobileMenuOpen = !isMobileMenuOpen" />
      <!-- Header is same as create.vue essentially -->
      <header class="hidden lg:block sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-lg">
        <div class="flex items-center gap-4 px-6 py-4">
          <NuxtLink to="/dashboard/tools" class="p-2 hover:bg-gray-100 rounded-lg transition">
            <Icon name="arrow-left" size="sm" class="text-gray-600" />
          </NuxtLink>
          <h1 class="text-2xl font-bold text-gray-800">Edit Tool</h1>
        </div>
      </header>
      
      <main class="p-4 lg:p-8">
        <div v-if="loading" class="text-center py-12 text-gray-500">Loading...</div>
        <div v-else class="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
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
              <input v-model="formData.title" type="text" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
            </div>

            <!-- Existing File Info -->
             <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
               <div class="flex items-center gap-3 overflow-hidden">
                 <Icon name="document" size="md" class="text-gray-400 flex-shrink-0" />
                 <div class="truncate">
                   <p class="text-sm font-medium text-gray-700 truncate">{{ formData.filename }}</p>
                   <a :href="formData.file_url" target="_blank" class="text-xs text-blue-500 hover:underline">View Current File</a>
                 </div>
               </div>
             </div>

            <!-- Update URL (Optional) -->
            <div>
                 <label class="block text-sm font-medium text-gray-700 mb-1">Update File URL (Optional reference update)</label>
                 <input v-model="formData.file_url" type="url" class="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                 <p class="text-xs text-gray-400 mt-1">Note: Re-uploading file not supported in edit mode currently. Delete and re-create if file needs replacing.</p>
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

            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
               <NuxtLink to="/dashboard/tools" class="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition">Cancel</NuxtLink>
               <button type="submit" :disabled="isSubmitting" class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50">
                 <Icon v-if="isSubmitting" name="refresh" class="animate-spin" />
                 <span>{{ isSubmitting ? 'Saving...' : 'Save Changes' }}</span>
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

const route = useRoute()
const isMobileMenuOpen = ref(false)
const isSubmitting = ref(false)
const loading = ref(true)

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
  filename: '',
  notes: ''
})

// Fetch Detail using List API with Search or (better) specific endpoint logic, 
// using List endpoint filtering by ID logic if I implemented [id].get.ts?
// Wait, I didn't verify I made [id].get.ts. I made index.get.ts (list).
// I should probably use supabase client directly here or fetch list filtered by ID if acceptable, 
// OR just add a quick fetch logic. Since I don't have [id].get.ts, I will use client side Supabase fetch or modify index.get.ts?
// Actually I can just fetch via Supabase client in the script setup since I might not have created [id].get.ts.
// BUT I am in `admin-package`. Does it have `useSupabaseClient`? It should.
// Let's use `useSupabaseClient` to fetch detail for Edit page.

const fetchDetail = async () => {
  loading.value = true
  try {
     const client = useSupabaseClient()
     const { data, error } = await client
       .from('tools_documents')
       .select('*')
       .eq('id', route.params.id)
       .single()
     
     if (error) throw error
     if (data) {
       formData.value = { ...data }
     }
  } catch (err) {
    console.error('Failed to fetch detail:', err)
    alert('Failed to load document')
    navigateTo('/dashboard/tools')
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  isSubmitting.value = true
  try {
    const response = await $fetch(`/api/admin/tools/${route.params.id}`, {
      method: 'PUT',
      body: formData.value
    })

    if (response.success) {
      navigateTo('/dashboard/tools')
    }
  } catch (err) {
    console.error('Failed to update tool:', err)
    alert(err.message || 'Failed to update tool')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(fetchDetail)
</script>
