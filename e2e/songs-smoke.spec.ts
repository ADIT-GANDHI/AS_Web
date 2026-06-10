import { test, expect } from '@playwright/test';

/**
 * Requires a running dev server: `npx next dev --hostname 127.0.0.1 --port 3000`
 * (`npm run test:e2e` does not start Next — avoids long compile waits inside Playwright.)
 */
test.describe('/songs listing (headless Chromium)', () => {
  test('page responds and shows songs chrome', async ({ page }) => {
    const res = await page.goto('/songs', { waitUntil: 'commit', timeout: 90_000 });
    expect(res?.ok(), `HTTP ${res?.status()}`).toBeTruthy();

    await expect(page.locator('header').first()).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('footer').first()).toBeVisible();

    await expect(page.locator('.cl-songs-page-root')).toBeVisible();
    await expect(page.locator('.cl-songs-count')).toContainText(/Songs/i);
  });

  test('up to 9 song card links; Load more when applicable', async ({ page }) => {
    await page.goto('/songs', { waitUntil: 'commit', timeout: 90_000 });
    await page.waitForSelector('a.cl-song-card-link', { state: 'visible', timeout: 90_000 });

    const links = page.locator('a.cl-song-card-link');
    const n = await links.count();
    expect(n, 'grid should show at most 9 cards initially').toBeLessThanOrEqual(9);
    expect(n).toBeGreaterThan(0);

    if (n >= 9) {
      const loadMore = page.getByRole('button', { name: /load more/i });
      const moreVisible = await loadMore.isVisible().catch(() => false);
      if (moreVisible) await expect(loadMore).toBeEnabled();
    }
  });

  test('clicking first card navigates to /songs/details/{id}', async ({ page }) => {
    await page.goto('/songs', { waitUntil: 'commit', timeout: 90_000 });
    const first = page.locator('a.cl-song-card-link').first();
    await expect(first).toBeVisible({ timeout: 90_000 });

    const href = await first.getAttribute('href');
    expect(href).toMatch(/^\/songs\/details\/[^/]+$/);

    await Promise.all([
      page.waitForURL(/\/songs\/details\/.+/, { timeout: 90_000 }),
      first.click(),
    ]);

    await expect(page.locator('.cld-page, .cl-songs-page-root')).toBeVisible({ timeout: 45_000 });
  });
});
