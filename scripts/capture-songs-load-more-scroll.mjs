import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.argv[2] || 'http://localhost:3000';
const CLICKS = Number(process.argv[3] || 4);
const OUT_DIR = join(process.cwd(), 'Comparison_Out', 'Songs_FullScroll');
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 180000 });
await page.waitForTimeout(15000);

const loadMore = page.locator('.cl-load-more-btn');
await loadMore.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

let clicks = 0;
for (let i = 0; i < CLICKS; i++) {
  const visible = await loadMore.isVisible().catch(() => false);
  const enabled = visible && (await loadMore.isEnabled().catch(() => false));
  if (!enabled) {
    console.log(`Stop at click ${i}: button not available`);
    break;
  }
  await loadMore.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await loadMore.click();
  clicks++;
  await page.waitForTimeout(1200);
  const count = await page.locator('.cl-song-card').count();
  console.log(`Click ${clicks}: ${count} cards visible in DOM`);
}

const finalCount = await page.locator('.cl-song-card').count();
const scrollH = await page.evaluate(() => document.documentElement.scrollHeight);

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

// Stitched scroll capture: viewport slices while scrolling
const sliceH = 1080;
const steps = Math.ceil(scrollH / (sliceH * 0.85));
const slicePaths = [];

for (let i = 0; i < steps; i++) {
  const y = Math.min(i * Math.floor(sliceH * 0.85), Math.max(0, scrollH - sliceH));
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(350);
  const p = join(OUT_DIR, `slice-${String(i).padStart(3, '0')}.png`);
  await page.screenshot({ path: p });
  slicePaths.push(p);
}

await page.screenshot({
  path: join(OUT_DIR, 'songs-fullpage-after-loadmore.png'),
  fullPage: true,
});

console.log(
  JSON.stringify(
    {
      base: BASE,
      loadMoreClicks: clicks,
      songCards: finalCount,
      scrollHeight: scrollH,
      fullPage: join(OUT_DIR, 'songs-fullpage-after-loadmore.png'),
      slices: slicePaths.length,
      outDir: OUT_DIR,
    },
    null,
    2,
  ),
);

await browser.close();
