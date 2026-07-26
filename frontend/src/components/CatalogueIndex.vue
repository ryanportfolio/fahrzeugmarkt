<script setup lang="ts">
import CarSilhouette from './CarSilhouette.vue'
import SaveHeart from './SaveHeart.vue'
import {
  bodyLabel,
  formatMonthYear,
  formatPrice,
  fuelLabel,
  transmissionLabel,
  variantLabel,
} from '../format'
import type { ListingCardDto } from '../types'

/* withDefaults, not a bare optional. Vue casts an absent Boolean prop to false
 * rather than leaving it undefined, so an optional `showSave` that nobody passed
 * arrived as false and the save control was missing from every row of the index
 * while the plates had one. */
withDefaults(
  defineProps<{
    listings: ListingCardDto[]
    /** Catalogue position of the first row, 1-based. */
    offset: number
    savedIds: Set<number>
    comparedIds: Set<number>
    showSave?: boolean
  }>(),
  { showSave: true },
)

const emit = defineEmits<{
  toggleSave: [listing: ListingCardDto]
  toggleCompare: [listing: ListingCardDto]
}>()

const numbers = new Intl.NumberFormat('de-DE')
</script>

<template>
  <!-- The second register. Same catalogue, same drawings, read as an index
       instead of as plates: the drawing drops to glyph size and becomes an
       ornament in a figure table. Two ways of reading one page is what keeps
       twenty-four vehicles from arriving as one repeated shape. -->
  <div class="index" role="table" aria-label="Vehicle index">
    <div class="row head" role="row">
      <span class="col-no micro-label" role="columnheader">№</span>
      <span class="col-glyph micro-label" role="columnheader">
        <span class="visually-hidden">Drawing</span>
      </span>
      <span class="col-name micro-label" role="columnheader">Vehicle</span>
      <span class="spacer" aria-hidden="true"></span>
      <span class="col-fig micro-label" role="columnheader">EZ</span>
      <span class="col-fig micro-label" role="columnheader">km</span>
      <span class="col-fig micro-label" role="columnheader">kW</span>
      <span class="col-price micro-label" role="columnheader">Price</span>
      <span class="col-act" role="columnheader"><span class="visually-hidden">Actions</span></span>
    </div>

    <div
      v-for="(listing, i) in listings"
      :key="listing.id"
      class="row"
      :class="{ compared: comparedIds.has(listing.id) }"
      role="row"
    >
      <span class="col-no figure" role="cell">{{ String(offset + i).padStart(3, '0') }}</span>

      <!-- Sized relative to the other rows here too, so the column has some
           variation down the page instead of the same shape twenty-four times. -->
      <span class="col-glyph" role="cell">
        <CarSilhouette
          :src="listing.coverImageUrl"
          :model="listing.model"
          :body-type="listing.bodyType"
          :lit="false"
        />
        <span class="glyph-rule" aria-hidden="true"></span>
      </span>

      <span class="col-name" role="cell">
        <RouterLink class="name" :to="{ name: 'listing', params: { id: listing.id } }">
          <span class="family">{{ listing.make }} {{ listing.model }}</span>
          <span class="variant">{{ variantLabel(listing) }}</span>
        </RouterLink>
        <span class="sub"
          >{{ bodyLabel(listing.bodyType) }} · {{ fuelLabel(listing.fuelType) }} ·
          {{ transmissionLabel(listing.transmission) }}<template v-if="listing.city">
            · {{ listing.city }}</template
          ></span
        >
      </span>

      <span class="spacer" aria-hidden="true"></span>

      <span class="col-fig figure" role="cell">{{ formatMonthYear(listing.firstRegistration) }}</span>
      <span class="col-fig figure" role="cell">{{ numbers.format(listing.mileageKm) }}</span>
      <span class="col-fig figure" role="cell">{{ listing.powerKw }}</span>
      <span class="col-price figure" role="cell">{{ formatPrice(listing.priceEur) }}</span>

      <span class="col-act" role="cell">
        <button
          type="button"
          class="compare"
          :class="{ on: comparedIds.has(listing.id) }"
          :aria-pressed="comparedIds.has(listing.id)"
          :aria-label="`Compare ${listing.title}`"
          @click="emit('toggleCompare', listing)"
        >
          +
        </button>
        <SaveHeart
          v-if="showSave"
          :saved="savedIds.has(listing.id)"
          :label="savedIds.has(listing.id) ? `Remove ${listing.title} from saved` : `Save ${listing.title}`"
          @toggle="emit('toggleSave', listing)"
        />
      </span>
    </div>
  </div>
</template>

<style scoped>
.index {
  border-top: var(--rule-heavy) solid var(--text);
}

/* The name column is capped and the slack taken by a spacer, so the row is one
   band of information rather than two clusters separated by 500px of nothing. */
.row {
  display: grid;
  grid-template-columns:
    38px 96px minmax(200px, 420px) minmax(0, 1fr)
    62px 78px 44px minmax(96px, auto) 76px;
  align-items: center;
  gap: 0 var(--space-4);
  padding: var(--space-3) 0;
  border-bottom: var(--rule-hair) solid var(--border);
  position: relative;
  transition: background-color var(--transition-fast);
}

.row > .spacer {
  min-width: 0;
}

.row:not(.head):hover {
  background: var(--surface-hover);
}

.row.compared {
  box-shadow: inset 3px 0 0 var(--accent);
}

.head {
  padding: var(--space-2) 0;
  border-bottom-color: var(--rule-ink);
}

.head span {
  color: var(--text-subtle);
}

.col-no {
  color: var(--text-subtle);
  font-size: var(--text-xs);
}

.col-glyph {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}

/* Glyph size. Not a thumbnail: it carries no background and no shadow, so it
   sits in the figure table the way a dingbat would. */
.col-glyph :deep(.drawing) {
  filter: none;
}

/* The floor each glyph stands on, running the full width of the column so the
   drawings line up down the page. */
.glyph-rule {
  height: 0;
  border-top: var(--rule-hair) solid var(--rule-ink);
}

.col-name {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.name {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  min-width: 0;
  color: var(--text);
  font-size: var(--text-sm);
}

.name::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
}

.row:hover .name {
  color: var(--accent-text);
}

.family {
  color: var(--text-subtle);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  white-space: nowrap;
}

.variant {
  font-weight: 500;
  letter-spacing: -0.012em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub {
  font-size: var(--text-xs);
  color: var(--text-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-fig {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-align: right;
  white-space: nowrap;
}

/* The row needs a top and a bottom. At 16px against 12px figures it had neither. */
.col-price {
  text-align: right;
  font-size: var(--text-xl);
  font-weight: 400;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.head .col-price {
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
}

.col-act {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-1);
  position: relative;
  z-index: 1;
}

/* A mark on a rule, like every other toggle on the surface. The bordered square it
   used to be was the only box left in the index. */
.compare {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: 0;
  border-bottom: var(--rule-mid) solid var(--border);
  background: none;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: var(--text-md);
  line-height: 1;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.compare:hover {
  color: var(--text);
  border-bottom-color: var(--text);
}

.compare.on {
  color: var(--accent-text);
  border-bottom-color: var(--accent);
}

/* Below the figure columns' comfortable width the index stops being a table and
   becomes a two-line list, rather than shrinking figures into ellipsis. */
@media (max-width: 940px) {
  .row {
    grid-template-columns: 30px 72px minmax(0, 1fr) auto 68px;
    gap: 0 var(--space-3);
  }

  .col-fig,
  .spacer,
  .head .col-price {
    display: none;
  }

  .col-price {
    font-size: var(--text-md);
  }
}
</style>
