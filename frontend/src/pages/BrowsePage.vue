<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import FilterChips from '../components/FilterChips.vue'
import FilterSidebar from '../components/FilterSidebar.vue'
import ListingCard from '../components/ListingCard.vue'
import ListingCardSkeleton from '../components/ListingCardSkeleton.vue'
import PaginationBar from '../components/PaginationBar.vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import { SORT_LABELS, formatCount } from '../format'
import {
  activeChips,
  emptyFilters,
  filtersFromQuery,
  filtersToApiQuery,
  filtersToQuery,
  pageFromQuery,
  queriesEqual,
  removeChip,
  sortFromQuery,
  PAGE_SIZE,
  SORT_KEYS,
} from '../browse/filters'
import type { FilterChip, FilterState } from '../browse/filters'
import { useAuthStore } from '../stores/auth'
import { useSavedStore } from '../stores/saved'
import type { FacetsDto, ListingCardDto, MetaDto, SortKey } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const saved = useSavedStore()

const filters = ref<FilterState>(filtersFromQuery(route.query))
const sort = ref<SortKey>(sortFromQuery(route.query))
const page = ref(pageFromQuery(route.query))

const meta = ref<MetaDto | null>(null)
const facets = ref<FacetsDto | null>(null)
const listings = ref<ListingCardDto[]>([])
const totalElements = ref(0)
const totalPages = ref(0)

const loading = ref(true)
const error = ref<string | null>(null)
const sheetOpen = ref(false)

interface Shortcut {
  label: string
  apply: Partial<FilterState>
  clear: Partial<FilterState>
  active: (state: FilterState) => boolean
}

const shortcuts: Shortcut[] = [
  {
    label: 'Diesel',
    apply: { fuelType: ['DIESEL'] },
    clear: { fuelType: [] },
    active: (state) => state.fuelType.length === 1 && state.fuelType[0] === 'DIESEL',
  },
  {
    label: 'Electric',
    apply: { fuelType: ['ELECTRIC'] },
    clear: { fuelType: [] },
    active: (state) => state.fuelType.length === 1 && state.fuelType[0] === 'ELECTRIC',
  },
  {
    label: 'Automatic',
    apply: { transmission: ['AUTOMATIC'] },
    clear: { transmission: [] },
    active: (state) => state.transmission.length === 1 && state.transmission[0] === 'AUTOMATIC',
  },
  {
    label: 'SUV',
    apply: { bodyType: ['SUV'] },
    clear: { bodyType: [] },
    active: (state) => state.bodyType.length === 1 && state.bodyType[0] === 'SUV',
  },
  {
    label: 'Under 15.000 €',
    apply: { priceTo: 15000 },
    clear: { priceTo: null },
    active: (state) => state.priceTo === 15000,
  },
  {
    label: 'Under 100.000 km',
    apply: { mileageTo: 100000 },
    clear: { mileageTo: null },
    active: (state) => state.mileageTo === 100000,
  },
]

function applyShortcut(shortcut: Shortcut) {
  patch(shortcut.active(filters.value) ? shortcut.clear : shortcut.apply, true)
}

const chips = computed(() => activeChips(filters.value))
const hasFilters = computed(() => chips.value.length > 0)
const resultLabel = computed(() => formatCount(totalElements.value, 'vehicle', 'vehicles'))
const makeCount = computed(() => meta.value?.makes.length ?? 0)

// The masthead states the size of the catalogue the current filters describe,
// so it stays true as filters narrow rather than advertising a fixed number.
const shownRange = computed(() => {
  if (!listings.value.length) return null
  const first = page.value * PAGE_SIZE + 1
  return { first, last: first + listings.value.length - 1, total: totalElements.value }
})

let controller: AbortController | null = null
let syncTimer: ReturnType<typeof setTimeout> | undefined

async function loadMeta() {
  try {
    meta.value = await api.meta()
  } catch {
    meta.value = null
  }
}

async function load() {
  controller?.abort()
  controller = new AbortController()
  const signal = controller.signal
  loading.value = true
  error.value = null

  const query = filtersToApiQuery(filters.value, sort.value, page.value)
  try {
    const [pageResult, facetResult] = await Promise.all([
      api.searchListings(query, signal),
      api.facets(query, signal),
    ])
    listings.value = pageResult.content
    totalElements.value = pageResult.totalElements
    totalPages.value = pageResult.totalPages
    facets.value = facetResult
    loading.value = false
  } catch (err) {
    if (signal.aborted) return
    error.value = errorMessage(err)
    listings.value = []
    totalElements.value = 0
    totalPages.value = 0
    loading.value = false
  }
}

function syncUrl(immediate = false) {
  clearTimeout(syncTimer)
  const run = () => {
    const target = filtersToQuery(filters.value, sort.value, page.value)
    if (queriesEqual(target, route.query)) return
    void router.push({ name: 'browse', query: target })
  }
  if (immediate) run()
  else syncTimer = setTimeout(run, 350)
}

function patch(update: Partial<FilterState>, immediate = false) {
  filters.value = { ...filters.value, ...update }
  page.value = 0
  syncUrl(immediate)
}

function onSearchInput(event: Event) {
  patch({ q: (event.target as HTMLInputElement).value })
}

function onSortChange(event: Event) {
  sort.value = (event.target as HTMLSelectElement).value as SortKey
  page.value = 0
  syncUrl(true)
}

function onRemoveChip(chip: FilterChip) {
  filters.value = removeChip(filters.value, chip)
  page.value = 0
  syncUrl(true)
}

function resetFilters() {
  filters.value = emptyFilters()
  page.value = 0
  syncUrl(true)
}

function goToPage(next: number) {
  page.value = next
  syncUrl(true)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function onToggleSave(listing: ListingCardDto) {
  if (!auth.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await saved.toggle(listing)
  } catch (err) {
    error.value = errorMessage(err)
  }
}

watch(
  () => route.query,
  (query) => {
    const incoming = filtersToQuery(filtersFromQuery(query), sortFromQuery(query), pageFromQuery(query))
    const local = filtersToQuery(filters.value, sort.value, page.value)
    if (!queriesEqual(incoming, local)) {
      filters.value = filtersFromQuery(query)
      sort.value = sortFromQuery(query)
      page.value = pageFromQuery(query)
    }
    void load()
  },
)

watch(sheetOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  void loadMeta()
  void load()
})

onBeforeUnmount(() => {
  clearTimeout(syncTimer)
  controller?.abort()
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="browse">
    <section class="masthead">
      <div class="shell masthead-inner">
        <div class="masthead-lead">
          <p class="masthead-eyebrow">Fahrzeugmarkt / Northern Germany</p>
          <h1 class="masthead-title">Used cars across northern Germany</h1>

          <div class="search">
            <AppIcon name="search" :size="18" />
            <input
              class="search-input"
              type="search"
              :value="filters.q"
              placeholder="Search by make, model or title"
              aria-label="Search vehicles"
              @input="onSearchInput"
            />
          </div>

          <div class="shortcuts">
            <span class="shortcuts-label">Popular</span>
            <button
              v-for="shortcut in shortcuts"
              :key="shortcut.label"
              type="button"
              class="shortcut"
              :class="{ on: shortcut.active(filters) }"
              :aria-pressed="shortcut.active(filters)"
              @click="applyShortcut(shortcut)"
            >
              {{ shortcut.label }}
            </button>
          </div>
        </div>

        <dl class="masthead-stats">
          <div class="stat">
            <dt class="micro-label">Vehicles</dt>
            <dd class="stat-value figure" :class="{ pending: loading }">
              {{ loading ? '·' : totalElements }}
            </dd>
          </div>
          <div class="stat">
            <dt class="micro-label">Makes</dt>
            <dd class="stat-value figure" :class="{ pending: !makeCount }">
              {{ makeCount || '·' }}
            </dd>
          </div>
        </dl>
      </div>
    </section>

    <div class="shell layout">
      <aside class="sidebar-desktop" aria-label="Filters">
        <div class="sidebar-head">
          <h2 class="sidebar-title">Filters</h2>
          <span v-if="hasFilters" class="badge badge-accent">{{ chips.length }}</span>
        </div>
        <FilterSidebar
          :filters="filters"
          :meta="meta"
          :facets="facets"
          :loading="loading"
          @patch="patch($event)"
          @reset="resetFilters"
        />
      </aside>

      <section class="results">
        <div class="toolbar">
          <div class="count">
            <p v-if="loading" class="count-value">Searching</p>
            <p v-else-if="shownRange" class="count-value">
              <span class="figure">{{ shownRange.first }}</span>
              to
              <span class="figure">{{ shownRange.last }}</span>
              of
              <span class="figure">{{ shownRange.total }}</span>
            </p>
            <p v-else class="count-value">{{ resultLabel }}</p>
          </div>

          <div class="toolbar-actions">
            <button type="button" class="btn btn-secondary filter-trigger" @click="sheetOpen = true">
              <AppIcon name="filter" :size="16" />
              Filters
              <span v-if="hasFilters" class="trigger-count">{{ chips.length }}</span>
            </button>
            <label class="sort">
              <span class="visually-hidden">Sort results</span>
              <select class="select" :value="sort" @change="onSortChange">
                <option v-for="key in SORT_KEYS" :key="key" :value="key">
                  {{ SORT_LABELS[key] }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <FilterChips :chips="chips" @remove="onRemoveChip" @clear="resetFilters" />

        <p v-if="error" class="alert alert-error">{{ error }}</p>

        <div v-if="loading" class="grid">
          <ListingCardSkeleton v-for="n in 8" :key="n" />
        </div>

        <template v-else-if="listings.length">
          <div class="grid">
            <ListingCard
              v-for="listing in listings"
              :key="listing.id"
              :listing="listing"
              :saved="saved.has(listing.id)"
              @toggle-save="onToggleSave"
            />
          </div>
          <PaginationBar :page="page" :total-pages="totalPages" @change="goToPage" />
        </template>

        <EmptyState
          v-else-if="!error"
          icon="car"
          title="No vehicles match those filters"
          description="Try widening the price or mileage range, or drop a filter or two. The whole catalogue is one click away."
        >
          <button type="button" class="btn btn-primary" @click="resetFilters">
            Clear all filters
          </button>
        </EmptyState>
      </section>
    </div>

    <Transition name="sheet">
      <div v-if="sheetOpen" class="sheet-wrap">
        <div class="sheet-backdrop" @click="sheetOpen = false"></div>
        <aside class="sheet" role="dialog" aria-modal="true" aria-label="Filters">
          <header class="sheet-head">
            <h2 class="sidebar-title">Filters</h2>
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              aria-label="Close filters"
              @click="sheetOpen = false"
            >
              <AppIcon name="x" :size="18" />
            </button>
          </header>
          <div class="sheet-body">
            <FilterSidebar
              :filters="filters"
              :meta="meta"
              :facets="facets"
              :loading="loading"
              @patch="patch($event)"
              @reset="resetFilters"
            />
          </div>
          <footer class="sheet-foot">
            <button type="button" class="btn btn-primary btn-block btn-lg" @click="sheetOpen = false">
              Show {{ resultLabel }}
            </button>
          </footer>
        </aside>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.browse {
  padding-bottom: var(--space-16);
}

/* The one inked surface on the page. It carries the search, the shortcuts and
   the size of the catalogue, so the results below it can be pure structure. */
.masthead {
  background: var(--band);
  color: var(--band-text);
  /* Carries the boundary in dark mode, where the band and the page ground sit
     only two steps apart. */
  border-bottom: 1px solid var(--band-border);
}

.masthead-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-10);
  padding-top: var(--space-10);
  padding-bottom: var(--space-8);
}

.masthead-lead {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 660px;
}

.masthead-eyebrow {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--band-muted);
}

.masthead-title {
  font-size: var(--text-4xl);
  font-weight: 500;
  line-height: 1.02;
  letter-spacing: -0.035em;
  color: var(--band-text);
  text-wrap: balance;
}

.masthead-stats {
  display: none;
  gap: var(--space-10);
  padding-top: 6px;
}

.stat-value {
  margin-top: var(--space-2);
  font-size: var(--text-3xl);
  font-weight: 400;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--band-text);
}

.stat-value.pending {
  color: var(--band-muted);
}

.masthead-stats .micro-label {
  color: var(--band-muted);
}

.search {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 560px;
  padding: 0 var(--space-4);
  height: 52px;
  background: var(--band-field);
  border: 1px solid var(--band-border);
  border-radius: var(--radius-md);
  color: var(--band-muted);
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.search:focus-within {
  border-color: var(--accent-on-band);
  color: var(--band-text);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: var(--text-md);
  color: var(--band-text);
  outline: none;
}

.search-input::placeholder {
  color: var(--band-muted);
}

.search-input::-webkit-search-cancel-button {
  cursor: pointer;
}

.shortcuts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.shortcuts-label {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--band-muted);
  margin-right: var(--space-2);
}

.shortcut {
  height: 30px;
  padding: 0 var(--space-3);
  border: 1px solid var(--band-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--band-muted);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.shortcut:hover {
  border-color: var(--band-muted);
  color: var(--band-text);
}

.shortcut.on {
  background: var(--accent-on-band);
  border-color: var(--accent-on-band);
  color: #06211f;
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  padding-top: var(--space-8);
}

.sidebar-desktop {
  display: none;
}

.sidebar-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
}

.sidebar-title {
  font-size: var(--text-lg);
  font-weight: 660;
}

.results {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.count-value {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 450;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.count-value .figure {
  color: var(--text);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.trigger-count {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 11px;
  font-weight: 700;
}

.sort .select {
  height: 40px;
  min-width: 190px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-5);
}

.sheet-wrap {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: var(--surface-overlay);
}

.sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(380px, 88vw);
  height: 100%;
  background: var(--surface-card);
  border-right: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--border);
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.sheet-foot {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--border);
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--transition-base);
}

.sheet-enter-active .sheet,
.sheet-leave-active .sheet {
  transition: transform var(--transition-base);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateX(-100%);
}

@media (min-width: 560px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .masthead-stats {
    display: flex;
  }
}

@media (min-width: 1024px) {
  .layout {
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  }

  .sidebar-desktop {
    display: block;
    position: sticky;
    top: calc(var(--header-height) + var(--space-6));
    align-self: start;
    max-height: calc(100vh - var(--header-height) - var(--space-10));
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--border-strong) transparent;
    padding-right: var(--space-2);
  }

  .filter-trigger {
    display: none;
  }

  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
