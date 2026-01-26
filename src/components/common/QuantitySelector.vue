<script setup>
const props = defineProps({
  modelValue: {
    type: Number,
    default: 1
  },
  min: {
    type: Number,
    default: 1
  },
  max: {
    type: Number,
    default: 99
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue'])

const decrease = () => {
  if (props.modelValue > props.min) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

const increase = () => {
  if (props.modelValue < props.max) {
    emit('update:modelValue', props.modelValue + 1)
  }
}

const handleInput = (event) => {
  const value = parseInt(event.target.value) || props.min
  const clampedValue = Math.min(Math.max(value, props.min), props.max)
  emit('update:modelValue', clampedValue)
}
</script>

<template>
  <div
    :class="[
      'inline-flex items-center border border-gray-300 rounded-lg overflow-hidden',
      {
        'h-8': size === 'sm',
        'h-10': size === 'md',
        'h-12': size === 'lg'
      }
    ]"
  >
    <button
      :class="[
        'flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'w-8': size === 'sm',
          'w-10': size === 'md',
          'w-12': size === 'lg'
        }
      ]"
      :disabled="modelValue <= min"
      @click="decrease"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
      </svg>
    </button>
    <input
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      :class="[
        'text-center border-x border-gray-300 focus:outline-none',
        {
          'w-10 text-sm': size === 'sm',
          'w-12 text-base': size === 'md',
          'w-14 text-lg': size === 'lg'
        }
      ]"
      @input="handleInput"
    />
    <button
      :class="[
        'flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'w-8': size === 'sm',
          'w-10': size === 'md',
          'w-12': size === 'lg'
        }
      ]"
      :disabled="modelValue >= max"
      @click="increase"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>
