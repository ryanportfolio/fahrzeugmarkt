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
  <fieldset class="range">
    <legend class="field-label">{{ props.label }}</legend>
    <div class="pair">
      <label class="cell">
        <span class="visually-hidden">{{ props.label }} from</span>
        <input
          class="input"
          type="number"
          inputmode="numeric"
          :min="props.min ?? 0"
          :step="props.step ?? 1"
          :placeholder="props.fromPlaceholder ?? 'From'"
          :value="props.from ?? ''"
          @input="onFrom"
        />
      </label>
      <span class="dash" aria-hidden="true"></span>
      <label class="cell">
        <span class="visually-hidden">{{ props.label }} to</span>
        <input
          class="input"
          type="number"
          inputmode="numeric"
          :min="props.min ?? 0"
          :step="props.step ?? 1"
          :placeholder="props.toPlaceholder ?? 'To'"
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
  margin: 0;
  padding: 0;
  border: none;
}

.pair {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.cell {
  flex: 1;
  min-width: 0;
}

.cell .input {
  height: 36px;
  font-size: var(--text-xs);
}

.dash {
  width: 10px;
  height: 1px;
  flex: none;
  background: var(--border-strong);
}

.unit {
  flex: none;
  font-size: var(--text-xs);
  color: var(--text-subtle);
}
</style>
