<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CatalogueIndex from '../components/CatalogueIndex.vue'
import CompareTray from '../components/CompareTray.vue'
import EmptyState from '../components/EmptyState.vue'
import { errorMessage } from '../api/client'
import { formatCount } from '../format'
import { useCompareStore } from '../stores/compare'
import { useSavedStore } from '../stores/saved'
import type { ListingCardDto } from '../types'

const saved = useSavedStore()
const compare = useCompareStore()
const actionError = ref<string | null>(null)

async function onToggleSave(listing: ListingCardDto) {
  actionError.value = null
  try {
    await saved.toggle(listing)
  } catch (error) {
    actionError.value = errorMessage(error)
  }
}

function onToggleCompare(listing: ListingCardDto) {
  if (!compare.toggle(listing)) {
    actionError.value = 'The comparison holds three vehicles. Drop one to add another.'
  }
}

onMounted(() => void saved.load(true))
</script>

<template>
  <!-- The shortlist is the index view of the catalogue: the same drawings, the same
       figure columns, filtered to what was kept. Rebuilding it as its own card grid
       would put a second visual language in the product. -->
  <div class="shell page" :class="{ 'tray-open': compare.entries.length > 0 }">
    <header class="head">
      <p class="edition">
        <span>Fahrzeugmarkt</span>
        <span class="edition-sep">/</span>
        <span>Your shortlist</span>
      </p>
      <h1 class="title">Kept for later</h1>
      <p class="lead figure">
        {{
          saved.loading
            ? 'Loading'
            : formatCount(saved.listings.length, 'vehicle', 'vehicles')
        }}
      </p>
    </header>

    <p v-if="saved.error" class="alert alert-error">{{ saved.error }}</p>
    <p v-if="actionError" class="alert alert-error">{{ actionError }}</p>

    <div v-if="saved.loading" class="skeleton index-skeleton"></div>

    <CatalogueIndex
      v-else-if="saved.listings.length"
      :listings="saved.listings"
      :offset="1"
      :saved-ids="saved.ids"
      :compared-ids="compare.ids"
      @toggle-save="onToggleSave"
      @toggle-compare="onToggleCompare"
    />

    <EmptyState
      v-else
      icon="heart"
      title="Nothing saved yet"
      description="Tap the heart on any plate and it lands here, ready to be stood beside another."
    >
      <RouterLink :to="{ name: 'browse' }" class="btn btn-primary">Browse the catalogue</RouterLink>
    </EmptyState>

    <CompareTray />
  </div>
</template>

<style scoped>
/* padding-block, not padding: the shorthand also zeroed the inline gutter this
   element inherits from .shell, which pushed the title hard against the viewport
   edge and clipped its first letter. */
.page {
  padding-block: var(--space-12) var(--space-20);
}

.page.tray-open {
  padding-block-end: calc(var(--tray-height, 40vh) + var(--space-12));
}

.head {
  margin-bottom: var(--space-10);
}

.edition {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-subtle);
}

.edition-sep {
  color: var(--text-faint);
}

.title {
  margin-top: var(--space-4);
  font-size: var(--text-4xl);
  font-weight: 300;
  line-height: var(--leading-tight);
  letter-spacing: -0.04em;
}

.lead {
  margin-top: var(--space-3);
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-faint);
}

.index-skeleton {
  height: 320px;
  opacity: 0.5;
}
</style>
