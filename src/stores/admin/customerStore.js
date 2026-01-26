import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockCustomers } from '@/mock/admin/customers'

export const useCustomerStore = defineStore('adminCustomers', () => {
  const customers = ref([...mockCustomers])
  const loading = ref(false)

  const activeCustomers = computed(() => customers.value.filter(c => c.status === 'active'))
  const totalCustomers = computed(() => customers.value.length)
  const totalRevenue = computed(() => customers.value.reduce((sum, c) => sum + c.totalSpent, 0))

  function getCustomerById(id) {
    return customers.value.find(c => c.id === parseInt(id))
  }

  function updateCustomerNotes(id, notes) {
    const customer = customers.value.find(c => c.id === parseInt(id))
    if (customer) {
      customer.notes = notes
    }
  }

  return {
    customers,
    loading,
    activeCustomers,
    totalCustomers,
    totalRevenue,
    getCustomerById,
    updateCustomerNotes
  }
})
