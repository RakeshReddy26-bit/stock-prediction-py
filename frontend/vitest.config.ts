import { defineConfig } from 'vitest/config';
import path from 'path'

// Scoped Vitest config for the stock project's frontend. This ensures imports
// like `src/...` map to this folder and avoids pulling in other repo projects.
export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, 'src/setupTests.ts'),
  // Include common test file locations (allow root and src patterns)
  include: ['**/*.{test,spec}.{js,ts,mjs,cjs}'],
    testTimeout: 20000,
    // Explicitly avoid the rest of the monorepo
    exclude: [
      'node_modules',
      '../**',
      '../../**',
      '../../../**'
    ],
    alias: {
      'src': path.resolve(__dirname, 'src')
    }
  },
});
