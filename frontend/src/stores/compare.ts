import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '../api'
import type { ListingCardDto } from '../types'

/** Three is the most that can be stood side by side and still be drawn large
 *  enough to compare. A fourth turns the tray back into a list. */
export const COMPARE_LIMIT = 3

/* A comparison that a refresh empties is not a comparison anyone can rely on, and
 * one with no address is not something anyone can send to the person they are
 * buying the car with. The ids are mirrored to sessionStorage so a reload keeps it,
 * and `shareQuery` exposes them for a URL. */
const STORAGE_KEY = 'fm-compare'

function readStoredIds(): number[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .slice(0, COMPARE_LIMIT)
  } catch {
    return []
  }
}

export const useCompareStore = defineStore('compare', () => {
  const entries = ref<ListingCardDto[]>([])
  const restoring = ref(false)

  const ids = computed(() => new Set(entries.value.map((entry) => entry.id)))
  const full = computed(() => entries.value.length >= COMPARE_LIMIT)

  function has(id: number): boolean {
    return ids.value.has(id)
  }

  /** Returns false when the vehicle could not be added because the tray is
   *  full, so the caller can say so rather than failing silently. */
  function toggle(listing: ListingCardDto): boolean {
    if (has(listing.id)) {
      entries.value = entries.value.filter((entry) => entry.id !== listing.id)
      return true
    }
    if (full.value) return false
    entries.value = [...entries.value, listing]
    return true
  }

  function remove(id: number) {
    entries.value = entries.value.filter((entry) => entry.id !== id)
  }

  function clear() {
    entries.value = []
  }

  /** The compared ids, for putting in a URL. */
  const shareQuery = computed(() => entries.value.map((entry) => entry.id).join(','))

  /** Rebuilds the tray from a list of ids, which is how both a reload and a shared
   *  link are handled. Listings that have since gone are skipped rather than
   *  leaving a hole. */
  async function restore(ids: number[]) {
    const wanted = ids.slice(0, COMPARE_LIMIT).filter((id) => !has(id))
    if (!wanted.length) return
    restoring.value = true
    try {
      const loaded = await Promise.all(
        wanted.map((id) =>
          api
            .listing(id)
            .then<ListingCardDto | null>((detail) => ({
              id: detail.id,
              title: detail.title,
              make: detail.vehicle.make,
              model: detail.vehicle.model,
              priceEur: detail.priceEur,
              firstRegistration: detail.vehicle.firstRegistration,
              mileageKm: detail.vehicle.mileageKm,
              powerKw: detail.vehicle.powerKw,
              fuelType: detail.vehicle.fuelType,
              transmission: detail.vehicle.transmission,
              bodyType: detail.vehicle.bodyType,
              city: detail.seller.city,
              coverImageUrl: detail.images[0]?.url ?? null,
              createdAt: detail.createdAt,
            }))
            .catch(() => null),
        ),
      )
      entries.value = [...entries.value, ...loaded.filter((item): item is ListingCardDto => item !== null)].slice(
        0,
        COMPARE_LIMIT,
      )
    } finally {
      restoring.value = false
    }
  }

  /** Reads the ids this browser tab had before a reload. */
  function storedIds(): number[] {
    return readStoredIds()
  }

  watch(
    () => entries.value.map((entry) => entry.id),
    (ids) => {
      try {
        if (ids.length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
        else sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        /* storage unavailable */
      }
    },
    { deep: true },
  )

  return { entries, ids, full, restoring, has, toggle, remove, clear, restore, storedIds, shareQuery }
})
