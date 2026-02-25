import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoriesApi } from '@/api/categories'
import type {
  ApiError,
  Category,
  CategoryCreateRequest,
  CategoryListParams,
  CategoryUpdateRequest
} from '@/api/types'

export const useCategoryStore = defineStore('adminCategories', () => {
  const categories = ref<Category[]>([])
  const categoryOptions = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const pagination = ref({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  })

  const totalCategories = computed(() => pagination.value.count)

  async function fetchCategories(params: CategoryListParams = {}): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await categoriesApi.list({
        page: params.page || pagination.value.page,
        page_size: params.page_size || pagination.value.pageSize,
        ...params
      })

      categories.value = response.results
      pagination.value = {
        count: response.count,
        page: params.page || pagination.value.page,
        pageSize: params.page_size || pagination.value.pageSize,
        hasNext: !!response.next,
        hasPrevious: !!response.previous
      }
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to fetch categories'
      categories.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCategoryOptions(): Promise<void> {
    try {
      const items: Category[] = []
      let page = 1
      let hasNext = true

      while (hasNext && page <= 20) {
        const response = await categoriesApi.list({
          page,
          page_size: 100,
          ordering: 'name'
        })
        items.push(...response.results)
        hasNext = !!response.next
        page += 1
      }

      categoryOptions.value = items
    } catch {
      categoryOptions.value = []
    }
  }

  async function createCategory(data: CategoryCreateRequest): Promise<Category | null> {
    loading.value = true
    error.value = null

    try {
      const created = await categoriesApi.create(data)
      await Promise.all([fetchCategories({ page: 1 }), fetchCategoryOptions()])
      return created
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to create category'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(id: number, data: CategoryUpdateRequest): Promise<Category | null> {
    loading.value = true
    error.value = null

    try {
      const updated = await categoriesApi.update(id, data)
      await Promise.all([fetchCategories(), fetchCategoryOptions()])
      return updated
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to update category'
      return null
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: number): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      await categoriesApi.delete(id)
      await Promise.all([fetchCategories(), fetchCategoryOptions()])
      return true
    } catch (err) {
      const apiError = err as ApiError
      error.value = apiError.message || 'Failed to delete category'
      return false
    } finally {
      loading.value = false
    }
  }

  function getCategoryNameById(id: number | null): string {
    if (!id) return '-'
    return categoryOptions.value.find(category => category.id === id)?.name || `#${id}`
  }

  function setPage(page: number): void {
    pagination.value.page = page
    fetchCategories({ page })
  }

  function clearError(): void {
    error.value = null
  }

  return {
    categories,
    categoryOptions,
    loading,
    error,
    pagination,
    totalCategories,
    fetchCategories,
    fetchCategoryOptions,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryNameById,
    setPage,
    clearError
  }
})
