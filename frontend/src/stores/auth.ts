import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api'
import type { LoginRequest, RegisterRequest, UserDto } from '../types'

/* Nothing on this prototype is worth seeing from behind a sign-in wall: saving a
 * vehicle, comparing, and messaging a seller are the interesting parts, and a
 * visitor who has to register first never reaches any of them. So a visitor
 * arrives already signed in as the demo buyer. These are the same public
 * credentials the README publishes, against a database it describes as public
 * and disposable.
 *
 * The opt-out flag is what makes "Sign out" mean something: without it the next
 * navigation would sign the visitor straight back in. */
const DEMO_EMAIL = 'buyer@demo.de'
const DEMO_PASSWORD = 'demo1234'
const SIGNED_OUT_KEY = 'fm-signed-out'

function hasSignedOut(): boolean {
  try {
    return localStorage.getItem(SIGNED_OUT_KEY) === '1'
  } catch {
    return false
  }
}

function rememberSignedOut(value: boolean) {
  try {
    if (value) localStorage.setItem(SIGNED_OUT_KEY, '1')
    else localStorage.removeItem(SIGNED_OUT_KEY)
  } catch {
    /* storage unavailable */
  }
}

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

  /** Resolves the session, then opens a demo one if there is none and the visitor
   *  has not deliberately signed out. Failure is silent: the app works signed
   *  out, it is just less interesting. */
  async function ensureSession() {
    await ensureResolved()
    if (user.value || hasSignedOut()) return
    try {
      user.value = await api.login({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
    } catch {
      user.value = null
    }
  }

  async function login(credentials: LoginRequest) {
    user.value = await api.login(credentials)
    resolved.value = true
    rememberSignedOut(false)
    return user.value
  }

  async function register(payload: RegisterRequest) {
    user.value = await api.register(payload)
    resolved.value = true
    rememberSignedOut(false)
    return user.value
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      user.value = null
      resolved.value = true
      rememberSignedOut(true)
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
    ensureSession,
    login,
    register,
    logout,
    clear,
  }
})
