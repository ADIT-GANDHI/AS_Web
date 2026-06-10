/**
 * Songs listing — verify alternating bg strips after Load More clicks.
 * Run: node scripts/verify-songs-bg-loadmore.mjs
 * Requires dev server at http://localhost:3000
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'Comparison_Out', 'songs-bg-loadmore-test');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function readBgState(page) {
  return page.evaluate(() => {
    const layers = document.querySelector('.cl-songs-bg-layers');
    const tiles = layers ? [...layers.querySelectorAll('.cl-songs-bg-tile')] : [];
    return {
      segmentCount: tiles.length,
      flippedCount: tiles.filter((t) => t.classList.contains('cl-songs-bg-tile--flipped')).length,
      stackHeight: layers ? Math.round(layers.getBoundingClientRect().height) : 0,
      shellHeight: Math.round(
        (document.querySelector('.cl-songs-page-shell')?.scrollHeight || 0)
      ),
      tileTops: tiles.map((t) => Math.round(t.offsetTop)),
      tileFlipped: tiles.map((t) => t.classList.contains('cl-songs-bg-tile--flipped')),
    };
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/songs`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  // Wait out the fullscreen loader, then for cards / load-more
  await page.waitForSelector('.cl-song-grid .cl-song-grid-item', { timeout: 180_000 });
  await page.waitForFunction(
    () => !document.querySelector('.loader-overlay, [class*="Loader"]')?.offsetParent,
    { timeout: 180_000 }
  ).catch(() => {});
  await page.waitForTimeout(1500);

  const states = [];

  for (let step = 0; step <= 3; step++) {
    await page.waitForTimeout(800);
    const state = await readBgState(page);
    const visibleSongs = await page.locator('.cl-song-grid-item').count();
    states.push({ step, visibleSongs, ...state });

    await page.screenshot({
      path: path.join(OUT, `step-${step}-segments-${state.segmentCount}.png`),
      fullPage: step > 0,
    });

    if (step < 3) {
      const btn = page.locator('.cl-load-more-btn');
      if (!(await btn.isVisible())) break;
      await btn.click();
      await page.waitForTimeout(1200);
    }
  }

  await browser.close();

  const report = {
    url: `${BASE}/songs`,
    outDir: OUT,
    states,
    segmentCountsChanged: new Set(states.map((s) => s.segmentCount)).size > 1,
    hasFlippedTiles: states.some((s) => s.flippedCount > 0),
  };

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nScreenshots: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
