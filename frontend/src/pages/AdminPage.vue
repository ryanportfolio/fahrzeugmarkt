<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import { formatDateTime, formatPrice, specLine } from '../format'
import type { AdminListingDto, ListingStatus } from '../types'

type Tab = ListingStatus | 'ALL'

const tabs: Array<{ value: Tab; label: string }> = [
  { value: 'FLAGGED', label: 'Flagged' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'REMOVED', label: 'Removed' },
  { value: 'ALL', label: 'Everything' },
]

const listings = ref<AdminListingDto[]>([])
const tab = ref<Tab>('FLAGGED')
const loading = ref(true)
const error = ref<string | null>(null)
const busyId = ref<number | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    listings.value = await api.adminListings(tab.value === 'ALL' ? undefined : tab.value)
  } catch (err) {
    error.value = errorMessage(err)
    listings.value = []
  } finally {
    loading.value = false
  }
}

async function select(next: Tab) {
  if (tab.value === next) return
  tab.value = next
  await load()
}

async function moderate(listing: AdminListingDto, action: 'flag' | 'approve') {
  const previousStatus = listing.status
  const nextStatus: ListingStatus = action === 'flag' ? 'FLAGGED' : 'ACTIVE'
  listing.status = nextStatus
  busyId.value = listing.id
  error.value = null
  try {
    if (action === 'flag') await api.adminFlag(listing.id)
    else await api.adminApprove(listing.id)
    if (tab.value !== 'ALL' && nextStatus !== tab.value) {
      listings.value = listings.value.filter((item) => item.id !== listing.id)
    }
  } catch (err) {
    listing.status = previousStatus
    error.value = errorMessage(err)
  } finally {
    busyId.value = null
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="shell page">
    <header class="head">
      <p class="eyebrow">Admin</p>
      <h1>Moderation queue</h1>
      <p class="lead">Flag anything that misrepresents a vehicle, approve when it is clean</p>
    </header>

    <div class="tabs" role="tablist" aria-label="Filter by status">
      <button
        v-for="item in tabs"
        :key="item.value"
        type="button"
        role="tab"
        class="tab"
        :class="{ on: tab === item.value }"
        :aria-selected="tab === item.value"
        @click="select(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div v-if="loading" class="rows">
      <div v-for="n in 4" :key="n" class="skeleton row-skeleton"></div>
    </div>

    <div v-else-if="listings.length" class="table-wrap card">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Listing</th>
            <th scope="col">Seller</th>
            <th scope="col">Price</th>
            <th scope="col">Status</th>
            <th scope="col"><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="listing in listings" :key="listing.id">
            <td>
              <RouterLink :to="{ name: 'listing', params: { id: listing.id } }" class="link">
                {{ listing.title }}
              </RouterLink>
              <p class="sub">{{ specLine(listing) }}</p>
              <p class="sub">Created {{ formatDateTime(listing.createdAt) }}</p>
            </td>
            <td class="nowrap">
              <span class="seller">{{ listing.sellerEmail }}</span>
              <p v-if="listing.city" class="sub">{{ listing.city }}</p>
            </td>
            <td class="nowrap price">{{ formatPrice(listing.priceEur) }}</td>
            <td><StatusBadge :status="listing.status" /></td>
            <td class="actions-cell">
              <div class="actions-inner">
                <button
                  v-if="listing.status !== 'ACTIVE'"
                  type="button"
                  class="btn btn-secondary btn-sm"
                  :disabled="busyId === listing.id"
                  @click="moderate(listing, 'approve')"
                >
                  <AppIcon name="check" :size="14" />
                  Approve
                </button>
                <button
                  v-if="listing.status !== 'FLAGGED'"
                  type="button"
                  class="btn btn-danger btn-sm"
                  :disabled="busyId === listing.id"
                  @click="moderate(listing, 'flag')"
                >
                  <AppIcon name="flag" :size="14" />
                  Flag
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState
      v-else-if="!error"
      icon="check"
      title="Queue is clear"
      description="Nothing in this bucket right now. Switch tabs to review the rest of the catalogue."
    >
      <button type="button" class="btn btn-secondary" @click="select('ALL')">
        Show everything
      </button>
    </EmptyState>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.lead {
  color: var(--text-muted);
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-bottom: var(--space-5);
  padding: var(--space-1);
  border: 1px solid var(--border);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  width: fit-content;
}

.tab {
  height: 32px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.tab:hover {
  color: var(--text);
}

.tab.on {
  background: var(--accent);
  color: var(--accent-contrast);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.row-skeleton {
  height: 76px;
  border-radius: var(--radius-md);
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th {
  padding: var(--space-3) var(--space-4);
  text-align: left;
  font-size: var(--text-xs);
  font-weight: 680;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-subtle);
  border-bottom: 1px solid var(--border);
}

td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
  vertical-align: top;
  font-size: var(--text-sm);
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr {
  transition: background-color var(--transition-fast);
}

tbody tr:hover {
  background: var(--surface-hover);
}

.link {
  font-weight: 620;
  color: var(--text);
}

.link:hover {
  color: var(--accent-text);
}

.sub {
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.seller {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.nowrap {
  white-space: nowrap;
}

.price {
  font-weight: 640;
  font-variant-numeric: tabular-nums;
}

.actions-cell {
  text-align: right;
  white-space: nowrap;
}

.actions-inner {
  display: inline-flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
</style>
