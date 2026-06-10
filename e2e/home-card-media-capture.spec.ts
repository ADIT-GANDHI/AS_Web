import { test, expect } from '@playwright/test';
import path from 'path';

test('capture home song card media area', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1200 });
  await page.goto('/', { waitUntil: 'networkidle' });
  const card = page.locator('.clh-song-card').first();
  await card.waitFor({ state: 'visible', timeout: 60_000 });

  const metrics = await card.evaluate(() => {
    const cardEl = document.querySelector('.clh-song-card');
    const img = document.querySelector('.clh-song-card .clh-media-img') as HTMLElement | null;
    const slot = document.querySelector('.clh-song-card .clh-media-slot');
    const surface = document.querySelector('.clh-song-card .clh-card-surface');
    if (!cardEl || !img || !slot || !surface) return null;
    const cr = cardEl.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    const slotR = slot.getBoundingClientRect();
    const surfaceR = surface.getBoundingClientRect();
    return {
      cardW: cr.width,
      surfaceW: surfaceR.width,
      slotW: slotR.width,
      imgW: ir.width,
      imgInsideSlot:
        ir.left >= slotR.left + 1.5 &&
        ir.right <= slotR.right - 1.5 &&
        ir.top >= slotR.top + 1.5 &&
        ir.bottom <= slotR.bottom - 1.5,
      imgInsideCard: ir.left >= cr.left - 0.5 && ir.right <= cr.right + 0.5,
      slotInsetL: slotR.left - surfaceR.left,
      slotInsetR: surfaceR.right - slotR.right,
    };
  });
  expect(metrics).not.toBeNull();
  expect(metrics!.imgInsideSlot).toBe(true);
  expect(metrics!.imgInsideCard).toBe(true);
  expect(metrics!.slotInsetL).toBeGreaterThan(2);
  expect(metrics!.slotInsetR).toBeGreaterThan(6);

  const dir = path.join(process.cwd(), 'e2e', 'screenshots');
  await card.screenshot({ path: path.join(dir, 'home-song-card-media.png') });
  await page.locator('.clh-song-card .clh-media-slot').first().screenshot({
    path: path.join(dir, 'home-song-card-clip-only.png'),
  });
});
