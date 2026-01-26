<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StatusBadge from '@/components/admin/StatusBadge.vue'
import { useCustomerStore } from '@/stores/admin/customerStore'

const route = useRoute()
const router = useRouter()
const customerStore = useCustomerStore()

const customer = computed(() => customerStore.getCustomerById(route.params.id))

const isEditingNotes = ref(false)
const editedNotes = ref('')

const startEditNotes = () => {
  editedNotes.value = customer.value?.notes || ''
  isEditingNotes.value = true
}

const saveNotes = () => {
  customerStore.updateCustomerNotes(customer.value.id, editedNotes.value)
  isEditingNotes.value = false
}

const cancelEditNotes = () => {
  isEditingNotes.value = false
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

    <div v-if="!customer" class="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
      <p class="text-gray-500">Customer not found</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-start gap-4">
              <div class="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl">
                {{ customer.name.charAt(0) }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-3">
                  <h2 class="text-xl font-bold text-gray-900">{{ customer.name }}</h2>
                  <StatusBadge :status="customer.status" />
                </div>
                <p class="text-gray-500 mt-1">{{ customer.email }}</p>
                <p class="text-gray-500">{{ customer.phone }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
            <div class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-sm text-gray-500">Address</p>
                <p class="font-medium text-gray-900">{{ customer.address }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Member Since</p>
                <p class="font-medium text-gray-900">{{ new Date(customer.joinedDate).toLocaleDateString() }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Orders</p>
                <p class="font-medium text-gray-900">{{ customer.totalOrders }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Total Spent</p>
                <p class="font-medium text-gray-900">${{ customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Last Order</p>
                <p class="font-medium text-gray-900">{{ new Date(customer.lastOrderDate).toLocaleDateString() }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Average Order Value</p>
                <p class="font-medium text-gray-900">${{ (customer.totalSpent / customer.totalOrders).toFixed(2) }}</p>
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
                  class="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
                >
                  Save
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
              {{ customer.notes || 'No notes added yet.' }}
            </p>
          </div>
        </div>

        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Lifetime Value</span>
                <span class="font-bold text-lg text-green-600">
                  ${{ customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Orders</span>
                <span class="font-semibold">{{ customer.totalOrders }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Avg. Order</span>
                <span class="font-semibold">${{ (customer.totalSpent / customer.totalOrders).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
