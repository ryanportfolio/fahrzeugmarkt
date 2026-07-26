<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

const pages = computed(() => {
  const total = props.totalPages
  const current = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)

  const items: Array<number | 'gap'> = [0]
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)
  if (start > 1) items.push('gap')
  for (let i = start; i <= end; i += 1) items.push(i)
  if (end < total - 2) items.push('gap')
  items.push(total - 1)
  return items
})

function go(page: number) {
  if (page < 0 || page >= props.totalPages || page === props.page) return
  emit('change', page)
}
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Pagination">
    <button
      type="button"
      class="btn btn-secondary btn-sm nav-btn"
      :disabled="page === 0"
      aria-label="Previous page"
      @click="go(page - 1)"
    >
      <AppIcon name="chevron-left" :size="16" />
      <span class="nav-text">Previous</span>
    </button>

    <ol class="numbers">
      <li v-for="(item, index) in pages" :key="`${item}-${index}`">
        <span v-if="item === 'gap'" class="gap">…</span>
        <button
          v-else
          type="button"
          class="number"
          :class="{ current: item === page }"
          :aria-current="item === page ? 'page' : undefined"
          @click="go(item)"
        >
          {{ item + 1 }}
        </button>
      </li>
    </ol>

    <button
      type="button"
      class="btn btn-secondary btn-sm nav-btn"
      :disabled="page >= totalPages - 1"
      aria-label="Next page"
      @click="go(page + 1)"
    >
      <span class="nav-text">Next</span>
      <AppIcon name="chevron-right" :size="16" />
    </button>
  </nav>
</template>

<style scoped>
/* Sits on a rule, so the page numbers read as part of the results table
   rather than as a floating widget under it. */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  flex-wrap: wrap;
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}

.numbers {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.number {
  min-width: 32px;
  height: 32px;
  padding: 0 var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.number:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.number.current {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-contrast);
}

.gap {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  color: var(--text-subtle);
}

.nav-text {
  display: none;
}

@media (min-width: 640px) {
  .nav-text {
    display: inline;
  }
}
</style>
