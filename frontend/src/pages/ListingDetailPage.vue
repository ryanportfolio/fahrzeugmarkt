<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import CarSilhouette from '../components/CarSilhouette.vue'
import ContactForm from '../components/ContactForm.vue'
import EmptyState from '../components/EmptyState.vue'
import SaveHeart from '../components/SaveHeart.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import { lastBrowsePath } from '../router'
import {
  bodyLabel,
  formatDateTime,
  formatInspection,
  formatMileage,
  formatMonthYear,
  formatPower,
  formatPrice,
  fuelLabel,
  transmissionLabel,
} from '../format'
import { useAuthStore } from '../stores/auth'
import { useCompareStore } from '../stores/compare'
import { useSavedStore } from '../stores/saved'
import type { ListingDetailDto } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const saved = useSavedStore()
const compare = useCompareStore()

const listing = ref<ListingDetailDto | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)
const shot = ref(0)

const id = computed(() => Number(route.params.id))
const backTarget = computed(() => lastBrowsePath.value)

/* Whether this page was reached from the catalogue in this session, which decides
 * how "back" should work. */
const cameFromBrowse = ref(false)

/** Real history when there is history to go back to, because the router only
 *  restores a scroll position on a popstate. A RouterLink here is a push, so it
 *  always landed at the top of the results with the reader's place in a page of
 *  twenty-four plates lost. Falls back to the last known browse path, filters and
 *  all, for anyone who arrived on a direct link. */
function goBack() {
  if (cameFromBrowse.value) {
    router.back()
    return
  }
  void router.push(backTarget.value)
}

const isSaved = computed(() => {
  if (!listing.value) return false
  return auth.isAuthenticated ? saved.has(listing.value.id) : listing.value.savedByMe
})

const cover = computed(() => listing.value?.images[shot.value]?.url ?? null)

/* The plate number a browse page would have printed on this vehicle is not
 * knowable from a direct link, so the detail page prints the listing id instead.
 * It is the number this vehicle actually has. */
const plateNumber = computed(() => String(listing.value?.id ?? 0).padStart(3, '0'))

/** The row of figures under the drawing. Reads left to right in the order a used
 *  car is actually assessed. */
const readings = computed(() => {
  const item = listing.value
  if (!item) return []
  return [
    { label: 'EZ', value: formatMonthYear(item.vehicle.firstRegistration) },
    { label: 'Mileage', value: formatMileage(item.vehicle.mileageKm) },
    { label: 'Power', value: formatPower(item.vehicle.powerKw) },
    { label: 'Transmission', value: transmissionLabel(item.vehicle.transmission) },
  ]
})

const attributes = computed(() => {
  const item = listing.value
  if (!item) return []
  return [
    { label: 'Make', value: item.vehicle.make },
    { label: 'Model', value: item.vehicle.model },
    { label: 'Body type', value: bodyLabel(item.vehicle.bodyType) },
    { label: 'Fuel', value: fuelLabel(item.vehicle.fuelType) },
    { label: 'Transmission', value: transmissionLabel(item.vehicle.transmission) },
    { label: 'Colour', value: item.vehicle.color },
    { label: 'Doors', value: item.vehicle.doors === null ? 'Not specified' : String(item.vehicle.doors) },
    { label: 'Seats', value: item.vehicle.seats === null ? 'Not specified' : String(item.vehicle.seats) },
    { label: 'Next inspection', value: formatInspection(item.vehicle.nextInspection) },
  ]
})

const inCompare = computed(() => (listing.value ? compare.has(listing.value.id) : false))

async function load() {
  loading.value = true
  error.value = null
  shot.value = 0
  try {
    listing.value = await api.listing(id.value)
    document.title = `${listing.value.title} · Fahrzeugmarkt`
  } catch (err) {
    listing.value = null
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}

async function toggleSave() {
  if (!auth.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  if (!listing.value) return
  saveError.value = null
  try {
    await saved.toggle({ id: listing.value.id })
  } catch (err) {
    saveError.value = errorMessage(err)
  }
}

function toggleCompare() {
  const item = listing.value
  if (!item) return
  compare.toggle({
    id: item.id,
    title: item.title,
    make: item.vehicle.make,
    model: item.vehicle.model,
    priceEur: item.priceEur,
    firstRegistration: item.vehicle.firstRegistration,
    mileageKm: item.vehicle.mileageKm,
    powerKw: item.vehicle.powerKw,
    fuelType: item.vehicle.fuelType,
    transmission: item.vehicle.transmission,
    bodyType: item.vehicle.bodyType,
    city: item.seller.city,
    coverImageUrl: item.images[0]?.url ?? null,
    createdAt: item.createdAt,
  })
}

watch(id, () => void load())

onMounted(() => {
  // Recorded once, on arrival: router.back() is only the right move if there is a
  // catalogue behind this page in the session's history.
  cameFromBrowse.value = window.history.state?.back != null
  void load()
})
</script>

<template>
  <div class="page">
    <div class="shell">
      <button type="button" class="back" @click="goBack">
        <AppIcon name="arrow-left" :size="14" />
        Back to the catalogue
      </button>
    </div>

    <div v-if="loading" class="shell">
      <div class="skeleton head-skeleton"></div>
      <div class="skeleton drawing-skeleton"></div>
    </div>

    <div v-else-if="error || !listing" class="shell">
      <EmptyState
        icon="alert"
        tone="error"
        title="This listing is not available"
        :description="error ?? 'It may have been removed by the seller or hidden by moderation.'"
      >
        <RouterLink :to="{ name: 'browse' }" class="btn btn-primary">
          Browse all vehicles
        </RouterLink>
      </EmptyState>
    </div>

    <article v-else>
      <!-- The plate, opened full width. Name on the left, price on the right,
           one heavy rule under both, and the drawing standing on its ground rule
           beneath that. Same apparatus as the catalogue, one vehicle wide. -->
      <header class="shell masthead">
        <div class="masthead-name">
          <p class="family">{{ listing.vehicle.make }} {{ listing.vehicle.model }}</p>
          <h1 class="title">{{ listing.title }}</h1>
          <div class="listed">
            <StatusBadge v-if="listing.status !== 'ACTIVE'" :status="listing.status" />
            <span>Listed {{ formatDateTime(listing.createdAt) }}</span>
          </div>
        </div>

        <div class="masthead-price">
          <p class="price">{{ formatPrice(listing.priceEur) }}</p>
          <p class="price-note">Negotiable, VAT not reportable</p>
          <div class="price-actions">
            <SaveHeart variant="inline" :saved="isSaved" @toggle="toggleSave" />
            <button
              type="button"
              class="btn btn-secondary"
              :aria-pressed="inCompare"
              @click="toggleCompare"
            >
              {{ inCompare ? 'In comparison' : 'Compare' }}
            </button>
          </div>
          <p v-if="saveError" class="field-error">{{ saveError }}</p>
        </div>
      </header>

      <section class="shell stage-block">
        <div class="stage">
          <span class="plate-no figure" aria-hidden="true">{{ plateNumber }}</span>
          <CarSilhouette
            :key="cover ?? 'none'"
            :src="cover"
            :model="listing.vehicle.model"
            :body-type="listing.vehicle.bodyType"
          />
        </div>

        <div class="ground" aria-hidden="true"></div>

        <div class="stage-caption">
          <span class="micro-label">Plate {{ plateNumber }}</span>

          <!-- Numbers rather than thumbnails. The alternate renders differ in
               lighting, and the lighting is what this page strips off, so
               thumbnails would be three pictures of the same thing. -->
          <span v-if="listing.images.length > 1" class="shots">
            <span class="micro-label">Render</span>
            <button
              v-for="(image, i) in listing.images"
              :key="image.id"
              type="button"
              class="shot figure"
              :class="{ on: i === shot }"
              :aria-pressed="i === shot"
              :aria-label="`Show render ${i + 1}`"
              @click="shot = i"
            >
              {{ i + 1 }}
            </button>
          </span>
        </div>
      </section>

      <!-- The four figures a used car is judged on, at figure size rather than in
           a bordered panel on the right. -->
      <section class="shell readings">
        <div v-for="reading in readings" :key="reading.label" class="reading">
          <span class="micro-label">{{ reading.label }}</span>
          <span class="reading-value figure">{{ reading.value }}</span>
        </div>
      </section>

      <div class="shell columns">
        <div class="col-main">
          <section class="block">
            <h2 class="block-title micro-label">Description</h2>
            <p class="description">{{ listing.description }}</p>
          </section>

          <section class="block">
            <h2 class="block-title micro-label">Technical data</h2>
            <dl class="attributes">
              <div v-for="attribute in attributes" :key="attribute.label" class="attribute">
                <dt>{{ attribute.label }}</dt>
                <dd class="figure">{{ attribute.value }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside class="col-side">
          <section class="block">
            <h2 class="block-title micro-label">Seller</h2>
            <p class="seller-name">{{ listing.seller.displayName }}</p>
            <p v-if="listing.seller.city" class="seller-line">{{ listing.seller.city }}</p>
            <p class="seller-line">Member since {{ formatDateTime(listing.seller.memberSince) }}</p>
            <p v-if="listing.seller.phone" class="seller-line figure">{{ listing.seller.phone }}</p>
          </section>

          <ContactForm :listing-id="listing.id" :listing-title="listing.title" />
        </aside>
      </div>
    </article>
  </div>
</template>

<style scoped>
.page {
  padding: var(--space-8) 0 var(--space-20);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  border: 0;
  background: none;
  cursor: pointer;
  color: var(--text-subtle);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
}

.back:hover {
  color: var(--accent-text);
}

/* Masthead */

.masthead {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: end;
  gap: var(--space-6);
  margin-top: var(--space-8);
  padding-bottom: var(--space-5);
  border-bottom: var(--rule-heavy) solid var(--text);
}

.family {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-subtle);
}

.title {
  margin-top: var(--space-3);
  font-size: var(--text-4xl);
  font-weight: 300;
  line-height: var(--leading-tight);
  letter-spacing: -0.035em;
}

.listed {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
  font-size: var(--text-xs);
  color: var(--text-faint);
}

.masthead-price {
  min-width: 0;
}

.price {
  font-size: var(--text-figure);
  font-weight: 400;
  line-height: 0.95;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.price-note {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.price-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

/* Stage */

.stage-block {
  margin-top: var(--space-10);
}

/* Capped on the inner elements, not on .stage-block. The block is a .shell, and
   .shell centres itself with auto margins, so capping it indented the whole plate
   away from the masthead above it.
   The cap exists because at the full 1512px measure the drawing came out 616px
   tall, which is a car filling a screen rather than a plate on a page. */
.stage,
.ground,
.stage-caption {
  max-width: 1040px;
}

.stage {
  position: relative;
  display: flex;
  align-items: flex-end;
}

/* Apparatus, not a headline. At display size the catalogue number was the largest
   thing on a page reached by a direct link, where it means nothing to a buyer. It
   is sized like the plate numbers in the grid and labelled as what it is. */
.plate-no {
  position: absolute;
  left: -0.04em;
  top: -0.1em;
  z-index: 0;
  font-size: var(--text-index);
  font-weight: 300;
  line-height: var(--leading-flush);
  letter-spacing: -0.05em;
  color: var(--rule-ink);
  opacity: 0.5;
  user-select: none;
}

.stage :deep(.silhouette) {
  position: relative;
  z-index: 1;
}

.ground {
  height: 0;
  border-top: var(--rule-mid) solid var(--text);
}

.stage-caption {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-6);
  margin-top: var(--space-3);
}

.stage-caption .micro-label {
  display: inline;
}

/* Pushed to the far end of the caption, so the plate number and the render picker
   sit at opposite ends of the rule rather than crowding its left corner. */
.shots {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-left: auto;
}

.shot {
  padding: 0 2px 2px;
  border: 0;
  border-bottom: var(--rule-mid) solid transparent;
  background: none;
  color: var(--text-faint);
  font-size: var(--text-xs);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.shot:hover {
  color: var(--text-muted);
}

.shot.on {
  color: var(--text);
  border-bottom-color: var(--accent);
}

/* Readings */

/* Four figures read as one line of data, so the columns are sized to the figures
   rather than stretched across a 1680px shell with 250px of void trailing each.
   The cap that used to do that job was set on the .shell itself, and .shell centres
   with auto margins, so it indented the whole row 200px away from the rule and the
   drawing above it. The max-content tracks pack left on their own. */
.readings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-6) var(--space-16);
  margin-top: var(--space-12);
  padding-top: var(--space-5);
  border-top: var(--rule-hair) solid var(--border);
}

.reading {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.reading-value {
  font-size: var(--text-xl);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--text);
}

/* Columns */

.columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-12);
  margin-top: var(--space-16);
}

.col-main,
.col-side {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  min-width: 0;
}

.block-title {
  padding-bottom: var(--space-2);
  border-bottom: var(--rule-mid) solid var(--text);
  color: var(--text);
}

.description {
  max-width: 66ch;
  margin-top: var(--space-4);
  font-size: var(--text-lg);
  line-height: 1.55;
  color: var(--text-muted);
  white-space: pre-line;
  text-wrap: pretty;
}

.attributes {
  margin-top: var(--space-4);
}

.attribute {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-6);
  padding: var(--space-3) 0;
  border-bottom: var(--rule-hair) solid var(--border);
  font-size: var(--text-sm);
}

.attribute dt {
  color: var(--text-muted);
}

.attribute dd {
  text-align: right;
  color: var(--text);
}

.seller-name {
  margin-top: var(--space-4);
  font-size: var(--text-xl);
  font-weight: 400;
  letter-spacing: -0.02em;
}

.seller-line {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

/* Skeletons */

.head-skeleton {
  height: 96px;
  margin-top: var(--space-8);
}

.drawing-skeleton {
  aspect-ratio: 955 / 388;
  margin-top: var(--space-10);
  opacity: 0.5;
}

@media (min-width: 860px) {
  .masthead {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-12);
  }

  .masthead-price {
    text-align: right;
  }

  .price-actions {
    justify-content: flex-end;
  }

  .readings {
    grid-template-columns: repeat(4, max-content);
  }
}

@media (min-width: 1080px) {
  .columns {
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.85fr);
    gap: var(--space-20);
  }
}
</style>
