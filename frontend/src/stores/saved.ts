import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api'
import { errorMessage } from '../api/client'
import type { ListingCardDto } from '../types'
import { useAuthStore } from './auth'

export const useSavedStore = defineStore('saved', () => {
  const ids = ref<Set<number>>(new Set())
  const listings = ref<ListingCardDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)

  const count = computed(() => ids.value.size)

  function has(listingId: number): boolean {
    return ids.value.has(listingId)
  }

  function reset() {
    ids.value = new Set()
    listings.value = []
    loaded.value = false
    error.value = null
  }

  async function load(force = false) {
    const auth = useAuthStore()
    if (!auth.isAuthenticated) {
      reset()
      return
    }
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      const result = await api.savedListings()
      listings.value = result
      ids.value = new Set(result.map((item) => item.id))
      loaded.value = true
    } catch (err) {
      error.value = errorMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function toggle(listing: ListingCardDto | { id: number }) {
    const id = listing.id
    const wasSaved = ids.value.has(id)
    const next = new Set(ids.value)
    if (wasSaved) next.delete(id)
    else next.add(id)
    ids.value = next

    const previousListings = listings.value
    if (wasSaved) {
      listings.value = listings.value.filter((item) => item.id !== id)
    } else if ('title' in listing) {
      listings.value = [listing as ListingCardDto, ...listings.value]
    }

    try {
      if (wasSaved) await api.unsave(id)
      else await api.save(id)
    } catch (err) {
      const rollback = new Set(ids.value)
      if (wasSaved) rollback.add(id)
      else rollback.delete(id)
      ids.value = rollback
      listings.value = previousListings
      throw err
    }
  }

  return { ids, listings, loading, error, loaded, count, has, load, toggle, reset }
})
