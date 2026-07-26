<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import CarSilhouette from '../components/CarSilhouette.vue'
import CatalogueIndex from '../components/CatalogueIndex.vue'
import CataloguePlate from '../components/CataloguePlate.vue'
import CompareTray from '../components/CompareTray.vue'
import EmptyState from '../components/EmptyState.vue'
import FilterChips from '../components/FilterChips.vue'
import FilterSidebar from '../components/FilterSidebar.vue'
import PaginationBar from '../components/PaginationBar.vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import { SORT_LABELS, formatCount, formatPrice } from '../format'
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
import { useCompareStore } from '../stores/compare'
import { useSavedStore } from '../stores/saved'
import type { FacetsDto, ListingCardDto, MetaDto, SortKey } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const saved = useSavedStore()
const compare = useCompareStore()

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
const notice = ref<string | null>(null)
const sheetOpen = ref(false)

/* Plates or index. Two readings of the same catalogue, and the choice sticks,
 * because someone who wants the figure table wants it on every page. */
type ViewMode = 'plates' | 'index'
const VIEW_KEY = 'fm-view'

function readView(): ViewMode {
  try {
    return localStorage.getItem(VIEW_KEY) === 'index' ? 'index' : 'plates'
  } catch {
    return 'plates'
  }
}

const view = ref<ViewMode>(readView())

function setView(next: ViewMode) {
  view.value = next
  try {
    localStorage.setItem(VIEW_KEY, next)
  } catch {
    /* storage unavailable */
  }
}

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
const firstIndex = computed(() => page.value * PAGE_SIZE + 1)

const shownRange = computed(() => {
  if (!listings.value.length) return null
  return {
    first: firstIndex.value,
    last: firstIndex.value + listings.value.length - 1,
    total: totalElements.value,
  }
})

/* One drawing on the cover, beside the masthead. The first vehicle in the current
 * results, drawn to fill its column rather than at its size relative to the rest
 * of the catalogue: the cover is a masthead, not a row of the grid, so a supermini
 * landing at the top of the page should not leave the column half empty. */
const coverCar = computed(() => listings.value[0] ?? null)

let controller: AbortController | null = null
let syncTimer: ReturnType<typeof setTimeout> | undefined
let noticeTimer: ReturnType<typeof setTimeout> | undefined

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

function flash(message: string) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = null
  }, 3200)
}

function onToggleCompare(listing: ListingCardDto) {
  if (!compare.toggle(listing)) {
    flash('The comparison holds three vehicles. Drop one to add another.')
  }
}

watch(
  () => route.query,
  (query) => {
    const incoming = filtersToQuery(
      filtersFromQuery(query),
      sortFromQuery(query),
      pageFromQuery(query),
    )
    const local = filtersToQuery(filters.value, sort.value, page.value)
    if (!queriesEqual(incoming, local)) {
      filters.value = filtersFromQuery(query)
      sort.value = sortFromQuery(query)
      page.value = pageFromQuery(query)
    }
    void load()
  },
)

/* The filter sheet claims role="dialog" aria-modal="true", so it has to behave like
 * one: focus goes in, Escape closes it, Tab stays inside, and the page behind it is
 * taken out of the accessibility tree. Without this it was an opaque panel over a
 * page that was still focusable and scroll-locked, which is the worst of both. */
const sheet = ref<HTMLElement | null>(null)
const sheetTrigger = ref<HTMLElement | null>(null)

function focusableIn(container: HTMLElement): HTMLElement[] {
  return [
    ...container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ].filter((element) => element.offsetParent !== null)
}

function onSheetKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    sheetOpen.value = false
    return
  }
  if (event.key !== 'Tab' || !sheet.value) return
  const focusable = focusableIn(sheet.value)
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || !sheet.value.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(sheetOpen, async (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    sheetTrigger.value = document.activeElement as HTMLElement | null
    await nextTick()
    focusableIn(sheet.value!)[0]?.focus()
  } else {
    sheetTrigger.value?.focus()
    sheetTrigger.value = null
  }
})

onMounted(() => {
  void loadMeta()
  void load()
})

onBeforeUnmount(() => {
  clearTimeout(syncTimer)
  clearTimeout(noticeTimer)
  controller?.abort()
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="browse" :class="{ 'tray-open': compare.entries.length > 0 }">
    <!-- The cover. Masthead on the left, one drawing on the right, and the search
         closing it off across the full measure. -->
    <section class="cover" :inert="sheetOpen || undefined">
      <div class="shell cover-inner" :class="{ 'no-drawing': !coverCar }">
        <div class="cover-lead">
          <p class="edition">
            <span>Fahrzeugmarkt</span>
            <span class="edition-sep">/</span>
            <span>Northern Germany</span>
            <span class="edition-sep">/</span>
            <!-- The last known count rather than an ellipsis: the number is about to
                 change, not about to become unknown. -->
            <span class="figure">{{ totalElements }} vehicles</span>
            <span class="edition-sep">/</span>
            <span class="figure">{{ makeCount || '·' }} makes</span>
          </p>

          <h1 class="cover-title">The used car<br />catalogue</h1>
        </div>

        <!-- The drawing and its caption go together. Filtering to nothing used to
             leave a bare rule and a caption labelling an empty region. -->
        <figure v-if="coverCar" class="cover-figure">
          <div class="cover-stage">
            <CarSilhouette
              :key="coverCar.id"
              :src="coverCar.coverImageUrl"
              :model="coverCar.model"
              :body-type="coverCar.bodyType"
              :relative-size="false"
            />
          </div>
          <div class="cover-ground" aria-hidden="true"></div>
          <figcaption class="cover-caption">
            <span class="micro-label">In stock</span>
            <RouterLink class="cover-ref" :to="{ name: 'listing', params: { id: coverCar.id } }">
              {{ coverCar.make }} {{ coverCar.model }}
              <span class="figure">{{ formatPrice(coverCar.priceEur) }}</span>
            </RouterLink>
          </figcaption>
        </figure>

        <div class="find">
          <label class="search">
            <span class="visually-hidden">Search vehicles</span>
            <AppIcon name="search" :size="18" />
            <input
              class="search-input"
              type="search"
              :value="filters.q"
              placeholder="Make, model or title"
              @input="onSearchInput"
            />
          </label>

          <div class="shortcuts">
            <span class="micro-label shortcuts-label">Jump to</span>
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
      </div>
    </section>

    <div class="shell layout" :inert="sheetOpen || undefined">
      <aside class="sidebar-desktop" aria-label="Filters">
        <div class="sidebar-head">
          <h2 class="sidebar-title micro-label">Filters</h2>
          <span v-if="hasFilters" class="filter-count figure">{{ chips.length }} applied</span>
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
          <p class="count" :class="{ busy: loading }">
            <template v-if="loading && !listings.length">Searching</template>
            <template v-else-if="shownRange">
              <span class="figure">{{ shownRange.first }}</span>
              <span class="count-sep">to</span>
              <span class="figure">{{ shownRange.last }}</span>
              <span class="count-sep">of</span>
              <span class="figure count-total">{{ shownRange.total }}</span>
            </template>
            <template v-else>{{ resultLabel }}</template>
          </p>

          <div class="toolbar-actions">
            <button type="button" class="btn btn-secondary filter-trigger" @click="sheetOpen = true">
              <AppIcon name="filter" :size="16" />
              Filters
              <span v-if="hasFilters" class="trigger-count">{{ chips.length }}</span>
            </button>

            <div class="views" role="group" aria-label="Layout">
              <button
                type="button"
                class="view"
                :class="{ on: view === 'plates' }"
                :aria-pressed="view === 'plates'"
                @click="setView('plates')"
              >
                Plates
              </button>
              <button
                type="button"
                class="view"
                :class="{ on: view === 'index' }"
                :aria-pressed="view === 'index'"
                @click="setView('index')"
              >
                Index
              </button>
            </div>

            <!-- The native select carries the behaviour, laid over a ruled label
                 that carries the look. A filled rounded box here was six times the
                 weight of the two controls beside it. -->
            <label class="sort">
              <span class="visually-hidden">Sort results</span>
              <select :value="sort" @change="onSortChange">
                <option v-for="key in SORT_KEYS" :key="key" :value="key">
                  {{ SORT_LABELS[key] }}
                </option>
              </select>
              <span class="sort-face" aria-hidden="true">
                <span class="sort-key">Sort</span>
                {{ SORT_LABELS[sort] }}
                <span class="sort-caret" aria-hidden="true"></span>
              </span>
            </label>
          </div>
        </div>

        <FilterChips :chips="chips" @remove="onRemoveChip" @clear="resetFilters" />

        <p v-if="error" class="alert alert-error">{{ error }}</p>
        <p v-if="notice" class="notice" role="status">{{ notice }}</p>

        <!-- Skeletons only on a genuinely empty first load. On a refetch the results
             stay mounted and dim, the way the sidebar already does: unmounting the
             grid collapsed the document from 7,300px to 1,600px for a frame, which
             the browser answered by clamping the scroll position a thousand pixels
             up the page. -->
        <div v-if="loading && !listings.length" class="plates">
          <div v-for="n in 4" :key="n" class="plate-skeleton">
            <span class="skeleton-rule" />
            <span class="skeleton-drawing" />
            <span class="skeleton-figure" />
          </div>
        </div>

        <template v-else-if="listings.length">
          <div v-if="view === 'plates'" class="plates" :class="{ busy: loading }">
            <CataloguePlate
              v-for="(listing, i) in listings"
              :key="listing.id"
              :listing="listing"
              :index="firstIndex + i"
              :featured="i === 0"
              :saved="saved.has(listing.id)"
              :compared="compare.has(listing.id)"
              @toggle-save="onToggleSave"
              @toggle-compare="onToggleCompare"
            />
          </div>

          <CatalogueIndex
            v-else
            :class="{ busy: loading }"
            :listings="listings"
            :offset="firstIndex"
            :saved-ids="saved.ids"
            :compared-ids="compare.ids"
            @toggle-save="onToggleSave"
            @toggle-compare="onToggleCompare"
          />

          <PaginationBar :page="page" :total-pages="totalPages" @change="goToPage" />
        </template>

        <!-- Offers the single filter most likely to be the problem before offering to
             throw the whole search away. "Clear all filters" as the only exit asks
             the reader to discard work to recover from it. -->
        <EmptyState
          v-else-if="!error"
          icon="car"
          title="No vehicles match those filters"
          :description="
            chips.length > 1
              ? 'That combination is too narrow. Drop one and the rest of the search stays.'
              : 'Nothing in the catalogue matches. Try widening the range.'
          "
        >
          <button
            v-if="chips.length > 1"
            type="button"
            class="btn btn-secondary"
            @click="onRemoveChip(chips[chips.length - 1])"
          >
            Drop {{ chips[chips.length - 1].label }}
          </button>
          <button type="button" class="btn btn-primary" @click="resetFilters">
            Clear all filters
          </button>
        </EmptyState>
      </section>
    </div>

    <Transition name="sheet">
      <div v-if="sheetOpen" class="sheet-wrap">
        <div class="sheet-backdrop" @click="sheetOpen = false"></div>
        <aside
          ref="sheet"
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          @keydown="onSheetKeydown"
        >
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

    <CompareTray />
  </div>
</template>

<style scoped>
.browse {
  padding-bottom: var(--space-16);
}

.browse.tray-open {
  /* The tray publishes its measured height, so a collapsed tray reserves the room a
     collapsed tray needs. A flat 40vh left roughly 300px of empty page under the
     last plate whenever it was collapsed. */
  padding-bottom: calc(var(--tray-height, 40vh) + var(--space-12));
}

/* Cover */

/* The masthead and one drawing share a line at desktop width, so the page opens on
   the thing it is a page of. */
.cover-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: end;
  gap: var(--space-10) var(--space-16);
  padding-top: var(--space-10);
  padding-bottom: 0;
}

.cover-lead {
  min-width: 0;
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

/* The one element on the site allowed to be this large. Tight tracking and flush
   leading, so it reads as a printed masthead rather than as a heading that got
   bigger. Weight 350 rather than 300: the object beside it is a filled near-white
   car, and at 300 the words lost the page to it. */
.cover-title {
  margin-top: var(--space-5);
  font-size: var(--text-display);
  font-weight: 350;
  line-height: var(--leading-flush);
  letter-spacing: -0.045em;
  text-wrap: balance;
}

/* The cover drawing */

.cover-figure {
  position: relative;
  margin: 0;
  min-width: 0;
}

/* Sized by the drawing rather than fixed: the stage is exactly as tall as the
   car in it, so the rule always sits on the wheels. */
.cover-stage {
  display: flex;
  align-items: flex-end;
}

.cover-ground {
  height: 0;
  border-top: var(--rule-mid) solid var(--text);
}

.cover-caption {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  margin-top: var(--space-3);
  font-size: var(--text-xs);
}

.cover-caption .micro-label {
  display: inline;
}

.cover-ref {
  color: var(--text-muted);
  transition: color var(--transition-fast);
}

.cover-ref:hover {
  color: var(--text);
}

.cover-ref .figure {
  color: var(--accent-text);
}

/* Search and shortcuts */

/* Closes the cover. Without a rule here the 100px between the shortcuts and the
   toolbar read as a hole rather than as a section break. */
.find {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  margin-top: var(--space-4);
  padding-bottom: var(--space-8);
  border-bottom: var(--rule-heavy) solid var(--text);
}

/* A ruled line, not a boxed field. The cover has no other boxes on it and one
   would look borrowed. */
.search {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  max-width: 620px;
  padding-bottom: var(--space-3);
  border-bottom: var(--rule-mid) solid var(--border-strong);
  color: var(--text-subtle);
  transition: border-color var(--transition-base);
}

.search:focus-within {
  border-bottom-color: var(--accent);
  color: var(--accent-text);
}

.search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: none;
  color: var(--text);
  font-size: var(--text-xl);
  font-weight: 300;
  letter-spacing: -0.02em;
}

.search-input::placeholder {
  color: var(--text-faint);
}

/* The wrapper's :focus-within turns the rule to the accent as well, so focus here
   reads twice over: the ring on the field and the rule under it. */

.search-input::-webkit-search-cancel-button {
  filter: invert(0.5);
}

.shortcuts {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-5);
}

.shortcuts-label {
  display: inline;
  color: var(--text-faint);
}

/* Ruled text, not pills. Six pills in a row is the most template-looking thing
   a hero can do. */
.shortcut {
  padding: var(--space-2) 0 6px;
  border: 0;
  border-bottom: var(--rule-hair) solid transparent;
  background: none;
  color: var(--text-muted);
  font-size: var(--text-sm);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.shortcut:hover {
  color: var(--text);
  border-bottom-color: var(--border-strong);
}

.shortcut.on {
  color: var(--accent-text);
  border-bottom-color: var(--accent);
}

/* Layout */

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-10);
  margin-top: var(--space-8);
}

.sidebar-desktop {
  display: none;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding-bottom: var(--space-3);
  border-bottom: var(--rule-mid) solid var(--text);
}

.sidebar-title {
  color: var(--text);
}

.filter-count {
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--accent-text);
}

.results {
  min-width: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
  padding-bottom: var(--space-4);
}

.count {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-faint);
}

.count-sep {
  color: var(--text-faint);
}

.count-total {
  color: var(--text);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3) var(--space-4);
  min-width: 0;
}

/* Two labels sharing one rule, rather than two icon buttons in a segmented
   control. The words are shorter to read than the icons are to decode. */
.views {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
}

.view {
  padding: var(--space-2) 0 7px;
  border: 0;
  border-bottom: var(--rule-mid) solid transparent;
  background: none;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.view:hover {
  color: var(--text-muted);
}

.view.on {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.sort {
  position: relative;
  display: block;
  min-width: 0;
}

.sort-face {
  display: inline-flex;
  align-items: baseline;
  gap: var(--space-2);
  pointer-events: none;
  padding-bottom: 3px;
  border-bottom: var(--rule-mid) solid var(--border-strong);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  white-space: nowrap;
  transition: border-color var(--transition-fast);
}

.sort-key {
  color: var(--text-faint);
}

.sort-caret {
  align-self: center;
  width: 6px;
  height: 6px;
  border-right: var(--rule-hair) solid var(--text-subtle);
  border-bottom: var(--rule-hair) solid var(--text-subtle);
  transform: translateY(-2px) rotate(45deg);
}

.sort select {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  border: 0;
  opacity: 0;
  cursor: pointer;
}

.sort:hover .sort-face,
.sort select:focus-visible + .sort-face {
  border-bottom-color: var(--accent);
}

/* A figure beside the word, not a badge stuck to it. */
.trigger-count {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: var(--text-xs);
  color: var(--accent-text);
}

.notice {
  margin-bottom: var(--space-4);
  padding: var(--space-2) var(--space-3);
  border-left: var(--rule-mid) solid var(--accent);
  background: var(--accent-soft);
  color: var(--text);
  font-size: var(--text-sm);
}

/* Plates */

.plates {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-8) var(--space-12);
}

/* A refetch dims the results in place rather than replacing them. Same signal the
   filter sidebar uses while it is waiting. */
.plates.busy,
.results :deep(.index.busy) {
  opacity: 0.45;
  transition: opacity var(--transition-base);
  pointer-events: none;
}

.plate-skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding-bottom: var(--space-10);
}

.skeleton-rule,
.skeleton-drawing,
.skeleton-figure {
  display: block;
  background: var(--skeleton-base);
}

.skeleton-rule {
  height: var(--rule-mid);
  background: var(--border-strong);
}

/* Same ratio as the drawing it stands in for, so the grid does not jump when the
   real plates arrive. */
.skeleton-drawing {
  aspect-ratio: 955 / 388;
  opacity: 0.4;
}

.skeleton-figure {
  height: 34px;
  width: 42%;
  opacity: 0.4;
}

/* Mobile filter sheet */

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
  border-right: var(--rule-hair) solid var(--border);
  box-shadow: var(--shadow-lg);
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-bottom: var(--rule-hair) solid var(--border);
}

.sheet-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

.sheet-foot {
  padding: var(--space-4) var(--space-5);
  border-top: var(--rule-hair) solid var(--border);
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

@media (min-width: 720px) {
  .cover-inner {
    padding-top: var(--space-20);
  }

  .plates {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* The drawing moves alongside the masthead only once both have room. Below this it
   stacks under the title, where a 700px-wide car would otherwise squeeze the
   headline into four lines. The words get the larger track. */
@media (min-width: 1140px) {
  .cover-inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.82fr);
  }

  /* No drawing to stand beside the masthead, so the masthead takes the whole
     measure rather than the cover holding a column open for nothing. */
  .cover-inner.no-drawing {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (min-width: 1080px) {
  .layout {
    grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
    gap: var(--space-16);
  }

  /* Scrolls without a track: a grey bar down the full height of the page beside
     the plates was the most visible line on the surface. The mask fades the last
     rows instead, which says there is more below without drawing furniture. */
  .sidebar-desktop {
    display: block;
    position: sticky;
    top: calc(var(--header-height) + var(--space-6));
    align-self: start;
    max-height: calc(100vh - var(--header-height) - var(--space-12));
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
    padding-right: var(--space-2);
    mask-image: linear-gradient(to bottom, #000 0, #000 calc(100% - 40px), transparent 100%);
  }

  .sidebar-desktop::-webkit-scrollbar {
    width: 0;
  }

  .filter-trigger {
    display: none;
  }
}

/* Three across only once a plate is still wide enough to set a 44px price beside
   a three-figure column without either of them wrapping. Below that, two, and the
   drawings are better for it. */
@media (min-width: 1860px) {
  .plates {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* A phone should not inherit desktop air. The cover's gaps were tuned for a
   1600px spread and arrived unchanged at 390px, where they read as three empty
   screens before the first vehicle. */
@media (max-width: 719px) {
  .cover-inner {
    gap: var(--space-6) 0;
    padding-top: var(--space-6);
  }

  .find {
    margin-top: var(--space-2);
    padding-bottom: var(--space-5);
  }

  .layout {
    margin-top: var(--space-5);
  }
}

@media (prefers-reduced-motion: reduce) {
  .browse :deep(*) {
    scroll-behavior: auto;
  }
}
</style>
