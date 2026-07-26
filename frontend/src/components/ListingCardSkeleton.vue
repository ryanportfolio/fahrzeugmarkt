<template>
  <div class="skeleton-card" aria-hidden="true">
    <div class="skeleton media"></div>
    <div class="body">
      <div class="skeleton line family"></div>
      <div class="skeleton line title"></div>
      <div class="skeleton line price"></div>
      <div class="specs">
        <div v-for="n in 3" :key="n" class="spec">
          <div class="skeleton line label"></div>
          <div class="skeleton line value"></div>
        </div>
      </div>
      <div class="foot">
        <div class="skeleton line drivetrain"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Box metrics track ListingCard exactly, so the grid does not shift when the
   real results arrive. Any change to the card's spacing belongs here too. */
.skeleton-card {
  display: flex;
  flex-direction: column;
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.media {
  aspect-ratio: 16 / 10;
  border-radius: 0;
  border-bottom: 1px solid var(--border);
}

.body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--space-4);
}

.line {
  height: 12px;
  width: 100%;
}

/* Matches .family: 10px mono label. */
.line.family {
  height: 10px;
  width: 42%;
}

/* Matches .title, which reserves two lines from the two-column grid up. */
.line.title {
  height: calc(2 * var(--text-md) * var(--leading-snug));
  width: 78%;
  margin-top: 6px;
}

/* Matches .price at --text-xl. */
.line.price {
  height: var(--text-xl);
  width: 46%;
  margin-top: var(--space-3);
}

.specs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.spec {
  padding: var(--space-3) var(--space-2) var(--space-3) 0;
  min-width: 0;
}

.spec + .spec {
  padding-left: var(--space-3);
  border-left: 1px solid var(--border);
}

.line.label {
  height: 10px;
  width: 60%;
}

.line.value {
  height: var(--text-xs);
  width: 85%;
  margin-top: 4px;
}

.foot {
  margin-top: auto;
  padding-top: var(--space-3);
  border-top: 1px solid var(--border);
}

.line.drivetrain {
  height: var(--text-xs);
  width: 64%;
}

@media (min-width: 560px) {
  .line.title {
    min-height: calc(2 * var(--text-md) * var(--leading-snug));
  }
}
</style>
