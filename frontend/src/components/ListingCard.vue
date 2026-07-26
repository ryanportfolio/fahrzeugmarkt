<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import SaveHeart from './SaveHeart.vue'
import { bodyLabel, formatPrice, fuelLabel, specColumns, transmissionLabel, variantLabel } from '../format'
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
const columns = computed(() => specColumns(props.listing))
const variant = computed(() => variantLabel(props.listing))
const family = computed(() => `${props.listing.make} ${props.listing.model}`)
const drivetrain = computed(() =>
  [fuelLabel(props.listing.fuelType), transmissionLabel(props.listing.transmission)].join(' · '),
)
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
      <span class="body-tag">{{ bodyLabel(listing.bodyType) }}</span>
    </RouterLink>

    <SaveHeart
      v-if="showSave"
      class="heart"
      :saved="saved"
      @toggle="emit('toggleSave', listing)"
    />

    <div class="body">
      <p class="family micro-label">{{ family }}</p>
      <h3 class="title">
        <RouterLink :to="{ name: 'listing', params: { id: listing.id } }">
          {{ variant }}
        </RouterLink>
      </h3>

      <p class="price figure">{{ price }}</p>

      <dl class="specs">
        <div v-for="column in columns" :key="column.label" class="spec">
          <dt class="micro-label">{{ column.label }}</dt>
          <dd class="spec-value figure">{{ column.value }}</dd>
        </div>
      </dl>

      <div class="foot">
        <span class="drivetrain">{{ drivetrain }}</span>
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
    background-color var(--transition-fast);
}

.listing-card:hover {
  border-color: var(--text);
}

.media {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  background: var(--surface-sunken);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}

.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.listing-card:hover .media img {
  transform: scale(1.02);
}

.media-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--text-subtle);
}

/* The body type is the one fact the photograph itself carries, so it is
   stamped on the image rather than repeated in the data columns. */
.body-tag {
  position: absolute;
  left: var(--space-3);
  bottom: var(--space-3);
  padding: 3px 6px;
  border-radius: var(--radius-sm);
  background: rgba(10, 11, 12, 0.66);
  color: #f3f2ef;
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  backdrop-filter: blur(6px);
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
  padding: var(--space-4);
}

.family {
  color: var(--text-subtle);
}

.title {
  margin-top: 6px;
  font-size: var(--text-md);
  font-weight: 550;
  line-height: var(--leading-snug);
  letter-spacing: -0.015em;
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

/* The price is the one figure read at a glance rather than compared column by
   column, so it takes the sans face with tabular figures. Mono at display size
   spaces the digits too far apart to read as money. */
.price {
  margin-top: var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: 550;
  letter-spacing: -0.035em;
  color: var(--text);
}

/* Three fixed columns, so mileage sits under mileage across a whole row of
   results and the eye can compare down the grid instead of reading prose. */
.specs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.spec {
  padding: var(--space-3) var(--space-2) var(--space-3) 0;
  min-width: 0;
}

.spec + .spec {
  padding-left: var(--space-3);
  border-left: 1px solid var(--border);
}

/* Sized so the widest real value, "140 (190)", clears three columns inside the
   narrowest card in the grid without ellipsis. */
.spec-value {
  margin-top: 4px;
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.foot {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
  font-size: var(--text-xs);
}

.drivetrain {
  color: var(--text-muted);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city {
  color: var(--text-subtle);
  white-space: nowrap;
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
