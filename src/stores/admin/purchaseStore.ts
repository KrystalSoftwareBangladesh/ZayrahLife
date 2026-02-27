import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { purchasesApi } from '@/api/purchases'
import { productsApi, productVariantsApi } from '@/api/products'
import type {
  ApiError,
  ProductVariantList,
  PurchaseCreateRequest,
  PurchaseDetail,
  PurchaseList,
  PurchaseListParams,
  PurchaseUpdateRequest
} from '@/api/types'

interface ProductOption {
  value: number
  label: string
  price: string
}

interface VariantOption {
  value: number
  label: string
  sku: string
}

export const usePurchaseStore = defineStore('adminPurchases', () => {
  const purchases = ref<PurchaseList[]>([])
  const currentPurchase = ref<PurchaseDetail | null>(null)
  const productOptions = ref<ProductOption[]>([])
  const variantOptions = ref<VariantOption[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const totalPurchases = computed(() => pagination.value.count)
  const pendingPurchases = computed(() => purchases.value.filter(item => item.status === 'DRAFT').length)
  const confirmedPurchases = computed(() => purchases.value.filter(item => item.status === 'CONFIRMED').length)
  const cancelledPurchases = computed(() => purchases.value.filter(item => item.status === 'CANCELLED').length)
  const pageTotalAmount = computed(() =>
    purchases.value.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
  )

  async function fetchPurchases(params: PurchaseListParams = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await purchasesApi.list({
        page: params.page || pagination.value.page,
        page_size: params.page_size || pagination.value.pageSize,
        ...params
      })
      purchases.value = response.results
      pagination.value = {
        count: response.count,
        page: params.page || pagination.value.page,
        pageSize: params.page_size || pagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch purchases'
      purchases.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchPurchaseDetail(id: number): Promise<PurchaseDetail | null> {
    loading.value = true
    error.value = null

    try {
      const detail = await purchasesApi.getById(id)
      currentPurchase.value = detail
      return detail
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch purchase details'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchProductOptions(): Promise<void> {
    try {
      const result: ProductOption[] = []
      let page = 1
      let hasNext = true

      while (hasNext && page <= 20) {
        const response = await productsApi.list({ page, page_size: 100 })
        result.push(
          ...response.results.map(product => ({
            value: product.id,
            label: product.name,
            price: product.current_selling_price
          }))
        )
        hasNext = !!response.next
        page += 1
      }
      productOptions.value = result
    } catch {
      productOptions.value = []
    }
  }

  async function fetchVariantOptions(productId: number): Promise<void> {
    try {
      const result: VariantOption[] = []
      let page = 1
      let hasNext = true

      while (hasNext && page <= 10) {
        const response = await productVariantsApi.list({ product: productId, page, page_size: 100 })
        result.push(
          ...response.results.map((variant: ProductVariantList) => ({
            value: variant.id,
            label: `${variant.color || '-'} / ${variant.size || '-'} (${variant.sku}) - ${variant.current_stock} in stock`,
            sku: variant.sku
          }))
        )
        hasNext = !!response.next
        page += 1
      }
      variantOptions.value = result
    } catch {
      variantOptions.value = []
    }
  }

  async function createPurchase(data: PurchaseCreateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await purchasesApi.create(data)
      await fetchPurchases({ page: 1 })
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create purchase'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updatePurchase(id: number, data: PurchaseUpdateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await purchasesApi.update(id, data)
      await fetchPurchases()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update purchase'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deletePurchase(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await purchasesApi.delete(id)
      await fetchPurchases()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete purchase'
      return false
    } finally {
      loading.value = false
    }
  }

  async function confirmPurchase(id: number, data: PurchaseCreateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await purchasesApi.confirm(id, data)
      await fetchPurchases()
      await fetchPurchaseDetail(id)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update purchase status'
      return false
    } finally {
      loading.value = false
    }
  }

  async function cancelPurchase(id: number, data: PurchaseCreateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await purchasesApi.cancel(id, data)
      await fetchPurchases()
      await fetchPurchaseDetail(id)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to cancel purchase'
      return false
    } finally {
      loading.value = false
    }
  }

  function setPage(page: number): void {
    pagination.value.page = page
    fetchPurchases({ page })
  }

  function clearError(): void {
    error.value = null
  }

  return {
    purchases,
    currentPurchase,
    productOptions,
    variantOptions,
    loading,
    error,
    pagination,
    totalPurchases,
    pendingPurchases,
    confirmedPurchases,
    cancelledPurchases,
    pageTotalAmount,
    fetchPurchases,
    fetchPurchaseDetail,
    fetchProductOptions,
    fetchVariantOptions,
    createPurchase,
    updatePurchase,
    deletePurchase,
    confirmPurchase,
    cancelPurchase,
    setPage,
    clearError
  }
})
