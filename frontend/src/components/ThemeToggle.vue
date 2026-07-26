<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { DEFAULT_IS_DARK, useThemeStore } from '../stores/theme'

const theme = useThemeStore()
const dark = computed(() => theme.choice === 'dark' || (theme.choice === 'system' && DEFAULT_IS_DARK))
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
/* A bare mark in the running head. It was a bordered rounded tile, which made it
   the only box in a header of ruled text. A switch is also wrong here: a switch
   implies two settings held at once, and this swaps one. */
.theme-toggle {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  background: none;
  color: var(--band-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.theme-toggle:hover {
  color: var(--accent-on-band);
}

.theme-toggle:focus-visible {
  color: var(--accent-on-band);
}
</style>
