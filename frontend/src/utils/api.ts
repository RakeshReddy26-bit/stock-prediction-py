// Small helper to centralize API base URL resolution for development and production.
// Use this helper in the frontend when making requests so developers can override
// the backend target via env vars (VITE_BACKEND_URL or BACKEND_URL) or the dev-start proxy.

// Local development proxy (started by dev-start.sh). Prefer this as a reliable
// local fallback on macOS when Vite's proxy is unreliable.
const DEV_PROXY_FALLBACK = 'http://127.0.0.1:3013'
const DEFAULT = DEV_PROXY_FALLBACK

// Prefer Vite env (import.meta.env) when available, then process env (when started via npm scripts),
// then window.__BACKEND_URL if present (injected by scripts), else default.
const getBase = (): string => {
  try {
    // import.meta.env is provided by Vite during dev and build-time replacements
    // access it via any to avoid TS errors when running in Node
    // @ts-ignore
    const vite = (import.meta as any)?.env?.VITE_BACKEND_URL as string | undefined
    if (vite) return vite
  } catch (e) {
    // ignore
  }
  if (typeof process !== 'undefined' && process.env && (process.env.BACKEND_URL as string)) {
    return (process.env.BACKEND_URL as string)
  }
  // window-level override (useful for scripts that start Vite)
  // eslint-disable-next-line no-undef
  if (typeof window !== 'undefined' && (window as any).__BACKEND_URL) {
    return (window as any).__BACKEND_URL
  }
  // If nothing else is configured, prefer the local dev proxy during
  // development for a predictable forwarding target.
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return 'https://api.example.com' // placeholder for production API; replace as needed
  }
  return DEFAULT
}

export const API_BASE = getBase()

export async function apiFetch(path: string, opts?: RequestInit) {
  const url = path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`
  return fetch(url, opts)
}

export default {
  API_BASE,
  apiFetch
}
