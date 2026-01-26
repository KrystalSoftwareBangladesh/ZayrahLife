import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  email: string
  name: string
  createdAt: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  const login = async (email: string, password: string) => {
    isLoading.value = true
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (email && password.length >= 6) {
      user.value = {
        id: 1,
        email,
        name: email.split('@')[0],
        createdAt: new Date().toISOString()
      }
      isLoading.value = false
      return { success: true }
    }
    
    isLoading.value = false
    return { success: false, error: 'Invalid credentials' }
  }

  const register = async (name: string, email: string, password: string) => {
    isLoading.value = true
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    if (name && email && password.length >= 6) {
      user.value = {
        id: 1,
        email,
        name,
        createdAt: new Date().toISOString()
      }
      isLoading.value = false
      return { success: true }
    }
    
    isLoading.value = false
    return { success: false, error: 'Registration failed' }
  }

  const logout = () => {
    user.value = null
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout
  }
})
