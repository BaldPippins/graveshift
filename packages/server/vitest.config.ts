import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'server',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
});
