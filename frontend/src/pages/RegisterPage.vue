<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { errorMessage, fieldErrorsOf } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useSavedStore } from '../stores/saved'
import type { Role } from '../types'

const auth = useAuthStore()
const saved = useSavedStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  displayName: '',
  email: '',
  password: '',
  role: 'BUYER' as Exclude<Role, 'ADMIN'>,
})

const errors = reactive<Record<string, string>>({})
const failure = ref<string | null>(null)
const submitting = ref(false)

const roles: Array<{ value: Exclude<Role, 'ADMIN'>; title: string; note: string }> = [
  { value: 'BUYER', title: 'Buyer', note: 'Save vehicles and message sellers' },
  { value: 'SELLER', title: 'Seller', note: 'Publish listings and manage inquiries' },
]

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]
  if (form.displayName.trim().length < 2) errors.displayName = 'Enter the name buyers will see'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (form.password.length < 8) errors.password = 'Use at least 8 characters'
  return Object.keys(errors).length === 0
}

async function submit() {
  failure.value = null
  if (!validate()) return
  submitting.value = true
  try {
    await auth.register({
      displayName: form.displayName.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    })
    await saved.load(true)
    const redirect = route.query.redirect
    await router.replace(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/')
  } catch (error) {
    const fieldErrors = fieldErrorsOf(error)
    if (Object.keys(fieldErrors).length) Object.assign(errors, fieldErrors)
    else failure.value = errorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="shell page auth">
    <section class="card form-card">
      <header class="head">
        <span class="mark"><AppIcon name="car" :size="20" /></span>
        <h1 class="title">Create your account</h1>
        <p class="lead">Two roles, one prototype. Pick the one you want to demo</p>
      </header>

      <form class="form" novalidate @submit.prevent="submit">
        <fieldset class="roles">
          <legend class="field-label">I want to</legend>
          <div class="role-grid">
            <label v-for="option in roles" :key="option.value" class="role" :class="{ on: form.role === option.value }">
              <input v-model="form.role" type="radio" name="role" :value="option.value" />
              <span class="role-title">{{ option.title }}</span>
              <span class="role-note">{{ option.note }}</span>
            </label>
          </div>
        </fieldset>

        <div class="field">
          <label class="field-label" for="register-name">Display name</label>
          <input
            id="register-name"
            v-model="form.displayName"
            class="input"
            :class="{ 'has-error': errors.displayName }"
            type="text"
            autocomplete="name"
          />
          <p v-if="errors.displayName" class="field-error">{{ errors.displayName }}</p>
        </div>

        <div class="field">
          <label class="field-label" for="register-email">Email</label>
          <input
            id="register-email"
            v-model="form.email"
            class="input"
            :class="{ 'has-error': errors.email }"
            type="email"
            autocomplete="email"
          />
          <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
        </div>

        <div class="field">
          <label class="field-label" for="register-password">Password</label>
          <input
            id="register-password"
            v-model="form.password"
            class="input"
            :class="{ 'has-error': errors.password }"
            type="password"
            autocomplete="new-password"
          />
          <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          <p v-else class="field-hint">At least 8 characters</p>
        </div>

        <p v-if="failure" class="alert alert-error">{{ failure }}</p>

        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="submitting">
          {{ submitting ? 'Creating account' : 'Create account' }}
        </button>
      </form>

      <p class="switch">
        Already registered?
        <RouterLink :to="{ name: 'login', query: route.query }">Sign in</RouterLink>
      </p>
    </section>

    <aside class="card side">
      <h2 class="side-title">What you get</h2>
      <ul class="perks">
        <li><AppIcon name="heart" :size="16" /> A saved list that follows your session</li>
        <li><AppIcon name="mail" :size="16" /> Direct messages to sellers</li>
        <li><AppIcon name="car" :size="16" /> Seller tools with inquiry and save counts</li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.auth {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  align-items: start;
  max-width: 920px;
}

.form-card {
  padding: var(--space-8);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-md);
  background: var(--accent);
  color: var(--accent-contrast);
}

.title {
  font-size: var(--text-2xl);
}

.lead {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.roles {
  margin: 0;
  padding: 0;
  border: none;
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.role {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast);
}

.role:hover {
  border-color: var(--accent);
}

.role.on {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.role input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.role-title {
  font-size: var(--text-sm);
  font-weight: 640;
}

.role-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.switch {
  margin-top: var(--space-5);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.side {
  padding: var(--space-6);
  background: var(--surface-sunken);
}

.side-title {
  font-size: var(--text-xs);
  font-weight: 680;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.perks {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.perks li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

@media (min-width: 860px) {
  .auth {
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: var(--space-8);
  }
}
</style>
