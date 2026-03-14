<script setup>
defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: 'Add New' },
  size: { type: String, default: 'md' },
  zIndexClass: { type: String, default: 'z-50' }
})

defineEmits(['close', 'submit'])

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" :class="zIndexClass" class="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>
        <div :class="sizeClasses[size]" class="relative bg-white rounded-lg shadow-xl w-full my-8">
          <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <button
              @click="$emit('close')"
              class="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form @submit.prevent="$emit('submit')">
            <div class="p-4 max-h-[70vh] overflow-y-auto">
              <slot></slot>
            </div>
            <div class="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                type="button"
                @click="$emit('close')"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <slot name="actions">
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
              </slot>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
