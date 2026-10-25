import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
/** The GitHub Pages build, served as Pages does by `scripts/offline/serve.mjs`. */
export const PAGES_PORT = 3200;

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 180_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Lets a machine with a pre-installed Chromium skip `playwright install`.
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
      // Software WebGL, so the 3D look can be tested without a GPU.
      args: ['--enable-unsafe-swiftshader'],
    },
  },
  projects: [{ name: 'mobile-chromium', use: { ...devices['Pixel 7'] } }],
  webServer: [
    {
      // The GitHub Pages build first, into out/ (the offline test plays it), then the usual one.
      // Its save server is a port nobody answers on, as if the phone had no signal.
      command: `NEXT_PUBLIC_SAVE_API=http://127.0.0.1:9/api pnpm build:pages && pnpm build && pnpm start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      timeout: 360_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `node scripts/offline/serve.mjs ${PAGES_PORT}`,
      url: `http://localhost:${PAGES_PORT}/ranemon/`,
      timeout: 360_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
