/**
 * Capture Reflections bg at scroll depths where mirror seams appear.
 * Run: node scripts/verify-reflections-bg-seams.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'Comparison_Out', 'reflections-bg-seam-test');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/reflections', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.cl-song-grid-item, .clr-grid-status', { timeout: 120000 });
await page.waitForTimeout(2000);

for (let i = 0; i < 3; i++) {
  const btn = page.locator('.cl-load-more-btn');
  if (!(await btn.isVisible())) break;
  await btn.click();
  await page.waitForTimeout(1000);
}

const metrics = await page.evaluate(() => {
  const top = document.querySelector('.clr-bg-top');
  const sheet = document.querySelector('.clr-bg-sheet');
  return {
    topH: top?.getBoundingClientRect().height,
    sheetTop: sheet?.getBoundingClientRect().top,
    sheetH: sheet?.getBoundingClientRect().height,
    sheetBg: sheet ? getComputedStyle(sheet).backgroundImage.slice(0, 80) : null,
  };
});
console.log(JSON.stringify(metrics, null, 2));

for (const y of [0, 1500, 2500, 3200, 4000, 5000]) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.waitForTimeout(350);
  await page.screenshot({ path: join(OUT, `v4-y${y}.png`) });
}

await browser.close();
console.log('Saved:', OUT);
