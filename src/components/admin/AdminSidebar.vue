<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const menuItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Customers', path: '/admin/customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { name: 'Products', path: '/admin/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Orders', path: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Accounts', path: '/admin/accounts', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Campaigns', path: '/admin/campaigns', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' }
]

const isActive = (path) => {
  if (path === '/admin/dashboard') {
    return route.path === path
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <aside class="w-64 bg-gray-900 text-white flex flex-col">
    <div class="p-4 border-b border-gray-800">
      <RouterLink to="/admin/dashboard" class="flex items-center gap-3">
        <img src="/logo.png" alt="ZayrahLife" class="h-10 w-auto brightness-200" />
        <div>
          <div class="font-bold text-lg">ZayrahLife</div>
          <div class="text-xs text-gray-400">Admin Panel</div>
        </div>
      </RouterLink>
    </div>
    
    <nav class="flex-1 py-4">
      <ul class="space-y-1">
        <li v-for="item in menuItems" :key="item.path">
          <RouterLink
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 text-sm transition-colors"
            :class="isActive(item.path) 
              ? 'bg-primary-700 text-white border-r-4 border-gold-500' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon" />
            </svg>
            {{ item.name }}
          </RouterLink>
        </li>
      </ul>
    </nav>
    
    <div class="p-4 border-t border-gray-800">
      <RouterLink
        to="/"
        class="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Website
      </RouterLink>
    </div>
  </aside>
</template>
