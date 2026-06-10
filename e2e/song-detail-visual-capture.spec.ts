/**
 * Full-page screenshots for the API-integrated Songs UI review gallery.
 *
 * Does NOT run in the default `npm run test:e2e` suite — excluded in
 * `playwright.config.ts` via `testIgnore`. This file runs only with
 * `playwright.capture.config.ts` (see `npm run capture:song-detail-api-review`).
 *
 * Output layout matches `Songs_Client_Review_2026-05-13`:
 *   `Song_Detail_API_Integrated_2026-05-14/localhost/*.png`
 *   Gallery: `Song_Detail_API_Integrated_2026-05-14/comparison/index.html`
 *
 * Usage — one command (starts Next on :3000 if `PLAYWRIGHT_BASE_URL` is unset):
 *   npm.cmd run capture:song-detail-api-review
 *
 * Optional:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002   (use your own server; no auto-start)
 *   CAPTURE_NO_WEBSERVER=1
 *   CAPTURE_SONG_ID=229
 */
import * as fs from 'fs';
import * as path from 'path';
import { expect, test, type Page } from '@playwright/test';

const OUT_DIR = path.join(__dirname, '..', 'Song_Detail_API_Integrated_2026-05-14', 'localhost');

const GOTO_MS = 90_000;

/** Same idea as `Songs_Client_Review_2026-05-13/capture-localhost.mjs` — hide dev-only overlays. */
async function suppressDevOverlay(page: Page): Promise<void> {
  await page
    .addStyleTag({
      content:
        'nextjs-portal,[data-nextjs-toast],[data-nextjs-dialog-overlay],[data-nextjs-build-error]{display:none!important}',
    })
    .catch(() => {});
}

/** Scroll the full document height so lazy images / below-the-fold content paint before capture. */
async function scrollFullPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let y = 0;
      const step = window.innerHeight;
      const tick = () => {
        window.scrollTo(0, y);
        y += step;
        const max = document.scrollingElement?.scrollHeight ?? 0;
        if (y < max) {
          setTimeout(tick, 80);
        } else {
          window.scrollTo(0, 0);
          setTimeout(() => resolve(), 500);
        }
      };
      tick();
    });
  });
}

async function gotoSettledOrSkip(page: Page, url: string): Promise<void> {
  let res: Awaited<ReturnType<typeof page.goto>> | null = null;
  try {
    res = await page.goto(url, { waitUntil: 'networkidle', timeout: GOTO_MS });
  } catch {
    try {
      res = await page.goto(url, { waitUntil: 'load', timeout: GOTO_MS });
    } catch {
      test.skip(true, `Navigation failed — start Next and set PLAYWRIGHT_BASE_URL (tried ${GOTO_MS}ms)`);
    }
  }
  if (!res?.ok()) {
    test.skip(true, `HTTP ${res?.status()} — start Next and set PLAYWRIGHT_BASE_URL`);
  }
}

/** `.cl-songs-page-root` exists during loader; wait for real grid + API-backed count. */
async function waitListingReady(page: Page): Promise<void> {
  await page.waitForSelector('.cl-songs-page', { state: 'visible', timeout: 120_000 });
  await page.locator('a.cl-song-card-link').first().waitFor({ state: 'visible', timeout: 120_000 });
  await expect(page.locator('.cl-songs-count')).toHaveText(/\d+\s+Songs/i, { timeout: 30_000 });
  await expect(page.locator('.loader-overlay')).toHaveCount(0, { timeout: 20_000 });
}

/** Loading shell has `.cl-songs-page-root` + Loader but no `.cld-page`. */
async function waitDetailReady(page: Page): Promise<void> {
  await page.waitForSelector('.cld-page', { state: 'visible', timeout: 120_000 });
  await expect(page.locator('h1.cld-song-title')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.cld-song-header-title-name')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.loader-overlay')).toHaveCount(0, { timeout: 20_000 });
}

async function settleForScreenshot(page: Page): Promise<void> {
  await suppressDevOverlay(page);
  await scrollFullPage(page);
  await page.waitForTimeout(3500);
}

test.describe('Song detail — API review captures', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test('01 — /songs listing full page (1920×1080 viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const listP = page.waitForResponse(
      (r) => r.request().method() === 'GET' && r.url().includes('/Api/list'),
      { timeout: 120_000 },
    );
    await gotoSettledOrSkip(page, '/songs');
    await listP.catch(() => {});
    await waitListingReady(page);
    await settleForScreenshot(page);
    await page.screenshot({
      path: path.join(OUT_DIR, '01-songs-listing-localhost.png'),
      fullPage: true,
    });
  });

  test('02 — /songs/details/{id} full page (1920×1080 viewport)', async ({ page }) => {
    const id = process.env.CAPTURE_SONG_ID || '229';
    await page.setViewportSize({ width: 1920, height: 1080 });
    const songP = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes('explore_songs') &&
        r.url().includes(`song_id=${id}`),
      { timeout: 120_000 },
    );
    await gotoSettledOrSkip(page, `/songs/details/${id}`);
    await songP.catch(() => {});
    await waitDetailReady(page);
    await settleForScreenshot(page);
    await page.screenshot({
      path: path.join(OUT_DIR, `02-song-detail-${id}-1920-localhost.png`),
      fullPage: true,
    });
  });

  test('03 — /songs/details/{id} full page (1440×900 viewport)', async ({ page }) => {
    const id = process.env.CAPTURE_SONG_ID || '229';
    await page.setViewportSize({ width: 1440, height: 900 });
    const songP = page.waitForResponse(
      (r) =>
        r.request().method() === 'GET' &&
        r.url().includes('explore_songs') &&
        r.url().includes(`song_id=${id}`),
      { timeout: 120_000 },
    );
    await gotoSettledOrSkip(page, `/songs/details/${id}`);
    await songP.catch(() => {});
    await waitDetailReady(page);
    await settleForScreenshot(page);
    await page.screenshot({
      path: path.join(OUT_DIR, `03-song-detail-${id}-1440-localhost.png`),
      fullPage: true,
    });
  });
});
