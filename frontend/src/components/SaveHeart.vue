<script setup lang="ts">
import AppIcon from './AppIcon.vue'

withDefaults(
  defineProps<{
    saved: boolean
    label?: string
    variant?: 'floating' | 'inline'
    size?: number
  }>(),
  { label: undefined, variant: 'floating', size: 18 },
)

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="save"
    :class="[variant, { active: saved }]"
    :aria-pressed="saved"
    :aria-label="label ?? (saved ? 'Remove from saved vehicles' : 'Save this vehicle')"
    :title="saved ? 'Remove from saved vehicles' : 'Save this vehicle'"
    @click.stop.prevent="emit('toggle')"
  >
    <AppIcon name="heart" :size="size" :filled="saved" />
    <span v-if="variant === 'inline'" class="text">{{ saved ? 'Saved' : 'Save' }}</span>
  </button>
</template>

<style scoped>
.save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.save:hover {
  color: var(--danger);
  border-color: var(--danger);
}

.save:active {
  transform: scale(0.94);
}

.save.active {
  color: var(--danger);
  border-color: var(--danger);
}

/* Sits on the photograph, so it is inked like the body-type stamp rather than
   floated as a white bubble. */
.floating {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border-color: rgba(243, 242, 239, 0.28);
  background: rgba(10, 11, 12, 0.6);
  color: rgba(243, 242, 239, 0.92);
  backdrop-filter: blur(6px);
}

.floating:hover,
.floating.active {
  background: rgba(10, 11, 12, 0.78);
}

.inline {
  height: 48px;
  padding: 0 var(--space-5);
  font-size: var(--text-sm);
  font-weight: 620;
}

.text {
  white-space: nowrap;
}
</style>
