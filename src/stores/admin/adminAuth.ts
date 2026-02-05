import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { UserProfile, ApiError } from '@/api/types'

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const user = ref<UserProfile | null>(JSON.parse(localStorage.getItem('adminUser') || 'null'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!localStorage.getItem('accessToken') && !!user.value)
  const isAdmin = computed(() => user.value?.groups?.includes(1) ?? false)

  async function login(credential: string, password: string): Promise<{ success: boolean; error?: string }> {
    loading.value = true
    error.value = null

    try {
      await authApi.login({ credential, password })
      const profile = await authApi.getProfile()
      user.value = profile
      localStorage.setItem('adminUser', JSON.stringify(profile))
      return { success: true }
    } catch (err) {
      const apiError = err as ApiError
      const errorMessage = apiError.message || 'Invalid credentials'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await authApi.logout()
    } catch {
    } finally {
      user.value = null
      loading.value = false
    }
  }

  async function fetchProfile(): Promise<void> {
    if (!localStorage.getItem('accessToken')) return
    
    loading.value = true
    try {
      const profile = await authApi.getProfile()
      user.value = profile
      localStorage.setItem('adminUser', JSON.stringify(profile))
    } catch {
      user.value = null
      localStorage.removeItem('adminUser')
    } finally {
      loading.value = false
    }
  }

  function handleAuthLogout() {
    user.value = null
    error.value = 'Session expired. Please login again.'
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', handleAuthLogout)
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    fetchProfile
  }
})
