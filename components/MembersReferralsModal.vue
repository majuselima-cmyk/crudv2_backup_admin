<!-- Referrals Modal Component -->
<template>
  <div 
    v-if="show"
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-800">Data Referral / Downline</h3>
            <p class="text-sm text-gray-600 mt-1">
              Member: <strong>{{ member?.email }}</strong> 
              ({{ member?.username }})
            </p>
            <!-- Breadcrumb for nested navigation -->
            <div v-if="history && history.length > 1" class="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span v-for="(item, idx) in history" :key="idx" class="flex items-center gap-2">
                <button
                  v-if="idx < history.length - 1"
                  @click="$emit('navigate-back', idx)"
                  class="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {{ item.member?.email || item.member?.username }}
                </button>
                <span v-else class="text-gray-700 font-medium">
                  {{ item.member?.email || item.member?.username }}
                </span>
                <span v-if="idx < history.length - 1" class="text-gray-400">›</span>
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="history && history.length > 1"
              @click="$emit('navigate-back', history.length - 2)"
              class="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              title="Kembali"
            >
              ← Kembali
            </button>
            <button 
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 transition"
            >
              <Icon name="close" size="md" />
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="ml-3 text-gray-600">Memuat data referral...</span>
        </div>

        <!-- Referrals List -->
        <div v-else-if="referrals && referrals.length > 0" class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p class="text-sm text-blue-700">
              <strong>Total Referral:</strong> {{ referrals.length }} member
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">No</th>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Member</th>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Referral Code</th>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Total Downline</th>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
                  <th class="text-left py-3.5 px-5 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr 
                  v-for="(referral, index) in referrals" 
                  :key="referral.id"
                  class="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td class="py-4 px-5 text-sm text-gray-600 font-medium">{{ index + 1 }}</td>
                  <td class="py-4 px-5">
                    <div class="flex flex-col gap-1.5">
                      <div class="flex items-center gap-2">
                        <div class="text-gray-900 font-semibold text-sm">{{ referral.username }}</div>
                        <span 
                          :class="[
                            'px-2.5 py-1 rounded-full text-xs font-semibold inline-block',
                            referral.member_type === 'vip' 
                              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                              : referral.member_type === 'leader'
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          ]"
                        >
                          {{ referral.member_type === 'vip' ? 'VIP' : referral.member_type === 'leader' ? 'Leader' : 'Normal' }}
                        </span>
                      </div>
                      <div class="text-gray-600 text-xs">{{ referral.email }}</div>
                    </div>
                  </td>
                  <td class="py-4 px-5 text-sm text-gray-700 font-mono">{{ referral.referral_code || '-' }}</td>
                  <td class="py-4 px-5">
                    <button
                      v-if="referral.total_downline > 0"
                      @click="$emit('view-referrals', referral)"
                      class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm"
                      title="Klik untuk melihat referral dari member ini"
                    >
                      <Icon name="users" size="sm" />
                      {{ referral.total_downline }}
                    </button>
                    <span v-else class="text-gray-400 text-sm">0</span>
                  </td>
                  <td class="py-4 px-5">
                    <span 
                      :class="[
                        'px-2.5 py-1 rounded-full text-xs font-semibold inline-block',
                        referral.status === 'active' 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : referral.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      ]"
                    >
                      {{ referral.status === 'active' ? 'Aktif' : referral.status === 'pending' ? 'Pending' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="py-4 px-5 text-sm text-gray-600">
                    {{ formatDate(referral.created_at) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <p class="text-gray-400">Member ini belum memiliki referral/downline</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  show: Boolean,
  member: Object,
  referrals: Array,
  loading: Boolean,
  error: String,
  history: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'view-referrals', 'navigate-back'])

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
</script>
