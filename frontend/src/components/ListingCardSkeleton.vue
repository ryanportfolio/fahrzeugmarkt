<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="skeleton media"></div>
    <div class="body">
      <div class="skeleton line xs"></div>
      <div class="skeleton line lg"></div>
      <div class="skeleton line price"></div>
      <div class="skeleton line"></div>
      <div class="skeleton line sm"></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-card {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.media {
  aspect-ratio: 4 / 3;
  border-radius: 0;
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
}

.line {
  height: 12px;
  width: 100%;
}

.line.xs {
  height: 9px;
  width: 35%;
}

.line.lg {
  height: 16px;
  width: 85%;
}

.line.price {
  height: 22px;
  width: 45%;
  margin: var(--space-1) 0;
}

.line.sm {
  width: 55%;
}
</style>
