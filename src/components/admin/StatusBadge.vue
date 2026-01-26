<script setup>
const props = defineProps({
  status: { type: String, required: true },
  size: { type: String, default: 'md' }
})

const statusConfig = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
  shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
  low: { bg: 'bg-red-100', text: 'text-red-800', label: 'Low Stock' },
  in_stock: { bg: 'bg-green-100', text: 'text-green-800', label: 'In Stock' },
  out_of_stock: { bg: 'bg-red-100', text: 'text-red-800', label: 'Out of Stock' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
  running: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Running' },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Paused' },
  income: { bg: 'bg-green-100', text: 'text-green-800', label: 'Income' },
  expense: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expense' },
  investment: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Investment' }
}

const config = statusConfig[props.status.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', label: props.status }

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
}
</script>

<template>
  <span
    :class="[config.bg, config.text, sizeClasses[size]]"
    class="inline-flex items-center font-medium rounded-full"
  >
    {{ config.label }}
  </span>
</template>
