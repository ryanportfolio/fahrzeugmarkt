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
  border: 0;
  background: none;
  color: var(--text-faint);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.save:hover {
  color: var(--danger);
}

.save:active {
  transform: scale(0.94);
}

.save.active {
  color: var(--danger);
}

/* There is no longer a photograph to sit on. The glass bubble this used to be was
   built to float over a cropped studio shot, and on the open page it read as a
   stray dark box. It is a bare mark in the plate's own head row now, sized to stay
   a comfortable target. */
/* No margin here on purpose. A margin shorthand in this component and the
   `margin-left: auto` its host sets have equal specificity, so which one wins would
   come down to stylesheet order. The host owns placement; this owns the target. */
.floating {
  width: 32px;
  height: 32px;
}

.save:focus-visible {
  color: var(--accent-text);
}

/* The one place it is a labelled control rather than a mark: the detail page, where
   it is an action and takes the ruled idiom the other actions use. */
.inline {
  height: 38px;
  padding: 0 0 3px;
  border-bottom: var(--rule-mid) solid var(--border-strong);
  color: var(--text);
  font-size: var(--text-sm);
  font-weight: 500;
}

.inline:hover,
.inline.active {
  border-bottom-color: var(--danger);
}

.text {
  white-space: nowrap;
}
</style>
