<script setup lang="ts">
import { computed } from 'vue'
import {
  bodyLabel,
  formatInspection,
  formatMileage,
  formatMonthYear,
  formatPower,
  fuelLabel,
  transmissionLabel,
} from '../format'
import type { VehicleDetailDto } from '../types'

const props = defineProps<{ vehicle: VehicleDetailDto }>()

const rows = computed(() => {
  const v = props.vehicle
  return [
    { label: 'Make', value: v.make },
    { label: 'Model', value: v.model },
    { label: 'Body type', value: bodyLabel(v.bodyType) },
    { label: 'First registration', value: formatMonthYear(v.firstRegistration) },
    { label: 'Mileage', value: formatMileage(v.mileageKm) },
    { label: 'Power', value: formatPower(v.powerKw) },
    { label: 'Fuel', value: fuelLabel(v.fuelType) },
    { label: 'Transmission', value: transmissionLabel(v.transmission) },
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
  font-size: var(--text-sm);
  font-weight: 620;
  text-align: right;
}

@media (min-width: 720px) {
  .specs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: var(--space-8);
  }
}
</style>
