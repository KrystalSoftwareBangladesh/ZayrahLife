<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import { useOrderStore } from '@/stores/admin/orderStore'

const router = useRouter()
const orderStore = useOrderStore()

const searchQuery = ref('')
const statusFilter = ref('')
const channelFilter = ref('')

const columns = [
  { key: 'id', label: 'Order ID' },
  { key: 'customerName', label: 'Customer' },
  { key: 'items', label: 'Items', width: '80px' },
  { key: 'total', label: 'Total', width: '120px' },
  { key: 'channel', label: 'Channel', width: '120px' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'createdAt', label: 'Date', width: '120px' }
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
]

const channelOptions = [
  { value: '', label: 'All Channels' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'FACEBOOK', label: 'Facebook' }
]

const filteredOrders = computed(() => {
  let result = orderStore.orders
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(o =>
      o.id.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query)
    )
  }
  if (statusFilter.value) {
    result = result.filter(o => o.status === statusFilter.value)
  }
  if (channelFilter.value) {
    result = result.filter(o => o.channel === channelFilter.value)
  }
  return result
})

const handleRowClick = (order) => {
  router.push({ name: 'admin-order-detail', params: { id: order.id } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
        <p class="text-gray-500 mt-1">Manage and track customer orders</p>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-64">
          <FormInput
            v-model="searchQuery"
            placeholder="Search orders..."
          />
        </div>
        <div class="w-40">
          <FormSelect
            v-model="statusFilter"
            :options="statusOptions"
            placeholder="All Statuses"
          />
        </div>
        <div class="w-40">
          <FormSelect
            v-model="channelFilter"
            :options="channelOptions"
            placeholder="All Channels"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ filteredOrders.length }} orders
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredOrders"
      :loading="orderStore.loading"
      @row-click="handleRowClick"
    >
      <template #id="{ value }">
        <span class="font-mono font-medium text-primary-600">{{ value }}</span>
      </template>
      <template #items="{ row }">
        {{ row.items.length }}
      </template>
      <template #total="{ value }">
        <span class="font-medium">${{ value.toFixed(2) }}</span>
      </template>
      <template #channel="{ value }">
        <span
          :class="value === 'FACEBOOK' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
          class="px-2 py-1 text-xs font-medium rounded"
        >
          {{ value }}
        </span>
      </template>
      <template #status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #createdAt="{ value }">
        {{ new Date(value).toLocaleDateString() }}
      </template>
    </DataTable>
  </div>
</template>
