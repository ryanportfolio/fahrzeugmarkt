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

/* The catalogue is drawn for the night showroom, so dark is what an unset
 * preference resolves to. Only an explicit choice of light moves off it, which
 * is why this does not consult prefers-color-scheme: the stylesheet no longer
 * has a branch for it. */
export const DEFAULT_IS_DARK = true

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
    return choice.value === 'dark' || (choice.value === 'system' && DEFAULT_IS_DARK)
  }

  function toggle() {
    set(isDark() ? 'light' : 'dark')
  }

  return { choice, apply, set, toggle, isDark }
})
