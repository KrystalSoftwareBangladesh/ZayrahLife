import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { productsApi, productVariantsApi } from '@/api/products'
import type {
  ApiError,
  ProductCreateRequest,
  ProductDetail,
  ProductList,
  ProductListParams,
  ProductUpdateRequest,
  ProductVariantCreateRequest,
  ProductVariantList,
  ProductVariantUpdateRequest
} from '@/api/types'

export const useAdminProductStore = defineStore('adminProductsApi', () => {
  const products = ref<ProductList[]>([])
  const currentProduct = ref<ProductDetail | null>(null)
  const currentProductVariants = ref<ProductVariantList[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const totalProducts = computed(() => pagination.value.count)

  async function fetchProducts(params: ProductListParams = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await productsApi.list({
        page: params.page || pagination.value.page,
        page_size: params.page_size || pagination.value.pageSize,
        ...params
      })

      products.value = response.results
      pagination.value = {
        count: response.count,
        page: params.page || pagination.value.page,
        pageSize: params.page_size || pagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch products'
      products.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchProductDetail(id: number): Promise<ProductDetail | null> {
    loading.value = true
    error.value = null

    try {
      const product = await productsApi.getById(id)
      currentProduct.value = product
      return product
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch product details'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchProductVariants(productId: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await productVariantsApi.list({
        product: productId,
        page: 1,
        page_size: 200
      })
      currentProductVariants.value = response.results
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch product variants'
      currentProductVariants.value = []
    } finally {
      loading.value = false
    }
  }

  async function createProduct(data: ProductCreateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await productsApi.create(data)
      await fetchProducts({ page: 1 })
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create product'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id: number, data: ProductUpdateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await productsApi.update(id, data)
      await fetchProducts()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update product'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await productsApi.delete(id)
      await fetchProducts()
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete product'
      return false
    } finally {
      loading.value = false
    }
  }

  async function createVariant(data: ProductVariantCreateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await productVariantsApi.create(data)
      await fetchProductVariants(data.product)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create variant'
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateVariant(variantId: number, productId: number, data: ProductVariantUpdateRequest): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await productVariantsApi.update(variantId, data)
      await fetchProductVariants(productId)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update variant'
      return false
    } finally {
      loading.value = false
    }
  }

  async function deleteVariant(variantId: number, productId: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await productVariantsApi.delete(variantId)
      await fetchProductVariants(productId)
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete variant'
      return false
    } finally {
      loading.value = false
    }
  }

  function setPage(page: number): void {
    pagination.value.page = page
    fetchProducts({ page })
  }

  function clearError(): void {
    error.value = null
  }

  return {
    products,
    currentProduct,
    currentProductVariants,
    loading,
    error,
    pagination,
    totalProducts,
    fetchProducts,
    fetchProductDetail,
    fetchProductVariants,
    createProduct,
    updateProduct,
    deleteProduct,
    createVariant,
    updateVariant,
    deleteVariant,
    setPage,
    clearError
  }
})
