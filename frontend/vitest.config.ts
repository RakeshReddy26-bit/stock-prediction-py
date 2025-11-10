import { defineConfig } from 'vitest/config';
import path from 'path'

// Vitest config for the frontend only. We set `root` and an explicit alias for `src`
// so test imports like `src/...` map to `frontend/src` instead of the repo root.
export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    globals: true,
    environment: 'jsdom',
    // use an absolute path so Vitest can't accidentally resolve the repo root
    setupFiles: path.resolve(__dirname, 'src/setupTests.ts'),
    testTimeout: 20000,
    // Ensure vitest does not pick backend files from repo root
    exclude: [
      'node_modules',
      '../backend/**',
      '../../backend/**',
      'backend/**',
      // Also ignore any server middleware files under the repo root
      '../src/server.ts',
      '../src/middleware/**'
    ],
    // Resolve `src` imports to frontend/src
    alias: {
      'src': path.resolve(__dirname, 'src')
    }
  },
});
