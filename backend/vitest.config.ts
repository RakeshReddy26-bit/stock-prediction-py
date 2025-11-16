import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: './',
    // Only include explicit test files. Avoid picking up helper/util files
    // when running inside the backend package the patterns should be
    // relative to the package root (no 'backend/' prefix).
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run files in sequence to avoid DB concurrency issues
    sequence: { concurrent: false },
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
  },
});
