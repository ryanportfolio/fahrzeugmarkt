<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { formatDateTime } from '../format'
import type { SellerDto } from '../types'

const props = defineProps<{ seller: SellerDto }>()

const initials = computed(() =>
  props.seller.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join(''),
)
</script>

<template>
  <section class="seller panel">
    <h2 class="heading">Seller</h2>
    <div class="identity">
      <span class="avatar">{{ initials }}</span>
      <div>
        <p class="name">{{ seller.displayName }}</p>
        <p v-if="seller.city" class="meta">{{ seller.city }}</p>
      </div>
    </div>
    <ul class="facts">
      <li>
        <AppIcon name="user" :size="15" />
        <span>Member since {{ formatDateTime(seller.memberSince) }}</span>
      </li>
      <li v-if="seller.phone">
        <AppIcon name="mail" :size="15" />
        <span>{{ seller.phone }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.seller {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.heading {
  font-size: var(--text-xs);
  font-weight: 680;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.identity {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: var(--text-sm);
  font-weight: 700;
}

.name {
  font-size: var(--text-md);
  font-weight: 640;
}

.meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.facts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.facts li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-muted);
}
</style>
