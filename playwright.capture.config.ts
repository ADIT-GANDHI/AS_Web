import { defineConfig, devices } from '@playwright/test';

/**
 * Full-page PNGs for `Song_Detail_API_Integrated_2026-05-14/`.
 * Default `playwright.config.ts` ignores the capture spec.
 *
 * If `PLAYWRIGHT_BASE_URL` is **unset**, Playwright starts `next dev` on
 * 127.0.0.1:3000 (or reuses an existing server when not in CI), then runs tests.
 * Set `CAPTURE_NO_WEBSERVER=1` to only use a server you start yourself.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const autoStartNext =
  process.env.CAPTURE_NO_WEBSERVER !== '1' &&
  process.env.PLAYWRIGHT_BASE_URL === undefined;

export default defineConfig({
  ...(autoStartNext
    ? {
        webServer: {
          // Avoid `npm`/`npx` shims (e.g. PowerShell execution policy); Next CLI via node.
          command:
            'node ./node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000',
          url: 'http://127.0.0.1:3000',
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      }
    : {}),
  testDir: 'e2e',
  testMatch: '**/song-detail-visual-capture.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
});
