import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// In Docker dev the backend is another container, so the proxy target is
// overridable via env (compose sets VITE_PROXY_TARGET=http://backend:8000).
const apiProxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      '/django-admin': {
        target: apiProxyTarget,
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  }
})
