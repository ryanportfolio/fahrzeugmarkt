<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import CarSilhouette from './CarSilhouette.vue'
import AppIcon from './AppIcon.vue'
import { formatPrice, variantLabel } from '../format'
import { useCompareStore } from '../stores/compare'

const compare = useCompareStore()
const open = ref(true)

const numbers = new Intl.NumberFormat('de-DE')

/* The page has to keep enough bottom padding to scroll its last plate clear of the
 * tray, and the tray's height depends on how many vehicles are in it and whether it
 * is collapsed. A flat reservation left ~300px of dead page under the results
 * whenever the tray was collapsed, so the real measured height is published as a
 * custom property on the document and the pages read it. */
const root = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

function publishHeight(height: number) {
  document.documentElement.style.setProperty('--tray-height', `${Math.round(height)}px`)
}

watch(root, (element) => {
  observer?.disconnect()
  observer = null
  if (!element) {
    publishHeight(0)
    return
  }
  if (typeof ResizeObserver === 'undefined') {
    publishHeight(element.offsetHeight)
    return
  }
  observer = new ResizeObserver((entries) => {
    publishHeight(entries[0].target.getBoundingClientRect().height)
  })
  observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  publishHeight(0)
  clearTimeout(copiedTimer)
})

/* A comparison is something you send to whoever you are buying the car with, so it
 * needs an address. The ids go in the query and the store hydrates from them. */
const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

async function copyLink() {
  const url = new URL(window.location.href)
  url.searchParams.set('compare', compare.shareQuery)
  try {
    await navigator.clipboard.writeText(url.toString())
    copied.value = true
  } catch {
    // Clipboard refused, so put the link in the address bar instead: it is still
    // copyable by hand and the page now has the comparison in its URL.
    window.history.replaceState(window.history.state, '', url.toString())
    copied.value = true
  }
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 2400)
}

interface Delta {
  label: string
  values: string[]
  /** Index of the strongest value, or -1 where "strongest" has no meaning. */
  best: number
}

/* Marks the strongest value in each row, so the comparison says something instead
 * of just tabulating. Lower is better for price and mileage, higher for power and
 * registration date. Every row here has a direction: the accent means the primary
 * action, the saved state and the live figure, so extending it to mean "wins" on a
 * metric with no winner would be the accent losing its meaning. */
const deltas = computed<Delta[]>(() => {
  const entries = compare.entries
  if (entries.length < 2) return []

  const scored: { label: string; raw: number[]; text: string[]; lowerIsBetter: boolean }[] = [
    {
      label: 'Price',
      raw: entries.map((e) => e.priceEur),
      text: entries.map((e) => formatPrice(e.priceEur)),
      lowerIsBetter: true,
    },
    {
      label: 'Mileage',
      raw: entries.map((e) => e.mileageKm),
      text: entries.map((e) => `${numbers.format(e.mileageKm)} km`),
      lowerIsBetter: true,
    },
    {
      label: 'Power',
      raw: entries.map((e) => e.powerKw),
      text: entries.map((e) => `${e.powerKw} kW`),
      lowerIsBetter: false,
    },
    {
      label: 'First registration',
      raw: entries.map((e) => Number(e.firstRegistration.replace(/-/g, ''))),
      text: entries.map((e) => {
        const [year, month] = e.firstRegistration.split('-')
        return `${month}/${year}`
      }),
      lowerIsBetter: false,
    },
  ]

  return scored.map((row) => {
    const target = row.lowerIsBetter ? Math.min(...row.raw) : Math.max(...row.raw)
    // A tie is nobody's win, so nothing is marked.
    const winners = row.raw.filter((value) => value === target).length
    return {
      label: row.label,
      values: row.text,
      best: winners === 1 ? row.raw.indexOf(target) : -1,
    }
  })
})
</script>

<template>
  <Transition name="tray">
    <aside
      v-if="compare.entries.length"
      ref="root"
      class="tray"
      :style="{ '--bays': compare.entries.length }"
      aria-label="Comparison"
    >
      <div class="shell tray-inner">
        <header class="tray-head">
          <h2 class="tray-title">
            Comparison
            <span class="count figure">{{ compare.entries.length }}/3</span>
          </h2>
          <button type="button" class="text-action" @click="open = !open">
            {{ open ? 'Collapse' : 'Expand' }}
          </button>
          <button type="button" class="text-action" @click="copyLink">
            {{ copied ? 'Link copied' : 'Copy link' }}
          </button>
          <button type="button" class="text-action" @click="compare.clear()">Clear</button>
        </header>

        <div v-show="open" class="tray-panel">
          <!-- Lanes, not bays: the cars keep the sizes they have relative to each
               other and every lane ends on the same ground line, so the two are
               seen side by side before they are tabulated. That is the whole point
               of the tray, and scaling each car to fill its own box destroyed it. -->
          <div class="stage">
            <!-- Holds the lanes clear of the label column the delta table below
                 uses, so each figure sits under the car it belongs to. -->
            <div class="gutter" aria-hidden="true"></div>
            <article v-for="entry in compare.entries" :key="entry.id" class="lane">
              <header class="lane-head">
                <div class="lane-name">
                  <p class="lane-variant">{{ variantLabel(entry) }}</p>
                  <p class="lane-family">{{ entry.make }} {{ entry.model }}</p>
                </div>
                <button
                  type="button"
                  class="drop"
                  :aria-label="`Remove ${entry.title} from comparison`"
                  @click="compare.remove(entry.id)"
                >
                  <AppIcon name="x" :size="12" />
                </button>
              </header>

              <CarSilhouette
                :src="entry.coverImageUrl"
                :model="entry.model"
                :body-type="entry.bodyType"
              />

              <div class="lane-rule" aria-hidden="true"></div>
            </article>
          </div>

          <p v-if="compare.entries.length < 2" class="prompt">
            Add a second vehicle. Both stand on one line, side by side, with the
            figures that separate them underneath.
          </p>

          <dl v-else class="deltas">
            <template v-for="row in deltas" :key="row.label">
              <dt class="micro-label">{{ row.label }}</dt>
              <dd
                v-for="(value, i) in row.values"
                :key="i"
                class="delta figure"
                :class="{ best: i === row.best }"
              >
                {{ value }}
              </dd>
            </template>
          </dl>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.tray {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  /* --surface-raised, not --surface-sunken: in the light theme the sunken tone sits
     four values off the page, so a 72vh overlay read as a faint tonal shift with no
     edge. The heavy accent rule gives it the edge in both themes. */
  background: var(--surface-raised);
  border-top: var(--rule-heavy) solid var(--accent);
  box-shadow: var(--shadow-lg);
  /* Capped so the grid it is meant to help you shop from stays reachable. At 72vh
     the expanded tray covered two thirds of the viewport, which left no scroll
     position where a plate's Compare button was uncovered: you could add two
     vehicles and then physically could not add a third. */
  max-height: 46vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* The lanes and the table scroll, not the whole aside, so the head with Collapse
   and Clear stays put. */
.tray-panel {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.tray-inner {
  --label-col: 132px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-top: var(--space-3);
  padding-bottom: var(--space-4);
}

.tray-head {
  display: flex;
  align-items: baseline;
  gap: var(--space-5);
}

.tray-title {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text);
}

.count {
  color: var(--accent-text);
}

/* Padded to a 24px target. At 16px tall these were a coin flip on a phone, and the
   ink stays 10px either way. */
.text-action {
  padding: var(--space-2) 0;
  border: 0;
  background: none;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.text-action:last-of-type {
  margin-left: auto;
}

.text-action:hover {
  color: var(--text);
}

/* One lane per vehicle, all the same measure, so a car's size in its lane means the
   same thing in every lane. Counted rather than auto-fit: auto-fit would lay eight
   180px columns across this width and leave two cars in the left quarter of the
   screen. */
.stage {
  display: grid;
  grid-template-columns: var(--label-col) repeat(var(--bays), minmax(0, 1fr));
  align-items: end;
  gap: 0 var(--space-8);
  max-width: calc(var(--label-col) + var(--bays) * 520px);
  margin-top: var(--space-4);
}

.gutter {
  min-width: 0;
}

.lane {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-width: 0;
}

.lane-head {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.lane-name {
  min-width: 0;
}

.lane-variant {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  font-weight: 500;
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lane-family {
  margin-top: 2px;
  font-size: var(--text-lg);
  font-weight: 400;
  letter-spacing: -0.022em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lane-rule {
  height: 0;
  border-top: var(--rule-hair) solid var(--rule-ink);
}

.drop {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: var(--rule-hair) solid var(--border-strong);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--text-subtle);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.drop:hover {
  color: var(--danger);
  border-color: var(--danger);
}

.prompt {
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--text-faint);
  max-width: 44ch;
}

/* A label column, then one column per vehicle. The lanes above start at the shell
   edge, so the label column is pulled out to the left of them and the figure
   columns stay aligned under the cars they describe. */
.deltas {
  display: grid;
  grid-template-columns: var(--label-col) repeat(var(--bays), minmax(0, 1fr));
  column-gap: var(--space-8);
  max-width: calc(var(--label-col) + var(--bays) * 520px);
  margin-top: var(--space-8);
  border-top: var(--rule-hair) solid var(--border);
}

.deltas dt {
  padding: var(--space-2) 0;
  color: var(--text-subtle);
  border-bottom: var(--rule-hair) solid var(--border);
}

.delta {
  padding: var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
  border-bottom: var(--rule-hair) solid var(--border);
}

/* The one value in the row worth having. Marked in the accent rather than with a
   badge, because a badge on every row would be five badges. */
.delta.best {
  color: var(--accent-text);
  font-weight: 500;
}

.tray-enter-active,
.tray-leave-active {
  transition:
    transform var(--transition-slow),
    opacity var(--transition-slow);
}

.tray-enter-from,
.tray-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tray-enter-active,
  .tray-leave-active {
    transition: none;
  }
}

/* The label column is dropped rather than squeezed, so the drawings keep their
   measure, and the row label rides above its own figures instead.
   The label track has to leave the template entirely: keeping a zero-width first
   column and only re-spanning the dt left the dd cells auto-placing into that
   zero-width track, which printed both vehicles' figures on top of each other on
   every row. */
@media (max-width: 720px) {
  .stage,
  .deltas {
    grid-template-columns: repeat(var(--bays), minmax(0, 1fr));
    column-gap: var(--space-4);
    max-width: none;
  }

  .gutter {
    display: none;
  }

  .lane-family {
    font-size: var(--text-sm);
  }

  .deltas dt {
    grid-column: 1 / -1;
    padding-top: var(--space-4);
    border-bottom: 0;
  }
}
</style>
