import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { customersApi } from '@/api/customers'
import type { 
  CustomerProfileList, 
  CustomerProfileDetail, 
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerListParams,
  ApiError 
} from '@/api/types'

export const useCustomerStore = defineStore('adminCustomers', () => {
  const customers = ref<CustomerProfileList[]>([])
  const currentCustomer = ref<CustomerProfileDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const totalCustomers = computed(() => pagination.value.count)
  const activeCustomers = computed(() => customers.value)

  async function fetchCustomers(params: CustomerListParams = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await customersApi.list({
        page: params.page || pagination.value.page,
        page_size: params.page_size || pagination.value.pageSize,
        ...params
      })
      
      customers.value = response.results
      pagination.value = {
        count: response.count,
        page: params.page || pagination.value.page,
        pageSize: params.page_size || pagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch customers'
      customers.value = []
    } finally {
      loading.value = false
    }
  }

  async function getCustomerById(id: number): Promise<CustomerProfileDetail | null> {
    loading.value = true
    error.value = null

    try {
      const customer = await customersApi.getById(id)
      currentCustomer.value = customer
      return customer
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch customer'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createCustomer(data: CustomerCreateRequest): Promise<CustomerProfileDetail | null> {
    loading.value = true
    error.value = null

    try {
      const newCustomer = await customersApi.create(data)
      await fetchCustomers()
      return newCustomer
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create customer'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(id: number, data: CustomerUpdateRequest): Promise<CustomerProfileDetail | null> {
    loading.value = true
    error.value = null

    try {
      const updated = await customersApi.update(id, data)
      currentCustomer.value = updated
      
      const index = customers.value.findIndex(c => c.id === id)
      if (index !== -1) {
        customers.value[index] = {
          ...customers.value[index],
          ...updated
        }
      }
      
      return updated
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update customer'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteCustomer(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await customersApi.delete(id)
      customers.value = customers.value.filter(c => c.id !== id)
      if (currentCustomer.value?.id === id) {
        currentCustomer.value = null
      }
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete customer'
      return false
    } finally {
      loading.value = false
    }
  }

  function setPage(page: number): void {
    pagination.value.page = page
    fetchCustomers({ page })
  }

  function clearError(): void {
    error.value = null
  }

  return {
    customers,
    currentCustomer,
    loading,
    error,
    pagination,
    totalCustomers,
    activeCustomers,
    fetchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    setPage,
    clearError
  }
})
