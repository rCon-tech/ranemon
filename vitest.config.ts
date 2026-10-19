import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        // `pnpm simulate`: thousands of CPU-vs-CPU battles to check balance. Slow, so not in `pnpm test`.
        resolve: { alias },
        test: {
          name: 'sim',
          include: ['tests/sim/**/*.test.ts'],
          environment: 'node',
          testTimeout: 600_000,
        },
      },
    ],
  },
});
