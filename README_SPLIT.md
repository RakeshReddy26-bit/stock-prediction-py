# Monorepo layout

This repository is now split into two independent projects:

- frontend — React + Vite + Vitest (UI)
- backend — Node.js + Express + Vitest/Jest (API)

## Run

- Frontend: cd frontend && npm install && npm run dev
- Backend: cd backend && npm install && npm run dev
- Both at once (root): npm install && npm run dev:all

## Test

- Frontend only: cd frontend && npm test
- Backend only: cd backend && npm test
- All (root): npm run test:all

## Notes

- Frontend vitest excludes backend/** and server.ts so it never imports backend files.
- Vite dev server proxies /api to http://localhost:5000.
- Adjust .env files within each project independently.