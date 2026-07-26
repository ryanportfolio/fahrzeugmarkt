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
/* Takes the band, so the reversed running head at the top of the page is answered
   by a reversed colophon at the bottom and the two hold the catalogue between
   them. In the light theme a single dark bar with nothing to answer it read as the
   dark theme's header left behind on paper. */
.footer {
  margin-top: auto;
  border-top: var(--rule-mid) solid var(--band-border);
  background: var(--band);
  color: var(--band-text);
}

.footer-inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-8);
  padding-bottom: var(--space-8);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 500;
  font-size: var(--text-sm);
  letter-spacing: -0.02em;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  background: var(--accent-on-band);
  color: var(--accent-on-band-contrast);
}

.note {
  font-family: var(--font-mono);
  font-size: var(--label-size);
  letter-spacing: var(--label-tracking);
  text-transform: uppercase;
  color: var(--band-muted);
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
