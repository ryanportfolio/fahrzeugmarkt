import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeChoice = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'fm-theme'

function readStored(): ThemeChoice {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

function systemPrefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = defineStore('theme', () => {
  const choice = ref<ThemeChoice>(readStored())

  function apply() {
    const root = document.documentElement
    if (choice.value === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', choice.value)
  }

  function set(next: ThemeChoice) {
    choice.value = next
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable */
    }
    apply()
  }

  function isDark(): boolean {
    return choice.value === 'dark' || (choice.value === 'system' && systemPrefersDark())
  }

  function toggle() {
    set(isDark() ? 'light' : 'dark')
  }

  return { choice, apply, set, toggle, isDark }
})
