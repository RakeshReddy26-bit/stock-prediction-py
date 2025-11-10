import { defineConfig } from 'vitest/config';

// Vitest config scoped to backend only
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run files in sequence to avoid DB concurrency issues
    sequence: { concurrent: false },
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: [
      'node_modules',
      '../frontend/**',
      '../../frontend/**',
      'dist/**'
    ]
  },
});
