<script setup lang="ts">
import { computed } from 'vue'
import { formatInspection } from '../format'
import type { VehicleDetailDto } from '../types'

const props = defineProps<{ vehicle: VehicleDetailDto }>()

// The price panel beside the gallery already carries registration, mileage,
// power, fuel, transmission and body type. Repeating them here made two thirds
// of this table an echo, so it now covers only what the panel does not.
const rows = computed(() => {
  const v = props.vehicle
  return [
    { label: 'Make', value: v.make },
    { label: 'Model', value: v.model },
    { label: 'Colour', value: v.color },
    { label: 'Doors', value: v.doors !== null ? String(v.doors) : 'Not specified' },
    { label: 'Seats', value: v.seats !== null ? String(v.seats) : 'Not specified' },
    { label: 'Next inspection', value: formatInspection(v.nextInspection) },
  ]
})
</script>

<template>
  <dl class="specs">
    <div v-for="row in rows" :key="row.label" class="row">
      <dt>{{ row.label }}</dt>
      <dd>{{ row.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.specs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  margin: 0;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

dt {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

dd {
  margin: 0;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: -0.01em;
  text-align: right;
}

@media (min-width: 720px) {
  .specs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--space-8);
  }
}
</style>
