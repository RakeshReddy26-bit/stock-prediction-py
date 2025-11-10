# Frontend — local dev

Recommended quick-start for development (from repository root):

```bash
# starts backend, local python proxy (3013) and frontend (Vite)
npm run dev:local
```

Notes:

- The repo provides a small helper `scripts/dev-start.sh` that brings up the backend and
  a lightweight python proxy on port 3013 and launches the frontend with `BACKEND_URL`
  pointed at that proxy. This avoids local port collisions on macOS (AirPlay/AirTunes
  can bind to port 5000) and gives a reliable dev proxy.

- Frontend code should use the centralized helper `src/utils/api.ts` (exported `apiFetch`)
  to make API calls. `apiFetch` resolves the backend URL from `import.meta.env.VITE_BACKEND_URL`,
  `process.env.BACKEND_URL`, `window.__BACKEND_URL`, and falls back to `http://127.0.0.1:3013` for
  development.

Examples:

```ts
import { apiFetch } from 'src/utils/api'

const res = await apiFetch('/api/stocks/health')
const json = await res.json()
```

If you prefer to use Vite's native proxy directly, start Vite with:

```bash
VITE_BACKEND_URL=http://127.0.0.1:5003 npm --prefix frontend run dev
```

But note: on some macOS setups ports like 5000 may be owned by system services — prefer the
dev helper for a predictable experience.
