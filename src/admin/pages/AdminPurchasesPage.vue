<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import StatCard from '@/components/admin/StatCard.vue'
import { useAccountStore } from '@/stores/admin/accountStore'
import { useSupplierStore } from '@/stores/admin/supplierStore'
import { usePurchaseStore } from '@/stores/admin/purchaseStore'
import type { ChartOfAccountList, PurchaseDetail, PurchaseStatus, PurchaseUpdateRequest, SupplierList } from '@/api/types'

interface PurchaseItemForm {
  productId: number
  variantId: number
  sku: string
  quantity: number
  unitCost: number
}

const supplierStore = useSupplierStore()
const accountStore = useAccountStore()
const purchaseStore = usePurchaseStore()

const searchQuery = ref('')
const statusFilter = ref<PurchaseStatus | ''>('')
const showAddModal = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const selectedPurchaseId = ref<number | null>(null)

const variantOptionsMap = ref<Record<number, Array<{ value: number; label: string; sku: string }>>>({})

const newPurchase = ref({
  supplierId: 0,
  accountId: 0,
  purchaseDate: new Date().toISOString().split('T')[0],
  discountAmount: 0,
  taxAmount: 0,
  notes: '',
  items: [{ productId: 0, variantId: 0, sku: '', quantity: 1, unitCost: 0 }] as PurchaseItemForm[]
})

const editForm = ref({
  supplierId: 0,
  accountId: 0,
  purchaseDate: '',
  discountAmount: 0,
  taxAmount: 0,
  notes: '',
  status: 'DRAFT' as PurchaseStatus
})

const columns = [
  { key: 'id', label: 'Purchase ID' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'account', label: 'Account' },
  { key: 'purchase_date', label: 'Date', width: '120px' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'total_amount', label: 'Total', width: '120px' },
  { key: 'actions', label: 'Actions', width: '150px' }
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' }
]

const supplierOptions = computed(() =>
  supplierStore.activeSuppliers.map(supplier => ({
    value: supplier.id,
    label: supplier.name
  }))
)

const accountOptions = computed(() =>
  accountStore.accountOptions.map(account => ({
    value: account.id,
    label: `${account.code} - ${account.name}`
  }))
)

const productOptions = computed(() => purchaseStore.productOptions)

const getSupplierId = (supplier: SupplierList | number | null | undefined) => {
  if (typeof supplier === 'number') return supplier
  return supplier?.id || 0
}

const getSupplierName = (supplier: SupplierList | number | null | undefined) => {
  if (typeof supplier === 'number') {
    return supplierStore.activeSuppliers.find(item => item.id === supplier)?.name || `Supplier #${supplier}`
  }
  return supplier?.name || '-'
}

const getPurchaseAccountId = (purchase: Pick<PurchaseDetail, 'account_id' | 'account'> | null | undefined) => {
  if (!purchase) return 0
  if (typeof purchase.account_id === 'number') return purchase.account_id
  if (typeof purchase.account === 'number') return purchase.account
  return purchase.account?.id || 0
}

const getAccountLabelById = (accountId: number) => {
  if (!accountId) return '-'
  const account = accountStore.accountOptions.find((item: ChartOfAccountList) => item.id === accountId)
  return account ? `${account.code} - ${account.name}` : `Account #${accountId}`
}

const canSubmitCreatePurchase = computed(() => {
  const supplierId = Number(newPurchase.value.supplierId)
  const accountId = Number(newPurchase.value.accountId)
  if (!supplierId || !accountId || !newPurchase.value.purchaseDate) return false

  return newPurchase.value.items.some(item =>
    Number(item.variantId) > 0 && Number(item.quantity) > 0 && Number(item.unitCost) >= 0
  )
})

const filteredPurchases = computed(() => {
  let result = purchaseStore.purchases
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(purchase =>
      String(purchase.id).includes(query) ||
      getSupplierName(purchase.supplier).toLowerCase().includes(query) ||
      getAccountLabelById(getPurchaseAccountId(purchase)).toLowerCase().includes(query)
    )
  }
  return result
})

const createSubtotal = computed(() => {
  return newPurchase.value.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
})

const createTotal = computed(() => {
  return createSubtotal.value - newPurchase.value.discountAmount + newPurchase.value.taxAmount
})

const resetCreateForm = () => {
  newPurchase.value = {
    supplierId: 0,
    accountId: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    discountAmount: 0,
    taxAmount: 0,
    notes: '',
    items: [{ productId: 0, variantId: 0, sku: '', quantity: 1, unitCost: 0 }]
  }
  variantOptionsMap.value = {}
}

const fetchPurchaseList = (page = 1) => {
  purchaseStore.fetchPurchases({
    page,
    status: statusFilter.value || undefined
  })
}

const openAddModal = () => {
  resetCreateForm()
  showAddModal.value = true
}

const addItem = () => {
  newPurchase.value.items.push({ productId: 0, variantId: 0, sku: '', quantity: 1, unitCost: 0 })
}

const removeItem = (index: number) => {
  if (newPurchase.value.items.length > 1) {
    newPurchase.value.items.splice(index, 1)
    delete variantOptionsMap.value[index]
  }
}

const onProductSelect = async (index: number) => {
  const productId = Number(newPurchase.value.items[index].productId)
  if (!productId) return

  await purchaseStore.fetchVariantOptions(productId)
  variantOptionsMap.value[index] = [...purchaseStore.variantOptions]
  newPurchase.value.items[index].variantId = 0
  newPurchase.value.items[index].sku = ''
}

const onVariantSelect = (index: number) => {
  const options = variantOptionsMap.value[index] || []
  const selected = options.find(option => Number(option.value) === Number(newPurchase.value.items[index].variantId))
  if (selected) {
    newPurchase.value.items[index].sku = selected.sku
  }
}

const handleCreatePurchase = async () => {
  const supplierId = Number(newPurchase.value.supplierId)
  const accountId = Number(newPurchase.value.accountId)
  if (!supplierId || !accountId || !newPurchase.value.purchaseDate) return

  const validItems = newPurchase.value.items.filter(item => Number(item.variantId) > 0 && Number(item.quantity) > 0)
  if (validItems.length === 0) return

  const success = await purchaseStore.createPurchase({
    supplier: supplierId,
    account_id: accountId,
    purchase_date: newPurchase.value.purchaseDate,
    discount_amount: String(newPurchase.value.discountAmount || 0),
    tax_amount: String(newPurchase.value.taxAmount || 0),
    notes: newPurchase.value.notes || null,
    items: validItems.map(item => ({
      product_variant_id: Number(item.variantId),
      quantity: item.quantity,
      unit_cost: String(item.unitCost)
    }))
  })

  if (success) {
    showAddModal.value = false
    fetchPurchaseList(1)
  }
}

const openPurchaseDetail = async (row: { id: number }) => {
  selectedPurchaseId.value = row.id
  const detail = await purchaseStore.fetchPurchaseDetail(row.id)
  if (!detail) return

  editForm.value = {
    supplierId: getSupplierId(detail.supplier),
    accountId: getPurchaseAccountId(detail),
    purchaseDate: detail.purchase_date,
    discountAmount: Number(detail.discount_amount || 0),
    taxAmount: Number(detail.tax_amount || 0),
    notes: detail.notes || '',
    status: detail.status
  }
  showDetailModal.value = true
}

const buildStatusPayload = () => {
  if (!purchaseStore.currentPurchase) return null

  const supplierId = Number(editForm.value.supplierId)
  const accountId = Number(editForm.value.accountId)
  if (!supplierId || !accountId || !editForm.value.purchaseDate) return null

  return {
    supplier: supplierId,
    account_id: accountId,
    purchase_date: editForm.value.purchaseDate,
    discount_amount: String(editForm.value.discountAmount || 0),
    tax_amount: String(editForm.value.taxAmount || 0),
    notes: editForm.value.notes || null,
    items: purchaseStore.currentPurchase.items.map(item => ({
      product_variant_id: item.product_variant.id,
      quantity: item.quantity,
      unit_cost: item.unit_cost
    }))
  }
}

const handleUpdatePurchase = async () => {
  if (!selectedPurchaseId.value || !purchaseStore.currentPurchase) return

  const nextSupplierId = Number(editForm.value.supplierId)
  const nextAccountId = Number(editForm.value.accountId)
  if (!nextSupplierId || !nextAccountId || !editForm.value.purchaseDate) return

  const current = purchaseStore.currentPurchase
  const payload: PurchaseUpdateRequest = {}
  const currentSupplierId = getSupplierId(current.supplier)
  const currentAccountId = getPurchaseAccountId(current)

  if (nextSupplierId !== currentSupplierId) payload.supplier = nextSupplierId
  if (nextAccountId !== currentAccountId) payload.account_id = nextAccountId
  if (editForm.value.purchaseDate !== current.purchase_date) payload.purchase_date = editForm.value.purchaseDate
  if (String(editForm.value.discountAmount) !== String(current.discount_amount || 0)) {
    payload.discount_amount = String(editForm.value.discountAmount || 0)
  }
  if (String(editForm.value.taxAmount) !== String(current.tax_amount || 0)) {
    payload.tax_amount = String(editForm.value.taxAmount || 0)
  }
  if ((editForm.value.notes || null) !== (current.notes || null)) {
    payload.notes = editForm.value.notes || null
  }

  let success = true
  if (Object.keys(payload).length > 0) {
    success = await purchaseStore.updatePurchase(selectedPurchaseId.value, payload)
  }

  if (success) {
    showDetailModal.value = false
    fetchPurchaseList(purchaseStore.pagination.page)
  }
}

const handleConfirmPurchase = async () => {
  if (!selectedPurchaseId.value) return
  const statusPayload = buildStatusPayload()
  if (!statusPayload) return

  const success = await purchaseStore.confirmPurchase(selectedPurchaseId.value, statusPayload)
  if (success && purchaseStore.currentPurchase) {
    editForm.value.status = purchaseStore.currentPurchase.status
    fetchPurchaseList(purchaseStore.pagination.page)
  }
}

const handleCancelPurchase = async () => {
  if (!selectedPurchaseId.value) return
  const statusPayload = buildStatusPayload()
  if (!statusPayload) return

  const success = await purchaseStore.cancelPurchase(selectedPurchaseId.value, statusPayload)
  if (success && purchaseStore.currentPurchase) {
    editForm.value.status = purchaseStore.currentPurchase.status
    fetchPurchaseList(purchaseStore.pagination.page)
  }
}

const openDeleteModal = (id: number) => {
  selectedPurchaseId.value = id
  showDeleteModal.value = true
}

const handleDeletePurchase = async () => {
  if (!selectedPurchaseId.value) return
  const success = await purchaseStore.deletePurchase(selectedPurchaseId.value)
  if (success) {
    showDeleteModal.value = false
    fetchPurchaseList(purchaseStore.pagination.page)
  }
}

const handlePageChange = (page: number) => {
  fetchPurchaseList(page)
}

onMounted(async () => {
  await Promise.all([
    accountStore.fetchAccountOptions(),
    supplierStore.fetchSuppliers({ page_size: 100 }),
    purchaseStore.fetchProductOptions(),
    purchaseStore.fetchPurchases()
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <p class="text-gray-500 mt-1">Manage purchase lifecycle with backend APIs</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Purchase
      </button>
    </div>

    <div v-if="purchaseStore.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      {{ purchaseStore.error }}
      <button @click="purchaseStore.clearError" class="ml-2 underline">Dismiss</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Total Purchases" :value="purchaseStore.totalPurchases" icon="file" color="blue" />
      <StatCard title="Draft" :value="purchaseStore.pendingPurchases" icon="clock" color="yellow" />
      <StatCard title="Confirmed" :value="purchaseStore.confirmedPurchases" icon="check" color="green" />
      <StatCard title="Page Total" :value="`৳${purchaseStore.pageTotalAmount.toLocaleString()}`" icon="bdt" color="purple" />
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-64">
          <FormInput v-model="searchQuery" placeholder="Search purchases..." />
        </div>
        <div class="w-48">
          <FormSelect v-model="statusFilter" :options="statusOptions" @update:model-value="fetchPurchaseList(1)" />
        </div>
        <div class="text-sm text-gray-500">{{ filteredPurchases.length }} purchases</div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredPurchases"
      :loading="purchaseStore.loading"
      @row-click="openPurchaseDetail"
    >
      <template #id="{ value }">
        <span class="font-mono font-medium text-primary-600">PO-{{ value }}</span>
      </template>
      <template #supplier="{ value }">
        {{ getSupplierName(value) }}
      </template>
      <template #account="{ row }">
        {{ getAccountLabelById(getPurchaseAccountId(row)) }}
      </template>
      <template #purchase_date="{ value }">
        {{ value ? new Date(value).toLocaleDateString() : '-' }}
      </template>
      <template #status="{ value }">
        <StatusBadge :status="value?.toLowerCase() || 'unknown'" />
      </template>
      <template #total_amount="{ value }">
        <span class="font-medium">৳{{ Number(value || 0).toFixed(2) }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="openPurchaseDetail(row)"
            class="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
          >
            Edit
          </button>
          <button
            @click.stop="openDeleteModal(row.id)"
            class="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </template>
    </DataTable>

    <div v-if="purchaseStore.pagination.count > purchaseStore.pagination.pageSize" class="flex justify-center gap-2">
      <button
        :disabled="!purchaseStore.pagination.hasPrevious"
        @click="handlePageChange(purchaseStore.pagination.page - 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span class="px-3 py-1">
        Page {{ purchaseStore.pagination.page }} of {{ Math.ceil(purchaseStore.pagination.count / purchaseStore.pagination.pageSize) }}
      </span>
      <button
        :disabled="!purchaseStore.pagination.hasNext"
        @click="handlePageChange(purchaseStore.pagination.page + 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>

    <FormModal
      :show="showAddModal"
      title="Create Purchase"
      size="lg"
      @close="showAddModal = false"
      @submit="handleCreatePurchase"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormSelect v-model="newPurchase.supplierId" label="Supplier" :options="supplierOptions" placeholder="Select supplier" />
          <FormSelect v-model="newPurchase.accountId" label="Account" :options="accountOptions" placeholder="Select account" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="newPurchase.purchaseDate" type="date" label="Purchase Date" />
          <div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            Invoice number will be generated automatically after purchase creation.
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model.number="newPurchase.discountAmount" type="number" step="0.01" label="Discount" />
          <FormInput v-model.number="newPurchase.taxAmount" type="number" step="0.01" label="Tax" />
        </div>

        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900">Items</h4>
            <button type="button" @click="addItem" class="text-sm text-primary-600 hover:text-primary-700 font-medium">+ Add Item</button>
          </div>
          <div v-for="(item, index) in newPurchase.items" :key="index" class="p-3 bg-gray-50 rounded-lg mb-2">
            <div class="grid grid-cols-5 gap-3 items-end">
              <FormSelect
                v-model="item.productId"
                :options="productOptions"
                placeholder="Product"
                @update:model-value="onProductSelect(index)"
              />
              <FormSelect
                v-model="item.variantId"
                :options="variantOptionsMap[index] || []"
                placeholder="Variant"
                :disabled="!item.productId"
                @update:model-value="onVariantSelect(index)"
              />
              <FormInput v-model.number="item.quantity" type="number" min="1" placeholder="Qty" />
              <FormInput v-model.number="item.unitCost" type="number" step="0.01" placeholder="Unit Cost" />
              <button type="button" @click="removeItem(index)" class="px-2 py-2 text-red-600 hover:text-red-700">Remove</button>
            </div>
          </div>
          <div class="text-right mt-3 space-y-1 text-sm">
            <div class="text-gray-600">Subtotal: ৳{{ createSubtotal.toFixed(2) }}</div>
            <div class="font-bold text-gray-900">Total: ৳{{ createTotal.toFixed(2) }}</div>
          </div>
        </div>

        <FormInput v-model="newPurchase.notes" label="Notes" placeholder="Optional notes..." />
      </div>
      <template #actions>
        <button
          type="button"
          @click="showAddModal = false"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="!canSubmitCreatePurchase || purchaseStore.loading"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </template>
    </FormModal>

    <FormModal
      :show="showDetailModal"
      :title="selectedPurchaseId ? `Purchase #${selectedPurchaseId}` : 'Purchase Detail'"
      size="lg"
      @close="showDetailModal = false"
      @submit="handleUpdatePurchase"
    >
      <div v-if="purchaseStore.currentPurchase" class="space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <FormSelect v-model="editForm.supplierId" label="Supplier" :options="supplierOptions" placeholder="Select supplier" />
          <FormSelect v-model="editForm.accountId" label="Account" :options="accountOptions" placeholder="Select account" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="editForm.purchaseDate" type="date" label="Purchase Date" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
            <div class="h-10 px-3 border border-gray-300 rounded-lg flex items-center bg-gray-50 text-sm text-gray-700">
              {{ purchaseStore.currentPurchase.invoice_number || 'Generated by backend after creation' }}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model.number="editForm.discountAmount" type="number" step="0.01" label="Discount" />
          <FormInput v-model.number="editForm.taxAmount" type="number" step="0.01" label="Tax" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="editForm.notes" label="Notes" />
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div class="h-10 px-3 border border-gray-300 rounded-lg flex items-center">
              <StatusBadge :status="editForm.status.toLowerCase()" />
            </div>
          </div>
        </div>

        <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div class="text-sm font-medium text-gray-700 mb-2">Status Actions</div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              :disabled="editForm.status !== 'DRAFT' || purchaseStore.loading || !editForm.accountId"
              @click="handleConfirmPurchase"
            >
              Confirm Purchase
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              :disabled="editForm.status === 'CANCELLED' || purchaseStore.loading || !editForm.accountId"
              @click="handleCancelPurchase"
            >
              Cancel Purchase
            </button>
          </div>
        </div>

        <div>
          <h4 class="font-medium text-gray-900 mb-2">Items</h4>
          <div class="bg-gray-50 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Variant</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Line Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in purchaseStore.currentPurchase.items" :key="item.id" class="border-t border-gray-200">
                  <td class="px-4 py-2">{{ item.product_variant.sku }}</td>
                  <td class="px-4 py-2">{{ item.product_variant.color || '-' }} / {{ item.product_variant.size || '-' }}</td>
                  <td class="px-4 py-2 text-right">{{ item.quantity }}</td>
                  <td class="px-4 py-2 text-right">৳{{ Number(item.unit_cost).toFixed(2) }}</td>
                  <td class="px-4 py-2 text-right font-medium">৳{{ Number(item.line_total).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FormModal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Purchase"
      :message="`Are you sure you want to delete purchase #${selectedPurchaseId || ''}?`"
      confirm-text="Delete"
      @confirm="handleDeletePurchase"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
