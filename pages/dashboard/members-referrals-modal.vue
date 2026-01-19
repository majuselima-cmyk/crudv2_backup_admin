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
          <div>
            <h3 class="text-xl font-semibold text-gray-800">Data Referral / Downline</h3>
            <p class="text-sm text-gray-600 mt-1">
              Member: <strong>{{ member?.email }}</strong> 
              ({{ member?.username }})
            </p>
          </div>
          <button 
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 transition"
          >
            <Icon name="close" size="md" />
          </button>
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
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">No</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Username</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Referral Code</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Downline</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Member Type</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">Tanggal Daftar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr 
                  v-for="(referral, index) in referrals" 
                  :key="referral.id"
                  class="hover:bg-gray-50 transition"
                >
                  <td class="py-4 px-4 text-gray-600">{{ index + 1 }}</td>
                  <td class="py-4 px-4 text-gray-800">{{ referral.email }}</td>
                  <td class="py-4 px-4 text-gray-800">{{ referral.username }}</td>
                  <td class="py-4 px-4 text-gray-600 font-mono text-sm">{{ referral.referral_code || '-' }}</td>
                  <td class="py-4 px-4">
                    <button
                      v-if="referral.total_downline > 0"
                      @click="$emit('view-referrals', referral)"
                      class="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition cursor-pointer"
                    >
                      {{ referral.total_downline }} 👁️
                    </button>
                    <span v-else class="text-gray-500">0</span>
                  </td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        referral.member_type === 'vip' 
                          ? 'bg-purple-100 text-purple-700' 
                          : referral.member_type === 'leader'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      ]"
                    >
                      {{ referral.member_type === 'vip' ? 'VIP' : referral.member_type === 'leader' ? 'Leader' : 'Normal' }}
                    </span>
                  </td>
                  <td class="py-4 px-4">
                    <span 
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        referral.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : referral.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      ]"
                    >
                      {{ referral.status === 'active' ? 'Aktif' : referral.status === 'pending' ? 'Pending' : 'Tidak Aktif' }}
                    </span>
                  </td>
                  <td class="py-4 px-4 text-gray-600 text-sm">
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

        <!-- Error State -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-sm text-red-600">{{ error }}</p>
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
  error: String
})

const emit = defineEmits(['close', 'view-referrals'])

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

