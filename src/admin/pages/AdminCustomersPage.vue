<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/admin/DataTable.vue'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import { useCustomerStore } from '@/stores/admin/customerStore'

const router = useRouter()
const customerStore = useCustomerStore()

const searchQuery = ref('')
const showAddModal = ref(false)
const searchTimeout = ref<number | null>(null)

const newCustomer = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  email: '',
  phone: '',
  customer_type: 'POS' as 'POS' | 'FACEBOOK' | 'WEBSITE',
  notes: ''
})

const customerTypeOptions = [
  { value: 'POS', label: 'POS' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'WEBSITE', label: 'Website' }
]

const columns = [
  { key: 'full_name', label: 'Customer' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone', width: '140px' },
  { key: 'customer_type', label: 'Type', width: '100px' },
  { key: 'created_at', label: 'Joined', width: '120px' }
]

onMounted(() => {
  customerStore.fetchCustomers()
})

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  searchTimeout.value = window.setTimeout(() => {
    customerStore.fetchCustomers({ search: searchQuery.value, page: 1 })
  }, 400)
}

const handleRowClick = (customer: { id: number }) => {
  router.push({ name: 'admin-customer-detail', params: { id: customer.id } })
}

const openAddModal = () => {
  newCustomer.value = { 
    first_name: '', 
    middle_name: '',
    last_name: '',
    email: '', 
    phone: '',
    customer_type: 'POS',
    notes: ''
  }
  showAddModal.value = true
}

const handleAddCustomer = async () => {
  if (!newCustomer.value.first_name) return
  
  const result = await customerStore.createCustomer({
    first_name: newCustomer.value.first_name,
    middle_name: newCustomer.value.middle_name || undefined,
    last_name: newCustomer.value.last_name || undefined,
    email: newCustomer.value.email || undefined,
    phone: newCustomer.value.phone || undefined,
    customer_type: newCustomer.value.customer_type,
    notes: newCustomer.value.notes || undefined
  })
  
  if (result) {
    showAddModal.value = false
  }
}

const handlePageChange = (page: number) => {
  customerStore.setPage(page)
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

    <div v-if="customerStore.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      {{ customerStore.error }}
      <button @click="customerStore.clearError" class="ml-2 underline">Dismiss</button>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex items-center gap-4">
        <div class="flex-1 max-w-md">
          <FormInput
            v-model="searchQuery"
            placeholder="Search customers..."
            @input="handleSearch"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ customerStore.pagination.count }} customers
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="customerStore.customers"
      :loading="customerStore.loading"
      @row-click="handleRowClick"
    >
      <template #full_name="{ row }">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium text-sm">
            {{ row.full_name?.charAt(0) || '?' }}
          </div>
          <span class="font-medium">{{ row.full_name }}</span>
        </div>
      </template>
      <template #customer_type="{ value }">
        <StatusBadge :status="value?.toLowerCase() || 'unknown'" />
      </template>
      <template #created_at="{ value }">
        {{ value ? new Date(value).toLocaleDateString() : '-' }}
      </template>
    </DataTable>

    <div v-if="customerStore.pagination.count > customerStore.pagination.pageSize" class="flex justify-center gap-2">
      <button
        :disabled="!customerStore.pagination.hasPrevious"
        @click="handlePageChange(customerStore.pagination.page - 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span class="px-3 py-1">
        Page {{ customerStore.pagination.page }} of {{ Math.ceil(customerStore.pagination.count / customerStore.pagination.pageSize) }}
      </span>
      <button
        :disabled="!customerStore.pagination.hasNext"
        @click="handlePageChange(customerStore.pagination.page + 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>

    <FormModal
      :show="showAddModal"
      title="Add New Customer"
      @close="showAddModal = false"
      @submit="handleAddCustomer"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newCustomer.first_name"
          label="First Name"
          placeholder="Enter first name"
          required
        />
        <FormInput
          v-model="newCustomer.middle_name"
          label="Middle Name"
          placeholder="Enter middle name"
        />
        <FormInput
          v-model="newCustomer.last_name"
          label="Last Name"
          placeholder="Enter last name"
        />
        <FormInput
          v-model="newCustomer.email"
          label="Email Address"
          type="email"
          placeholder="customer@example.com"
        />
        <FormInput
          v-model="newCustomer.phone"
          label="Phone Number"
          placeholder="+1 (555) 123-4567"
        />
        <FormSelect
          v-model="newCustomer.customer_type"
          label="Customer Type"
          :options="customerTypeOptions"
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            v-model="newCustomer.notes"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows="3"
            placeholder="Additional notes..."
          ></textarea>
        </div>
      </div>
    </FormModal>
  </div>
</template>
