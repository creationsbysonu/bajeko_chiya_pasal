import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// No API proxy is needed: the SPA talks directly to Supabase (cross-origin,
// configured via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  }
})
