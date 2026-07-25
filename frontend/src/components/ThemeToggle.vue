<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useThemeStore } from '../stores/theme'

const theme = useThemeStore()
const dark = computed(() => theme.choice === 'dark' || (theme.choice === 'system' && prefersDark()))

function prefersDark(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="dark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="dark ? 'Switch to light theme' : 'Switch to dark theme'"
    @click="theme.toggle()"
  >
    <span class="knob" :class="{ dark }">
      <AppIcon :name="dark ? 'moon' : 'sun'" :size="15" />
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  width: 56px;
  height: 32px;
  padding: 3px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  cursor: pointer;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-fast);
}

.theme-toggle:hover {
  border-color: var(--accent);
}

.knob {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--surface-card);
  color: var(--text-muted);
  box-shadow: var(--shadow-sm);
  transform: translateX(0);
  transition:
    transform var(--transition-base),
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.knob.dark {
  transform: translateX(24px);
  background: var(--accent);
  color: var(--accent-contrast);
}
</style>
