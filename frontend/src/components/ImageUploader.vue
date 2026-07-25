<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import type { ListingImageDto } from '../types'

const props = withDefaults(
  defineProps<{
    images: ListingImageDto[]
    pending: File[]
    max?: number
    busy?: boolean
    error?: string | null
  }>(),
  { max: 10, busy: false, error: null },
)

const emit = defineEmits<{
  add: [files: File[]]
  removePending: [index: number]
  removeImage: [id: number]
  reject: [message: string]
}>()

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const previews = ref<string[]>([])

const total = computed(() => props.images.length + props.pending.length)
const remaining = computed(() => Math.max(0, props.max - total.value))

watch(
  () => props.pending,
  (files) => {
    previews.value.forEach((url) => URL.revokeObjectURL(url))
    previews.value = files.map((file) => URL.createObjectURL(file))
  },
  { immediate: true, deep: true },
)

onBeforeUnmount(() => {
  previews.value.forEach((url) => URL.revokeObjectURL(url))
})

function accept(files: FileList | null) {
  if (!files || !files.length) return
  const valid: File[] = []
  for (const file of Array.from(files)) {
    if (!ACCEPTED.includes(file.type)) {
      emit('reject', `${file.name} is not a JPEG, PNG or WebP image`)
      continue
    }
    if (file.size > MAX_BYTES) {
      emit('reject', `${file.name} is larger than 5 MB`)
      continue
    }
    valid.push(file)
  }
  const allowed = valid.slice(0, remaining.value)
  if (valid.length > allowed.length) {
    emit('reject', `Only ${props.max} photos per listing`)
  }
  if (allowed.length) emit('add', allowed)
}

function onDrop(event: DragEvent) {
  dragging.value = false
  accept(event.dataTransfer?.files ?? null)
}

function onPick(event: Event) {
  const target = event.target as HTMLInputElement
  accept(target.files)
  target.value = ''
}
</script>

<template>
  <div class="uploader">
    <div
      class="dropzone"
      :class="{ dragging, disabled: remaining === 0 }"
      role="button"
      tabindex="0"
      :aria-disabled="remaining === 0"
      @click="input?.click()"
      @keydown.enter.prevent="input?.click()"
      @keydown.space.prevent="input?.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span class="glyph"><AppIcon name="upload" :size="22" /></span>
      <p class="drop-title">Drag photos here or click to choose</p>
      <p class="drop-note">
        JPEG, PNG or WebP, up to 5 MB each. {{ remaining }} of {{ max }} slots left
      </p>
      <input
        ref="input"
        class="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        :disabled="remaining === 0"
        @change="onPick"
      />
    </div>

    <p v-if="error" class="field-error">{{ error }}</p>

    <ul v-if="total" class="tiles">
      <li v-for="(image, index) in images" :key="`saved-${image.id}`" class="tile">
        <img :src="image.url" :alt="`Photo ${index + 1}`" />
        <span v-if="index === 0" class="cover">Cover</span>
        <button
          type="button"
          class="remove"
          :disabled="busy"
          aria-label="Remove photo"
          @click="emit('removeImage', image.id)"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </li>
      <li v-for="(file, index) in pending" :key="`pending-${index}-${file.name}`" class="tile">
        <img :src="previews[index]" :alt="file.name" />
        <span class="cover queued">Queued</span>
        <button
          type="button"
          class="remove"
          :disabled="busy"
          aria-label="Remove photo"
          @click="emit('removePending', index)"
        >
          <AppIcon name="x" :size="14" />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.uploader {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-8) var(--space-4);
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  text-align: center;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.dropzone:hover,
.dropzone.dragging {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.dropzone.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.glyph {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--surface-card);
  color: var(--accent-text);
}

.drop-title {
  font-size: var(--text-sm);
  font-weight: 620;
}

.drop-note {
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
}

.tile {
  position: relative;
  aspect-ratio: 4 / 3;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-sunken);
  overflow: hidden;
}

.tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover {
  position: absolute;
  left: var(--space-2);
  bottom: var(--space-2);
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 11px;
  font-weight: 700;
}

.cover.queued {
  background: var(--warning);
  color: var(--surface-card);
}

.remove {
  position: absolute;
  right: var(--space-2);
  top: var(--space-2);
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: color-mix(in srgb, var(--surface-card) 88%, transparent);
  backdrop-filter: blur(6px);
  color: var(--text);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.remove:hover {
  background: var(--danger);
  color: var(--text-inverse);
}
</style>
