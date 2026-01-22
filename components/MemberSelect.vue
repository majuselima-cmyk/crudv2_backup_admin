<template>
  <div class="relative">
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @focus="showDropdown = true"
        @blur="closeDropdownDelayed"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Icon 
        v-if="searchQuery" 
        name="x-circle" 
        size="sm" 
        @click="clearSearch"
        class="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-gray-600"
      />
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && filteredMembers.length > 0"
      class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
    >
      <div
        v-for="member in filteredMembers"
        :key="member.id"
        @click="selectMember(member)"
        class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
      >
        <div class="flex items-center justify-between mb-1">
          <div class="font-medium text-gray-900">{{ member.username }}</div>
          <span :class="getMemberTypeBadgeClass(member.member_type)">
            {{ formatMemberType(member.member_type) }}
          </span>
        </div>
        <div class="text-sm text-gray-500">
          {{ member.email || 'N/A' }}
        </div>
      </div>
    </div>

    <!-- No results message -->
    <div
      v-if="showDropdown && searchQuery && filteredMembers.length === 0"
      class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-4 text-center text-gray-500"
    >
      Member tidak ditemukan
    </div>

    <!-- Selected member display -->
    <div v-if="selectedMember && !showDropdown && searchQuery === ''" class="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div class="flex items-center justify-between mb-1">
        <div class="font-medium text-gray-900">✓ {{ selectedMember.username }}</div>
        <span :class="getMemberTypeBadgeClass(selectedMember.member_type)">
          {{ formatMemberType(selectedMember.member_type) }}
        </span>
      </div>
      <div class="text-sm text-gray-500">{{ selectedMember.email || 'N/A' }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  members: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: [String, Number],
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Cari member...'
  }
})

const emit = defineEmits(['update:modelValue', 'select'])

const searchQuery = ref('')
const showDropdown = ref(false)

const selectedMember = computed(() => {
  if (!props.modelValue) return null
  return props.members.find(m => m.id === props.modelValue || m.id === parseInt(props.modelValue))
})

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.members
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.members.filter(member => 
    member.username.toLowerCase().includes(query) ||
    member.email?.toLowerCase().includes(query) ||
    member.id.toString().includes(query) ||
    member.member_type?.toLowerCase().includes(query)
  )
})

const selectMember = (member) => {
  emit('update:modelValue', member.id)
  emit('select', member)
  searchQuery.value = ''
  showDropdown.value = false
}

const clearSearch = () => {
  searchQuery.value = ''
}

const closeDropdownDelayed = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const getMemberTypeBadgeClass = (memberType) => {
  const baseClass = 'px-2 py-1 text-xs font-semibold rounded whitespace-nowrap'
  const typeClasses = {
    'normal': 'bg-gray-100 text-gray-800',
    'premium': 'bg-purple-100 text-purple-800',
    'vip': 'bg-yellow-100 text-yellow-800',
    'leader': 'bg-red-100 text-red-800',
    'presale': 'bg-blue-100 text-blue-800'
  }
  return `${baseClass} ${typeClasses[memberType] || 'bg-gray-100 text-gray-800'}`
}

const formatMemberType = (memberType) => {
  const typeMap = {
    'normal': 'Normal',
    'premium': 'Premium',
    'vip': 'VIP',
    'leader': 'Leader',
    'presale': 'Presale'
  }
  return typeMap[memberType] || memberType
}
</script>
