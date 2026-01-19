<template>
  <header class="lg:hidden sticky top-0 z-30 backdrop-blur-md bg-white/90 border-b border-gray-200/50 shadow-lg">
    <div class="flex items-center justify-between p-4">
      <button
        @click.stop="handleToggle"
        type="button"
        class="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
      >
        <Icon name="menu" size="md" class="text-gray-700" />
      </button>
      
      <h1 class="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
        Dashboard Admin
      </h1>
      
      <div class="w-16"></div>
    </div>
  </header>
</template>

<script setup>
const emit = defineEmits(['toggle-menu'])

const handleToggle = () => {
  console.log('Hamburger clicked in admin')
  emit('toggle-menu')
}
</script>

