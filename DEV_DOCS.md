# Development notes — monorepo (frontend/backend)

Short instructions for running and testing the two projects in this repository.
This file is intentionally concise — add to README.md as needed.

## Quick commands (from repo root)

- Install deps (root workspace):

```bash
npm install
```

## Local start helper

If Vite's built-in proxy is unreliable on your machine, use the included helper which starts the backend, a small local proxy, and the frontend (and prints verification):

```bash
npm run dev:local
# or run directly
bash ./scripts/dev-start.sh
```

### Recommended local workflow (practical)

If you want the most reliable local experience on macOS (where system services sometimes claim common ports), use the helper above. It will:

- Ensure the backend is running (on PORT or a fallback port)
- Start a tiny local Python proxy on port 3013 that forwards /api -> backend
- Start the frontend with BACKEND_URL pointing at the proxy so all frontend /api calls go through the proxy

This avoids intermittent Vite proxy issues we've observed on some machines.

Example (from repo root):

```bash
npm run dev:local
```

The helper exposes these ports by default:

- Backend: 5003 (or the PORT you set)
- Proxy: 3013
- Frontend (Vite): next-available port (the script requests 3012 by default)

If you'd prefer to use Vite's native proxy directly, set `VITE_BACKEND_URL` when starting the frontend. On machines where Vite's proxy works reliably this is perfectly fine.

### Using the frontend API helper

Use the centralized helper `frontend/src/utils/api.ts` for any outgoing requests from the frontend. Example usage:

```tsx
import { apiFetch } from 'src/utils/api'

// GET
const res = await apiFetch('/api/stocks/health')
const json = await res.json()

// POST
await apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
```

This ensures the frontend consistently respects `VITE_BACKEND_URL`, `BACKEND_URL`, or the `dev-start` proxy.



- Frontend dev server (Vite) — prefers VITE_BACKEND_URL env var:

```bash
VITE_BACKEND_URL=http://localhost:5002 npm --prefix frontend run dev
```

- Backend dev server (Express):

```bash
# default
npm --prefix backend run dev
# alternate port (macOS port 5000 may be used by system services)
PORT=5002 npm --prefix backend run dev
```

- Run frontend tests (scoped to frontend project):

```bash
npm run test:frontend
```

- Run backend tests (scoped to backend project):

```bash
npm run test:backend
```

- Start both concurrently (requires `concurrently`):

```bash
npm run dev:all
```

## Environment variables

- Frontend
  - VITE_BACKEND_URL — URL that Vite dev server proxies `/api` to (e.g. http://localhost:5002)

- Backend
  - PORT — override server port (useful if 5000 is taken)
  - FASTAPI_URL — optional URL of the external stock FastAPI service
  - SKIP_STOCK_INTEGRATION — when `true` (or when NODE_ENV=test), backend will not call the
    stock FastAPI or execute local Python scripts; instead a deterministic stub is returned.

## Notes and rationale

- Tests are intentionally scoped per-project using per-project `vitest.config.ts` files and a root-level
  `vitest.config.ts` that excludes per-project folders. This prevents accidental cross-project test
  discovery when running `npx vitest` at repo root.

- By default the backend test environment sets `NODE_ENV=test`, which also enables the
  `SKIP_STOCK_INTEGRATION` behavior so tests don't depend on the Python microservice.

- If you need to run the stock predictor locally, set `FASTAPI_URL` to the running service and
  unset `SKIP_STOCK_INTEGRATION`.

## Troubleshooting

- If the backend fails to start on port 5000 on macOS, start it on 5002 instead:

```bash
PORT=5002 npm --prefix backend run dev
```

- After modifying `package.json` devDependencies (for example adding `concurrently`), run:

```bash
npm install
```

*** End of doc ***
