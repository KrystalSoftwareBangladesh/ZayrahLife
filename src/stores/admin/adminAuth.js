import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const user = ref(JSON.parse(localStorage.getItem('adminUser') || 'null'))
  const token = ref(localStorage.getItem('adminToken') || null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isStaff = computed(() => user.value?.role === 'STAFF')

  const mockUsers = [
    { id: 1, email: 'admin@zayrahlife.com', password: 'admin123', name: 'Admin User', role: 'ADMIN' },
    { id: 2, email: 'staff@zayrahlife.com', password: 'staff123', name: 'Staff User', role: 'STAFF' }
  ]

  function login(email, password) {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password)
    if (foundUser) {
      const { password: _password, ...userData } = foundUser
void _password
      user.value = userData
      token.value = `mock-token-${Date.now()}`
      localStorage.setItem('adminUser', JSON.stringify(userData))
      localStorage.setItem('adminToken', token.value)
      return { success: true }
    }
    return { success: false, error: 'Invalid credentials' }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('adminUser')
    localStorage.removeItem('adminToken')
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isStaff,
    login,
    logout
  }
})
