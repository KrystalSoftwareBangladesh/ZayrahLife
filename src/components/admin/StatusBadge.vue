<script setup lang="ts">
import { computed } from 'vue'
import { humanizeStatusLabel, normalizeStatusValue } from '@/utils/status'

const props = defineProps({
  status: { type: String, required: true },
  size: { type: String, default: 'md' }
})

const statusConfig: Record<string, { bg: string, text: string, label?: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  DRAFT: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' },
  CONFIRMED: { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Confirmed' },
  PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing' },
  PACKAGED: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Packaged' },
  SHIPPED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Shipped' },
  OUT_FOR_DELIVERY: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', label: 'Out for Delivery' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
  RETURNED: { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Returned' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
  INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
  LOW: { bg: 'bg-red-100', text: 'text-red-800', label: 'Low Stock' },
  IN_STOCK: { bg: 'bg-green-100', text: 'text-green-800', label: 'In Stock' },
  OUT_OF_STOCK: { bg: 'bg-red-100', text: 'text-red-800', label: 'Out of Stock' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
  RUNNING: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Running' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Paused' },
  INCOME: { bg: 'bg-green-100', text: 'text-green-800', label: 'Income' },
  EXPENSE: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expense' },
  INVESTMENT: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Investment' }
}

const config = computed(() => {
  const normalizedStatus = normalizeStatusValue(props.status)
  const matched = statusConfig[normalizedStatus]
  return matched || { bg: 'bg-gray-100', text: 'text-gray-800' }
})

const label = computed(() => {
  const normalizedStatus = normalizeStatusValue(props.status)
  return statusConfig[normalizedStatus]?.label || humanizeStatusLabel(props.status)
})

const sizeClasses: Record<string, string> = {
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
    {{ label }}
  </span>
</template>
