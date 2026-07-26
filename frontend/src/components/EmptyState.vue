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
/* A blank page in the catalogue, not a dashed box with a tinted tile in it. Opened
   by the same rule every other block uses, set left, and given room. */
.empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-8) 0 var(--space-16);
  border-top: var(--rule-mid) solid var(--text);
}

.glyph {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-faint);
}

.empty.error .glyph {
  color: var(--danger);
}

.title {
  font-size: var(--text-2xl);
  font-weight: 400;
  letter-spacing: -0.026em;
}

.description {
  max-width: 42ch;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.actions:not(:empty) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
</style>
