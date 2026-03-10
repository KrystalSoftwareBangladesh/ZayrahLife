<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme } = useTheme()

const label = computed(() => (isDark.value ? 'Switch to light mode' : 'Switch to dark mode'))
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <span class="theme-toggle__icon" aria-hidden="true">
      <svg v-if="isDark" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
      <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </span>
    <span class="hidden sm:inline">{{ isDark ? 'Light' : 'Dark' }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  border: 1px solid var(--color-border-strong);
  border-radius: 9999px;
  background: var(--color-surface-muted);
  color: var(--color-text-primary);
  padding: 0.55rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.theme-toggle:hover {
  background: var(--color-surface-elevated);
  transform: translateY(-1px);
}

.theme-toggle:focus-visible {
  outline: 2px solid rgb(45 143 123 / 0.45);
  outline-offset: 2px;
}

.theme-toggle__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
