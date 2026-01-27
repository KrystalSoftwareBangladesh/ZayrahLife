<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import StatCard from '@/components/admin/StatCard.vue'
import { useSupplierStore } from '@/stores/admin/supplierStore'
import { useInventoryStore } from '@/stores/admin/inventoryStore'

const supplierStore = useSupplierStore()
const inventoryStore = useInventoryStore()

const searchQuery = ref('')
const statusFilter = ref('')
const showAddModal = ref(false)
const showDetailModal = ref(false)
const selectedPO = ref<typeof supplierStore.purchaseOrders[0] | null>(null)

interface POItem {
  productId: number
  productName: string
  quantity: number
  unitCost: number
  total: number
}

const newPO = ref({
  supplierId: 0,
  supplierName: '',
  expectedDate: '',
  notes: '',
  items: [{ productId: 0, productName: '', quantity: 1, unitCost: 0, total: 0 }] as POItem[]
})

const columns = [
  { key: 'id', label: 'PO Number' },
  { key: 'supplierName', label: 'Supplier' },
  { key: 'items', label: 'Items', width: '80px' },
  { key: 'total', label: 'Total', width: '120px' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'paymentStatus', label: 'Payment', width: '120px' },
  { key: 'orderDate', label: 'Order Date', width: '120px' }
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' }
]

const supplierOptions = computed(() => {
  return supplierStore.activeSuppliers.map(s => ({
    value: s.id,
    label: s.name
  }))
})

const productOptions = computed(() => {
  return inventoryStore.inventory.map(p => ({
    value: p.productId,
    label: p.productName,
    cost: p.cost
  }))
})

const filteredPurchaseOrders = computed(() => {
  let result = supplierStore.purchaseOrders
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(po =>
      po.id.toLowerCase().includes(query) ||
      po.supplierName.toLowerCase().includes(query)
    )
  }
  if (statusFilter.value) {
    result = result.filter(po => po.status === statusFilter.value)
  }
  return result
})

const poSubtotal = computed(() => {
  return newPO.value.items.reduce((sum, item) => sum + item.total, 0)
})

const poTax = computed(() => poSubtotal.value * 0.05)
const poTotal = computed(() => poSubtotal.value + poTax.value)

const pendingValue = computed(() => {
  return supplierStore.pendingPurchaseOrders.reduce((sum, po) => sum + po.total, 0)
})

const unpaidValue = computed(() => {
  return supplierStore.unpaidPurchaseOrders.reduce((sum, po) => sum + po.total, 0)
})

const openAddModal = () => {
  newPO.value = {
    supplierId: 0,
    supplierName: '',
    expectedDate: '',
    notes: '',
    items: [{ productId: 0, productName: '', quantity: 1, unitCost: 0, total: 0 }]
  }
  showAddModal.value = true
}

const onSupplierSelect = () => {
  const supplier = supplierStore.suppliers.find(s => s.id === newPO.value.supplierId)
  if (supplier) {
    newPO.value.supplierName = supplier.name
  }
}

const onProductSelect = (index: number) => {
  const product = inventoryStore.inventory.find(p => p.productId === newPO.value.items[index].productId)
  if (product) {
    newPO.value.items[index].productName = product.productName
    newPO.value.items[index].unitCost = product.cost
    updateItemTotal(index)
  }
}

const updateItemTotal = (index: number) => {
  const item = newPO.value.items[index]
  item.total = item.quantity * item.unitCost
}

const addPOItem = () => {
  newPO.value.items.push({ productId: 0, productName: '', quantity: 1, unitCost: 0, total: 0 })
}

const removePOItem = (index: number) => {
  if (newPO.value.items.length > 1) {
    newPO.value.items.splice(index, 1)
  }
}

const handleAddPO = () => {
  if (!newPO.value.supplierId) return
  const validItems = newPO.value.items.filter(item => item.productId > 0 && item.quantity > 0)
  if (validItems.length === 0) return
  
  supplierStore.addPurchaseOrder({
    supplierId: newPO.value.supplierId,
    supplierName: newPO.value.supplierName,
    items: validItems,
    subtotal: poSubtotal.value,
    tax: poTax.value,
    shipping: 0,
    total: poTotal.value,
    expectedDate: newPO.value.expectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: newPO.value.notes
  })
  showAddModal.value = false
}

const handleRowClick = (po: typeof supplierStore.purchaseOrders[0]) => {
  selectedPO.value = po
  showDetailModal.value = true
}

const updateStatus = (status: string) => {
  if (selectedPO.value) {
    supplierStore.updatePurchaseOrderStatus(selectedPO.value.id, status)
  }
}

const updatePayment = (paymentStatus: string) => {
  if (selectedPO.value) {
    supplierStore.updatePaymentStatus(selectedPO.value.id, paymentStatus)
  }
}

const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    unpaid: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <p class="text-gray-500 mt-1">Manage inventory purchases from suppliers</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Purchase Order
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Purchase Orders"
        :value="supplierStore.purchaseOrders.length"
        icon="file"
        color="blue"
      />
      <StatCard
        title="Pending Orders"
        :value="supplierStore.pendingPurchaseOrders.length"
        icon="clock"
        color="yellow"
      />
      <StatCard
        title="Pending Value"
        :value="`$${pendingValue.toLocaleString()}`"
        icon="dollar"
        color="purple"
      />
      <StatCard
        title="Unpaid Amount"
        :value="`$${unpaidValue.toLocaleString()}`"
        icon="alert"
        color="red"
      />
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-64">
          <FormInput
            v-model="searchQuery"
            placeholder="Search purchase orders..."
          />
        </div>
        <div class="w-40">
          <FormSelect
            v-model="statusFilter"
            :options="statusOptions"
            placeholder="All Statuses"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ filteredPurchaseOrders.length }} orders
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredPurchaseOrders"
      :loading="supplierStore.loading"
      @row-click="handleRowClick"
    >
      <template #id="{ value }">
        <span class="font-mono font-medium text-primary-600">{{ value }}</span>
      </template>
      <template #items="{ row }">
        {{ row.items.length }}
      </template>
      <template #total="{ value }">
        <span class="font-medium">${{ value.toLocaleString() }}</span>
      </template>
      <template #status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #paymentStatus="{ value }">
        <span :class="[getPaymentStatusColor(value), 'px-2 py-1 text-xs font-medium rounded capitalize']">
          {{ value }}
        </span>
      </template>
      <template #orderDate="{ value }">
        {{ new Date(value).toLocaleDateString() }}
      </template>
    </DataTable>

    <FormModal
      :show="showAddModal"
      title="Create Purchase Order"
      size="lg"
      @close="showAddModal = false"
      @submit="handleAddPO"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormSelect
            v-model="newPO.supplierId"
            label="Supplier"
            :options="supplierOptions"
            placeholder="Select supplier"
            @update:model-value="onSupplierSelect"
          />
          <FormInput
            v-model="newPO.expectedDate"
            type="date"
            label="Expected Delivery Date"
          />
        </div>

        <div class="border-t pt-4 mt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">Order Items</h4>
            <button
              type="button"
              @click="addPOItem"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Item
            </button>
          </div>
          <div v-for="(item, index) in newPO.items" :key="index" class="p-3 bg-gray-50 rounded-lg mb-2">
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
                  @update:model-value="updateItemTotal(index)"
                />
                <FormInput
                  v-model.number="item.unitCost"
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  @update:model-value="updateItemTotal(index)"
                />
              </div>
              <div class="text-right min-w-[80px] pt-2">
                <span class="font-medium">${{ item.total.toFixed(2) }}</span>
              </div>
              <button
                v-if="newPO.items.length > 1"
                type="button"
                @click="removePOItem(index)"
                class="p-1 text-red-500 hover:text-red-700 mt-1"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <div class="text-right mt-3 space-y-1 text-sm">
            <div class="text-gray-600">Subtotal: ${{ poSubtotal.toFixed(2) }}</div>
            <div class="text-gray-600">Tax (5%): ${{ poTax.toFixed(2) }}</div>
            <div class="font-bold text-gray-900">Total: ${{ poTotal.toFixed(2) }}</div>
          </div>
        </div>

        <FormInput
          v-model="newPO.notes"
          label="Notes"
          placeholder="Add any notes for this order..."
        />
      </div>
    </FormModal>

    <FormModal
      :show="showDetailModal"
      :title="selectedPO?.id || 'Purchase Order Details'"
      size="lg"
      @close="showDetailModal = false"
    >
      <div v-if="selectedPO" class="space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Order Information</h3>
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-500">Supplier:</span> {{ selectedPO.supplierName }}</div>
              <div><span class="text-gray-500">Order Date:</span> {{ new Date(selectedPO.orderDate).toLocaleDateString() }}</div>
              <div><span class="text-gray-500">Expected:</span> {{ new Date(selectedPO.expectedDate).toLocaleDateString() }}</div>
              <div v-if="selectedPO.receivedDate"><span class="text-gray-500">Received:</span> {{ new Date(selectedPO.receivedDate).toLocaleDateString() }}</div>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <div class="space-y-3">
              <div>
                <label class="text-xs text-gray-500 block mb-1">Order Status</label>
                <select
                  :value="selectedPO.status"
                  @change="updateStatus(($event.target as HTMLSelectElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-500 block mb-1">Payment Status</label>
                <select
                  :value="selectedPO.paymentStatus"
                  @change="updatePayment(($event.target as HTMLSelectElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-2">Items</h3>
          <div class="bg-gray-50 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedPO.items" :key="item.productId" class="border-t border-gray-200">
                  <td class="px-4 py-2">{{ item.productName }}</td>
                  <td class="px-4 py-2 text-right">{{ item.quantity }}</td>
                  <td class="px-4 py-2 text-right">${{ item.unitCost.toFixed(2) }}</td>
                  <td class="px-4 py-2 text-right font-medium">${{ item.total.toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-100">
                <tr>
                  <td colspan="3" class="px-4 py-2 text-right text-gray-500">Subtotal</td>
                  <td class="px-4 py-2 text-right font-medium">${{ selectedPO.subtotal.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td colspan="3" class="px-4 py-2 text-right text-gray-500">Tax</td>
                  <td class="px-4 py-2 text-right">${{ selectedPO.tax.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td colspan="3" class="px-4 py-2 text-right font-bold">Total</td>
                  <td class="px-4 py-2 text-right font-bold text-primary-600">${{ selectedPO.total.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div v-if="selectedPO.notes">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Notes</h3>
          <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{{ selectedPO.notes }}</p>
        </div>
      </div>
      <template #footer>
        <button
          @click="showDetailModal = false"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </template>
    </FormModal>
  </div>
</template>
