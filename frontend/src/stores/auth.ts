import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api'
import type { LoginRequest, RegisterRequest, UserDto } from '../types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserDto | null>(null)
  const resolved = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const isSeller = computed(() => user.value?.role === 'SELLER')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  let inFlight: Promise<void> | null = null

  async function fetchMe() {
    if (inFlight) return inFlight
    inFlight = (async () => {
      try {
        user.value = await api.me()
      } catch {
        user.value = null
      } finally {
        resolved.value = true
        inFlight = null
      }
    })()
    return inFlight
  }

  async function ensureResolved() {
    if (!resolved.value) await fetchMe()
  }

  async function login(credentials: LoginRequest) {
    user.value = await api.login(credentials)
    resolved.value = true
    return user.value
  }

  async function register(payload: RegisterRequest) {
    user.value = await api.register(payload)
    resolved.value = true
    return user.value
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      user.value = null
      resolved.value = true
    }
  }

  function clear() {
    user.value = null
  }

  return {
    user,
    resolved,
    isAuthenticated,
    isSeller,
    isAdmin,
    fetchMe,
    ensureResolved,
    login,
    register,
    logout,
    clear,
  }
})
