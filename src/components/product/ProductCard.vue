<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PriceDisplay from '@/components/common/PriceDisplay.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import { useCartStore } from '@/stores/cart'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cartStore = useCartStore()

const isLowStock = computed(() => props.product.stock <= 5)

const goToProduct = () => {
  router.push({ name: 'product-detail', params: { id: props.product.id } })
}

const addToCart = (e) => {
  e.stopPropagation()
  cartStore.addItem(
    props.product,
    1,
    props.product.colors?.[0] || null,
    props.product.sizes?.[0] || null
  )
}
</script>

<template>
  <div
    class="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group"
    @click="goToProduct"
  >
    <div class="relative aspect-square overflow-hidden bg-gray-100">
      <img
        :src="product.images[0]"
        :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div
        v-if="product.originalPrice"
        class="absolute top-3 left-3 px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full"
      >
        SALE
      </div>
      <div
        v-if="isLowStock"
        class="absolute top-3 right-3 px-2 py-1 text-xs font-semibold text-orange-700 bg-orange-100 rounded-full"
      >
        Low Stock
      </div>
    </div>
    
    <div class="p-4">
      <p class="text-sm text-gray-500 mb-1">{{ product.categoryName }}</p>
      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ product.name }}</h3>
      
      <div class="flex items-center gap-1 mb-3">
        <div class="flex">
          <svg
            v-for="i in 5"
            :key="i"
            class="w-4 h-4"
            :class="i <= Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-200'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <span class="text-sm text-gray-500">({{ product.reviews }})</span>
      </div>
      
      <div class="flex items-center justify-between">
        <PriceDisplay :price="product.price" :original-price="product.originalPrice" size="sm" />
        <BaseButton size="sm" @click="addToCart">Add</BaseButton>
      </div>
    </div>
  </div>
</template>
