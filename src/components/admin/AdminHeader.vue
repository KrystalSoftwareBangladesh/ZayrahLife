<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin/adminAuth'
import Calculator from './Calculator.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'

const router = useRouter()
const adminAuth = useAdminAuthStore()
const showCalculator = ref(false)

const user = computed(() => adminAuth.user)

const logout = () => {
  adminAuth.logout()
  router.push({ name: 'admin-login' })
}
</script>

<template>
  <header class="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-gray-900">Admin Panel</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <ThemeToggle />

        <div class="relative">
          <button
            @click="showCalculator = !showCalculator"
            class="w-10 h-10 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition-colors flex items-center justify-center"
            title="Calculator"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>

          <div v-if="showCalculator" class="absolute top-12 right-0 z-50">
            <Calculator @close="showCalculator = false" />
          </div>
        </div>

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
