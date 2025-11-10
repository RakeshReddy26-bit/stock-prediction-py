import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend-only Vite config
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3001,
    proxy: {
      '/api': {
        // Compute target from env, fall back to the local dev proxy on 3013.
        target: process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://127.0.0.1:3013',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          try {
            // eslint-disable-next-line no-console
            console.log('[vite] /api proxy target ->', process.env.BACKEND_URL || process.env.VITE_BACKEND_URL || 'http://127.0.0.1:3013')
          } catch (e) {
            // ignore
          }
          return proxy
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
