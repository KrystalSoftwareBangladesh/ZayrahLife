<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useOrderStore } from '@/stores/orders'
import { useAuthStore } from '@/stores/auth'
import BaseButton from '@/components/common/BaseButton.vue'

const orderStore = useOrderStore()
const authStore = useAuthStore()

const orders = computed(() => orderStore.sortedOrders)
const isLoggedIn = computed(() => authStore.isAuthenticated)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusClass = (status) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-700'
    case 'shipped':
      return 'bg-blue-100 text-blue-700'
    case 'processing':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

onMounted(() => {
  void orderStore.fetchOrders()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

    <div v-if="!isLoggedIn" class="text-center py-16 bg-white rounded-xl shadow-sm">
      <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Please sign in</h2>
      <p class="text-gray-500 mb-6">Sign in to view your order history</p>
      <RouterLink to="/login">
        <BaseButton>Sign In</BaseButton>
      </RouterLink>
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-16 bg-white rounded-xl shadow-sm">
      <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
      <p class="text-gray-500 mb-6">Start shopping to see your orders here</p>
      <RouterLink to="/products">
        <BaseButton>Browse Products</BaseButton>
      </RouterLink>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div class="p-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-lg font-semibold text-gray-900">{{ order.id }}</h2>
                <span :class="['px-2 py-1 text-xs font-medium rounded-full', getStatusClass(order.status)]">
                  {{ order.statusLabel }}
                </span>
              </div>
              <p class="text-sm text-gray-500 mt-1">Placed on {{ formatDate(order.date) }}</p>
            </div>
            <div class="text-right">
              <p class="text-lg font-bold text-gray-900">৳{{ order.total.toFixed(2) }}</p>
              <p class="text-sm text-gray-500">{{ order.items.length }} item(s)</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3 mb-4">
            <div
              v-for="item in order.items.slice(0, 3)"
              :key="item.productId"
              class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs"
            >
              {{ item.name.substring(0, 2).toUpperCase() }}
            </div>
            <div
              v-if="order.items.length > 3"
              class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-medium"
            >
              +{{ order.items.length - 3 }}
            </div>
          </div>

          <div class="flex gap-3">
            <RouterLink :to="{ name: 'invoice', params: { orderId: order.id } }">
              <BaseButton variant="outline" size="sm">View Invoice</BaseButton>
            </RouterLink>
            <RouterLink :to="{ name: 'order-detail', params: { id: order.id } }">
              <BaseButton variant="ghost" size="sm">Order Details</BaseButton>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
