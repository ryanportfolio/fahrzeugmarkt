<script setup lang="ts">
const props = defineProps<{
  label: string
  from: number | null
  to: number | null
  unit?: string
  min?: number
  step?: number
  fromPlaceholder?: string
  toPlaceholder?: string
}>()

const emit = defineEmits<{ 'update:from': [value: number | null]; 'update:to': [value: number | null] }>()

function parse(raw: string): number | null {
  if (!raw.trim()) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function onFrom(event: Event) {
  emit('update:from', parse((event.target as HTMLInputElement).value))
}

function onTo(event: Event) {
  emit('update:to', parse((event.target as HTMLInputElement).value))
}
</script>

<template>
  <!-- One ruled line per range, the two bounds set as figures either side of a
       dash, so the column reads as a spec sheet being filled in rather than as a
       form with eight boxes on it. -->
  <fieldset class="range">
    <legend class="range-label">{{ props.label }}</legend>
    <div class="pair">
      <label class="cell">
        <span class="visually-hidden">{{ props.label }} from</span>
        <input
          class="bound figure"
          type="number"
          inputmode="numeric"
          :min="props.min ?? 0"
          :step="props.step ?? 1"
          :placeholder="props.fromPlaceholder ?? 'Any'"
          :value="props.from ?? ''"
          @input="onFrom"
        />
      </label>
      <span class="dash" aria-hidden="true"></span>
      <label class="cell">
        <span class="visually-hidden">{{ props.label }} to</span>
        <input
          class="bound figure"
          type="number"
          inputmode="numeric"
          :min="props.min ?? 0"
          :step="props.step ?? 1"
          :placeholder="props.toPlaceholder ?? 'Any'"
          :value="props.to ?? ''"
          @input="onTo"
        />
      </label>
      <span v-if="props.unit" class="unit">{{ props.unit }}</span>
    </div>
  </fieldset>
</template>

<style scoped>
.range {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-2) 0;
  border: 0;
  border-bottom: var(--rule-hair) solid var(--border);
}

.range-label {
  padding: 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.pair {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.cell {
  min-width: 0;
}

.bound {
  width: 5ch;
  padding: 0;
  border: 0;
  border-bottom: var(--rule-hair) solid transparent;
  background: none;
  color: var(--text);
  font-size: var(--text-xs);
  text-align: right;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.bound::placeholder {
  color: var(--text-faint);
}

/* Spinners take more room than the five characters the field is sized for. */
.bound::-webkit-inner-spin-button,
.bound::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.bound {
  appearance: textfield;
}

.bound:hover {
  border-bottom-color: var(--border-strong);
}

.bound:focus-visible {
  border-bottom-width: var(--rule-mid);
  border-bottom-color: var(--accent);
}

.dash {
  width: 8px;
  height: 1px;
  flex: none;
  background: var(--border-strong);
}

.unit {
  flex: none;
  width: 3ch;
  font-family: var(--font-mono);
  font-size: var(--label-size);
  letter-spacing: 0.04em;
  color: var(--text-faint);
}
</style>
