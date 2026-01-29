<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  close: []
}>()

const display = ref('0')
const previousValue = ref<number | null>(null)
const operator = ref<string | null>(null)
const waitingForOperand = ref(false)

const inputDigit = (digit: string) => {
  if (waitingForOperand.value) {
    display.value = digit
    waitingForOperand.value = false
  } else {
    display.value = display.value === '0' ? digit : display.value + digit
  }
}

const inputDecimal = () => {
  if (waitingForOperand.value) {
    display.value = '0.'
    waitingForOperand.value = false
    return
  }
  if (!display.value.includes('.')) {
    display.value += '.'
  }
}

const clear = () => {
  display.value = '0'
  previousValue.value = null
  operator.value = null
  waitingForOperand.value = false
}

const toggleSign = () => {
  const value = parseFloat(display.value)
  display.value = String(value * -1)
}

const percentage = () => {
  const value = parseFloat(display.value)
  display.value = String(value / 100)
}

const performOperation = (nextOperator: string) => {
  const inputValue = parseFloat(display.value)

  if (previousValue.value === null) {
    previousValue.value = inputValue
  } else if (operator.value) {
    const result = calculate(previousValue.value, inputValue, operator.value)
    display.value = String(result)
    previousValue.value = result
  }

  waitingForOperand.value = true
  operator.value = nextOperator
}

const calculate = (a: number, b: number, op: string): number => {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': return b !== 0 ? a / b : 0
    default: return b
  }
}

const equals = () => {
  if (operator.value === null || previousValue.value === null) return

  const inputValue = parseFloat(display.value)
  const result = calculate(previousValue.value, inputValue, operator.value)
  
  display.value = String(result)
  previousValue.value = null
  operator.value = null
  waitingForOperand.value = true
}

const formattedDisplay = computed(() => {
  const num = parseFloat(display.value)
  if (isNaN(num)) return display.value
  if (display.value.endsWith('.')) return display.value
  if (display.value.includes('.') && display.value.endsWith('0')) return display.value
  return num.toLocaleString('en-US', { maximumFractionDigits: 10 })
})

const buttons = [
  { label: 'C', action: clear, class: 'bg-gray-200 text-gray-800' },
  { label: '+/-', action: toggleSign, class: 'bg-gray-200 text-gray-800' },
  { label: '%', action: percentage, class: 'bg-gray-200 text-gray-800' },
  { label: '÷', action: () => performOperation('/'), class: 'bg-gold-500 text-white' },
  { label: '7', action: () => inputDigit('7'), class: 'bg-gray-100 text-gray-800' },
  { label: '8', action: () => inputDigit('8'), class: 'bg-gray-100 text-gray-800' },
  { label: '9', action: () => inputDigit('9'), class: 'bg-gray-100 text-gray-800' },
  { label: '×', action: () => performOperation('*'), class: 'bg-gold-500 text-white' },
  { label: '4', action: () => inputDigit('4'), class: 'bg-gray-100 text-gray-800' },
  { label: '5', action: () => inputDigit('5'), class: 'bg-gray-100 text-gray-800' },
  { label: '6', action: () => inputDigit('6'), class: 'bg-gray-100 text-gray-800' },
  { label: '-', action: () => performOperation('-'), class: 'bg-gold-500 text-white' },
  { label: '1', action: () => inputDigit('1'), class: 'bg-gray-100 text-gray-800' },
  { label: '2', action: () => inputDigit('2'), class: 'bg-gray-100 text-gray-800' },
  { label: '3', action: () => inputDigit('3'), class: 'bg-gray-100 text-gray-800' },
  { label: '+', action: () => performOperation('+'), class: 'bg-gold-500 text-white' },
  { label: '0', action: () => inputDigit('0'), class: 'bg-gray-100 text-gray-800 col-span-2' },
  { label: '.', action: inputDecimal, class: 'bg-gray-100 text-gray-800' },
  { label: '=', action: equals, class: 'bg-primary-600 text-white' }
]
</script>

<template>
  <div class="bg-white rounded-xl shadow-2xl overflow-hidden w-72 border border-gray-200">
    <div class="bg-gray-900 px-4 py-2 flex items-center justify-between">
      <span class="text-white text-sm font-medium">Calculator</span>
      <button @click="emit('close')" class="text-gray-400 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    <div class="bg-gray-800 px-4 py-5 text-right">
      <div class="text-white text-3xl font-light truncate">{{ formattedDisplay }}</div>
    </div>
    <div class="grid grid-cols-4 gap-px bg-gray-300 p-px">
      <button
        v-for="btn in buttons"
        :key="btn.label"
        @click="btn.action"
        :class="[
          btn.class,
          btn.label === '0' ? 'col-span-2' : '',
          'py-4 text-lg font-medium hover:opacity-80 transition-opacity active:opacity-60'
        ]"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>
