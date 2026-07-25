<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import { formatDateTime, formatPrice, specLine } from '../format'
import type { SellerListingDto } from '../types'

const listings = ref<SellerListingDto[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const pendingDelete = ref<SellerListingDto | null>(null)
const deleting = ref(false)

const stats = computed(() => {
  const active = listings.value.filter((item) => item.status === 'ACTIVE').length
  const inquiries = listings.value.reduce((sum, item) => sum + item.inquiryCount, 0)
  const saves = listings.value.reduce((sum, item) => sum + item.savedCount, 0)
  return [
    { label: 'Listings', value: listings.value.length },
    { label: 'Active', value: active },
    { label: 'Inquiries', value: inquiries },
    { label: 'Saves', value: saves },
  ]
})

async function load() {
  loading.value = true
  error.value = null
  try {
    listings.value = await api.sellerListings()
  } catch (err) {
    error.value = errorMessage(err)
    listings.value = []
  } finally {
    loading.value = false
  }
}

async function confirmDelete() {
  const target = pendingDelete.value
  if (!target) return
  deleting.value = true
  try {
    await api.deleteListing(target.id)
    listings.value = listings.value.filter((item) => item.id !== target.id)
    pendingDelete.value = null
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    deleting.value = false
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="shell page">
    <header class="head">
      <div>
        <p class="eyebrow">Seller area</p>
        <h1>Your listings</h1>
        <p class="lead">Publish, edit and keep an eye on what buyers are doing</p>
      </div>
      <div class="head-actions">
        <RouterLink :to="{ name: 'seller-inquiries' }" class="btn btn-secondary">
          <AppIcon name="mail" :size="16" />
          Inquiries
        </RouterLink>
        <RouterLink :to="{ name: 'listing-new' }" class="btn btn-primary">
          <AppIcon name="plus" :size="16" />
          New listing
        </RouterLink>
      </div>
    </header>

    <ul v-if="!loading && listings.length" class="stats">
      <li v-for="stat in stats" :key="stat.label" class="stat">
        <span class="stat-value">{{ stat.value }}</span>
        <span class="stat-label">{{ stat.label }}</span>
      </li>
    </ul>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div v-if="loading" class="rows">
      <div v-for="n in 3" :key="n" class="skeleton row-skeleton"></div>
    </div>

    <div v-else-if="listings.length" class="rows">
      <article v-for="listing in listings" :key="listing.id" class="row card">
        <RouterLink
          :to="{ name: 'listing', params: { id: listing.id } }"
          class="thumb"
          :aria-label="listing.title"
        >
          <img
            v-if="listing.coverImageUrl"
            :src="listing.coverImageUrl"
            :alt="listing.title"
            loading="lazy"
          />
          <span v-else class="thumb-fallback"><AppIcon name="car" :size="24" /></span>
        </RouterLink>

        <div class="row-body">
          <div class="row-head">
            <h2 class="row-title">
              <RouterLink :to="{ name: 'listing', params: { id: listing.id } }">
                {{ listing.title }}
              </RouterLink>
            </h2>
            <StatusBadge :status="listing.status" />
          </div>
          <p class="row-specs">{{ specLine(listing) }}</p>
          <p class="row-meta">
            <strong>{{ formatPrice(listing.priceEur) }}</strong> · created
            {{ formatDateTime(listing.createdAt) }}
          </p>
          <ul class="counters">
            <li><AppIcon name="image" :size="14" /> {{ listing.imageCount }} photos</li>
            <li><AppIcon name="mail" :size="14" /> {{ listing.inquiryCount }} inquiries</li>
            <li><AppIcon name="heart" :size="14" /> {{ listing.savedCount }} saves</li>
          </ul>
        </div>

        <div class="row-actions">
          <RouterLink
            :to="{ name: 'listing-edit', params: { id: listing.id } }"
            class="btn btn-secondary btn-sm"
          >
            <AppIcon name="pencil" :size="14" />
            Edit
          </RouterLink>
          <button type="button" class="btn btn-danger btn-sm" @click="pendingDelete = listing">
            <AppIcon name="trash" :size="14" />
            Delete
          </button>
        </div>
      </article>
    </div>

    <EmptyState
      v-else-if="!error"
      icon="car"
      title="No listings yet"
      description="Add your first vehicle and it appears in the public search straight away."
    >
      <RouterLink :to="{ name: 'listing-new' }" class="btn btn-primary">
        Create your first listing
      </RouterLink>
    </EmptyState>

    <ConfirmDialog
      :open="pendingDelete !== null"
      title="Delete this listing?"
      :message="`${pendingDelete?.title ?? ''} will be removed together with its photos and inquiries. This cannot be undone.`"
      confirm-label="Delete listing"
      :busy="deleting"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.lead {
  color: var(--text-muted);
}

.head-actions {
  display: flex;
  gap: var(--space-2);
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-4);
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.stat-value {
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.row-skeleton {
  height: 132px;
  border-radius: var(--radius-lg);
}

.row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: var(--space-4);
  padding: var(--space-4);
  align-items: start;
}

.thumb {
  display: block;
  width: 96px;
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  overflow: hidden;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--text-subtle);
}

.row-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.row-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.row-title {
  font-size: var(--text-md);
  font-weight: 640;
}

.row-title a {
  color: var(--text);
}

.row-title a:hover {
  color: var(--accent-text);
}

.row-specs,
.row-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.counters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.counters li {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.row-actions {
  display: flex;
  gap: var(--space-2);
  grid-column: 1 / -1;
}

@media (min-width: 768px) {
  .stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .row {
    grid-template-columns: 128px minmax(0, 1fr) auto;
    align-items: center;
  }

  .thumb {
    width: 128px;
  }

  .row-actions {
    grid-column: auto;
    flex-direction: column;
  }
}
</style>
