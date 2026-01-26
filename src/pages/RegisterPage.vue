<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput from '@/components/common/BaseInput.vue'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = ref({})
const registerError = ref('')

const validate = () => {
  errors.value = {}
  
  if (!form.value.name) {
    errors.value.name = 'Name is required'
  }
  
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
  
  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = 'Please confirm your password'
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Passwords do not match'
  }
  
  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return
  
  registerError.value = ''
  const result = await authStore.register(form.value.name, form.value.email, form.value.password)
  
  if (result.success) {
    router.push({ name: 'home' })
  } else {
    registerError.value = result.error
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-xl shadow-sm p-8">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p class="text-gray-500">Join us and start shopping</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <BaseInput
            v-model="form.name"
            label="Full Name"
            placeholder="John Doe"
            :error="errors.name"
            required
          />

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
            placeholder="At least 6 characters"
            :error="errors.password"
            required
          />

          <BaseInput
            v-model="form.confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            :error="errors.confirmPassword"
            required
          />

          <p v-if="registerError" class="text-sm text-red-600">{{ registerError }}</p>

          <BaseButton
            type="submit"
            full-width
            size="lg"
            :loading="authStore.isLoading"
          >
            Create Account
          </BaseButton>
        </form>

        <p class="mt-6 text-center text-gray-500">
          Already have an account?
          <RouterLink to="/login" class="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
