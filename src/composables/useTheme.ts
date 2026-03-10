import { computed, ref } from 'vue'

type ThemeMode = 'light' | 'dark'
type ThemeChangeEvent = { matches: boolean }

const STORAGE_KEY = 'zayrahlife-theme'

const theme = ref<ThemeMode>('light')

let initialized = false
let mediaQuery: ReturnType<typeof window.matchMedia> | null = null
let mediaQueryHandler: ((_: ThemeChangeEvent) => void) | null = null

const applyTheme = (value: ThemeMode) => {
  if (typeof document === 'undefined') return

  document.documentElement.classList.toggle('dark', value === 'dark')
  document.documentElement.dataset.theme = value
  document.documentElement.style.colorScheme = value
  document.body?.classList.toggle('dark', value === 'dark')
}

const setTheme = (value: ThemeMode, persist = true) => {
  theme.value = value
  applyTheme(value)

  if (typeof window !== 'undefined' && persist) {
    window.localStorage.setItem(STORAGE_KEY, value)
  }
}

const initTheme = () => {
  if (initialized || typeof window === 'undefined') {
    if (initialized) {
      applyTheme(theme.value)
    }
    return
  }

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') {
    theme.value = storedTheme
  } else {
    theme.value = mediaQuery.matches ? 'dark' : 'light'
  }

  applyTheme(theme.value)

  mediaQueryHandler = (event: ThemeChangeEvent) => {
    if (window.localStorage.getItem(STORAGE_KEY)) return
    theme.value = event.matches ? 'dark' : 'light'
    applyTheme(theme.value)
  }

  mediaQuery.addEventListener('change', mediaQueryHandler)
  initialized = true
}

const toggleTheme = () => {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

export const useTheme = () => ({
  theme,
  isDark: computed(() => theme.value === 'dark'),
  initTheme,
  setTheme,
  toggleTheme
})
