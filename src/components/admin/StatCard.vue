<script setup>
import { computed } from 'vue'

const colorClasses = {
  primary: 'bg-primary-100 text-primary-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700'
}

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: '' },
  trend: { type: Number, default: null },
  color: { type: String, default: 'primary' }
})

const iconMap = {
  users: 'M17 20h5v-1a4 4 0 00-5.9-3.5M17 20H7m10 0v-1c0-.7-.1-1.4-.3-2M7 20H2v-1a4 4 0 015.9-3.5M7 20v-1c0-.7.1-1.4.3-2m0 0a5 5 0 119.4 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  check: 'M5 13l4 4L19 7',
  clock: 'M12 8v4l3 3M12 22a10 10 0 100-20 10 10 0 000 20z',
  file: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a2 2 0 011.4.6l3.4 3.4a2 2 0 01.6 1.4V19a2 2 0 01-2 2z',
  dollar: 'text:৳',
  bdt: 'text:৳',
  alert: 'M12 9v4m0 4h.01M10.3 3.8l-8 14A1 1 0 003.2 19h17.6a1 1 0 00.9-1.5l-8-14a1 1 0 00-1.8 0z'
}

const resolvedIcon = computed(() => {
  if (!props.icon) return ''
  return iconMap[props.icon] || props.icon
})

const isTextIcon = computed(() => typeof resolvedIcon.value === 'string' && resolvedIcon.value.startsWith('text:'))
const resolvedIconText = computed(() => (isTextIcon.value ? resolvedIcon.value.slice(5) : ''))
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-500">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ value }}</p>
        <div v-if="trend !== null" class="flex items-center mt-2">
          <span
            :class="trend >= 0 ? 'text-green-600' : 'text-red-600'"
            class="text-sm font-medium flex items-center"
          >
            <svg v-if="trend >= 0" class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            <svg v-else class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            {{ Math.abs(trend) }}%
          </span>
          <span class="text-gray-400 text-sm ml-2">vs last month</span>
        </div>
      </div>
      <div v-if="icon" :class="[colorClasses[color]]" class="w-12 h-12 rounded-lg flex items-center justify-center">
        <span v-if="isTextIcon" class="text-xl font-bold leading-none">{{ resolvedIconText }}</span>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="resolvedIcon" />
        </svg>
      </div>
    </div>
  </div>
</template>
