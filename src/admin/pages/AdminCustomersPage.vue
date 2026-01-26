<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormModal from '@/components/admin/FormModal.vue'
import { useCustomerStore } from '@/stores/admin/customerStore'

const router = useRouter()
const customerStore = useCustomerStore()

const searchQuery = ref('')
const showAddModal = ref(false)

const newCustomer = ref({
  name: '',
  email: '',
  phone: '',
  address: ''
})

const columns = [
  { key: 'name', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'totalOrders', label: 'Orders', width: '100px' },
  { key: 'totalSpent', label: 'Total Spent', width: '120px' },
  { key: 'status', label: 'Status', width: '100px' },
  { key: 'lastOrderDate', label: 'Last Order', width: '120px' }
]

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customerStore.customers
  const query = searchQuery.value.toLowerCase()
  return customerStore.customers.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.email.toLowerCase().includes(query)
  )
})

const handleRowClick = (customer) => {
  router.push({ name: 'admin-customer-detail', params: { id: customer.id } })
}

const openAddModal = () => {
  newCustomer.value = { name: '', email: '', phone: '', address: '' }
  showAddModal.value = true
}

const handleAddCustomer = () => {
  if (!newCustomer.value.name || !newCustomer.value.email) return
  customerStore.addCustomer(newCustomer.value)
  showAddModal.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Customers</h1>
        <p class="text-gray-500 mt-1">Manage your customer database</p>
      </div>
      <button
        @click="openAddModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Customer
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 max-w-md">
          <FormInput
            v-model="searchQuery"
            placeholder="Search customers..."
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ filteredCustomers.length }} customers
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="filteredCustomers"
      :loading="customerStore.loading"
      @row-click="handleRowClick"
    >
      <template #name="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-sm">
            {{ row.name.charAt(0) }}
          </div>
          <span class="font-medium">{{ row.name }}</span>
        </div>
      </template>
      <template #totalSpent="{ value }">
        ${{ value.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
      </template>
      <template #status="{ value }">
        <StatusBadge :status="value" />
      </template>
      <template #lastOrderDate="{ value }">
        {{ value ? new Date(value).toLocaleDateString() : 'Never' }}
      </template>
    </DataTable>

    <FormModal
      :show="showAddModal"
      title="Add New Customer"
      @close="showAddModal = false"
      @submit="handleAddCustomer"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newCustomer.name"
          label="Full Name"
          placeholder="Enter customer name"
          required
        />
        <FormInput
          v-model="newCustomer.email"
          label="Email Address"
          type="email"
          placeholder="customer@example.com"
          required
        />
        <FormInput
          v-model="newCustomer.phone"
          label="Phone Number"
          placeholder="+1 (555) 123-4567"
        />
        <FormInput
          v-model="newCustomer.address"
          label="Address"
          placeholder="Street address, city, state"
        />
      </div>
    </FormModal>
  </div>
</template>
