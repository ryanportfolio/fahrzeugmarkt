<script setup lang="ts">
import { computed } from 'vue'
import RangeFilter from './RangeFilter.vue'
import { bodyLabel, fuelLabel, transmissionLabel } from '../format'
import type { FilterState, MultiField, RangeField } from '../browse/filters'
import type { BodyType, FacetsDto, FuelType, MetaDto, Transmission } from '../types'

const props = defineProps<{
  filters: FilterState
  meta: MetaDto | null
  facets: FacetsDto | null
  loading: boolean
}>()

const emit = defineEmits<{
  patch: [patch: Partial<FilterState>]
  reset: []
}>()

const makes = computed(() => props.meta?.makes ?? [])

const models = computed(() => {
  const make = makes.value.find((item) => item.name === props.filters.make)
  return make?.models ?? []
})

const fuelOptions = computed<FuelType[]>(() => props.meta?.fuelTypes ?? [])
const transmissionOptions = computed<Transmission[]>(() => props.meta?.transmissions ?? [])
const bodyOptions = computed<BodyType[]>(() => props.meta?.bodyTypes ?? [])

function facetCount(dimension: keyof FacetsDto, value: string): number | null {
  const buckets = props.facets?.[dimension]
  if (!buckets) return null
  return buckets.find((bucket) => bucket.value === value)?.count ?? 0
}

function makeCount(name: string): number | null {
  return facetCount('makes', name)
}

function toggle(field: MultiField, value: string) {
  const current = props.filters[field] as string[]
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value]
  emit('patch', { [field]: next } as Partial<FilterState>)
}

function setRange(field: RangeField, value: number | null) {
  emit('patch', { [field]: value } as Partial<FilterState>)
}

function onMake(event: Event) {
  emit('patch', { make: (event.target as HTMLSelectElement).value, model: '' })
}

function onModel(event: Event) {
  emit('patch', { model: (event.target as HTMLSelectElement).value })
}
</script>

<template>
  <div class="sidebar" :class="{ busy: loading }">
    <section class="group">
      <h3 class="group-title">Make and model</h3>
      <label class="field">
        <span class="field-label">Make</span>
        <select class="select" :value="filters.make" @change="onMake">
          <option value="">Any make</option>
          <option v-for="make in makes" :key="make.name" :value="make.name">
            {{ make.name }}<template v-if="makeCount(make.name) !== null">
              ({{ makeCount(make.name) }})</template
            >
          </option>
        </select>
      </label>
      <label class="field">
        <span class="field-label">Model</span>
        <select
          class="select"
          :value="filters.model"
          :disabled="!filters.make"
          @change="onModel"
        >
          <option value="">{{ filters.make ? 'Any model' : 'Pick a make first' }}</option>
          <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
        </select>
      </label>
    </section>

    <section class="group">
      <h3 class="group-title">Age, price and mileage</h3>
      <RangeFilter
        label="First registration"
        :from="filters.yearFrom"
        :to="filters.yearTo"
        :min="1990"
        from-placeholder="2008"
        to-placeholder="2025"
        @update:from="setRange('yearFrom', $event)"
        @update:to="setRange('yearTo', $event)"
      />
      <RangeFilter
        label="Price"
        unit="EUR"
        :step="500"
        :from="filters.priceFrom"
        :to="filters.priceTo"
        @update:from="setRange('priceFrom', $event)"
        @update:to="setRange('priceTo', $event)"
      />
      <RangeFilter
        label="Mileage"
        unit="km"
        :step="5000"
        :from="filters.mileageFrom"
        :to="filters.mileageTo"
        @update:from="setRange('mileageFrom', $event)"
        @update:to="setRange('mileageTo', $event)"
      />
      <RangeFilter
        label="Power"
        unit="kW"
        :step="10"
        :from="filters.powerFrom"
        :to="filters.powerTo"
        @update:from="setRange('powerFrom', $event)"
        @update:to="setRange('powerTo', $event)"
      />
    </section>

    <section class="group">
      <h3 class="group-title">Fuel</h3>
      <ul class="checks">
        <li v-for="fuel in fuelOptions" :key="fuel">
          <label class="check">
            <input
              type="checkbox"
              :checked="filters.fuelType.includes(fuel)"
              @change="toggle('fuelType', fuel)"
            />
            <span class="check-box" aria-hidden="true"></span>
            <span class="check-label">{{ fuelLabel(fuel) }}</span>
            <span v-if="facetCount('fuelTypes', fuel) !== null" class="count">
              {{ facetCount('fuelTypes', fuel) }}
            </span>
          </label>
        </li>
      </ul>
    </section>

    <section class="group">
      <h3 class="group-title">Transmission</h3>
      <ul class="checks">
        <li v-for="option in transmissionOptions" :key="option">
          <label class="check">
            <input
              type="checkbox"
              :checked="filters.transmission.includes(option)"
              @change="toggle('transmission', option)"
            />
            <span class="check-box" aria-hidden="true"></span>
            <span class="check-label">{{ transmissionLabel(option) }}</span>
            <span v-if="facetCount('transmissions', option) !== null" class="count">
              {{ facetCount('transmissions', option) }}
            </span>
          </label>
        </li>
      </ul>
    </section>

    <section class="group">
      <h3 class="group-title">Body type</h3>
      <div class="body-chips">
        <button
          v-for="body in bodyOptions"
          :key="body"
          type="button"
          class="body-chip"
          :class="{ on: filters.bodyType.includes(body) }"
          :aria-pressed="filters.bodyType.includes(body)"
          @click="toggle('bodyType', body)"
        >
          {{ bodyLabel(body) }}
          <span v-if="facetCount('bodyTypes', body) !== null" class="chip-count">
            {{ facetCount('bodyTypes', body) }}
          </span>
        </button>
      </div>
    </section>

    <button type="button" class="btn btn-secondary btn-block" @click="emit('reset')">
      Reset all filters
    </button>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  transition: opacity var(--transition-fast);
}

.sidebar.busy {
  opacity: 0.7;
}

.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border);
}

.group-title {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-subtle);
}

.checks {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.check {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  margin: 0 calc(var(--space-2) * -1);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.check:hover {
  background: var(--surface-hover);
}

.check input {
  position: absolute;
  opacity: 0;
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
}

.check-box {
  position: relative;
  flex: none;
  width: 17px;
  height: 17px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.check input:checked + .check-box {
  background: var(--accent);
  border-color: var(--accent);
}

.check input:checked + .check-box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid var(--accent-contrast);
  border-width: 0 2px 2px 0;
  transform: rotate(42deg);
}

.check input:focus-visible + .check-box {
  box-shadow: var(--focus-ring);
}

.check-label {
  flex: 1;
  color: var(--text);
}

.count {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  color: var(--text-subtle);
}

.body-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.body-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 30px;
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.body-chip:hover {
  border-color: var(--text);
  color: var(--text);
}

.body-chip.on {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
}

/* A count beside its own label, so it takes a dimmer token rather than
   transparency, which would leave its real contrast unknowable. */
.chip-count {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--text-subtle);
}

.body-chip.on .chip-count {
  color: var(--accent-soft-strong);
}
</style>
