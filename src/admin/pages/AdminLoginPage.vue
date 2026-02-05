<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/admin/adminAuth'

const router = useRouter()
const adminAuth = useAdminAuthStore()

const credential = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  const result = await adminAuth.login(credential.value, password.value)
  
  if (result.success) {
    router.push({ name: 'admin-dashboard' })
  } else {
    error.value = result.error || 'Login failed'
  }
  
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <img src="/logo.png" alt="ZayrahLife" class="h-16 mx-auto mb-4 brightness-200" />
        <h1 class="text-2xl font-bold text-white">Admin Panel</h1>
        <p class="text-gray-400 mt-2">Sign in to access the dashboard</p>
      </div>
      
      <div class="bg-white rounded-lg shadow-xl p-8">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {{ error }}
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email or Username</label>
            <input
              v-model="credential"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="admin@zayrahlife.com"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter password"
            />
          </div>
          
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 bg-primary-700 text-white font-medium rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
