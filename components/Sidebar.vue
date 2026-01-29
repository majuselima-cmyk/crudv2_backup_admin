<template>
  <!-- Mobile Overlay -->
  <Transition
    enter-active-class="transition-opacity ease-linear duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity ease-linear duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isMobileMenuOpen && isMobile"
      @click.stop="closeMobileMenu"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    />
  </Transition>

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed top-0 left-0 h-screen backdrop-blur-md bg-white/95 border-r border-gray-200/50 z-50 transition-transform duration-300 ease-in-out w-64 shadow-lg',
      isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 lg:translate-x-0'
    ]"
  >
    <div class="flex flex-col h-full">
      <!-- Logo/Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-transparent">
        <h2 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Dashboard Admin</h2>
        <button
          @click.stop="closeMobileMenu"
          type="button"
          class="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
        >
          <Icon name="close" size="sm" class="text-gray-600" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-4">
        <ul class="space-y-2">
          <li v-for="item in menuItems" :key="item.path">
            <!-- Menu item tanpa sub-menu -->
            <template v-if="!item.submenu">
              <NuxtLink
                :to="item.path"
                @click.stop="closeMobileMenu"
                :class="[
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-600 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm'
                ]"
              >
                <Icon :name="item.icon" size="md" />
                <span class="font-medium">{{ item.label }}</span>
              </NuxtLink>
            </template>

            <!-- Menu item dengan sub-menu -->
            <template v-else>
              <button
                @click="toggleSubmenu(item.path)"
                :class="[
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActiveMenu(item.path)
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-600 border border-blue-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:shadow-sm'
                ]"
              >
                <Icon :name="item.icon" size="md" />
                <span class="font-medium">{{ item.label }}</span>
                <Icon 
                  name="chevron-down" 
                  size="sm" 
                  :class="['transition-transform duration-200 ml-auto', openSubmenus[item.path] ? 'rotate-180' : '']"
                />
              </button>

              <!-- Sub-menu items -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-96"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 max-h-96"
                leave-to-class="opacity-0 max-h-0"
              >
                <ul v-if="openSubmenus[item.path]" class="space-y-1 mt-1 ml-4 pl-2 border-l-2 border-gray-200">
                  <li v-for="sub in item.submenu" :key="sub.path">
                    <NuxtLink
                      :to="sub.path"
                      @click.stop="closeMobileMenu"
                      :class="[
                        'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-200',
                        isActive(sub.path)
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      ]"
                    >
                      <span>{{ sub.label }}</span>
                    </NuxtLink>
                  </li>
                </ul>
              </Transition>
            </template>
          </li>
        </ul>
      </nav>

      <!-- Footer/User Section -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Icon name="user" size="md" class="text-blue-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">Admin</p>
            <p class="text-xs text-gray-500 truncate">admin@example.com</p>
          </div>
        </div>
        <button
          @click.stop="handleLogout"
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all duration-200 border border-red-200 cursor-pointer hover:shadow-sm"
        >
          <Icon name="logout" size="md" />
          <span class="font-medium">Keluar</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
const route = useRoute()

const props = defineProps({
  isMobileMenuOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close-mobile-menu'])

const isMobile = ref(false)
const openSubmenus = ref({})

const menuItems = computed(() => [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: 'home'
  },
  {
    path: '/dashboard/members',
    label: 'Member',
    icon: 'user'
  },
  {
    path: '/dashboard/wallet',
    label: 'Wallet',
    icon: 'wallet'
  },
  {
    path: '/dashboard/bonus',
    label: 'Bonus',
    icon: 'gift'
  },
  {
    path: '/dashboard/bonus-active-report',
    label: 'Bonus Aktif',
    icon: 'chart-bar'
  },
  {
    path: '/dashboard/bonus-pasif',
    label: 'Bonus Pasif',
    icon: 'star',
    submenu: [
      { path: '/dashboard/bonus-pasif/members', label: 'Member List' },
      { path: '/dashboard/bonus-pasif/staking', label: 'Staking' },
      { path: '/dashboard/bonus-pasif/bonus-multiplier', label: 'Bonus Multiplier' },
      { path: '/dashboard/bonus-pasif/staking-multiplier', label: 'Staking Multiplier' }
    ]
  },
  {
    path: '/dashboard/coin',
    label: 'Coin',
    icon: 'coin'
  },
  {
    path: '/dashboard/gas-free-withdraw',
    label: 'Gas Free Withdraw',
    icon: 'cash'
  },
  {
    path: '/dashboard/minimal-deposit',
    label: 'Minimal Deposit',
    icon: 'card'
  },
  {
    path: '/dashboard/deposits',
    label: 'Rekap Deposit',
    icon: 'document'
  },
  {
    path: '/dashboard/withdraws',
    label: 'Rekap Withdraw',
    icon: 'document'
  },
  {
    path: '/dashboard/tools',
    label: 'Tools Manager',
    icon: 'document-text'
  },
  {
    path: '/dashboard/settings',
    label: 'Pengaturan',
    icon: 'settings'
  },
  {
    path: '/dashboard/email',
    label: 'Email',
    icon: 'email'
  },
  {
    path: '/dashboard/contact-us',
    label: 'Hubungi Kami',
    icon: 'chat'
  }
])

const isActive = (path) => {
  return route.path === path
}

const isActiveMenu = (path) => {
  // Check jika current path adalah submenu dari menu ini
  return route.path.startsWith(path + '/') || route.path === path
}

const toggleSubmenu = (path) => {
  openSubmenus.value[path] = !openSubmenus.value[path]
}

const closeMobileMenu = () => {
  emit('close-mobile-menu')
}

const handleLogout = () => {
  console.log('Admin Logout clicked - redirecting to login')
  closeMobileMenu()
  navigateTo('/')
}

const checkMobile = () => {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 1024 // lg breakpoint
  }
}

// Store cleanup function reference
let resizeHandler = null

// Register lifecycle hooks synchronously in setup
onMounted(() => {
  if (typeof window !== 'undefined') {
    checkMobile()
    resizeHandler = checkMobile
    window.addEventListener('resize', resizeHandler)
  }
  
  // Auto-open submenu jika current path ada di sub-menu
  menuItems.value.forEach(item => {
    if (item.submenu && item.submenu.some(sub => route.path.startsWith(sub.path))) {
      openSubmenus.value[item.path] = true
    }
  })
})

// Watch route changes untuk auto-expand submenu
watch(() => route.path, (newPath) => {
  menuItems.value.forEach(item => {
    if (item.submenu && item.submenu.some(sub => newPath.startsWith(sub.path))) {
      openSubmenus.value[item.path] = true
    }
  })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined' && resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
})
</script>

