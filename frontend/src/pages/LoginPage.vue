<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { errorMessage, fieldErrorsOf } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { useSavedStore } from '../stores/saved'

const auth = useAuthStore()
const saved = useSavedStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const errors = reactive<Record<string, string>>({})
const failure = ref<string | null>(null)
const submitting = ref(false)

const demoAccounts = [
  { label: 'Buyer', email: 'buyer@demo.de' },
  { label: 'Seller', email: 'seller@demo.de' },
  { label: 'Admin', email: 'admin@demo.de' },
]

function useDemo(email: string) {
  form.email = email
  form.password = 'demo1234'
}

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]
  if (!form.email.trim()) errors.email = 'Enter your email address'
  if (!form.password) errors.password = 'Enter your password'
  return Object.keys(errors).length === 0
}

async function submit() {
  failure.value = null
  if (!validate()) return
  submitting.value = true
  try {
    await auth.login({ email: form.email.trim(), password: form.password })
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
        <h1 class="title">Welcome back</h1>
        <p class="lead">Sign in to save vehicles, contact sellers and manage your listings</p>
      </header>

      <form class="form" novalidate @submit.prevent="submit">
        <div class="field">
          <label class="field-label" for="login-email">Email</label>
          <input
            id="login-email"
            v-model="form.email"
            class="input"
            :class="{ 'has-error': errors.email }"
            type="email"
            autocomplete="email"
          />
          <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
        </div>

        <div class="field">
          <label class="field-label" for="login-password">Password</label>
          <input
            id="login-password"
            v-model="form.password"
            class="input"
            :class="{ 'has-error': errors.password }"
            type="password"
            autocomplete="current-password"
          />
          <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
        </div>

        <p v-if="failure" class="alert alert-error">{{ failure }}</p>

        <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="submitting">
          {{ submitting ? 'Signing in' : 'Sign in' }}
        </button>
      </form>

      <p class="switch">
        New here?
        <RouterLink :to="{ name: 'register', query: route.query }">Create an account</RouterLink>
      </p>
    </section>

    <aside class="card demo-card">
      <h2 class="demo-title">Demo accounts</h2>
      <p class="demo-lead">Password for all three is <code>demo1234</code></p>
      <ul class="demo-list">
        <li v-for="account in demoAccounts" :key="account.email">
          <button type="button" class="demo-item" @click="useDemo(account.email)">
            <span class="demo-role">{{ account.label }}</span>
            <span class="demo-email">{{ account.email }}</span>
          </button>
        </li>
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

.switch {
  margin-top: var(--space-5);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.demo-card {
  padding: var(--space-6);
  background: var(--surface-sunken);
}

.demo-title {
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.demo-lead {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

code {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--surface-card);
  font-family: var(--font-mono);
  font-size: 12px;
}

.demo-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.demo-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-card);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.demo-item:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
}

.demo-role {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--accent-text);
}

.demo-email {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

@media (min-width: 860px) {
  .auth {
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: var(--space-8);
  }
}
</style>
