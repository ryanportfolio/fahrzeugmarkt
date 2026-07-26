<script setup lang="ts">
import { computed } from 'vue'
import CarSilhouette from './CarSilhouette.vue'
import SaveHeart from './SaveHeart.vue'
import { bodyLabel, formatMonthYear, formatPrice, fuelLabel, transmissionLabel, variantLabel } from '../format'
import type { ListingCardDto } from '../types'

const props = withDefaults(
  defineProps<{
    listing: ListingCardDto
    /** Position in the catalogue, 1-based, printed as the plate number. */
    index: number
    saved?: boolean
    compared?: boolean
    showSave?: boolean
    /** Opens the page across the full measure. One per page, so the grid has an
     *  event in it rather than twenty-four identical cells. */
    featured?: boolean
  }>(),
  { saved: false, compared: false, showSave: true, featured: false },
)

const emit = defineEmits<{
  toggleSave: [listing: ListingCardDto]
  toggleCompare: [listing: ListingCardDto]
}>()

const plateNumber = computed(() => String(props.index).padStart(3, '0'))
const family = computed(() => `${props.listing.make} ${props.listing.model}`)
const variant = computed(() => variantLabel(props.listing))
const price = computed(() => formatPrice(props.listing.priceEur))
const ps = computed(() => Math.round(props.listing.powerKw * 1.35962))
const mileage = computed(() => new Intl.NumberFormat('de-DE').format(props.listing.mileageKm))
</script>

<template>
  <article class="plate" :class="{ compared, featured }">
    <!-- The variant code is a label on the car, not its name, so it sits above at
         label size and the model gets the reading line. A page whose largest words
         are "30 TDI Design" and "1.4 LPG Edition" is a list of engines. -->
    <header class="head">
      <span class="variant">{{ variant }}</span>
      <SaveHeart
        v-if="showSave"
        class="heart"
        :saved="saved"
        @toggle="emit('toggleSave', listing)"
      />
    </header>

    <h3 class="family">
      <RouterLink :to="{ name: 'listing', params: { id: listing.id } }">{{ family }}</RouterLink>
    </h3>

    <!-- The drawing stage. Its height is reserved for the tallest case, so a low
         car leaves a band of air above it. The plate number is set in that band
         rather than the band being left dead. -->
    <div class="stage">
      <span class="plate-no figure" aria-hidden="true">{{ plateNumber }}</span>
      <CarSilhouette
        :src="listing.coverImageUrl"
        :model="listing.model"
        :body-type="listing.bodyType"
      />
    </div>

    <!-- The ground the car stands on. A hairline across the full column, so the
         drawings in a row share one floor. -->
    <div class="baseline" aria-hidden="true"></div>

    <div class="figures">
      <p class="price">{{ price }}</p>
      <dl class="specs">
        <div class="spec">
          <dt class="micro-label">EZ</dt>
          <dd class="figure">{{ formatMonthYear(listing.firstRegistration) }}</dd>
        </div>
        <div class="spec">
          <dt class="micro-label">km</dt>
          <dd class="figure">{{ mileage }}</dd>
        </div>
        <div class="spec">
          <dt class="micro-label">kW (PS)</dt>
          <dd class="figure">{{ listing.powerKw }} ({{ ps }})</dd>
        </div>
      </dl>
    </div>

    <footer class="foot">
      <span class="drivetrain"
        >{{ bodyLabel(listing.bodyType) }} · {{ fuelLabel(listing.fuelType) }} ·
        {{ transmissionLabel(listing.transmission) }}</span
      >
      <button
        type="button"
        class="compare"
        :class="{ on: compared }"
        :aria-pressed="compared"
        @click="emit('toggleCompare', listing)"
      >
        {{ compared ? 'In comparison' : 'Compare' }}
      </button>
      <span v-if="listing.city" class="city">{{ listing.city }}</span>
    </footer>
  </article>
</template>

<style scoped>
/* No border, no card. A plate is opened by a rule and closed by the next one, the
   way a page of a catalogue is. Spacing inside runs on an 8px module: 8, 16, 24,
   48, and nothing between. */
.plate {
  position: relative;
  display: flex;
  flex-direction: column;
  padding-top: var(--space-2);
  border-top: var(--rule-mid) solid var(--text);
  transition: border-color var(--transition-base);
}

.plate.compared {
  border-top-color: var(--accent);
}

/* The opening plate. It takes the full measure and a heavier rule, and it lays the
   figures beside the drawing rather than under it.
   The drawing keeps the width a single column would have given it. Every drawing
   in the grid is sized relative to the others, and doubling this one to fill the
   space would put one car out of proportion with the rest of the page. */
@media (min-width: 720px) {
  .plate.featured {
    grid-column: 1 / -1;
    border-top-width: var(--rule-heavy);
    display: grid;
    grid-template-columns: calc(50% - var(--space-6)) minmax(0, 1fr);
    column-gap: var(--space-12);
    align-items: start;
  }

  .plate.featured .head,
  .plate.featured .family,
  .plate.featured .stage,
  .plate.featured .baseline {
    grid-column: 1;
  }

  .plate.featured .figures {
    grid-column: 2;
    grid-row: 2 / 5;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-8);
    align-self: end;
    margin-top: 0;
  }

  .plate.featured .price {
    font-size: clamp(44px, 4.4vw, 72px);
  }

  .plate.featured .specs {
    text-align: left;
    gap: 0 var(--space-8);
  }

  .plate.featured .spec dd {
    font-size: var(--text-sm);
  }

  .plate.featured .foot {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1860px) {
  .plate.featured {
    grid-template-columns: calc(33.333% - var(--space-8)) minmax(0, 1fr);
  }
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 32px;
}

.variant {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-subtle);
}

/* Lifted above the plate-wide link overlay. Without this the heart sits under
   `.family a::after` and a click on it navigates to the listing instead of saving,
   which is a control that silently does something else. Every interactive element
   inside a plate needs this, not just the ones that were remembered. */
.heart {
  position: relative;
  z-index: 2;
  margin-left: auto;
  margin-right: -8px;
}

.family {
  margin-top: var(--space-2);
  font-size: var(--text-2xl);
  font-weight: 400;
  letter-spacing: -0.026em;
  line-height: 1.1;
}

.family a {
  color: var(--text);
}

/* One hit area over the whole plate, so the drawing is the target rather than two
   words of the model name. */
.family a::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
}

.plate:hover .family a,
.plate:focus-within .family a {
  color: var(--accent-text);
}

.stage {
  position: relative;
  display: flex;
  align-items: flex-end;
  margin-top: var(--space-4);
}

/* Sits in the air above a low car and is overlapped by a tall one. Sized to the
   column rather than the viewport, so it never outranks the price. */
.plate-no {
  position: absolute;
  left: -0.055em;
  top: -0.12em;
  z-index: 0;
  font-size: clamp(30px, 3.4vw, 54px);
  font-weight: 300;
  line-height: var(--leading-flush);
  letter-spacing: -0.05em;
  color: var(--rule-ink);
  opacity: 0.62;
  user-select: none;
  transition:
    color var(--transition-slow),
    opacity var(--transition-slow);
}

.plate:hover .plate-no {
  color: var(--accent);
  opacity: 0.36;
}

.stage :deep(.silhouette) {
  position: relative;
  z-index: 1;
  transition: transform var(--transition-slow);
}

/* The car lifts off its baseline on hover. Three pixels, because the drawings are
   the only thing on the page with weight and it should read as weight. */
.plate:hover .stage :deep(.silhouette),
.plate:focus-within .stage :deep(.silhouette) {
  transform: translate3d(0, -3px, 0);
}

.plate:hover .stage :deep(.pool) {
  --pool-core: rgba(255, 200, 120, 0.2);
}

.baseline {
  height: 0;
  border-top: var(--rule-hair) solid var(--rule-ink);
}

.figures {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
  /* The ground rule used to carry an 18px band under it holding a length caption.
     With the caption gone the price sat almost on the rule, so the air it had is
     kept deliberately. */
  margin-top: var(--space-4);
}

/* The price is the figure the page is read for, so it takes the top of the ramp
   and nothing near it competes. */
.price {
  font-size: var(--text-figure);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 0.95;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.specs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, auto));
  gap: 0 var(--space-5);
  text-align: right;
}

.spec dd {
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--text);
  white-space: nowrap;
}

.foot {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  margin-top: var(--space-3);
  padding: var(--space-3) 0 var(--space-12);
  border-top: var(--rule-hair) solid var(--border);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.drivetrain {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.city {
  margin-left: auto;
  color: var(--text-subtle);
  white-space: nowrap;
}

/* Sits above the plate-wide link so it can be clicked without navigating. */
.compare {
  position: relative;
  z-index: 2;
  padding: var(--space-2) 0;
  border: 0;
  border-bottom: var(--rule-hair) solid var(--border-strong);
  background: none;
  color: var(--text-muted);
  font-size: var(--text-xs);
  cursor: pointer;
  white-space: nowrap;
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

@media (max-width: 720px) {
  .figures {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .specs {
    text-align: left;
    justify-content: space-between;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .foot {
    padding-bottom: var(--space-8);
  }
}
</style>
