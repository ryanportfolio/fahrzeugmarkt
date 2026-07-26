<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import ThemeToggle from './ThemeToggle.vue'
import { useAuthStore } from '../stores/auth'
import { useSavedStore } from '../stores/saved'

const auth = useAuthStore()
const saved = useSavedStore()
const route = useRoute()
const router = useRouter()

const menuOpen = ref(false)
const navOpen = ref(false)

const initials = computed(() => {
  const name = auth.user?.displayName ?? ''
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?'
  )
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
    navOpen.value = false
  },
)

async function signOut() {
  await auth.logout()
  saved.reset()
  menuOpen.value = false
  await router.push({ name: 'browse' })
}
</script>

<template>
  <header class="header">
    <div class="shell header-inner">
      <RouterLink :to="{ name: 'browse' }" class="brand">
        <span class="brand-mark"><AppIcon name="car" :size="20" /></span>
        <span class="brand-name">Fahrzeugmarkt</span>
      </RouterLink>

      <nav class="nav" :class="{ open: navOpen }" aria-label="Main">
        <RouterLink :to="{ name: 'browse' }" class="nav-link">Browse</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" :to="{ name: 'saved' }" class="nav-link">
          Saved
          <span v-if="saved.count" class="pill">{{ saved.count }}</span>
        </RouterLink>
        <RouterLink v-if="auth.isSeller" :to="{ name: 'seller-dashboard' }" class="nav-link">
          Your listings
        </RouterLink>
        <RouterLink v-if="auth.isAdmin" :to="{ name: 'admin' }" class="nav-link">
          Moderation
        </RouterLink>
        <template v-if="!auth.isAuthenticated">
          <RouterLink :to="{ name: 'login' }" class="nav-link nav-auth">Sign in</RouterLink>
          <RouterLink :to="{ name: 'register' }" class="nav-link nav-auth">
            Create account
          </RouterLink>
        </template>
      </nav>

      <div class="actions">
        <ThemeToggle />

        <template v-if="auth.isAuthenticated">
          <div class="account">
            <button
              type="button"
              class="avatar"
              :aria-expanded="menuOpen"
              aria-haspopup="true"
              :aria-label="`Account menu for ${auth.user?.displayName}`"
              @click="menuOpen = !menuOpen"
            >
              {{ initials }}
            </button>
            <div v-if="menuOpen" class="menu" role="menu">
              <div class="menu-head">
                <p class="menu-name">{{ auth.user?.displayName }}</p>
                <p class="menu-email">{{ auth.user?.email }}</p>
                <span class="badge badge-accent role">{{ auth.user?.role }}</span>
              </div>
              <RouterLink :to="{ name: 'saved' }" class="menu-item" role="menuitem">
                <AppIcon name="heart" :size="16" />
                Saved vehicles
              </RouterLink>
              <RouterLink
                v-if="auth.isSeller"
                :to="{ name: 'seller-inquiries' }"
                class="menu-item"
                role="menuitem"
              >
                <AppIcon name="mail" :size="16" />
                Inquiries
              </RouterLink>
              <button type="button" class="menu-item" role="menuitem" @click="signOut">
                <AppIcon name="logout" :size="16" />
                Sign out
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }" class="btn btn-ghost btn-sm desktop-auth">
            Sign in
          </RouterLink>
          <RouterLink :to="{ name: 'register' }" class="btn btn-primary btn-sm desktop-auth">
            Create account
          </RouterLink>
        </template>

        <button
          type="button"
          class="nav-trigger"
          :aria-expanded="navOpen"
          aria-label="Toggle navigation"
          @click="navOpen = !navOpen"
        >
          <AppIcon :name="navOpen ? 'x' : 'menu'" :size="18" />
        </button>
      </div>
    </div>
    <div v-if="menuOpen" class="menu-backdrop" @click="menuOpen = false"></div>
  </header>
</template>

<style scoped>
/* Inked chrome. On browse it runs continuously into the masthead, so the page
   opens on one solid block rather than a white bar above a white band. */
.header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--band);
  color: var(--band-text);
  border-bottom: 1px solid var(--band-border);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  min-height: var(--header-height);
  flex-wrap: wrap;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--band-text);
  font-weight: 550;
  font-size: var(--text-md);
  letter-spacing: -0.02em;
  margin-right: var(--space-6);
}

.brand:hover {
  color: var(--band-text);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  background: var(--accent-on-band);
  color: #06211f;
}

/* The shared button styles resolve against the page ramp, so the two auth
   controls are restated against the band ramp here. */
.desktop-auth.btn-ghost {
  color: var(--band-muted);
}

.desktop-auth.btn-ghost:not(:disabled):hover {
  background: var(--band-field);
  color: var(--band-text);
}

.desktop-auth.btn-primary {
  background: var(--accent-on-band);
  color: #06211f;
}

.desktop-auth.btn-primary:not(:disabled):hover {
  background: #63cabf;
}

.nav-trigger {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--band-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--band-muted);
  cursor: pointer;
}

.nav {
  display: none;
  gap: var(--space-1);
}

.nav.open {
  display: flex;
  flex-direction: column;
  width: 100%;
  order: 3;
  padding-bottom: var(--space-3);
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--band-muted);
  font-size: var(--text-sm);
  font-weight: 500;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.nav-link:hover {
  background: var(--band-field);
  color: var(--band-text);
}

.nav-link.router-link-active {
  color: var(--band-text);
  background: var(--band-field);
}

.pill {
  min-width: 20px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: var(--accent-contrast);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

.desktop-auth {
  display: none;
}

.account {
  position: relative;
}

.avatar {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: var(--text-xs);
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.avatar:hover {
  border-color: var(--accent);
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  z-index: 50;
  width: 240px;
  padding: var(--space-2);
  background: var(--surface-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.menu-head {
  padding: var(--space-2) var(--space-3) var(--space-3);
  border-bottom: 1px solid var(--border);
  margin-bottom: var(--space-2);
}

.menu-name {
  font-size: var(--text-sm);
  font-weight: 640;
}

.menu-email {
  font-size: var(--text-xs);
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}

.role {
  margin-top: var(--space-2);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    color var(--transition-fast);
}

.menu-item:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 30;
}

@media (min-width: 900px) {
  .nav-trigger {
    display: none;
  }

  .nav {
    display: flex;
  }

  .nav-auth {
    display: none;
  }

  .desktop-auth {
    display: inline-flex;
  }
}
</style>
