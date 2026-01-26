<script setup>
import { computed } from 'vue'

const props = defineProps({
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number,
    default: null
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v)
  },
  currency: {
    type: String,
    default: '$'
  }
})

const formattedPrice = computed(() => {
  return `${props.currency}${props.price.toFixed(2)}`
})

const formattedOriginalPrice = computed(() => {
  if (!props.originalPrice) return null
  return `${props.currency}${props.originalPrice.toFixed(2)}`
})

const discount = computed(() => {
  if (!props.originalPrice) return 0
  return Math.round((1 - props.price / props.originalPrice) * 100)
})
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <span
      :class="[
        'font-bold text-gray-900',
        {
          'text-sm': size === 'sm',
          'text-lg': size === 'md',
          'text-2xl': size === 'lg',
          'text-3xl': size === 'xl'
        }
      ]"
    >
      {{ formattedPrice }}
    </span>
    <span
      v-if="originalPrice"
      :class="[
        'text-gray-400 line-through',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
          'text-base': size === 'lg',
          'text-lg': size === 'xl'
        }
      ]"
    >
      {{ formattedOriginalPrice }}
    </span>
    <span
      v-if="discount > 0"
      class="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-full"
    >
      -{{ discount }}%
    </span>
  </div>
</template>
