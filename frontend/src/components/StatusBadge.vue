<script setup lang="ts">
import { computed } from 'vue'
import { statusLabel } from '../format'
import type { ListingStatus } from '../types'

const props = defineProps<{ status: ListingStatus }>()

const variant = computed(() => {
  if (props.status === 'ACTIVE') return 'badge-success'
  if (props.status === 'FLAGGED') return 'badge-warning'
  return 'badge-danger'
})
</script>

<template>
  <span class="badge" :class="variant">{{ statusLabel(status) }}</span>
</template>
