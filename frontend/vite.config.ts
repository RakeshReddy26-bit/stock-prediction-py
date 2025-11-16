import { defineConfig } from 'vite'
// Vite provides import.meta.env in dev; add typing for TypeScript to avoid errors
interface ImportMetaEnv {
  VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
import react from '@vitejs/plugin-react'
import path from 'path'

// Compute backend target using CLI env var first, then fallback to VITE_BACKEND_URL
// Use IPv4 localhost to avoid IPv6/hostname resolution differences during proxying.
// Prefer an explicit BACKEND_URL (or VITE_BACKEND_URL). When none is provided,
// prefer the local dev proxy (3013) which the repository's `dev-start.sh` will
// bring up. This avoids forwarding to system services that sometimes bind
// to well-known ports on macOS (for example AirPlay/AirTunes on port 5000).
const BACKEND_TARGET = (process.env.BACKEND_URL as string)
  || (process.env.VITE_BACKEND_URL as string)
  || 'http://127.0.0.1:3013'

// Frontend-only Vite config
// - root: ensures Vite resolves files relative to frontend folder
// - resolve.alias: map 'src' to frontend/src so imports don't reach repo root
export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      // allow imports like 'src/...' to resolve to frontend/src
      'src': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: true,
    port: 3001,
    proxy: {
      '/api': {
        // Use the computed BACKEND_TARGET; this avoids import.meta.env typing issues in the Node-run config
        target: BACKEND_TARGET,
        // Log the chosen target at Vite startup so developers can verify where /api is being forwarded
        configure: (proxy) => {
          try {
            // eslint-disable-next-line no-console
            console.log('[vite] /api proxy target ->', BACKEND_TARGET)
          } catch (e) {
            // ignore
          }
          return proxy
        },
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
