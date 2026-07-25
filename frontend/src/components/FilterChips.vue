<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { FilterChip } from '../browse/filters'

defineProps<{ chips: FilterChip[] }>()

const emit = defineEmits<{ remove: [chip: FilterChip]; clear: [] }>()
</script>

<template>
  <div v-if="chips.length" class="chips" role="group" aria-label="Active filters">
    <button
      v-for="chip in chips"
      :key="chip.id"
      type="button"
      class="chip"
      :data-chip="chip.id"
      :aria-label="`Remove filter ${chip.label}`"
      @click="emit('remove', chip)"
    >
      <span class="chip-label">{{ chip.label }}</span>
      <AppIcon name="x" :size="13" />
    </button>

    <button type="button" class="clear" @click="emit('clear')">Clear all</button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 30px;
  padding: 0 var(--space-2) 0 var(--space-3);
  border: 1px solid var(--accent-soft-strong);
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.chip:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
}

.chip-label {
  white-space: nowrap;
}

.clear {
  height: 30px;
  padding: 0 var(--space-2);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.clear:hover {
  color: var(--danger);
}
</style>
