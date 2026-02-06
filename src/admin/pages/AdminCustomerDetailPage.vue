<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import FormInput from '@/components/admin/FormInput.vue'
import FormSelect from '@/components/admin/FormSelect.vue'
import { useCustomerStore } from '@/stores/admin/customerStore'

const route = useRoute()
const router = useRouter()
const customerStore = useCustomerStore()

const isEditingNotes = ref(false)
const editedNotes = ref('')
const isEditing = ref(false)
const editForm = ref({
  first_name: '',
  middle_name: '',
  last_name: '',
  phone: '',
  facebook_profile_url: '',
  customer_type: '' as 'POS' | 'FACEBOOK' | 'WEBSITE'
})

const customerTypeOptions = [
  { value: 'POS', label: 'POS' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'WEBSITE', label: 'Website' }
]

onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    customerStore.getCustomerById(id)
  }
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    customerStore.getCustomerById(Number(newId))
  }
})

const startEditNotes = () => {
  editedNotes.value = customerStore.currentCustomer?.notes || ''
  isEditingNotes.value = true
}

const saveNotes = async () => {
  if (!customerStore.currentCustomer) return
  
  await customerStore.updateCustomer(customerStore.currentCustomer.id, {
    notes: editedNotes.value
  })
  isEditingNotes.value = false
}

const cancelEditNotes = () => {
  isEditingNotes.value = false
}

const startEdit = () => {
  const c = customerStore.currentCustomer
  if (!c) return
  editForm.value = {
    first_name: c.first_name || '',
    middle_name: c.middle_name || '',
    last_name: c.last_name || '',
    phone: c.phone || '',
    facebook_profile_url: c.facebook_profile_url || '',
    customer_type: c.customer_type
  }
  isEditing.value = true
}

const saveEdit = async () => {
  if (!customerStore.currentCustomer) return
  await customerStore.updateCustomer(customerStore.currentCustomer.id, {
    first_name: editForm.value.first_name,
    middle_name: editForm.value.middle_name || undefined,
    last_name: editForm.value.last_name || undefined,
    phone: editForm.value.phone || undefined,
    facebook_profile_url: editForm.value.facebook_profile_url || undefined,
    customer_type: editForm.value.customer_type
  })
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}
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
        <h1 class="text-2xl font-bold text-gray-900">Customer Details</h1>
        <p class="text-gray-500">View and manage customer information</p>
      </div>
    </div>

    <div v-if="customerStore.loading" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <div class="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-gray-500 mt-4">Loading customer...</p>
    </div>

    <div v-else-if="customerStore.error" class="bg-white rounded-lg shadow-sm border border-red-200 p-12 text-center">
      <p class="text-red-500">{{ customerStore.error }}</p>
      <button @click="router.back()" class="mt-4 text-primary-600 hover:underline">Go back</button>
    </div>

    <div v-else-if="!customerStore.currentCustomer" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <p class="text-gray-500">Customer not found</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl">
                {{ customerStore.currentCustomer.full_name?.charAt(0) || '?' }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <h2 class="text-xl font-bold text-gray-900">{{ customerStore.currentCustomer.full_name }}</h2>
                  <StatusBadge :status="customerStore.currentCustomer.is_active ? 'active' : 'inactive'" />
                </div>
                <p class="text-gray-500 mt-1">{{ customerStore.currentCustomer.email }}</p>
                <p class="text-gray-500">{{ customerStore.currentCustomer.phone || 'No phone' }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Customer Information</h3>
              <button
                v-if="!isEditing"
                @click="startEdit"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            </div>

            <div v-if="isEditing" class="space-y-4">
              <FormInput v-model="editForm.first_name" label="First Name" placeholder="First name" required />
              <FormInput v-model="editForm.middle_name" label="Middle Name" placeholder="Middle name" />
              <FormInput v-model="editForm.last_name" label="Last Name" placeholder="Last name" />
              <FormInput v-model="editForm.phone" label="Phone" placeholder="Phone number" />
              <FormInput v-model="editForm.facebook_profile_url" label="Facebook Profile URL" placeholder="https://facebook.com/profile" />
              <FormSelect v-model="editForm.customer_type" label="Customer Type" :options="customerTypeOptions" />
              <div class="flex gap-2 pt-2">
                <button
                  @click="saveEdit"
                  :disabled="customerStore.loading"
                  class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {{ customerStore.loading ? 'Saving...' : 'Save' }}
                </button>
                <button
                  @click="cancelEdit"
                  class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div v-else class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-sm text-gray-500">First Name</p>
                <p class="font-medium text-gray-900">{{ customerStore.currentCustomer.first_name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Middle Name</p>
                <p class="font-medium text-gray-900">{{ customerStore.currentCustomer.middle_name || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Last Name</p>
                <p class="font-medium text-gray-900">{{ customerStore.currentCustomer.last_name || '-' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Customer Type</p>
                <p class="font-medium text-gray-900">{{ customerStore.currentCustomer.customer_type }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Created At</p>
                <p class="font-medium text-gray-900">{{ new Date(customerStore.currentCustomer.created_at).toLocaleDateString() }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Last Updated</p>
                <p class="font-medium text-gray-900">{{ new Date(customerStore.currentCustomer.updated_at).toLocaleDateString() }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-sm text-gray-500">Facebook Profile</p>
                <a 
                  v-if="customerStore.currentCustomer.facebook_profile_url"
                  :href="customerStore.currentCustomer.facebook_profile_url" 
                  target="_blank"
                  class="font-medium text-primary-600 hover:underline"
                >
                  {{ customerStore.currentCustomer.facebook_profile_url }}
                </a>
                <p v-else class="font-medium text-gray-900">-</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Notes</h3>
              <button
                v-if="!isEditingNotes"
                @click="startEditNotes"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                Edit
              </button>
            </div>
            <div v-if="isEditingNotes">
              <textarea
                v-model="editedNotes"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add notes about this customer..."
              ></textarea>
              <div class="flex gap-2 mt-3">
                <button
                  @click="saveNotes"
                  :disabled="customerStore.loading"
                  class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {{ customerStore.loading ? 'Saving...' : 'Save' }}
                </button>
                <button
                  @click="cancelEditNotes"
                  class="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
            <p v-else class="text-gray-600">
              {{ customerStore.currentCustomer.notes || 'No notes added yet.' }}
            </p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Status</span>
                <StatusBadge :status="customerStore.currentCustomer.is_active ? 'active' : 'inactive'" />
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Type</span>
                <span class="font-semibold">{{ customerStore.currentCustomer.customer_type }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500">ID</span>
                <span class="font-mono text-sm">#{{ customerStore.currentCustomer.id }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
