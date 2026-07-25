<script setup lang="ts">
import { computed } from 'vue'
import { ICON_PATHS } from './icons'
import type { IconName } from './icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    filled?: boolean
    label?: string
  }>(),
  { size: 18, filled: false, label: undefined },
)

const d = computed(() => ICON_PATHS[props.name])
</script>

<template>
  <svg
    class="icon"
    :class="{ filled }"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
    :role="label ? 'img' : undefined"
  >
    <path :d="d" />
  </svg>
</template>

<style scoped>
.icon {
  flex: none;
  transition: fill var(--transition-fast);
}

.icon.filled path {
  fill: currentColor;
}
</style>
