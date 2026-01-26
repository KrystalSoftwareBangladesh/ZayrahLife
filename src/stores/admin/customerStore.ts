import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockCustomers } from '@/mock/admin/customers'

interface NewCustomer {
  name: string
  email: string
  phone: string
  address?: string
}

export const useCustomerStore = defineStore('adminCustomers', () => {
  const customers = ref([...mockCustomers])
  const loading = ref(false)

  const activeCustomers = computed(() => customers.value.filter(c => c.status === 'active'))
  const totalCustomers = computed(() => customers.value.length)
  const totalRevenue = computed(() => customers.value.reduce((sum, c) => sum + c.totalSpent, 0))

  function getCustomerById(id: string | number) {
    return customers.value.find(c => c.id === parseInt(String(id)))
  }

  function updateCustomerNotes(id: string | number, notes: string) {
    const customer = customers.value.find(c => c.id === parseInt(String(id)))
    if (customer) {
      customer.notes = notes
    }
  }

  function addCustomer(data: NewCustomer) {
    const newId = Math.max(...customers.value.map(c => c.id)) + 1
    const newCustomer = {
      id: newId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address || '',
      totalOrders: 0,
      totalSpent: 0,
      status: 'active',
      lastOrderDate: null,
      notes: '',
      createdAt: new Date().toISOString()
    }
    customers.value.unshift(newCustomer)
    return newCustomer
  }

  return {
    customers,
    loading,
    activeCustomers,
    totalCustomers,
    totalRevenue,
    getCustomerById,
    updateCustomerNotes,
    addCustomer
  }
})
