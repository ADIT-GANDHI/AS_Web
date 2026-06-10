/**
 * Capture People listing after Load More — inspect bg seams.
 * Run: node scripts/verify-people-bg-seams.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'Comparison_Out', 'people-bg-seam-test');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/people', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.clpe-entry', { timeout: 120000 });
await page.waitForTimeout(1200);

for (let i = 0; i < 5; i++) {
  const btn = page.locator('.cl-load-more-btn');
  if (!(await btn.isVisible().catch(() => false))) break;
  await btn.click();
  await page.waitForTimeout(700);
}

const metrics = await page.evaluate(() => {
  const bg = document.querySelector('.clpe-listing-bg');
  const entries = [...document.querySelectorAll('.clpe-entry')];
  return {
    bgUrl: bg ? getComputedStyle(bg).backgroundImage : null,
    bgSize: bg ? getComputedStyle(bg).backgroundSize : null,
    bgH: bg?.getBoundingClientRect().height,
    entryCount: entries.length,
    shellH: document.querySelector('.cl-songs-page-shell')?.scrollHeight,
  };
});
console.log(JSON.stringify(metrics, null, 2));

for (const y of [0, 600, 1200, 1800, 2400]) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, `people-y${y}.png`) });
}

await browser.close();
console.log('Saved:', OUT);
