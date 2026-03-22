<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/products'
import ProductCard from '@/components/product/ProductCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const categories = computed(() => productStore.categories)
const products = computed(() => productStore.filteredProducts)
const selectedCategory = computed(() => productStore.selectedCategory)
const priceRange = computed(() => productStore.priceRange)

onMounted(() => {
  void (async () => {
    await productStore.fetchProducts()
    const categoryParam = route.query.category
    if (categoryParam) {
      productStore.setCategory(String(categoryParam))
    }
  })()
})

watch(() => route.query.category, (newCategory) => {
  if (newCategory) {
    productStore.setCategory(String(newCategory))
  } else {
    productStore.clearFilters()
  }
})

const selectCategory = (categoryId) => {
  if (selectedCategory.value === categoryId) {
    productStore.setCategory(null)
    router.push({ name: 'products' })
  } else {
    productStore.setCategory(categoryId)
    router.push({ name: 'products', query: { category: categoryId } })
  }
}

const updatePriceRange = (event, type) => {
  const value = parseInt(event.target.value)
  if (type === 'min') {
    productStore.setPriceRange(value, priceRange.value.max)
  } else {
    productStore.setPriceRange(priceRange.value.min, value)
  }
}

const clearFilters = () => {
  productStore.clearFilters()
  router.push({ name: 'products' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
      <p class="text-gray-500">Browse our complete collection</p>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <aside class="lg:w-64 flex-shrink-0">
        <div class="bg-white rounded-xl p-6 shadow-sm sticky top-24">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900">Filters</h3>
            <button
              v-if="selectedCategory || priceRange.min > 0 || priceRange.max < 500"
              class="text-sm text-primary-600 hover:text-primary-700"
              @click="clearFilters"
            >
              Clear All
            </button>
          </div>

          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Categories</h4>
            <div class="space-y-2">
              <button
                v-for="category in categories"
                :key="category.id"
                :class="[
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedCategory === category.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'hover:bg-gray-100 text-gray-600'
                ]"
                @click="selectCategory(category.id)"
              >
                {{ category.name }}
                <span class="text-gray-400">({{ category.count }})</span>
              </button>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-500">৳</span>
                <input
                  type="number"
                  :value="priceRange.min"
                  min="0"
                  max="500"
                  class="w-full px-2 py-1 border rounded text-sm"
                  @input="updatePriceRange($event, 'min')"
                />
                <span class="text-gray-400">-</span>
                <input
                  type="number"
                  :value="priceRange.max"
                  min="0"
                  max="500"
                  class="w-full px-2 py-1 border rounded text-sm"
                  @input="updatePriceRange($event, 'max')"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="flex-1">
        <div class="mb-4 flex items-center justify-between">
          <p class="text-gray-500">
            Showing {{ products.length }} product{{ products.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <div v-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <div v-else class="text-center py-16">
          <p class="text-gray-500 mb-4">No products found matching your filters.</p>
          <BaseButton variant="outline" @click="clearFilters">Clear Filters</BaseButton>
        </div>
      </main>
    </div>
  </div>
</template>
