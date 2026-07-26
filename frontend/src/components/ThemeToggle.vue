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
    <AppIcon :name="dark ? 'moon' : 'sun'" :size="16" />
  </button>
</template>

<style scoped>
/* Lives in the inked header, so it is a hairline icon control rather than a
   sliding switch. A switch implies two settings held at once; this swaps one. */
.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--band-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--band-muted);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.theme-toggle:hover {
  background: var(--band-field);
  border-color: var(--band-muted);
  color: var(--band-text);
}
</style>
