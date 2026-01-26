<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import BaseButton from '@/components/common/BaseButton.vue'
import QuantitySelector from '@/components/common/QuantitySelector.vue'
import OrderSummary from '@/components/cart/OrderSummary.vue'

const router = useRouter()
const cartStore = useCartStore()

const items = computed(() => cartStore.items)
const isEmpty = computed(() => items.value.length === 0)

const updateQuantity = (index, quantity) => {
  cartStore.updateQuantity(index, quantity)
}

const removeItem = (index) => {
  cartStore.removeItem(index)
}

const proceedToCheckout = () => {
  router.push({ name: 'checkout' })
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

    <div v-if="!isEmpty" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-sm overflow-hidden">
          <div
            v-for="(item, index) in items"
            :key="`${item.id}-${item.selectedColor}-${item.selectedSize}`"
            class="flex gap-4 p-6 border-b last:border-b-0"
          >
            <div class="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
              <img :src="item.image" :alt="item.name" class="w-full h-full object-cover" />
            </div>

            <div class="flex-1 min-w-0">
              <RouterLink
                :to="{ name: 'product-detail', params: { id: item.id } }"
                class="font-semibold text-gray-900 hover:text-primary-600 line-clamp-2"
              >
                {{ item.name }}
              </RouterLink>

              <div class="mt-1 text-sm text-gray-500">
                <span v-if="item.selectedColor">Color: {{ item.selectedColor }}</span>
                <span v-if="item.selectedColor && item.selectedSize"> | </span>
                <span v-if="item.selectedSize">Size: {{ item.selectedSize }}</span>
              </div>

              <p class="mt-2 text-lg font-bold text-gray-900">${{ item.price.toFixed(2) }}</p>
            </div>

            <div class="flex flex-col items-end gap-3">
              <QuantitySelector
                :model-value="item.quantity"
                :max="item.stock"
                size="sm"
                @update:model-value="updateQuantity(index, $event)"
              />
              <button
                class="text-sm text-red-600 hover:text-red-700"
                @click="removeItem(index)"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-1">
        <OrderSummary
          :subtotal="cartStore.subtotal"
          :shipping="cartStore.shipping"
          :tax="cartStore.tax"
          :total="cartStore.total"
          show-promo
        >
          <BaseButton
            full-width
            size="lg"
            class="mt-6"
            @click="proceedToCheckout"
          >
            Proceed to Checkout
          </BaseButton>
          <RouterLink
            to="/products"
            class="block text-center mt-4 text-primary-600 hover:text-primary-700"
          >
            Continue Shopping
          </RouterLink>
        </OrderSummary>
      </div>
    </div>

    <div v-else class="text-center py-16">
      <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
      <p class="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
      <RouterLink to="/products">
        <BaseButton size="lg">Start Shopping</BaseButton>
      </RouterLink>
    </div>
  </div>
</template>
