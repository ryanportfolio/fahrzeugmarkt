<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import SaveHeart from './SaveHeart.vue'
import { bodyLabel, formatPrice, isNew, specGroups } from '../format'
import { mediaUrl } from '../api/client'
import type { ListingCardDto } from '../types'

const props = withDefaults(
  defineProps<{
    listing: ListingCardDto
    saved?: boolean
    showSave?: boolean
  }>(),
  { saved: false, showSave: true },
)

const emit = defineEmits<{ toggleSave: [listing: ListingCardDto] }>()

const price = computed(() => formatPrice(props.listing.priceEur))
const specs = computed(() => specGroups(props.listing))
const fresh = computed(() => isNew(props.listing.createdAt))
</script>

<template>
  <article class="listing-card">
    <RouterLink
      :to="{ name: 'listing', params: { id: listing.id } }"
      class="media"
      :aria-label="listing.title"
    >
      <img
        v-if="listing.coverImageUrl"
        :src="mediaUrl(listing.coverImageUrl)"
        :alt="listing.title"
        loading="lazy"
        decoding="async"
      />
      <span v-else class="media-fallback"><AppIcon name="car" :size="36" /></span>
      <span v-if="fresh" class="new-badge">New</span>
    </RouterLink>

    <SaveHeart
      v-if="showSave"
      class="heart"
      :saved="saved"
      @toggle="emit('toggleSave', listing)"
    />

    <div class="body">
      <h3 class="title">
        <RouterLink :to="{ name: 'listing', params: { id: listing.id } }">
          {{ listing.title }}
        </RouterLink>
      </h3>
      <p class="price">{{ price }}</p>
      <p class="specs">{{ specs[0] }}</p>
      <p class="specs">{{ specs[1] }}</p>
      <div class="foot">
        <span class="badge badge-neutral">{{ bodyLabel(listing.bodyType) }}</span>
        <span v-if="listing.city" class="city">{{ listing.city }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.listing-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-base),
    transform var(--transition-base);
}

.listing-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.media {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  background: var(--surface-sunken);
  overflow: hidden;
}

.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.listing-card:hover .media img {
  transform: scale(1.03);
}

.media-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--text-subtle);
}

.new-badge {
  position: absolute;
  left: var(--space-3);
  top: var(--space-3);
  padding: 3px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.heart {
  position: absolute;
  right: var(--space-3);
  top: var(--space-3);
  z-index: 2;
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4);
}

.title {
  font-size: var(--text-md);
  font-weight: 620;
  line-height: var(--leading-snug);
  letter-spacing: -0.005em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.title a {
  color: var(--text);
}

.title a::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.title a:hover {
  color: var(--accent-text);
}

.price {
  margin-top: var(--space-2);
  font-size: var(--text-xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.specs {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: var(--leading-snug);
  font-variant-numeric: tabular-nums;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-top: auto;
  padding-top: var(--space-3);
}

.city {
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

/* From the two-column grid up, reserve both title lines so the price sits on
   the same baseline across a row whether or not the title wraps. Below that
   the cards are stacked, so reserving it would only add dead space. */
@media (min-width: 560px) {
  .title {
    min-height: calc(2 * var(--text-md) * var(--leading-snug));
  }
}
</style>
