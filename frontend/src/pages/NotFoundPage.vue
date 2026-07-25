<script setup lang="ts">
import EmptyState from '../components/EmptyState.vue'
</script>

<template>
  <div class="shell page">
    <EmptyState
      icon="search"
      title="That page does not exist"
      description="The link may be out of date. The search is the fastest way back to a vehicle."
    >
      <RouterLink :to="{ name: 'browse' }" class="btn btn-primary">Go to search</RouterLink>
    </EmptyState>
  </div>
</template>
