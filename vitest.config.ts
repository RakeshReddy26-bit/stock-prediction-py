import { defineConfig } from 'vitest/config';

// Root-level Vitest config: intentionally minimal and excludes per-project
// test folders and legacy archives so `npx vitest` at repo root is safe.
export default defineConfig({
  test: {
    // Keep default environment; avoid collecting tests across workspace
    exclude: [
      '**/node_modules/**',
      'src/**',
      '**/archive/**',
      '**/archive_*/**',
      '**/projects/**',
      '**/projects/**/src/**',
      '**/frontend/**',
      '**/backend/**',
      '**/build/**',
      '**/public/**',
      '**/projects/rewash/**',
      '**/src/**/__tests__/**'
    ]
  }
});
