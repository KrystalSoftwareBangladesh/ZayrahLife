<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useOrderStore } from '@/stores/orders'
import BaseButton from '@/components/common/BaseButton.vue'

const route = useRoute()
const orderStore = useOrderStore()

const order = ref(null)

onMounted(() => {
  order.value = orderStore.getOrderById(route.params.id)
})

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
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
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <RouterLink to="/orders" class="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
      <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Orders
    </RouterLink>

    <div v-if="order">
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Order {{ order.id }}</h1>
          <p class="text-gray-500">Placed on {{ formatDate(order.date) }}</p>
        </div>
        <span :class="['px-4 py-2 text-sm font-medium rounded-full', getStatusClass(order.status)]">
          {{ order.statusLabel }}
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-900 mb-4">Shipping Address</h2>
          <p class="text-gray-600">{{ order.shippingAddress.name }}</p>
          <p class="text-gray-600">{{ order.shippingAddress.street }}</p>
          <p class="text-gray-600">
            {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.zip }}
          </p>
          <p class="text-gray-600">{{ order.shippingAddress.country }}</p>
        </div>

        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div class="space-y-2 text-gray-600">
            <div class="flex justify-between">
              <span>Subtotal</span>
              <span>${{ order.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Shipping</span>
              <span>{{ order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}` }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tax</span>
              <span>${{ order.tax.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between pt-2 border-t font-bold text-gray-900">
              <span>Total</span>
              <span>${{ order.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="order.trackingNumber" class="bg-blue-50 rounded-xl p-6 mb-8">
        <h2 class="font-semibold text-blue-900 mb-2">Tracking Information</h2>
        <p class="text-blue-800">Tracking Number: <span class="font-mono">{{ order.trackingNumber }}</span></p>
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b">
          <h2 class="font-semibold text-gray-900">Order Items</h2>
        </div>
        <div class="divide-y">
          <div
            v-for="item in order.items"
            :key="item.productId"
            class="p-6 flex gap-4"
          >
            <div class="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-medium flex-shrink-0">
              {{ item.name.substring(0, 2).toUpperCase() }}
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-gray-900">{{ item.name }}</h3>
              <p v-if="item.color || item.size" class="text-sm text-gray-500 mt-1">
                <span v-if="item.color">{{ item.color }}</span>
                <span v-if="item.color && item.size"> / </span>
                <span v-if="item.size">Size {{ item.size }}</span>
              </p>
              <p class="text-sm text-gray-500 mt-1">Quantity: {{ item.quantity }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium text-gray-900">${{ (item.price * item.quantity).toFixed(2) }}</p>
              <p class="text-sm text-gray-500">${{ item.price.toFixed(2) }} each</p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex gap-4">
        <RouterLink :to="{ name: 'invoice', params: { orderId: order.id } }">
          <BaseButton>View Invoice</BaseButton>
        </RouterLink>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-gray-500 mb-4">Order not found.</p>
      <RouterLink to="/orders">
        <BaseButton>View All Orders</BaseButton>
      </RouterLink>
    </div>
  </div>
</template>
