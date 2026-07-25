<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { api } from '../api'
import { errorMessage, fieldErrorsOf } from '../api/client'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{ listingId: number; listingTitle: string }>()

const auth = useAuthStore()
const route = useRoute()

const form = reactive({
  name: auth.user?.displayName ?? '',
  email: auth.user?.email ?? '',
  message: `Hello, is the ${props.listingTitle} still available? I would like to arrange a viewing.`,
})

const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const sent = ref(false)
const failure = ref<string | null>(null)

watch(
  () => auth.user,
  (user) => {
    if (!user) return
    if (!form.name) form.name = user.displayName
    if (!form.email) form.email = user.email
  },
)

function validate(): boolean {
  for (const key of Object.keys(errors)) delete errors[key]
  if (!form.name.trim()) errors.name = 'Tell the seller who you are'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (form.message.trim().length < 15) errors.message = 'Add a little more detail, 15 characters minimum'
  return Object.keys(errors).length === 0
}

async function submit() {
  failure.value = null
  if (!validate()) return
  submitting.value = true
  try {
    await api.contact(props.listingId, {
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    })
    sent.value = true
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
  <section class="contact panel">
    <h2 class="heading">Contact the seller</h2>

    <div v-if="!auth.isAuthenticated" class="gate">
      <p class="gate-text">Sign in to send a message about this vehicle</p>
      <RouterLink
        :to="{ name: 'login', query: { redirect: route.fullPath } }"
        class="btn btn-primary"
      >
        Sign in to continue
      </RouterLink>
    </div>

    <div v-else-if="sent" class="done">
      <span class="done-mark"><AppIcon name="check" :size="20" /></span>
      <div>
        <p class="done-title">Message sent</p>
        <p class="done-note">
          The seller has your details and can reply to {{ form.email }} directly
        </p>
      </div>
    </div>

    <form v-else class="form" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="field-label" for="contact-name">Your name</label>
        <input
          id="contact-name"
          v-model="form.name"
          class="input"
          :class="{ 'has-error': errors.name }"
          type="text"
          autocomplete="name"
        />
        <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
      </div>

      <div class="field">
        <label class="field-label" for="contact-email">Email</label>
        <input
          id="contact-email"
          v-model="form.email"
          class="input"
          :class="{ 'has-error': errors.email }"
          type="email"
          autocomplete="email"
        />
        <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
      </div>

      <div class="field">
        <label class="field-label" for="contact-message">Message</label>
        <textarea
          id="contact-message"
          v-model="form.message"
          class="textarea"
          :class="{ 'has-error': errors.message }"
          rows="5"
        ></textarea>
        <p v-if="errors.message" class="field-error">{{ errors.message }}</p>
      </div>

      <p v-if="failure" class="alert alert-error">{{ failure }}</p>

      <button type="submit" class="btn btn-primary btn-block" :disabled="submitting">
        <AppIcon name="mail" :size="16" />
        {{ submitting ? 'Sending' : 'Send message' }}
      </button>
      <p class="field-hint">Prototype, messages are stored but no email is delivered</p>
    </form>
  </section>
</template>

<style scoped>
.contact {
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

.gate {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  align-items: flex-start;
}

.gate-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.done {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--success-soft);
}

.done-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: 50%;
  background: var(--success);
  color: var(--surface-card);
}

.done-title {
  font-size: var(--text-sm);
  font-weight: 660;
  color: var(--success);
}

.done-note {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
