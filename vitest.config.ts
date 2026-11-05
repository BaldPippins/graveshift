import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/shared', 'packages/server', 'packages/client', 'scripts'],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: ['**/*.test.ts'],
      reporter: ['text-summary', 'json-summary'],
      reportOnFailure: true,
    },
  },
});
