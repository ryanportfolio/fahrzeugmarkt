import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Set when the app is published under a sub-path, for example
  // /prototype/fahrzeugmarkt/. Defaults to the root for local development.
  base: process.env.PUBLIC_BASE || '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Defaults to the local API. Set DEV_API_TARGET (and DEV_API_PREFIX when
      // the target serves the API under a sub-path) to develop the front end
      // against an already deployed backend instead of a local one.
      '/api': {
        target: process.env.DEV_API_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => `${process.env.DEV_API_PREFIX || ''}${path}`,
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    globals: true,
  },
})
