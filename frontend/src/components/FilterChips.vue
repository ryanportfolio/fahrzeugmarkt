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
  gap: var(--space-2) var(--space-4);
}

/* Ruled terms, not filled pills. These are the last set of pills in the product,
   and a row of tinted lozenges under a page of hairlines belonged to a different
   design. The accent marks them as applied; the rule under them makes them look
   removable. */
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0 6px;
  border: 0;
  border-bottom: var(--rule-mid) solid var(--accent);
  background: none;
  color: var(--accent-text);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.chip:hover {
  color: var(--danger);
  border-bottom-color: var(--danger);
}

.chip-label {
  white-space: nowrap;
}

.clear {
  padding: var(--space-2) 0 6px;
  border: 0;
  border-bottom: var(--rule-hair) solid var(--border-strong);
  background: none;
  color: var(--text-subtle);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.clear:hover {
  color: var(--text);
  border-bottom-color: var(--text);
}
</style>
