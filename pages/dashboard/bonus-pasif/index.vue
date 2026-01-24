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
            Bonus Pasif
          </h1>
        </div>
      </header>

      <!-- Content -->
      <main class="p-4 lg:p-8">
        <!-- Menu Navigation -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- Member List Card -->
          <NuxtLink
            to="/dashboard/bonus-pasif/members"
            class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer overflow-hidden"
          >
            <div class="p-6">
              <div class="flex items-center gap-4 mb-4">
                <div class="p-3 bg-purple-100 rounded-lg">
                  <Icon name="user" size="lg" class="text-purple-600" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">Member List</h2>
                  <p class="text-sm text-gray-600">Daftar member pasif</p>
                </div>
              </div>
              <div class="text-sm text-gray-500">
                Lihat semua member dengan status staking dan reward
              </div>
            </div>
          </NuxtLink>

          <!-- Staking Card -->
          <NuxtLink
            to="/dashboard/bonus-pasif/staking"
            class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
          >
            <div class="p-6">
              <div class="flex items-center gap-4 mb-4">
                <div class="p-3 bg-blue-100 rounded-lg">
                  <Icon name="trending-up" size="lg" class="text-blue-600" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">Staking</h2>
                  <p class="text-sm text-gray-600">Kelola staking member</p>
                </div>
              </div>
              <div class="text-sm text-gray-500">
                Lihat dan kelola semua aktivitas staking member
              </div>
            </div>
          </NuxtLink>

          <!-- Bonus Multiplier Card -->
          <NuxtLink
            to="/dashboard/bonus-pasif/bonus-multiplier"
            class="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-yellow-300 transition-all cursor-pointer overflow-hidden"
          >
            <div class="p-6">
              <div class="flex items-center gap-4 mb-4">
                <div class="p-3 bg-yellow-100 rounded-lg">
                  <Icon name="zap" size="lg" class="text-yellow-600" />
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-gray-900">Bonus Multiplier</h2>
                  <p class="text-sm text-gray-600">Kelola bonus multiplier</p>
                </div>
              </div>
              <div class="text-sm text-gray-500">
                Konfigurasi dan kelola sistem bonus multiplier
              </div>
            </div>
          </NuxtLink>
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
