import { defineConfig, devices } from '@playwright/test';

/**
 * Headless browser smoke tests. Start Next first:
 *   npx next dev --hostname 127.0.0.1 --port 3000
 * then: npm run test:e2e
 *
 * Optional: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002` if :3000 is taken or stuck.
 */
export default defineConfig({
  testDir: 'e2e',
  /** Manual full-page captures — run `npm run capture:song-detail-api-review` with `-c playwright.capture.config.ts`. */
  testIgnore: ['**/song-detail-visual-capture.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
});
