<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useOrderStore } from '@/stores/orders'
import BaseButton from '@/components/common/BaseButton.vue'

const route = useRoute()
const orderStore = useOrderStore()

const order = ref(null)

onMounted(() => {
  order.value = orderStore.getOrderById(route.params.orderId)
})

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const printInvoice = () => {
  window.print()
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="order" class="bg-white rounded-xl shadow-sm print:shadow-none">
      <div class="p-8 print:p-4">
        <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <img src="/logo.png" alt="ZayrahLife" class="h-16 w-auto mb-2" />
            <p class="text-gray-500">Invoice</p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-gray-900">{{ order.id }}</p>
            <p class="text-gray-500">{{ formatDate(order.date) }}</p>
            <span
              :class="[
                'inline-block mt-2 px-3 py-1 text-sm font-medium rounded-full',
                {
                  'bg-green-100 text-green-700': order.status === 'delivered',
                  'bg-blue-100 text-blue-700': order.status === 'shipped',
                  'bg-yellow-100 text-yellow-700': order.status === 'processing'
                }
              ]"
            >
              {{ order.statusLabel }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
            <p class="font-medium text-gray-900">{{ order.shippingAddress.name }}</p>
            <p class="text-gray-600">{{ order.shippingAddress.street }}</p>
            <p class="text-gray-600">
              {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.zip }}
            </p>
            <p class="text-gray-600">{{ order.shippingAddress.country }}</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Ship To</h3>
            <p class="font-medium text-gray-900">{{ order.shippingAddress.name }}</p>
            <p class="text-gray-600">{{ order.shippingAddress.street }}</p>
            <p class="text-gray-600">
              {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.zip }}
            </p>
            <p class="text-gray-600">{{ order.shippingAddress.country }}</p>
          </div>
        </div>

        <div class="overflow-x-auto mb-8">
          <table class="w-full">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th class="text-left py-3 px-2 text-sm font-semibold text-gray-600">Item</th>
                <th class="text-center py-3 px-2 text-sm font-semibold text-gray-600">Qty</th>
                <th class="text-right py-3 px-2 text-sm font-semibold text-gray-600">Price</th>
                <th class="text-right py-3 px-2 text-sm font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.productId" class="border-b border-gray-100">
                <td class="py-4 px-2">
                  <p class="font-medium text-gray-900">{{ item.name }}</p>
                  <p v-if="item.color || item.size" class="text-sm text-gray-500">
                    <span v-if="item.color">{{ item.color }}</span>
                    <span v-if="item.color && item.size"> / </span>
                    <span v-if="item.size">Size {{ item.size }}</span>
                  </p>
                </td>
                <td class="text-center py-4 px-2 text-gray-600">{{ item.quantity }}</td>
                <td class="text-right py-4 px-2 text-gray-600">${{ item.price.toFixed(2) }}</td>
                <td class="text-right py-4 px-2 font-medium text-gray-900">
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end">
          <div class="w-full max-w-xs">
            <div class="flex justify-between py-2 text-gray-600">
              <span>Subtotal</span>
              <span>${{ order.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between py-2 text-gray-600">
              <span>Shipping</span>
              <span>{{ order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}` }}</span>
            </div>
            <div class="flex justify-between py-2 text-gray-600">
              <span>Tax</span>
              <span>${{ order.tax.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between py-3 border-t-2 border-gray-200 text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>${{ order.total.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div v-if="order.trackingNumber" class="mt-8 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm text-gray-600">
            <span class="font-medium">Tracking Number:</span> {{ order.trackingNumber }}
          </p>
        </div>

        <div class="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500 print:hidden">
          <p>Thank you for your order!</p>
        </div>
      </div>

      <div class="px-8 pb-8 flex gap-4 print:hidden">
        <BaseButton @click="printInvoice">
          Print Invoice
        </BaseButton>
        <RouterLink to="/orders">
          <BaseButton variant="outline">View All Orders</BaseButton>
        </RouterLink>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-gray-500 mb-4">Order not found.</p>
      <RouterLink to="/orders">
        <BaseButton>View Orders</BaseButton>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .print\\:shadow-none {
    box-shadow: none !important;
  }
  .print\\:p-4 {
    padding: 1rem !important;
  }
  .print\\:hidden {
    display: none !important;
  }
}
</style>
