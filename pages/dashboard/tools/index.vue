<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar :is-mobile-menu-open="isMobileMenuOpen" @close-mobile-menu="isMobileMenuOpen = false" />
    <div class="lg:pl-64">
      <MobileHeader @toggle-menu="isMobileMenuOpen = !isMobileMenuOpen" />
      <header class="hidden lg:block sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-lg">
        <div class="flex items-center justify-between px-6 py-4">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Manage Tools
          </h1>
          <NuxtLink to="/dashboard/tools/create" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Icon name="plus" size="sm" />
            <span>Add New Tool</span>
          </NuxtLink>
        </div>
      </header>

      <main class="p-4 lg:p-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <!-- Filters -->
          <div class="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
            <div class="flex items-center gap-4 w-full md:w-auto">
              <div class="relative w-full md:w-64">
                <Icon name="search" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input v-model="search" type="text" placeholder="Search title..." class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" />
              </div>
              <select v-model="filterType" class="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                <option value="">All Types</option>
                <option value="ppt">PPT</option>
                <option value="whitepaper">Whitepaper</option>
                <option value="roadmap">Roadmap</option>
              </select>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th class="px-6 py-4">Title / File</th>
                  <th class="px-6 py-4">Type</th>
                  <th class="px-6 py-4">Status</th>
                  <th class="px-6 py-4">Created At</th>
                  <th class="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <template v-if="loading">
                  <tr class="animate-pulse">
                    <td colspan="5" class="px-6 py-8 text-center text-gray-400">Loading data...</td>
                  </tr>
                </template>
                <template v-else-if="!documents?.length">
                  <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-400">No documents found</td>
                  </tr>
                </template>
                <template v-else>
                  <tr v-for="doc in (documents || [])" :key="doc?.id" class="hover:bg-gray-50 transition">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-50 rounded-lg text-blue-600">
                          <Icon :name="getIconByType(doc?.type)" size="md" />
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">{{ doc.title || 'Untitled' }}</p>
                          <a :href="doc.file_url" target="_blank" class="text-xs text-blue-500 hover:text-blue-700 hover:underline truncate max-w-[200px] block">
                            {{ doc.filename }}
                          </a>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-xs font-medium capitalize" :class="getTypeColor(doc.type)">
                        {{ doc.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-xs font-medium capitalize" :class="doc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'">
                        {{ doc.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {{ formatDate(doc.created_at) }}
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <NuxtLink :to="`/dashboard/tools/${doc.id}`" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                          <Icon name="pencil" size="sm" />
                        </NuxtLink>
                        <button @click="confirmDelete(doc)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                          <Icon name="trash" size="sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          <div class="p-4 border-t border-gray-100 flex items-center justify-between" v-if="totalPages > 1">
             <button @click="page--" :disabled="page <= 1" class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
             <span class="text-sm text-gray-600">Page {{ page }} of {{ totalPages }}</span>
             <button @click="page++" :disabled="page >= totalPages" class="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'admin' })

const isMobileMenuOpen = ref(false)
const documents = ref([])
const loading = ref(true)
const search = ref('')
const filterType = ref('')
const page = ref(1)
const totalPages = ref(1)

// Fetch Data
const fetchDocuments = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/tools', {
      params: {
        page: page.value,
        limit: 10,
        search: search.value,
        type: filterType.value
      }
    })
    if (response.success) {
      documents.value = Array.isArray(response.data) ? response.data : []
      totalPages.value = response.total_pages || 1
    } else {
      documents.value = []
    }
  } catch (err) {
    console.error('Failed to fetch tools:', err)
    documents.value = []
  } finally {
    loading.value = false
  }
}

// Watchers
// Watchers
watch([page, filterType], fetchDocuments)

let debounceTimer = null
watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    fetchDocuments()
  }, 500)
})

// Helpers
const getIconByType = (type) => {
  switch(type) {
    case 'ppt': return 'presentation-chart-bar'
    case 'whitepaper': return 'document-text'
    case 'roadmap': return 'map'
    default: return 'document'
  }
}

const getTypeColor = (type) => {
  switch(type) {
    case 'ppt': return 'bg-orange-100 text-orange-700'
    case 'whitepaper': return 'bg-purple-100 text-purple-700'
    case 'roadmap': return 'bg-blue-100 text-blue-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const confirmDelete = async (doc) => {
  if (!confirm(`Are you sure you want to delete "${doc.title || doc.filename}"?`)) return
  try {
    await $fetch(`/api/admin/tools/${doc.id}`, { method: 'DELETE' })
    fetchDocuments()
  } catch (err) {
    alert('Failed to delete document')
  }
}

onMounted(fetchDocuments)
</script>
