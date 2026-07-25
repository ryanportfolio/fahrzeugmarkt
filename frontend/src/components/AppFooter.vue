<script setup lang="ts">
import AppIcon from './AppIcon.vue'
</script>

<template>
  <footer class="footer">
    <div class="shell footer-inner">
      <div class="brand">
        <span class="brand-mark"><AppIcon name="car" :size="16" /></span>
        <span>Fahrzeugmarkt</span>
      </div>
      <p class="note">
        A portfolio prototype of a German used-vehicle marketplace. Vue 3, TypeScript, Spring Boot
      </p>
      <p class="note">Demo data only, no vehicles are actually for sale</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  border-top: 1px solid var(--border);
  background: var(--surface-card);
}

.footer-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-8);
  padding-bottom: var(--space-8);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 640;
  font-size: var(--text-sm);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent-text);
}

.note {
  font-size: var(--text-xs);
  color: var(--text-subtle);
}

@media (min-width: 768px) {
  .footer-inner {
    flex-direction: row;
    align-items: center;
    gap: var(--space-6);
  }

  .note:first-of-type {
    margin-right: auto;
  }
}
</style>
