<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mediaUrl } from '../api/client'
import { isSeedDrawing, loadSilhouette } from '../catalogue/silhouette'
import { lengthFraction, plateViewBox } from '../catalogue/scale'
import type { BodyType } from '../types'

const props = withDefaults(
  defineProps<{
    /** Cover image path as the API returns it, or null when there is none. */
    src: string | null
    model: string
    /** Decides the crop: the renderer gives each body type a different share of
     *  the canvas, and the crop has to wrap the car for the sizing to hold. */
    bodyType: BodyType
    /** Size the drawing relative to the rest of the catalogue rather than
     *  stretching it to fill its slot. Off where a drawing stands alone and has no
     *  neighbours to be in proportion with. */
    relativeSize?: boolean
    /** Lay a pool of light on the ground under the car. */
    lit?: boolean
  }>(),
  { relativeSize: true, lit: true },
)

const markup = ref<string | null>(null)
const failed = ref(false)

/* A seller upload is a photograph, not a generated drawing: it cannot be lifted
 * out of a studio it was never in, and it is never inlined as markup. It is shown
 * as an ordinary image in the same slot, so the ground line still holds. */
const photo = computed(() => (props.src && !isSeedDrawing(props.src) ? mediaUrl(props.src) : null))

watch(
  () => props.src,
  (src) => {
    markup.value = null
    failed.value = false
    if (!src || !isSeedDrawing(src)) {
      failed.value = !src
      return
    }
    const requested = src
    // One retry, because loadSilhouette does not cache a failure and a drawing lost
    // to a dropped connection is otherwise gone for the rest of the session.
    loadSilhouette(mediaUrl(src))
      .catch(() => loadSilhouette(mediaUrl(src)))
      .then((silhouette) => {
        if (props.src !== requested) return
        markup.value = silhouette.markup
      })
      .catch(() => {
        if (props.src !== requested) return
        failed.value = true
      })
  },
  { immediate: true },
)

const width = computed(() => (props.relativeSize ? `${lengthFraction(props.model) * 100}%` : '100%'))
const viewBox = computed(() => plateViewBox(props.bodyType))
</script>

<template>
  <figure class="silhouette" :class="{ lit, ready: markup !== null || photo !== null }">
    <span v-if="lit" class="pool" aria-hidden="true" />
    <!-- The drawing is bottom-aligned inside its slot and the viewBox ends on
         the ground line, so cars of different sizes stand on one baseline. -->
    <svg
      v-if="markup"
      class="drawing"
      :viewBox="viewBox"
      :style="{ width }"
      role="img"
      :aria-label="`${model}, side profile drawing`"
      v-html="markup"
    />
    <img
      v-else-if="photo"
      class="photo"
      :src="photo"
      :alt="`${model}, photograph supplied by the seller`"
      loading="lazy"
      decoding="async"
    />
    <!-- A failure that looks like a design decision never gets reported, so it says
         what happened and says it to a screen reader too. -->
    <span v-else-if="failed" class="missing" :style="{ width }" role="img" aria-label="Drawing unavailable">
      <span class="missing-label">Drawing unavailable</span>
    </span>
    <span v-else class="placeholder" :style="{ width }" aria-hidden="true" />
  </figure>
</template>

<style scoped>
/* The slot carries the ratio, not the drawing. It reserves the height the
   tallest-per-width case needs, which is a full-length car in the narrowest crop,
   so a shorter car leaves the gap it has earned instead of shrinking the row,
   every plate in a grid is the same height, every drawing on a line stands on the
   same ground, and the height is known before the drawing has loaded. */
.silhouette {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: 100%;
  aspect-ratio: 845 / 388;
  margin: 0;
}

/* The studio light that was stripped out of the artwork, put back where the
   theme can reach it. It is what separates a black car from a dark ground and
   a white car from a light one, without tinting either. */
/* Kept inside the slot rather than bled past it. The feather comes from the
   gradient stops, not from negative insets, because a decorative element wider
   than the page is a horizontal scrollbar on a phone. */
.pool {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -7%;
  height: 42%;
  background: radial-gradient(
    var(--pool-shape),
    var(--pool-core) 0%,
    var(--pool-mid) 42%,
    transparent 74%
  );
  opacity: 0;
  transition: opacity 700ms var(--ease-out);
  pointer-events: none;
}

.silhouette.ready .pool {
  opacity: 1;
}

.drawing {
  position: relative;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 12px 18px var(--drawing-shadow));
  animation: settle 760ms var(--ease-out) both;
}

/* The car arrives on its baseline rather than fading in on the spot. Short,
   and only once, because twenty-four of them run at the same time. */
@keyframes settle {
  from {
    opacity: 0;
    transform: translate3d(-14px, 0, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* A photograph fills the slot instead of standing in it. There is no ground line
   inside a photo to align to, so it is contained rather than cropped. */
.photo {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom;
}

.placeholder {
  height: 100%;
  background: linear-gradient(100deg, var(--skeleton-base), var(--skeleton-shine), var(--skeleton-base));
  background-size: 220% 100%;
  animation: sweep 1500ms linear infinite;
  border-radius: 2px;
  opacity: 0.5;
}

.missing {
  display: grid;
  place-items: end start;
  height: 100%;
  border-bottom: var(--rule-hair) dashed var(--border-strong);
}

.missing-label {
  padding-bottom: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--text-subtle);
}

@keyframes sweep {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -120% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawing,
  .placeholder {
    animation: none;
  }

  .pool {
    transition: none;
  }
}
</style>
