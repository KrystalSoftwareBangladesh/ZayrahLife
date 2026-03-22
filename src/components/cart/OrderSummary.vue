<script setup>
import { computed } from 'vue'

const props = defineProps({
  subtotal: {
    type: Number,
    required: true
  },
  shipping: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  showPromo: {
    type: Boolean,
    default: false
  }
})

const formatPrice = (price) => {
  return `৳${price.toFixed(2)}`
}

const freeShipping = computed(() => props.shipping === 0)
</script>

<template>
  <div class="bg-gray-50 rounded-xl p-6">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
    
    <div class="space-y-3">
      <div class="flex justify-between text-gray-600">
        <span>Subtotal</span>
        <span>{{ formatPrice(subtotal) }}</span>
      </div>
      
      <div class="flex justify-between text-gray-600">
        <span>Shipping</span>
        <span :class="{ 'text-green-600 font-medium': freeShipping }">
          {{ freeShipping ? 'FREE' : formatPrice(shipping) }}
        </span>
      </div>
      
      <div class="flex justify-between text-gray-600">
        <span>Tax</span>
        <span>{{ formatPrice(tax) }}</span>
      </div>
      
      <div v-if="showPromo" class="pt-3">
        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Promo code"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button class="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700">
            Apply
          </button>
        </div>
      </div>
      
      <div class="pt-3 border-t border-gray-200">
        <div class="flex justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span>{{ formatPrice(total) }}</span>
        </div>
      </div>
    </div>
    
    <p v-if="!freeShipping" class="mt-4 text-sm text-gray-500">
      Add {{ formatPrice(100 - subtotal) }} more for free shipping!
    </p>
    
    <slot />
  </div>
</template>
