<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import EmptyState from '../components/EmptyState.vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import { formatDateTime } from '../format'
import type { InquiryDto } from '../types'

const inquiries = ref<InquiryDto[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    inquiries.value = await api.sellerInquiries()
  } catch (err) {
    error.value = errorMessage(err)
    inquiries.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => void load())
</script>

<template>
  <div class="shell page">
    <header class="head">
      <div>
        <p class="eyebrow">Seller area</p>
        <h1>Inquiries</h1>
        <p class="lead">Everything buyers sent about your vehicles, newest first</p>
      </div>
      <RouterLink :to="{ name: 'seller-dashboard' }" class="btn btn-secondary">
        <AppIcon name="arrow-left" :size="16" />
        Back to listings
      </RouterLink>
    </header>

    <p v-if="error" class="alert alert-error">{{ error }}</p>

    <div v-if="loading" class="list">
      <div v-for="n in 3" :key="n" class="skeleton item-skeleton"></div>
    </div>

    <ul v-else-if="inquiries.length" class="list">
      <li v-for="inquiry in inquiries" :key="inquiry.id" class="item card">
        <div class="item-head">
          <div>
            <p class="sender">{{ inquiry.senderName }}</p>
            <a class="email" :href="`mailto:${inquiry.senderEmail}`">{{ inquiry.senderEmail }}</a>
          </div>
          <span class="date">{{ formatDateTime(inquiry.createdAt) }}</span>
        </div>
        <p class="message">{{ inquiry.message }}</p>
        <RouterLink :to="{ name: 'listing', params: { id: inquiry.listingId } }" class="listing-link">
          <AppIcon name="car" :size="14" />
          {{ inquiry.listingTitle ?? `Listing ${inquiry.listingId}` }}
        </RouterLink>
      </li>
    </ul>

    <EmptyState
      v-else-if="!error"
      icon="mail"
      title="No inquiries yet"
      description="When a buyer sends a message about one of your vehicles it shows up here with their contact details."
    >
      <RouterLink :to="{ name: 'seller-dashboard' }" class="btn btn-primary">
        Back to your listings
      </RouterLink>
    </EmptyState>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.lead {
  color: var(--text-muted);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.item-skeleton {
  height: 128px;
  border-radius: var(--radius-lg);
}

.item {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
}

.item-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.sender {
  font-size: var(--text-sm);
  font-weight: 500;
}

.email {
  font-size: var(--text-xs);
}

.date {
  font-size: var(--text-xs);
  color: var(--text-subtle);
  white-space: nowrap;
}

.message {
  font-size: var(--text-sm);
  color: var(--text-muted);
  white-space: pre-line;
}

.listing-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  align-self: flex-start;
  font-size: var(--text-xs);
  font-weight: 500;
}
</style>
