<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import { mediaUrl } from '../api/client'
import type { ListingImageDto } from '../types'

const props = defineProps<{
  images: ListingImageDto[]
  alt: string
}>()

const index = ref(0)

const ordered = computed(() =>
  [...props.images].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
)
const current = computed(() => ordered.value[index.value] ?? null)
const total = computed(() => ordered.value.length)

watch(
  () => props.images,
  () => {
    index.value = 0
  },
)

function step(delta: number) {
  if (!total.value) return
  index.value = (index.value + delta + total.value) % total.value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    step(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    step(1)
  }
}
</script>

<template>
  <div
    class="gallery"
    tabindex="0"
    role="group"
    :aria-label="`Photo gallery, ${total} images, use arrow keys`"
    @keydown="onKeydown"
  >
    <div class="stage">
      <img v-if="current" :src="mediaUrl(current.url)" :alt="alt" decoding="async" />
      <span v-else class="fallback"><AppIcon name="image" :size="34" /></span>

      <template v-if="total > 1">
        <button
          type="button"
          class="arrow left"
          aria-label="Previous photo"
          @click="step(-1)"
        >
          <AppIcon name="chevron-left" :size="20" />
        </button>
        <button type="button" class="arrow right" aria-label="Next photo" @click="step(1)">
          <AppIcon name="chevron-right" :size="20" />
        </button>
        <p class="counter" aria-live="polite">{{ index + 1 }} of {{ total }}</p>
      </template>
    </div>

    <ul v-if="total > 1" class="thumbs">
      <li v-for="(image, i) in ordered" :key="image.id">
        <button
          type="button"
          class="thumb"
          :class="{ active: i === index }"
          :aria-label="`Show photo ${i + 1}`"
          :aria-current="i === index"
          @click="index = i"
        >
          <img :src="mediaUrl(image.url)" :alt="`${alt}, photo ${i + 1}`" loading="lazy" decoding="async" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-radius: var(--radius-lg);
}

.gallery:focus-visible {
  box-shadow: var(--focus-ring);
}

.stage {
  position: relative;
  aspect-ratio: 16 / 10;
  background: var(--surface-sunken);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.stage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: var(--text-subtle);
}

.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  border-radius: 50%;
  background: color-mix(in srgb, var(--surface-card) 88%, transparent);
  backdrop-filter: blur(6px);
  color: var(--text);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.arrow:hover {
  background: var(--surface-card);
}

.arrow.left {
  left: var(--space-3);
}

.arrow.right {
  right: var(--space-3);
}

.counter {
  position: absolute;
  right: var(--space-3);
  bottom: var(--space-3);
  padding: 3px var(--space-2);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--surface-card) 88%, transparent);
  backdrop-filter: blur(6px);
  font-size: var(--text-xs);
  font-weight: 620;
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
}

/* Thumbnails stay a strip of small frames rather than stretching to fill the
   stage width, so two images do not read as a second gallery. */
.thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.thumb {
  display: block;
  width: 104px;
  flex: none;
  aspect-ratio: 16 / 10;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
  transition:
    opacity var(--transition-fast),
    border-color var(--transition-fast);
}

.thumb:hover {
  opacity: 1;
}

.thumb.active {
  border-color: var(--accent);
  opacity: 1;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (min-width: 1024px) {
  .thumb {
    width: 120px;
  }
}
</style>
