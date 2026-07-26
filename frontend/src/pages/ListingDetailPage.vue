<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import ContactForm from '../components/ContactForm.vue'
import EmptyState from '../components/EmptyState.vue'
import ImageGallery from '../components/ImageGallery.vue'
import SaveHeart from '../components/SaveHeart.vue'
import SellerCard from '../components/SellerCard.vue'
import SpecTable from '../components/SpecTable.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import { lastBrowsePath } from '../router'
import {
  bodyLabel,
  formatDateTime,
  formatMileage,
  formatMonthYear,
  formatPower,
  formatPrice,
  fuelLabel,
  transmissionLabel,
} from '../format'
import { useAuthStore } from '../stores/auth'
import { useSavedStore } from '../stores/saved'
import type { ListingDetailDto } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const saved = useSavedStore()

const listing = ref<ListingDetailDto | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const saveError = ref<string | null>(null)

const id = computed(() => Number(route.params.id))

const backTarget = computed(() => lastBrowsePath.value)

const isSaved = computed(() => {
  if (!listing.value) return false
  return auth.isAuthenticated ? saved.has(listing.value.id) : listing.value.savedByMe
})

const highlights = computed(() => {
  const item = listing.value
  if (!item) return []
  return [
    { label: 'First registration', value: formatMonthYear(item.vehicle.firstRegistration) },
    { label: 'Mileage', value: formatMileage(item.vehicle.mileageKm) },
    { label: 'Power', value: formatPower(item.vehicle.powerKw) },
    { label: 'Fuel', value: fuelLabel(item.vehicle.fuelType) },
    { label: 'Transmission', value: transmissionLabel(item.vehicle.transmission) },
    { label: 'Body type', value: bodyLabel(item.vehicle.bodyType) },
  ]
})

async function load() {
  loading.value = true
  error.value = null
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

watch(id, () => void load())
onMounted(() => void load())
</script>

<template>
  <div class="shell page">
    <RouterLink :to="backTarget" class="back">
      <AppIcon name="arrow-left" :size="16" />
      Back to results
    </RouterLink>

    <div v-if="loading" class="detail">
      <div class="left">
        <div class="skeleton stage-skeleton"></div>
        <div class="skeleton line"></div>
        <div class="skeleton line short"></div>
      </div>
      <div class="right">
        <div class="skeleton panel-skeleton"></div>
        <div class="skeleton panel-skeleton small"></div>
      </div>
    </div>

    <EmptyState
      v-else-if="error || !listing"
      icon="alert"
      tone="error"
      title="This listing is not available"
      :description="error ?? 'It may have been removed by the seller or hidden by moderation.'"
    >
      <RouterLink :to="{ name: 'browse' }" class="btn btn-primary">Browse all vehicles</RouterLink>
    </EmptyState>

    <article v-else class="detail">
      <div class="left">
        <header class="head">
          <p class="eyebrow">{{ listing.vehicle.make }} {{ listing.vehicle.model }}</p>
          <h1 class="title">{{ listing.title }}</h1>
          <div class="head-meta">
            <StatusBadge v-if="listing.status !== 'ACTIVE'" :status="listing.status" />
            <span class="muted">Listed {{ formatDateTime(listing.createdAt) }}</span>
          </div>
        </header>

        <ImageGallery :images="listing.images" :alt="listing.title" />

        <section class="block">
          <h2 class="block-title">Description</h2>
          <p class="description">{{ listing.description }}</p>
        </section>

        <section class="block">
          <h2 class="block-title">Technical data</h2>
          <SpecTable :vehicle="listing.vehicle" />
        </section>
      </div>

      <div class="right">
        <section class="price-panel panel">
          <p class="price">{{ formatPrice(listing.priceEur) }}</p>
          <p class="price-note">Negotiable, VAT not reportable</p>
          <ul class="highlights">
            <li v-for="item in highlights" :key="item.label">
              <span class="highlight-label">{{ item.label }}</span>
              <span class="highlight-value">{{ item.value }}</span>
            </li>
          </ul>
          <SaveHeart variant="inline" :saved="isSaved" class="save-btn" @toggle="toggleSave" />
          <p v-if="saveError" class="field-error">{{ saveError }}</p>
        </section>

        <SellerCard :seller="listing.seller" />

        <ContactForm :listing-id="listing.id" :listing-title="listing.title" />
      </div>
    </article>
  </div>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-muted);
}

.back:hover {
  color: var(--accent-text);
}

.detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  align-items: start;
}

.left,
.right {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.title {
  font-size: clamp(24px, 4vw, 32px);
  letter-spacing: -0.02em;
}

.head-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-xs);
}

.block {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.block-title {
  font-size: var(--text-xs);
  font-weight: 680;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.description {
  max-width: 68ch;
  color: var(--text-muted);
  white-space: pre-line;
}

.price-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.price {
  font-size: var(--text-3xl);
  font-weight: 720;
  letter-spacing: -0.03em;
}

.price-note {
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.highlights {
  display: grid;
  gap: 0;
  margin: var(--space-4) 0;
}

.highlights li {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--border);
}

.highlight-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.highlight-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: -0.01em;
  text-align: right;
}

.save-btn {
  width: 100%;
}

.stage-skeleton {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-lg);
}

.line {
  height: 14px;
  width: 100%;
}

.line.short {
  width: 60%;
}

.panel-skeleton {
  height: 280px;
  border-radius: var(--radius-md);
}

.panel-skeleton.small {
  height: 160px;
}

@media (min-width: 1024px) {
  .detail {
    grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.9fr);
    gap: var(--space-10);
  }

  .right {
    position: sticky;
    top: calc(var(--header-height) + var(--space-6));
  }
}
</style>
