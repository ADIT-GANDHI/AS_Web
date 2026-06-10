import { test, expect } from '@playwright/test';

const DETAIL_ID = process.env.CAPTURE_SONG_ID || '233';

async function waitDetailReady(page: import('@playwright/test').Page) {
  await page.waitForSelector('.cld-page', { state: 'visible', timeout: 120_000 });
  await expect(page.locator('.cld-song-header-title-name')).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.loader-overlay')).toHaveCount(0, { timeout: 20_000 });
}

test.describe('Song detail — PDF layout & related fixes', () => {
  test('video frame: 8px border and PDF-proportional max width', async ({ page }) => {
    await page.goto(`/songs/details/${DETAIL_ID}`, { waitUntil: 'commit', timeout: 90_000 });
    await waitDetailReady(page);

    const video = page.locator('.cld-video-wrap');
    await expect(video).toBeVisible();

    const styles = await video.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderTopWidth: cs.borderTopWidth,
        maxWidth: cs.maxWidth,
        width: el.getBoundingClientRect().width,
        aspectRatio: cs.aspectRatio,
      };
    });

    const viewportW = page.viewportSize()?.width ?? 1440;
    const expectedMax = Math.min(1027, (viewportW * (1484 - 457)) / 1925);

    expect(styles.borderTopWidth).toBe('8px');
    expect(parseFloat(styles.maxWidth)).toBeCloseTo(expectedMax, -1);
    expect(styles.width).toBeCloseTo(expectedMax, -1);
    expect(styles.aspectRatio).toBe('1027 / 588');
  });

  test('first version card aligns with video column', async ({ page }) => {
    await page.goto('/songs/details/233', { waitUntil: 'commit', timeout: 90_000 });
    await waitDetailReady(page);

    const boxes = await page.evaluate(() => {
      const left = (sel: string) => document.querySelector(sel)?.getBoundingClientRect().left ?? null;
      const viewportW = window.innerWidth;
      const pdfColLeft = (viewportW * 457) / 1925;
      return {
        firstCard: left('.cld-version-card'),
        video: left('.cld-video-wrap'),
        header: left('.cld-song-header'),
        pdfColLeft,
      };
    });

    expect(boxes.firstCard).toBeTruthy();
    expect(boxes.video).toBeTruthy();
    expect(Math.abs(boxes.firstCard! - boxes.video!)).toBeLessThan(2);
    expect(Math.abs(boxes.header! - boxes.video!)).toBeLessThan(2);
    expect(Math.abs(boxes.video! - boxes.pdfColLeft)).toBeLessThan(3);
  });

  test('related section aligns with video column', async ({ page }) => {
    await page.goto(`/songs/details/${DETAIL_ID}`, { waitUntil: 'commit', timeout: 90_000 });
    await waitDetailReady(page);

    const boxes = await page.evaluate(() => {
      const box = (sel: string) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { left: b.left, width: b.width };
      };
      return { video: box('.cld-video-wrap'), related: box('.cld-related') };
    });

    expect(boxes.video).toBeTruthy();
    expect(boxes.related).toBeTruthy();
    expect(Math.abs(boxes.related!.left - boxes.video!.left)).toBeLessThan(4);
  });

  test('header: title half-width wrap, location right-aligned', async ({ page }) => {
    await page.goto(`/songs/details/${DETAIL_ID}`, { waitUntil: 'commit', timeout: 90_000 });
    await waitDetailReady(page);

    const titleName = page.locator('.cld-song-header-title-name');
    const meta = page.locator('.cld-song-header-meta');

    const titleBox = await titleName.evaluate((el) => {
      const cs = getComputedStyle(el);
      const parent = el.parentElement!;
      return {
        maxWidth: cs.maxWidth,
        parentWidth: parent.getBoundingClientRect().width,
        titleWidth: el.getBoundingClientRect().width,
      };
    });

    expect(titleBox.maxWidth).toBe('50%');
    expect(titleBox.titleWidth).toBeLessThanOrEqual(titleBox.parentWidth * 0.5 + 2);

    if (await meta.count()) {
      const metaAlign = await meta.evaluate((el) => getComputedStyle(el).textAlign);
      expect(metaAlign).toBe('right');
    }
  });

  test('about: collapsed first block, expand keeps HTML', async ({ page }) => {
    await page.goto(`/songs/details/${DETAIL_ID}`, { waitUntil: 'commit', timeout: 90_000 });
    await waitDetailReady(page);

    const desc = page.locator('.cld-description');
    if ((await desc.count()) === 0) {
      test.skip(true, 'No about content on this song');
    }

    const fontSize = await desc.evaluate((el) => getComputedStyle(el).fontSize);
    expect(fontSize).toBe('15px');

    const moreBtn = page.locator('.cld-description-more');
    if (await moreBtn.isVisible()) {
      const collapsedHtml = await page.locator('.cld-description-body').innerHTML();
      const collapsedParagraphs = await page.locator('.cld-description-body p').count();

      await moreBtn.click();
      const expandedHtml = await page.locator('.cld-description-body').innerHTML();
      expect(expandedHtml.length).toBeGreaterThan(collapsedHtml.length);
      expect(expandedHtml).toContain(collapsedHtml.replace(/^<p[^>]*>/i, '').slice(0, 20).trim().slice(0, 10) || '');
      expect(await page.locator('.cld-description-body p').count()).toBeGreaterThanOrEqual(
        collapsedParagraphs
      );

      await moreBtn.click();
      await expect(page.locator('.cld-description-body')).toHaveText(/\S/);
    }
  });

  test('related ALL tab renders without duplicate React keys', async ({ page }) => {
    const keyErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /same key/i.test(msg.text())) {
        keyErrors.push(msg.text());
      }
    });

    await page.goto(`/songs/details/${DETAIL_ID}`, { waitUntil: 'commit', timeout: 90_000 });
    await waitDetailReady(page);

    const allTab = page.getByRole('button', { name: /^ALL\b/i });
    if ((await allTab.count()) === 0) {
      test.skip(true, 'Related ALL tab not present');
    }

    await allTab.first().click();
    await page.waitForTimeout(500);

    expect(keyErrors, keyErrors.join('\n')).toHaveLength(0);
    await expect(page.locator('.cld-related-item').first()).toBeVisible();
  });

  test('loading shell includes footer before song data loads', async ({ page }) => {
    await page.route('**/Api/explore_songs**', async (route) => {
      await new Promise((r) => setTimeout(r, 2500));
      await route.continue();
    });

    await page.goto(`/songs/details/${DETAIL_ID}`, { waitUntil: 'commit', timeout: 90_000 });

    await expect(page.locator('.loader-overlay')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('footer').first()).toBeVisible({ timeout: 10_000 });

    await waitDetailReady(page);
    await expect(page.locator('footer').first()).toBeVisible();
  });
});
