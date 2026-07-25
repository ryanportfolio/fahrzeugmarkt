import { ref } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { Role } from '../types'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    roles?: Role[]
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'browse',
    component: () => import('../pages/BrowsePage.vue'),
    meta: { title: 'Find your next car' },
  },
  {
    path: '/listing/:id(\\d+)',
    name: 'listing',
    component: () => import('../pages/ListingDetailPage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { title: 'Sign in' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../pages/RegisterPage.vue'),
    meta: { title: 'Create an account' },
  },
  {
    path: '/saved',
    name: 'saved',
    component: () => import('../pages/SavedPage.vue'),
    meta: { title: 'Saved vehicles', requiresAuth: true },
  },
  {
    path: '/sell',
    name: 'seller-dashboard',
    component: () => import('../pages/SellerDashboardPage.vue'),
    meta: { title: 'Your listings', requiresAuth: true, roles: ['SELLER'] },
  },
  {
    path: '/sell/inquiries',
    name: 'seller-inquiries',
    component: () => import('../pages/SellerInquiriesPage.vue'),
    meta: { title: 'Inquiries', requiresAuth: true, roles: ['SELLER'] },
  },
  {
    path: '/sell/new',
    name: 'listing-new',
    component: () => import('../pages/ListingFormPage.vue'),
    meta: { title: 'New listing', requiresAuth: true, roles: ['SELLER'] },
  },
  {
    path: '/sell/:id(\\d+)/edit',
    name: 'listing-edit',
    component: () => import('../pages/ListingFormPage.vue'),
    meta: { title: 'Edit listing', requiresAuth: true, roles: ['SELLER'] },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../pages/AdminPage.vue'),
    meta: { title: 'Moderation queue', requiresAuth: true, roles: ['ADMIN'] },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../pages/NotFoundPage.vue'),
    meta: { title: 'Page not found' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.path === from.path) return {}
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.ensureResolved()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    return { name: 'browse' }
  }
  if ((to.name === 'login' || to.name === 'register') && auth.isAuthenticated) {
    return { name: 'browse' }
  }
  return true
})

export const lastBrowsePath = ref('/')

router.afterEach((to) => {
  if (to.name === 'browse') lastBrowsePath.value = to.fullPath
  const title = to.meta.title
  document.title = title ? `${title} · Fahrzeugmarkt` : 'Fahrzeugmarkt'
})
