<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import ListingCard from '../components/ListingCard.vue'
import ListingCardSkeleton from '../components/ListingCardSkeleton.vue'
import { errorMessage } from '../api/client'
import { formatCount } from '../format'
import { useSavedStore } from '../stores/saved'
import type { ListingCardDto } from '../types'

const saved = useSavedStore()
const actionError = ref<string | null>(null)

async function onToggleSave(listing: ListingCardDto) {
  actionError.value = null
  try {
    await saved.toggle(listing)
  } catch (error) {
    actionError.value = errorMessage(error)
  }
}

onMounted(() => void saved.load(true))
</script>

<template>
  <div class="shell page">
    <header class="head">
      <p class="eyebrow">Your shortlist</p>
      <h1>Saved vehicles</h1>
      <p class="lead">
        {{
          saved.loading
            ? 'Loading your shortlist'
            : `${formatCount(saved.listings.length, 'vehicle', 'vehicles')} kept for later`
        }}
      </p>
    </header>

    <p v-if="saved.error" class="alert alert-error">{{ saved.error }}</p>
    <p v-if="actionError" class="alert alert-error">{{ actionError }}</p>

    <div v-if="saved.loading" class="grid">
      <ListingCardSkeleton v-for="n in 4" :key="n" />
    </div>

    <div v-else-if="saved.listings.length" class="grid">
      <ListingCard
        v-for="listing in saved.listings"
        :key="listing.id"
        :listing="listing"
        :saved="saved.has(listing.id)"
        @toggle-save="onToggleSave"
      />
    </div>

    <EmptyState
      v-else
      icon="heart"
      title="Nothing saved yet"
      description="Tap the heart on any listing and it lands here, ready for a side-by-side comparison."
    >
      <RouterLink :to="{ name: 'browse' }" class="btn btn-primary">Browse vehicles</RouterLink>
    </EmptyState>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-8);
}

.lead {
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 560px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1400px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
