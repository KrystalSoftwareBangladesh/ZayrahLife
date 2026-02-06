<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin/adminAuth'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const user = computed(() => adminAuth.user)

const logout = () => {
  adminAuth.logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <header class="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-gray-900">Admin Panel</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-medium">
            {{ user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'A' }}
          </div>
          <div class="text-sm">
            <div class="font-medium text-gray-900">{{ user?.full_name || user?.username }}</div>
            <div class="text-xs text-gray-500">{{ user?.email }}</div>
          </div>
        </div>
        
        <button
          @click="logout"
          class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
