<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FormSelect from '@/components/admin/FormSelect.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import { useOrderStore } from '@/stores/admin/orderStore'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const isDeleting = ref(false)
const isUpdatingStatus = ref(false)

const orderIdentifier = computed(() => String(route.params.id || ''))
const order = computed(() => orderStore.getOrderById(orderIdentifier.value))

const availableStatusOptions = computed(() => {
  if (!order.value) return orderStore.apiStatusOptions

  const currentStatusMissing = !orderStore.apiStatusOptions.some(status =>
    orderStore.statusValuesMatch(status.value, order.value?.status)
  )

  if (!currentStatusMissing) return orderStore.apiStatusOptions

  return [
    { value: order.value.status, label: orderStore.getStatusLabel(order.value.status) },
    ...orderStore.apiStatusOptions
  ]
})

const nextStatusLabels = computed(() => {
  if (!order.value) return []
  return orderStore.getTransitionLabels(order.value.status)
})

const canDeleteCurrentOrder = computed(() => {
  if (!order.value) return false
  return orderStore.canDeleteOrder(order.value.apiId)
})

async function loadOrder(): Promise<void> {
  await orderStore.fetchStatusMetadata()
  await orderStore.fetchOrderById(orderIdentifier.value)
}

async function updateStatus(newStatus: string | number): Promise<void> {
  if (!order.value || isUpdatingStatus.value) return
  if (orderStore.statusValuesMatch(order.value.status, String(newStatus))) return

  isUpdatingStatus.value = true
  await orderStore.updateOrderStatus(order.value.apiId, String(newStatus))
  isUpdatingStatus.value = false
}

async function deleteCurrentOrder(): Promise<void> {
  if (!order.value || isDeleting.value) return
  if (!canDeleteCurrentOrder.value) return

  const shouldDelete = window.confirm(`Delete order ${order.value.id}? This cannot be undone.`)
  if (!shouldDelete) return

  isDeleting.value = true
  const deleted = await orderStore.deleteOrder(order.value.apiId)
  isDeleting.value = false

  if (deleted) {
    router.push({ name: 'admin-orders' })
  }
}

watch(() => route.params.id, () => {
  void loadOrder()
})

onMounted(() => {
  void loadOrder()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <button @click="router.back()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Order Details</h1>
        <p class="text-gray-500">View and manage order information</p>
      </div>
    </div>

    <div v-if="!order" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <p class="text-gray-500">Order not found</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-start justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-900 font-mono">{{ order.id }}</h2>
                <p class="text-sm text-gray-500 mt-1">Invoice: <span class="font-mono">{{ order.invoiceNumber || '-' }}</span></p>
                <p class="text-gray-500 mt-1">{{ new Date(order.createdAt).toLocaleString() }}</p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  :class="order.channel === 'FACEBOOK' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
                  class="px-3 py-1 text-sm font-medium rounded"
                >
                  {{ order.channel }}
                </span>
                <StatusBadge :status="order.status" size="lg" />
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">Order Items</h3>
            </div>
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="item in order.items" :key="`${item.productId}-${item.variantId || item.name}`">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ item.name }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">{{ item.variant || '-' }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900 text-center">{{ item.quantity }}</td>
                  <td class="px-6 py-4 text-sm text-gray-900 text-right">${{ item.price.toFixed(2) }}</td>
                  <td class="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    ${{ (item.price * item.quantity).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="4" class="px-6 py-3 text-sm text-gray-500 text-right">Subtotal</td>
                  <td class="px-6 py-3 text-sm text-gray-900 text-right">${{ order.subtotal.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="px-6 py-3 text-sm text-gray-500 text-right">Shipping</td>
                  <td class="px-6 py-3 text-sm text-gray-900 text-right">
                    {{ order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}` }}
                  </td>
                </tr>
                <tr>
                  <td colspan="4" class="px-6 py-3 text-sm text-gray-500 text-right">Tax</td>
                  <td class="px-6 py-3 text-sm text-gray-900 text-right">${{ order.tax.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="px-6 py-3 text-base font-bold text-gray-900 text-right">Total</td>
                  <td class="px-6 py-3 text-base font-bold text-gray-900 text-right">${{ order.total.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
            <p class="text-gray-700">{{ order.shippingAddress }}</p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Customer</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Name</p>
                <p class="font-medium text-gray-900">{{ order.customerName }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Email</p>
                <p class="font-medium text-gray-900">{{ order.customerEmail || '-' }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Method</p>
                <p class="font-medium text-gray-900">{{ order.paymentMethod }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Amount</p>
                <p class="font-bold text-xl text-gray-900">${{ order.total.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <FormSelect
              :modelValue="order.status"
              :options="availableStatusOptions"
              :disabled="isUpdatingStatus || availableStatusOptions.length === 0"
              @update:modelValue="updateStatus"
            />
            <p class="text-xs text-gray-500 mt-2">
              Last updated: {{ new Date(order.updatedAt).toLocaleString() }}
            </p>
            <p class="text-xs text-gray-500 mt-2">
              <template v-if="nextStatusLabels.length > 0">
                Allowed next statuses: {{ nextStatusLabels.join(', ') }}
              </template>
              <template v-else>
                No further transitions are currently available for this order.
              </template>
            </p>
            <p v-if="order.isLocalOnly" class="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              This order exists only in local fallback state. Status changes will stay in the browser until the sale is created in the API.
            </p>
            <p v-if="orderStore.error" class="mt-3 text-xs text-red-600">
              {{ orderStore.error }}
            </p>
            <button
              :disabled="isDeleting || !canDeleteCurrentOrder"
              class="mt-4 w-full px-3 py-2 text-sm font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
              @click="deleteCurrentOrder"
            >
              {{ isDeleting ? 'Deleting...' : canDeleteCurrentOrder ? 'Delete Order' : 'Delete Disabled (Pending Only)' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
