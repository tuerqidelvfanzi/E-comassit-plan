import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', '../shared/pipeline/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@shared/pipeline': path.resolve(__dirname, '../shared/pipeline'),
    },
  },
});
