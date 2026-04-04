<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DataTable from '@/components/admin/DataTable.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import FormModal from '@/components/admin/FormModal.vue'
import ConfirmModal from '@/components/admin/ConfirmModal.vue'
import StatCard from '@/components/admin/StatCard.vue'
import { useSupplierStore } from '@/stores/admin/supplierStore'
import { useCategoryStore } from '@/stores/admin/categoryStore'
import type {
  SupplierDetail,
  SupplierList,
  SupplierPaymentType,
  SupplierUpdateRequest
} from '@/api/types'

interface SupplierForm {
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  notes: string
  payment_type: SupplierPaymentType
  credit_days: string
  category_id: string
}

interface CategoryInlineForm {
  name: string
  slug: string
  description: string
  parent: string
}

const supplierStore = useSupplierStore()
const categoryStore = useCategoryStore()

const searchQuery = ref('')
const paymentTypeFilter = ref<SupplierPaymentType | ''>('')
const searchTimeout = ref<number | null>(null)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showCreateCategoryModal = ref(false)
const showDeleteModal = ref(false)

const selectedSupplier = ref<SupplierList | null>(null)
const selectedSupplierDetail = ref<SupplierDetail | null>(null)

const createForm = ref<SupplierForm>({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  payment_type: 'COD',
  credit_days: '',
  category_id: 'none'
})

const editForm = ref<SupplierForm>({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  payment_type: 'COD',
  credit_days: '',
  category_id: 'none'
})

const createCategoryForm = ref<CategoryInlineForm>({
  name: '',
  slug: '',
  description: '',
  parent: 'none'
})

const columns = [
  { key: 'name', label: 'Supplier Name' },
  { key: 'contact_person', label: 'Contact', width: '170px' },
  { key: 'phone', label: 'Phone', width: '140px' },
  { key: 'payment_type', label: 'Payment Type', width: '120px' },
  { key: 'categories', label: 'Categories', width: '190px' },
  { key: 'actions', label: 'Actions', width: '150px' }
]

const paymentTypeOptions = [
  { value: '', label: 'All Payment Types' },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'PREPAID', label: 'Prepaid' }
]

const createPaymentTypeOptions = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'PREPAID', label: 'Prepaid' }
]

const categoryOptions = computed(() => [
  { value: 'none', label: 'No Category' },
  ...categoryStore.categoryOptions.map(category => ({
    value: String(category.id),
    label: category.name
  }))
])

const hasCategoryOptions = computed(() => categoryStore.categoryOptions.length > 0)

const parentCategoryOptions = computed(() => [
  { value: 'none', label: 'No Parent (Root Category)' },
  ...categoryStore.categoryOptions.map(category => ({
    value: String(category.id),
    label: category.name
  }))
])

const paymentTypeLabel = (value: SupplierPaymentType): string => {
  if (value === 'COD') return 'Cash on Delivery'
  if (value === 'CREDIT') return 'Credit'
  return 'Prepaid'
}

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategoryOptions(),
    supplierStore.fetchSuppliers()
  ])
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})

const fetchSupplierList = (page = 1) => {
  supplierStore.fetchSuppliers({
    page,
    search: searchQuery.value || undefined,
    payment_type: paymentTypeFilter.value || undefined
  })
}

const handleSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = window.setTimeout(() => {
    fetchSupplierList(1)
  }, 400)
}

const handleFilterChange = () => {
  fetchSupplierList(1)
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    payment_type: 'COD',
    credit_days: '',
    category_id: 'none'
  }
}

const openCreateModal = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const resetCreateCategoryForm = () => {
  createCategoryForm.value = {
    name: '',
    slug: '',
    description: '',
    parent: 'none'
  }
}

const openCreateCategoryModal = () => {
  resetCreateCategoryForm()
  categoryStore.clearError()
  showCreateCategoryModal.value = true
}

const openEditModal = async (supplier: SupplierList) => {
  selectedSupplier.value = supplier
  const detail = await supplierStore.getSupplierById(supplier.id)
  if (!detail) return

  selectedSupplierDetail.value = detail
  editForm.value = {
    name: detail.name,
    contact_person: detail.contact_person || '',
    phone: detail.phone || '',
    email: detail.email || '',
    address: detail.address || '',
    notes: detail.notes || '',
    payment_type: detail.payment_type,
    credit_days: detail.credit_days !== null ? String(detail.credit_days) : '',
    category_id: 'none'
  }
  showEditModal.value = true
}

const openDeleteModal = (supplier: SupplierList) => {
  selectedSupplier.value = supplier
  showDeleteModal.value = true
}

const handleCreateSupplier = async () => {
  if (!createForm.value.name.trim()) return

  const success = await supplierStore.createSupplier({
    name: createForm.value.name.trim(),
    contact_person: createForm.value.contact_person.trim() || null,
    phone: createForm.value.phone.trim() || null,
    email: createForm.value.email.trim() || null,
    address: createForm.value.address.trim() || null,
    notes: createForm.value.notes.trim() || null,
    payment_type: createForm.value.payment_type,
    credit_days:
      createForm.value.payment_type === 'CREDIT' && createForm.value.credit_days
        ? Number(createForm.value.credit_days)
        : null,
    categories: createForm.value.category_id !== 'none' ? [Number(createForm.value.category_id)] : []
  })

  if (success) {
    showCreateModal.value = false
    fetchSupplierList(1)
  }
}

const handleCreateCategory = async () => {
  if (!createCategoryForm.value.name.trim()) return

  const created = await categoryStore.createCategory({
    name: createCategoryForm.value.name.trim(),
    slug: createCategoryForm.value.slug.trim() || undefined,
    description: createCategoryForm.value.description.trim() || null,
    parent: createCategoryForm.value.parent === 'none' ? null : Number(createCategoryForm.value.parent)
  })

  if (created) {
    if (showEditModal.value) {
      editForm.value.category_id = String(created.id)
    } else {
      createForm.value.category_id = String(created.id)
    }
    showCreateCategoryModal.value = false
  }
}

const handleUpdateSupplier = async () => {
  if (!selectedSupplier.value || !selectedSupplierDetail.value || !editForm.value.name.trim()) return

  const payload: SupplierUpdateRequest = {}
  const detail = selectedSupplierDetail.value
  const name = editForm.value.name.trim()
  const contactPerson = editForm.value.contact_person.trim() || null
  const phone = editForm.value.phone.trim() || null
  const email = editForm.value.email.trim() || null
  const address = editForm.value.address.trim() || null
  const notes = editForm.value.notes.trim() || null
  const paymentType = editForm.value.payment_type
  const creditDays =
    paymentType === 'CREDIT' && editForm.value.credit_days
      ? Number(editForm.value.credit_days)
      : null

  if (name !== detail.name) payload.name = name
  if (contactPerson !== (detail.contact_person || null)) payload.contact_person = contactPerson
  if (phone !== (detail.phone || null)) payload.phone = phone
  if (email !== (detail.email || null)) payload.email = email
  if (address !== (detail.address || null)) payload.address = address
  if (notes !== (detail.notes || null)) payload.notes = notes
  if (paymentType !== detail.payment_type) payload.payment_type = paymentType
  if (creditDays !== (detail.credit_days ?? null)) payload.credit_days = creditDays
  if (editForm.value.category_id !== 'none') {
    payload.categories = [Number(editForm.value.category_id)]
  }

  if (Object.keys(payload).length === 0) {
    showEditModal.value = false
    return
  }

  const success = await supplierStore.updateSupplier(selectedSupplier.value.id, payload)
  if (success) {
    showEditModal.value = false
    fetchSupplierList(supplierStore.pagination.page)
  }
}

const handleDeleteSupplier = async () => {
  if (!selectedSupplier.value) return

  const success = await supplierStore.deleteSupplier(selectedSupplier.value.id)
  if (success) {
    showDeleteModal.value = false
    selectedSupplier.value = null
    fetchSupplierList(supplierStore.pagination.page)
  }
}

const handlePageChange = (page: number) => {
  fetchSupplierList(page)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Suppliers</h1>
        <p class="text-gray-500 mt-1">Manage suppliers with backend-integrated CRUD</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Supplier
      </button>
    </div>

    <div v-if="supplierStore.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      {{ supplierStore.error }}
      <button @click="supplierStore.clearError" class="ml-2 underline">Dismiss</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatCard title="Total Suppliers" :value="supplierStore.totalSuppliers" icon="users" color="blue" />
      <StatCard title="COD Suppliers" :value="supplierStore.codSuppliers" icon="check" color="green" />
      <StatCard title="Credit Suppliers" :value="supplierStore.creditSuppliers" icon="clock" color="yellow" />
      <StatCard title="Prepaid Suppliers" :value="supplierStore.prepaidSuppliers" icon="bdt" color="purple" />
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-64">
          <FormInput
            v-model="searchQuery"
            placeholder="Search suppliers..."
            @input="handleSearch"
          />
        </div>
        <div class="w-56">
          <FormSelect
            v-model="paymentTypeFilter"
            :options="paymentTypeOptions"
            placeholder="All Payment Types"
            @update:model-value="handleFilterChange"
          />
        </div>
        <div class="text-sm text-gray-500">
          {{ supplierStore.pagination.count }} suppliers
        </div>
      </div>
    </div>

    <DataTable
      :columns="columns"
      :data="supplierStore.suppliers"
      :loading="supplierStore.loading"
      @row-click="openEditModal"
    >
      <template #name="{ row }">
        <div>
          <div class="font-medium text-gray-900">{{ row.name }}</div>
          <div class="text-xs text-gray-500">{{ row.email || '-' }}</div>
        </div>
      </template>
      <template #contact_person="{ value }">
        {{ value || '-' }}
      </template>
      <template #phone="{ value }">
        {{ value || '-' }}
      </template>
      <template #payment_type="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
          {{ paymentTypeLabel(value) }}
        </span>
      </template>
      <template #categories="{ value }">
        <span class="text-sm text-gray-700">{{ value?.length ? value.join(', ') : '-' }}</span>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <button
            @click.stop="openEditModal(row)"
            class="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
          >
            Edit
          </button>
          <button
            @click.stop="openDeleteModal(row)"
            class="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </template>
    </DataTable>

    <div v-if="supplierStore.pagination.count > supplierStore.pagination.pageSize" class="flex justify-center gap-2">
      <button
        :disabled="!supplierStore.pagination.hasPrevious"
        @click="handlePageChange(supplierStore.pagination.page - 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span class="px-3 py-1">
        Page {{ supplierStore.pagination.page }} of {{ Math.ceil(supplierStore.pagination.count / supplierStore.pagination.pageSize) }}
      </span>
      <button
        :disabled="!supplierStore.pagination.hasNext"
        @click="handlePageChange(supplierStore.pagination.page + 1)"
        class="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>

    <FormModal
      :show="showCreateModal"
      title="Create Supplier"
      @close="showCreateModal = false"
      @submit="handleCreateSupplier"
    >
      <div class="space-y-4">
        <FormInput v-model="createForm.name" label="Supplier Name" placeholder="Company name" required />
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="createForm.contact_person" label="Contact Person" placeholder="Contact name" />
          <FormInput v-model="createForm.phone" label="Phone" placeholder="Phone number" />
        </div>
        <FormInput v-model="createForm.email" label="Email" type="email" placeholder="Email address" />
        <FormInput v-model="createForm.address" label="Address" placeholder="Business address" />
        <div class="grid grid-cols-2 gap-4">
          <FormSelect v-model="createForm.payment_type" label="Payment Type" :options="createPaymentTypeOptions" />
          <FormInput
            v-model="createForm.credit_days"
            type="number"
            label="Credit Days"
            placeholder="Only for Credit payment"
            :disabled="createForm.payment_type !== 'CREDIT'"
          />
        </div>
        <FormSelect v-model="createForm.category_id" label="Category" :options="categoryOptions" />
        <div
          v-if="!hasCategoryOptions"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <div class="flex items-center justify-between gap-3">
            <span>No categories found. Add one before assigning a supplier category.</span>
            <button
              type="button"
              @click="openCreateCategoryModal"
              class="shrink-0 rounded-lg bg-primary-600 px-3 py-2 font-medium text-white transition-colors hover:bg-primary-700"
            >
              Add First Category
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            v-model="createForm.notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes..."
          ></textarea>
        </div>
      </div>
    </FormModal>

    <FormModal
      :show="showEditModal"
      title="Edit Supplier"
      @close="showEditModal = false"
      @submit="handleUpdateSupplier"
    >
      <div class="space-y-4">
        <FormInput v-model="editForm.name" label="Supplier Name" placeholder="Company name" required />
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-model="editForm.contact_person" label="Contact Person" placeholder="Contact name" />
          <FormInput v-model="editForm.phone" label="Phone" placeholder="Phone number" />
        </div>
        <FormInput v-model="editForm.email" label="Email" type="email" placeholder="Email address" />
        <FormInput v-model="editForm.address" label="Address" placeholder="Business address" />
        <div class="grid grid-cols-2 gap-4">
          <FormSelect v-model="editForm.payment_type" label="Payment Type" :options="createPaymentTypeOptions" />
          <FormInput
            v-model="editForm.credit_days"
            type="number"
            label="Credit Days"
            placeholder="Only for Credit payment"
            :disabled="editForm.payment_type !== 'CREDIT'"
          />
        </div>
        <FormSelect v-model="editForm.category_id" label="Change Category (Optional)" :options="categoryOptions" />
        <div
          v-if="!hasCategoryOptions"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <div class="flex items-center justify-between gap-3">
            <span>No categories found. Add one before assigning a supplier category.</span>
            <button
              type="button"
              @click="openCreateCategoryModal"
              class="shrink-0 rounded-lg bg-primary-600 px-3 py-2 font-medium text-white transition-colors hover:bg-primary-700"
            >
              Add First Category
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            v-model="editForm.notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional notes..."
          ></textarea>
        </div>
      </div>
    </FormModal>

    <FormModal
      :show="showCreateCategoryModal"
      title="Create Category"
      @close="showCreateCategoryModal = false"
      @submit="handleCreateCategory"
    >
      <div class="space-y-4">
        <FormInput
          v-model="createCategoryForm.name"
          label="Name"
          placeholder="Category name"
          required
        />
        <FormInput
          v-model="createCategoryForm.slug"
          label="Slug"
          placeholder="Optional slug"
        />
        <FormSelect
          v-model="createCategoryForm.parent"
          label="Parent Category"
          :options="parentCategoryOptions"
          placeholder="Select parent category"
        />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            v-model="createCategoryForm.description"
            rows="4"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Optional description..."
          ></textarea>
        </div>
      </div>
    </FormModal>

    <ConfirmModal
      :show="showDeleteModal"
      title="Delete Supplier"
      :message="`Are you sure you want to delete '${selectedSupplier?.name || ''}'? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="handleDeleteSupplier"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
