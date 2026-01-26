<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const isLoggedIn = computed(() => authStore.isAuthenticated)
const user = computed(() => authStore.user)

const isEditing = ref(false)
const isSaving = ref(false)

const profileForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'USA'
})

const initForm = () => {
  if (user.value) {
    profileForm.value.name = user.value.name || ''
    profileForm.value.email = user.value.email || ''
  }
}

if (user.value) {
  initForm()
}

const startEditing = () => {
  initForm()
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
}

const saveProfile = async () => {
  isSaving.value = true
  await new Promise(resolve => setTimeout(resolve, 800))
  
  if (authStore.user) {
    authStore.user.name = profileForm.value.name
    authStore.user.email = profileForm.value.email
  }
  
  isSaving.value = false
  isEditing.value = false
}

const logout = () => {
  authStore.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

    <div v-if="!isLoggedIn" class="text-center py-16 bg-white rounded-xl shadow-sm">
      <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Please sign in</h2>
      <p class="text-gray-500 mb-6">Sign in to view and manage your profile</p>
      <RouterLink to="/login">
        <BaseButton>Sign In</BaseButton>
      </RouterLink>
    </div>

    <div v-else class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="p-6 bg-gradient-to-r from-primary-700 to-primary-800">
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-full bg-gold-500 flex items-center justify-center text-primary-900 text-3xl font-bold">
              {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <div class="text-white">
              <h2 class="text-2xl font-bold">{{ user?.name }}</h2>
              <p class="text-primary-200">{{ user?.email }}</p>
              <p class="text-sm text-primary-300 mt-1">Member since {{ new Date(user?.createdAt).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>

        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Profile Information</h3>
            <BaseButton v-if="!isEditing" variant="outline" size="sm" @click="startEditing">
              Edit Profile
            </BaseButton>
          </div>

          <form v-if="isEditing" @submit.prevent="saveProfile" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BaseInput
                v-model="profileForm.name"
                label="Full Name"
                placeholder="Your name"
              />
              <BaseInput
                v-model="profileForm.email"
                label="Email"
                type="email"
                placeholder="your@email.com"
              />
              <BaseInput
                v-model="profileForm.phone"
                label="Phone"
                type="tel"
                placeholder="(555) 123-4567"
              />
              <BaseInput
                v-model="profileForm.address"
                label="Address"
                placeholder="123 Main Street"
              />
              <BaseInput
                v-model="profileForm.city"
                label="City"
                placeholder="New York"
              />
              <BaseInput
                v-model="profileForm.state"
                label="State"
                placeholder="NY"
              />
              <BaseInput
                v-model="profileForm.zip"
                label="ZIP Code"
                placeholder="10001"
              />
              <BaseInput
                v-model="profileForm.country"
                label="Country"
                disabled
              />
            </div>
            <div class="flex gap-3 pt-4">
              <BaseButton type="submit" :loading="isSaving">Save Changes</BaseButton>
              <BaseButton type="button" variant="ghost" @click="cancelEditing">Cancel</BaseButton>
            </div>
          </form>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="text-sm text-gray-500">Full Name</p>
              <p class="font-medium text-gray-900">{{ user?.name || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="font-medium text-gray-900">{{ user?.email || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Phone</p>
              <p class="font-medium text-gray-900">{{ profileForm.phone || 'Not set' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Address</p>
              <p class="font-medium text-gray-900">{{ profileForm.address || 'Not set' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RouterLink
            to="/orders"
            class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span class="font-medium text-gray-900">My Orders</span>
          </RouterLink>
          <RouterLink
            to="/cart"
            class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span class="font-medium text-gray-900">Shopping Cart</span>
          </RouterLink>
          <RouterLink
            to="/products"
            class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span class="font-medium text-gray-900">Browse Products</span>
          </RouterLink>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
        <BaseButton variant="danger" @click="logout">
          Sign Out
        </BaseButton>
      </div>
    </div>
  </div>
</template>
