<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { useProductVariants } from '@/composables/useProductVariants'
import BaseButton from '@/components/common/BaseButton.vue'
import PriceDisplay from '@/components/common/PriceDisplay.vue'
import QuantitySelector from '@/components/common/QuantitySelector.vue'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const cartStore = useCartStore()

const product = ref<ReturnType<typeof productStore.getProductById> | null>(null)
const selectedImage = ref(0)
const addedToCart = ref(false)

const {
  selectedColor,
  selectedSize,
  availableColors,
  availableSizes,
  quantity,
  currentPrice,
  originalPrice,
  isInStock,
  isLowStock,
  stockLabel,
  canAddToCart,
  maxQuantity,
  getVariantStock
} = useProductVariants(product as any)

onMounted(() => {
  const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  product.value = productStore.getProductById(id)
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    const id = Array.isArray(newId) ? newId[0] : newId
    product.value = productStore.getProductById(id)
    selectedImage.value = 0
  }
})

const hasReviews = computed(() => product.value?.reviewCount && product.value.reviewCount > 0)

const navigateToCategory = () => {
  if (product.value?.category) {
    router.push({ name: 'products', query: { category: product.value.category } })
  }
}

const addToCart = () => {
  if (product.value && canAddToCart.value) {
    cartStore.addItem(
      product.value, 
      quantity.value, 
      selectedColor.value, 
      selectedSize.value,
      currentPrice.value
    )
    addedToCart.value = true
    setTimeout(() => {
      addedToCart.value = false
    }, 2000)
  }
}

const buyNow = () => {
  if (canAddToCart.value) {
    addToCart()
    router.push({ name: 'cart' })
  }
}

const isSizeAvailable = (size: string) => {
  return getVariantStock(selectedColor.value || '', size) > 0
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <div class="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
          <img
            :src="product.images[selectedImage]"
            :alt="product.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex gap-3">
          <button
            v-for="(image, index) in product.images"
            :key="index"
            :class="[
              'w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
              selectedImage === index ? 'border-primary-600' : 'border-transparent hover:border-gray-300'
            ]"
            @click="selectedImage = index"
          >
            <img :src="image" :alt="`${product.name} ${index + 1}`" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <div>
        <button 
          @click="navigateToCategory"
          class="text-primary-600 font-medium mb-2 hover:text-primary-700 hover:underline cursor-pointer"
        >
          {{ product.categoryName }}
        </button>
        <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ product.name }}</h1>

        <div v-if="hasReviews" class="flex items-center gap-4 mb-6">
          <div class="flex items-center">
            <div class="flex">
              <svg
                v-for="i in 5"
                :key="i"
                class="w-5 h-5"
                :class="i <= Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-200'"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span class="ml-2 text-gray-600">{{ product.rating }} ({{ product.reviewCount }} reviews)</span>
          </div>
        </div>

        <PriceDisplay :price="currentPrice" :original-price="originalPrice" size="xl" class="mb-6" />

        <p class="text-gray-600 mb-8">{{ product.description }}</p>

        <div v-if="availableColors.length > 0" class="mb-6">
          <h3 class="text-sm font-medium text-gray-900 mb-3">Color</h3>
          <div class="flex gap-2">
            <button
              v-for="color in availableColors"
              :key="color"
              :class="[
                'px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors',
                selectedColor === color
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="selectedColor = color"
            >
              {{ color }}
            </button>
          </div>
        </div>

        <div v-if="availableSizes.length > 0" class="mb-6">
          <h3 class="text-sm font-medium text-gray-900 mb-3">Size</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="size in availableSizes"
              :key="size || 'default'"
              :disabled="!size || !isSizeAvailable(size)"
              :class="[
                'w-12 h-12 rounded-lg border-2 text-sm font-medium transition-colors',
                selectedSize === size
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : !size || !isSizeAvailable(size)
                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                    : 'border-gray-200 hover:border-gray-300'
              ]"
              @click="size && isSizeAvailable(size) && (selectedSize = size)"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
          <QuantitySelector v-model="quantity" :max="maxQuantity" :disabled="!isInStock" />
        </div>

        <div class="mb-6">
          <p 
            :class="[
              'font-medium',
              !isInStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'
            ]"
          >
            {{ stockLabel }}
          </p>
        </div>

        <div class="flex gap-4">
          <BaseButton
            size="lg"
            :disabled="!canAddToCart"
            class="flex-1"
            @click="addToCart"
          >
            {{ addedToCart ? 'Added to Cart!' : 'Add to Cart' }}
          </BaseButton>
          <BaseButton
            size="lg"
            variant="outline"
            :disabled="!canAddToCart"
            class="flex-1"
            @click="buyNow"
          >
            Buy Now
          </BaseButton>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <p class="text-gray-500">Product not found.</p>
      <RouterLink to="/products" class="text-primary-600 hover:text-primary-700 mt-4 inline-block">
        Back to Products
      </RouterLink>
    </div>
  </div>
</template>
