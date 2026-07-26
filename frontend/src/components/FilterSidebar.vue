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

/* A facet with no matches is a filter that is guaranteed to empty the page, so it is
 * shown, dimmed, and not clickable. Hiding it instead would make the list of body
 * types change length as you filter, which is worse. An already-applied filter stays
 * live whatever its count, or you could not undo it. */
function isDead(dimension: keyof FacetsDto, value: string, applied: boolean): boolean {
  if (applied) return false
  return facetCount(dimension, value) === 0
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
      <h3 class="group-title micro-label">Make and model</h3>

      <label class="ruled-select">
        <span class="visually-hidden">Make</span>
        <select :value="filters.make" @change="onMake">
          <option value="">Any make</option>
          <option v-for="make in makes" :key="make.name" :value="make.name">
            {{ make.name }}<template v-if="makeCount(make.name) !== null">
              ({{ makeCount(make.name) }})</template
            >
          </option>
        </select>
        <span class="caret" aria-hidden="true"></span>
      </label>

      <label class="ruled-select" :class="{ off: !filters.make }">
        <span class="visually-hidden">Model</span>
        <select :value="filters.model" :disabled="!filters.make" @change="onModel">
          <option value="">{{ filters.make ? 'Any model' : 'Pick a make first' }}</option>
          <option v-for="model in models" :key="model" :value="model">{{ model }}</option>
        </select>
        <span class="caret" aria-hidden="true"></span>
      </label>
    </section>

    <section class="group">
      <h3 class="group-title micro-label">Age, price and mileage</h3>
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

    <!-- Ruled rows, not checkbox squares. A selected row is marked by the accent
         rule on its leading edge and its label going to full ink, which is the same
         way selection is shown everywhere else on the surface. -->
    <section class="group">
      <h3 class="group-title micro-label">Fuel</h3>
      <ul class="rows">
        <li v-for="fuel in fuelOptions" :key="fuel">
          <button
            type="button"
            class="row"
            :class="{
              on: filters.fuelType.includes(fuel),
              dead: isDead('fuelTypes', fuel, filters.fuelType.includes(fuel)),
            }"
            :aria-pressed="filters.fuelType.includes(fuel)"
            :disabled="isDead('fuelTypes', fuel, filters.fuelType.includes(fuel))"
            @click="toggle('fuelType', fuel)"
          >
            <span class="row-label">{{ fuelLabel(fuel) }}</span>
            <span v-if="facetCount('fuelTypes', fuel) !== null" class="row-count figure">
              {{ facetCount('fuelTypes', fuel) }}
            </span>
          </button>
        </li>
      </ul>
    </section>

    <section class="group">
      <h3 class="group-title micro-label">Transmission</h3>
      <ul class="rows">
        <li v-for="option in transmissionOptions" :key="option">
          <button
            type="button"
            class="row"
            :class="{
              on: filters.transmission.includes(option),
              dead: isDead('transmissions', option, filters.transmission.includes(option)),
            }"
            :aria-pressed="filters.transmission.includes(option)"
            :disabled="isDead('transmissions', option, filters.transmission.includes(option))"
            @click="toggle('transmission', option)"
          >
            <span class="row-label">{{ transmissionLabel(option) }}</span>
            <span v-if="facetCount('transmissions', option) !== null" class="row-count figure">
              {{ facetCount('transmissions', option) }}
            </span>
          </button>
        </li>
      </ul>
    </section>

    <section class="group">
      <h3 class="group-title micro-label">Body type</h3>
      <ul class="rows">
        <li v-for="body in bodyOptions" :key="body">
          <button
            type="button"
            class="row"
            :class="{
              on: filters.bodyType.includes(body),
              dead: isDead('bodyTypes', body, filters.bodyType.includes(body)),
            }"
            :aria-pressed="filters.bodyType.includes(body)"
            :disabled="isDead('bodyTypes', body, filters.bodyType.includes(body))"
            @click="toggle('bodyType', body)"
          >
            <span class="row-label">{{ bodyLabel(body) }}</span>
            <span v-if="facetCount('bodyTypes', body) !== null" class="row-count figure">
              {{ facetCount('bodyTypes', body) }}
            </span>
          </button>
        </li>
      </ul>
    </section>

    <button type="button" class="reset" @click="emit('reset')">Reset all filters</button>
  </div>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  transition: opacity var(--transition-fast);
}

.sidebar.busy {
  opacity: 0.7;
}

.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.group-title {
  color: var(--text-subtle);
}

/* A native select stripped to a ruled line, so the column carries no boxes. The
   element itself still handles keyboard and touch; only its chrome is gone. */
.ruled-select {
  position: relative;
  display: block;
}

.ruled-select select {
  appearance: none;
  width: 100%;
  padding: 0 var(--space-5) var(--space-2) 0;
  border: 0;
  border-bottom: var(--rule-hair) solid var(--border-strong);
  border-radius: 0;
  background: none;
  color: var(--text);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast);
}

.ruled-select select:hover:not(:disabled) {
  border-bottom-color: var(--text);
}

/* The global focus ring is a box shadow, which reads oddly around a control with no
   box, so it is replaced rather than removed: the rule doubles in weight and takes
   the accent, the same signal every other ruled control on the surface uses. */
.ruled-select select:focus-visible {
  border-bottom-width: var(--rule-mid);
  border-bottom-color: var(--accent);
}

.ruled-select.off select {
  color: var(--text-faint);
  cursor: default;
}

/* Drawn rather than set: a rotated glyph read as a tilde at this size. */
.caret {
  position: absolute;
  right: 2px;
  bottom: 11px;
  width: 7px;
  height: 7px;
  border-right: var(--rule-hair) solid var(--text-faint);
  border-bottom: var(--rule-hair) solid var(--text-faint);
  transform: rotate(45deg);
  pointer-events: none;
}

.rows {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) 0 var(--space-2) var(--space-3);
  border: 0;
  border-bottom: var(--rule-hair) solid var(--border);
  box-shadow: inset 2px 0 0 transparent;
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.row:hover {
  color: var(--text);
  box-shadow: inset 2px 0 0 var(--border-strong);
}

.row.on {
  color: var(--text);
  box-shadow: inset 2px 0 0 var(--accent);
}

.row.dead {
  color: var(--text-faint);
  cursor: default;
}

.row.dead:hover {
  color: var(--text-faint);
  box-shadow: inset 2px 0 0 transparent;
}

.row-count {
  flex: none;
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.row.on .row-count {
  color: var(--accent-text);
}

.reset {
  align-self: flex-start;
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

.reset:hover {
  color: var(--text);
  border-bottom-color: var(--text);
}
</style>
