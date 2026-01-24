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
          <h1 class="text-2xl font-bold text-yellow-600">
            Bonus Multiplier
          </h1>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Empty page content -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div class="text-center py-12">
            <div class="p-4 bg-yellow-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Icon name="zap" size="xl" class="text-yellow-600" />
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-2">
              Bonus Multiplier
            </h2>
            <p class="text-gray-600">
              Halaman ini sedang dalam pengembangan
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin'
})

const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

