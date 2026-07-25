<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

withDefaults(
  defineProps<{
    icon?: IconName
    title: string
    description?: string
    tone?: 'neutral' | 'error'
  }>(),
  { icon: 'search', description: undefined, tone: 'neutral' },
)
</script>

<template>
  <div class="empty" :class="tone">
    <span class="glyph"><AppIcon :name="icon" :size="26" /></span>
    <h3 class="title">{{ title }}</h3>
    <p v-if="description" class="description">{{ description }}</p>
    <div class="actions"><slot /></div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-2);
  padding: var(--space-16) var(--space-6);
  background: var(--surface-card);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
}

.glyph {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  color: var(--accent-text);
}

.empty.error .glyph {
  background: var(--danger-soft);
  color: var(--danger);
}

.title {
  font-size: var(--text-lg);
  font-weight: 640;
}

.description {
  max-width: 42ch;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.actions:not(:empty) {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
</style>
