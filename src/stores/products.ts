import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { products as mockProducts, categories as mockCategories } from '@/mock/products'

export const useProductStore = defineStore('products', () => {
  const products = ref(mockProducts)
  const categories = ref(mockCategories)
  const selectedCategory = ref<string | null>(null)
  const priceRange = ref({ min: 0, max: 500 })

  const featuredProducts = computed(() => {
    return products.value.filter(p => p.featured)
  })

  const filteredProducts = computed(() => {
    let result = products.value

    if (selectedCategory.value) {
      result = result.filter(p => p.category === selectedCategory.value)
    }

    result = result.filter(p => 
      p.price >= priceRange.value.min && p.price <= priceRange.value.max
    )

    return result
  })

  const getProductById = (id: string | number) => {
    return products.value.find(p => p.id === parseInt(String(id)))
  }

  const getProductsByCategory = (categoryId: string) => {
    return products.value.filter(p => p.category === categoryId)
  }

  const setCategory = (categoryId: string | null) => {
    selectedCategory.value = categoryId
  }

  const setPriceRange = (min: number, max: number) => {
    priceRange.value = { min, max }
  }

  const clearFilters = () => {
    selectedCategory.value = null
    priceRange.value = { min: 0, max: 500 }
  }

  return {
    products,
    categories,
    selectedCategory,
    priceRange,
    featuredProducts,
    filteredProducts,
    getProductById,
    getProductsByCategory,
    setCategory,
    setPriceRange,
    clearFilters
  }
})
