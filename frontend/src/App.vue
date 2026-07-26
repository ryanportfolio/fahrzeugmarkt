<script setup lang="ts">
import { onMounted, watch } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import { useAuthStore } from './stores/auth'
import { useCompareStore } from './stores/compare'
import { useSavedStore } from './stores/saved'

const auth = useAuthStore()
const saved = useSavedStore()
const compare = useCompareStore()

/** Ids from `?compare=11,168` if the visitor followed a shared comparison, and from
 *  this tab's own session otherwise, so a reload does not empty the tray. */
function comparedIdsOnEntry(): number[] {
  const fromUrl = new URLSearchParams(window.location.search).get('compare')
  const ids = fromUrl
    ? fromUrl
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((value) => Number.isInteger(value) && value > 0)
    : compare.storedIds()
  return ids
}

onMounted(async () => {
  await auth.ensureSession()
  const ids = comparedIdsOnEntry()
  if (ids.length) await compare.restore(ids)
})

watch(
  () => auth.user?.id ?? null,
  (id) => {
    if (id === null) saved.reset()
    else void saved.load(true)
  },
  { immediate: true },
)
</script>

<template>
  <a href="#main" class="skip-link">Skip to content</a>
  <AppHeader />
  <main id="main" class="main">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.name === 'listing' ? route.fullPath : route.name" />
    </RouterView>
  </main>
  <AppFooter />
</template>

<style scoped>
.main {
  min-height: 60vh;
}

.skip-link {
  position: absolute;
  left: var(--space-4);
  top: var(--space-2);
  z-index: 100;
  padding: var(--space-2) var(--space-3);
  background: var(--accent);
  color: var(--accent-contrast);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  transform: translateY(-200%);
  transition: transform var(--transition-fast);
}

.skip-link:focus-visible {
  transform: translateY(0);
  color: var(--accent-contrast);
}
</style>
