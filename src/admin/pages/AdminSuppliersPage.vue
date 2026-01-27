<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import StatCard from '@/components/admin/StatCard.vue'
import { useSupplierStore } from '@/stores/admin/supplierStore'

const supplierStore = useSupplierStore()

const searchQuery = ref('')
const statusFilter = ref('')
const showAddModal = ref(false)
const showDetailModal = ref(false)
const selectedSupplier = ref<typeof supplierStore.suppliers[0] | null>(null)

const newSupplier = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  contactPerson: '',
  category: '',
  paymentTerms: 'COD',
  notes: ''
})

const columns = [
  { key: 'name', label: 'Supplier Name' },
  { key: 'contactPerson', label: 'Contact', width: '150px' },
  { key: 'phone', label: 'Phone', width: '140px' },
  { key: 'category', label: 'Category', width: '120px' },
  { key: 'totalOrders', label: 'Orders', width: '80px' },
  { key: 'totalSpent', label: 'Total Spent', width: '120px' },
  { key: 'status', label: 'Status', width: '100px' }
]

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
]

const categoryOptions = [
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Footwear', label: 'Footwear' },
  { value: 'General', label: 'General' }
]

const paymentTermsOptions = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'Net 15', label: 'Net 15 Days' },
  { value: 'Net 30', label: 'Net 30 Days' },
  { value: 'Net 45', label: 'Net 45 Days' },
  { value: 'Prepaid', label: 'Prepaid' }
]

const filteredSuppliers = computed(() => {
  let result = supplierStore.suppliers
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.contactPerson.toLowerCase().includes(query)
    )
  }
  if (statusFilter.value) {
    result = result.filter(s => s.status === statusFilter.value)
  }
  return result
})

const openAddModal = () => {
  newSupplier.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    category: '',
    paymentTerms: 'COD',
    notes: ''
  }
  showAddModal.value = true
}

const handleAddSupplier = () => {
  if (!newSupplier.value.name) return
  supplierStore.addSupplier(newSupplier.value)
  showAddModal.value = false
}

const handleRowClick = (supplier: typeof supplierStore.suppliers[0]) => {
  selectedSupplier.value = supplier
  showDetailModal.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Suppliers</h1>
        <p class="text-gray-500 mt-1">Manage your vendors and suppliers</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Supplier
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Suppliers"
        :value="supplierStore.totalSuppliers"
        icon="users"
        color="blue"
      />
      <StatCard
        title="Active Suppliers"
        :value="supplierStore.activeSuppliers.length"
        icon="check"
        color="green"
      />
      <StatCard
        title="Pending Orders"
        :value="supplierStore.pendingPurchaseOrders.length"
        icon="clock"
        color="yellow"
      />
      <StatCard
        title="Total Purchase Value"
        :value="`$${supplierStore.totalPurchaseValue.toLocaleString()}`"
        icon="dollar"
        color="purple"
      />
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-64">
          <FormInput
            v-model="searchQuery"
            placeholder="Search suppliers..."
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
          {{ filteredSuppliers.length }} suppliers
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredSuppliers"
      :loading="supplierStore.loading"
      @row-click="handleRowClick"
    >
      <template #name="{ row }">
        <div>
          <div class="font-medium text-gray-900">{{ row.name }}</div>
          <div class="text-xs text-gray-500">{{ row.email }}</div>
        </div>
      </template>
      <template #totalSpent="{ value }">
        <span class="font-medium">${{ value.toLocaleString() }}</span>
      </template>
      <template #status="{ value }">
        <StatusBadge :status="value" />
      </template>
    </DataTable>

    <FormModal
      :show="showAddModal"
      title="Add New Supplier"
      @close="showAddModal = false"
      @submit="handleAddSupplier"
    >
      <div class="space-y-4">
        <FormInput v-model="newSupplier.name" label="Supplier Name" placeholder="Company name" required />
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="newSupplier.contactPerson" label="Contact Person" placeholder="Contact name" />
          <FormInput v-model="newSupplier.phone" label="Phone" placeholder="Phone number" />
        </div>
        <FormInput v-model="newSupplier.email" label="Email" type="email" placeholder="Email address" />
        <FormInput v-model="newSupplier.address" label="Address" placeholder="Business address" />
        <div class="grid grid-cols-2 gap-4">
          <FormSelect v-model="newSupplier.category" label="Category" :options="categoryOptions" />
          <FormSelect v-model="newSupplier.paymentTerms" label="Payment Terms" :options="paymentTermsOptions" />
        </div>
        <FormInput v-model="newSupplier.notes" label="Notes" placeholder="Additional notes..." />
      </div>
    </FormModal>

    <FormModal
      :show="showDetailModal"
      :title="selectedSupplier?.name || 'Supplier Details'"
      size="lg"
      @close="showDetailModal = false"
    >
      <div v-if="selectedSupplier" class="space-y-6">
        <div class="grid grid-cols-2 gap-6">
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Contact Information</h3>
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-500">Contact:</span> {{ selectedSupplier.contactPerson }}</div>
              <div><span class="text-gray-500">Email:</span> {{ selectedSupplier.email }}</div>
              <div><span class="text-gray-500">Phone:</span> {{ selectedSupplier.phone }}</div>
              <div><span class="text-gray-500">Address:</span> {{ selectedSupplier.address }}</div>
            </div>
          </div>
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Business Details</h3>
            <div class="space-y-2 text-sm">
              <div><span class="text-gray-500">Category:</span> {{ selectedSupplier.category }}</div>
              <div><span class="text-gray-500">Payment Terms:</span> {{ selectedSupplier.paymentTerms }}</div>
              <div><span class="text-gray-500">Total Orders:</span> {{ selectedSupplier.totalOrders }}</div>
              <div><span class="text-gray-500">Total Spent:</span> ${{ selectedSupplier.totalSpent.toLocaleString() }}</div>
            </div>
          </div>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-2">Notes</h3>
          <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{{ selectedSupplier.notes || 'No notes' }}</p>
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
