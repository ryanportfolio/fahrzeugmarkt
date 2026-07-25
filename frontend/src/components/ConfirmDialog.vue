<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    busy?: boolean
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', busy: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="overlay" @keydown.esc="emit('cancel')">
      <div class="backdrop" @click="emit('cancel')"></div>
      <div class="dialog" role="alertdialog" aria-modal="true" :aria-label="title">
        <h2 class="title">{{ title }}</h2>
        <p class="message">{{ message }}</p>
        <div class="actions">
          <button type="button" class="btn btn-secondary" :disabled="busy" @click="emit('cancel')">
            {{ cancelLabel }}
          </button>
          <button type="button" class="btn btn-danger" :disabled="busy" @click="emit('confirm')">
            {{ busy ? 'Working' : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

.backdrop {
  position: absolute;
  inset: 0;
  background: var(--surface-overlay);
}

.dialog {
  position: relative;
  width: min(420px, 100%);
  padding: var(--space-6);
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.title {
  font-size: var(--text-lg);
  font-weight: 660;
}

.message {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
