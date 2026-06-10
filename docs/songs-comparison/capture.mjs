// Simple full-page screenshot capture using built-in puppeteer-core if available,
// otherwise fall back to instructions. Run with: node capture.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const targets = [
  { url: 'http://localhost:3000/songs',            file: 'localhost-songs-listing.png' },
  { url: 'http://localhost:3000/songs/details/1',  file: 'localhost-song-detail.png'   },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1568, height: 900 } });
  const page = await context.newPage();
  for (const t of targets) {
    console.log('Capturing', t.url);
    await page.goto(t.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: join(__dirname, t.file), fullPage: true });
  }
  // Filter open variant
  await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.click('text=Filters');
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(__dirname, 'localhost-songs-filter.png'), fullPage: false });
  await browser.close();
  console.log('Done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
