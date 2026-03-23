import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { paymentMethodsApi } from '@/api/paymentMethods'
import type {
  ApiError,
  PaymentMethodCreateUpdateRequest,
  PaymentMethodCreateUpdateResponse,
  PaymentMethodDetail,
  PaymentMethodListItem,
  PaymentMethodListParams
} from '@/api/types'

export const usePaymentMethodStore = defineStore('adminPaymentMethods', () => {
  const paymentMethods = ref<PaymentMethodListItem[]>([])
  const currentPaymentMethod = ref<PaymentMethodDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const totalPaymentMethods = computed(() => pagination.value.count)
  const activePaymentMethods = computed(() => paymentMethods.value.filter(method => method.is_active !== false).length)
  const overrideEnabledPaymentMethods = computed(() =>
    paymentMethods.value.filter(method => method.allow_account_override).length
  )
  const mappedAccounts = computed(() =>
    new Set(paymentMethods.value.map(method => method.default_account_id).filter((id): id is number => typeof id === 'number')).size
  )

  async function fetchPaymentMethods(params: PaymentMethodListParams = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await paymentMethodsApi.list({
        page: params.page || pagination.value.page,
        page_size: params.page_size || pagination.value.pageSize,
        ordering: params.ordering || 'sort_order',
        ...params
      })

      paymentMethods.value = response.results
      pagination.value = {
        count: response.count,
        page: params.page || pagination.value.page,
        pageSize: params.page_size || pagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch payment methods'
      paymentMethods.value = []
    } finally {
      loading.value = false
    }
  }

  async function getPaymentMethodById(id: number): Promise<PaymentMethodDetail | null> {
    loading.value = true
    error.value = null

    try {
      const detail = await paymentMethodsApi.getById(id)
      currentPaymentMethod.value = detail
      return detail
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch payment method'
      return null
    } finally {
      loading.value = false
    }
  }

  async function createPaymentMethod(
    data: PaymentMethodCreateUpdateRequest
  ): Promise<PaymentMethodCreateUpdateResponse | null> {
    loading.value = true
    error.value = null

    try {
      const created = await paymentMethodsApi.create(data)
      await fetchPaymentMethods({ page: 1 })
      return created
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create payment method'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updatePaymentMethod(
    id: number,
    data: PaymentMethodCreateUpdateRequest
  ): Promise<PaymentMethodCreateUpdateResponse | null> {
    loading.value = true
    error.value = null

    try {
      const updated = await paymentMethodsApi.update(id, data)
      await fetchPaymentMethods({ page: pagination.value.page })
      return updated
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update payment method'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deletePaymentMethod(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await paymentMethodsApi.delete(id)
      await fetchPaymentMethods({ page: pagination.value.page })
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete payment method'
      return false
    } finally {
      loading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    paymentMethods,
    currentPaymentMethod,
    loading,
    error,
    pagination,
    totalPaymentMethods,
    activePaymentMethods,
    overrideEnabledPaymentMethods,
    mappedAccounts,
    fetchPaymentMethods,
    getPaymentMethodById,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    clearError
  }
})
