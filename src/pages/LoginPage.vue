<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const errors = ref({})
const loginError = ref('')

const validate = () => {
  errors.value = {}
  
  if (!form.value.email) {
    errors.value.email = 'Email is required'
  } else if (!/\S+@\S+\.\S+/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email'
  }
  
  if (!form.value.password) {
    errors.value.password = 'Password is required'
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return
  
  loginError.value = ''
  const result = await authStore.login(form.value.email, form.value.password)
  
  if (result.success) {
    router.push({ name: 'home' })
  } else {
    loginError.value = result.error
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-xl shadow-sm p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p class="text-gray-500">Sign in to your account</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <BaseInput
            v-model="form.email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            :error="errors.email"
            required
          />

          <BaseInput
            v-model="form.password"
            type="password"
            label="Password"
            placeholder="Enter your password"
            :error="errors.password"
            required
          />

          <p v-if="loginError" class="text-sm text-red-600">{{ loginError }}</p>

          <BaseButton
            type="submit"
            full-width
            size="lg"
            :loading="authStore.isLoading"
          >
            Sign In
          </BaseButton>
        </form>

        <p class="mt-6 text-center text-gray-500">
          Don't have an account?
          <RouterLink to="/register" class="text-primary-600 hover:text-primary-700 font-medium">
            Sign up
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
