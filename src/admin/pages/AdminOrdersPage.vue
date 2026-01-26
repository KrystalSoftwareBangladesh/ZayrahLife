<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import { useOrderStore } from '@/stores/admin/orderStore'
import { useCustomerStore } from '@/stores/admin/customerStore'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

const router = useRouter()
const orderStore = useOrderStore()
const customerStore = useCustomerStore()
const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const statusFilter = ref('')
const channelFilter = ref('')
const showAddModal = ref(false)

const newOrder = ref({
  customerId: 0,
  customerName: '',
  customerEmail: '',
  channel: 'WEBSITE',
  shippingAddress: '',
  notes: '',
  items: [{ productId: 0, productName: '', quantity: 1, price: 0, variant: '' }]
})

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

const orderChannelOptions = [
  { value: 'WEBSITE', label: 'Website' },
  { value: 'FACEBOOK', label: 'Facebook' }
]

const customerOptions = computed(() => {
  return customerStore.customers.map(c => ({
    value: c.id,
    label: `${c.name} (${c.email})`
  }))
})

const productOptions = computed(() => {
  return inventoryStore.inventory.map(p => ({
    value: p.productId,
    label: p.productName,
    price: p.price
  }))
})

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

const openAddModal = () => {
  newOrder.value = {
    customerId: 0,
    customerName: '',
    customerEmail: '',
    channel: 'WEBSITE',
    shippingAddress: '',
    notes: '',
    items: [{ productId: 0, productName: '', quantity: 1, price: 0, variant: '' }]
  }
  showAddModal.value = true
}

const onCustomerSelect = () => {
  const customer = customerStore.customers.find(c => c.id === newOrder.value.customerId)
  if (customer) {
    newOrder.value.customerName = customer.name
    newOrder.value.customerEmail = customer.email
    newOrder.value.shippingAddress = customer.address || ''
  }
}

const onProductSelect = (index) => {
  const product = inventoryStore.inventory.find(p => p.productId === newOrder.value.items[index].productId)
  if (product) {
    newOrder.value.items[index].productName = product.productName
    newOrder.value.items[index].price = product.price
  }
}

const addOrderItem = () => {
  newOrder.value.items.push({ productId: 0, productName: '', quantity: 1, price: 0, variant: '' })
}

const removeOrderItem = (index) => {
  if (newOrder.value.items.length > 1) {
    newOrder.value.items.splice(index, 1)
  }
}

const orderSubtotal = computed(() => {
  return newOrder.value.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const handleAddOrder = () => {
  if (!newOrder.value.customerId) return
  const validItems = newOrder.value.items.filter(item => item.productId > 0 && item.quantity > 0)
  if (validItems.length === 0) return
  newOrder.value.items = validItems
  orderStore.addOrder(newOrder.value)
  showAddModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
        <p class="text-gray-500 mt-1">Manage and track customer orders</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Order
      </button>
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

    <FormModal
      :show="showAddModal"
      title="Create New Order"
      size="lg"
      @close="showAddModal = false"
      @submit="handleAddOrder"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormSelect
            v-model="newOrder.customerId"
            label="Customer"
            :options="customerOptions"
            placeholder="Select customer"
            @update:model-value="onCustomerSelect"
          />
          <FormSelect
            v-model="newOrder.channel"
            label="Sales Channel"
            :options="orderChannelOptions"
          />
        </div>
        
        <FormInput
          v-model="newOrder.shippingAddress"
          label="Shipping Address"
          placeholder="Enter shipping address"
        />
        
        <div class="border-t pt-4 mt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">Order Items</h4>
            <button
              type="button"
              @click="addOrderItem"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Item
            </button>
          </div>
          <div v-for="(item, index) in newOrder.items" :key="index" class="p-3 bg-gray-50 rounded-lg mb-2">
            <div class="flex items-start gap-3">
              <div class="flex-1 grid grid-cols-4 gap-3">
                <div class="col-span-2">
                  <FormSelect
                    v-model="item.productId"
                    :options="productOptions"
                    placeholder="Select product"
                    @update:model-value="onProductSelect(index)"
                  />
                </div>
                <FormInput
                  v-model.number="item.quantity"
                  type="number"
                  placeholder="Qty"
                  min="1"
                />
                <FormInput
                  v-model.number="item.price"
                  type="number"
                  step="0.01"
                  placeholder="Price"
                />
              </div>
              <button
                v-if="newOrder.items.length > 1"
                type="button"
                @click="removeOrderItem(index)"
                class="p-1 text-red-500 hover:text-red-700 mt-1"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div class="text-right mt-3 text-sm font-medium text-gray-700">
            Subtotal: ${{ orderSubtotal.toFixed(2) }}
          </div>
        </div>
        
        <FormInput
          v-model="newOrder.notes"
          label="Order Notes"
          placeholder="Add any notes for this order..."
        />
      </div>
    </FormModal>
  </div>
</template>
