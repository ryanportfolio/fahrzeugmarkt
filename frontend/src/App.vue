<script setup lang="ts">
import { onMounted, watch } from 'vue'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import { useAuthStore } from './stores/auth'
import { useSavedStore } from './stores/saved'

const auth = useAuthStore()
const saved = useSavedStore()

onMounted(async () => {
  await auth.ensureResolved()
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
  font-weight: 600;
  transform: translateY(-200%);
  transition: transform var(--transition-fast);
}

.skip-link:focus-visible {
  transform: translateY(0);
  color: var(--accent-contrast);
}
</style>
