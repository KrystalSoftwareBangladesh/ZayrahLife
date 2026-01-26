<script setup>
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)

const cartCount = computed(() => cartStore.itemCount)
const isLoggedIn = computed(() => authStore.isAuthenticated)
const userName = computed(() => authStore.user?.name || '')

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const logout = () => {
  authStore.logout()
  closeMobileMenu()
}
</script>

<template>
  <header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <RouterLink to="/" class="flex items-center gap-2" @click="closeMobileMenu">
          <img src="/logo.png" alt="ZayrahLife" class="h-12 w-auto" />
        </RouterLink>
        
        <nav class="hidden md:flex items-center gap-8">
          <RouterLink
            to="/"
            class="text-gray-600 hover:text-primary-700 transition-colors font-medium"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/products"
            class="text-gray-600 hover:text-primary-700 transition-colors font-medium"
          >
            Products
          </RouterLink>
        </nav>
        
        <div class="flex items-center gap-4">
          <RouterLink
            to="/cart"
            class="relative p-2 text-gray-600 hover:text-primary-700 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span
              v-if="cartCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-gold-500 rounded-full"
            >
              {{ cartCount > 99 ? '99+' : cartCount }}
            </span>
          </RouterLink>
          
          <template v-if="isLoggedIn">
            <RouterLink
              to="/orders"
              class="hidden md:block text-gray-600 hover:text-primary-700 transition-colors font-medium"
            >
              Orders
            </RouterLink>
            <RouterLink
              to="/profile"
              class="hidden md:flex items-center gap-2 text-gray-600 hover:text-primary-700 transition-colors"
            >
              <div class="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-primary-900 text-sm font-bold">
                {{ userName.charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm font-medium">{{ userName }}</span>
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="hidden md:block px-4 py-2 text-primary-700 hover:text-primary-800 font-medium"
            >
              Login
            </RouterLink>
            <RouterLink
              to="/register"
              class="hidden md:block px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium"
            >
              Sign Up
            </RouterLink>
          </template>
          
          <button
            class="md:hidden p-2 text-gray-600"
            @click="toggleMobileMenu"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <Transition name="slide">
      <div v-if="mobileMenuOpen" class="md:hidden bg-white border-t">
        <div class="px-4 py-4 space-y-3">
          <RouterLink
            to="/"
            class="block py-2 text-gray-600 hover:text-primary-700"
            @click="closeMobileMenu"
          >
            Home
          </RouterLink>
          <RouterLink
            to="/products"
            class="block py-2 text-gray-600 hover:text-primary-700"
            @click="closeMobileMenu"
          >
            Products
          </RouterLink>
          <template v-if="isLoggedIn">
            <RouterLink
              to="/profile"
              class="block py-2 text-gray-600 hover:text-primary-700"
              @click="closeMobileMenu"
            >
              My Profile
            </RouterLink>
            <RouterLink
              to="/orders"
              class="block py-2 text-gray-600 hover:text-primary-700"
              @click="closeMobileMenu"
            >
              My Orders
            </RouterLink>
            <button
              class="block py-2 text-red-600"
              @click="logout"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <RouterLink
              to="/login"
              class="block py-2 text-primary-700"
              @click="closeMobileMenu"
            >
              Login
            </RouterLink>
            <RouterLink
              to="/register"
              class="block py-2 text-primary-700"
              @click="closeMobileMenu"
            >
              Sign Up
            </RouterLink>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
