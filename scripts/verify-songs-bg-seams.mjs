import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'Comparison_Out', 'Songs_BG_Check');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(2500);

const metrics = await page.evaluate(() => {
  const sheet = document.querySelector('.cl-songs-bg-sheet');
  const root = document.querySelector('.cl-songs-bg-layers');
  const cs = sheet ? getComputedStyle(sheet) : null;
  return {
    hasBgRoot: !!root,
    hasBgSheet: !!sheet,
    bgImage: cs?.backgroundImage?.slice(0, 100),
    bgSize: cs?.backgroundSize,
    layerHeight: root?.getBoundingClientRect().height,
    scrollHeight: document.documentElement.scrollHeight,
    songCount: document.querySelectorAll('.cl-song-card, [class*="song-card"]').length,
  };
});

console.log(JSON.stringify(metrics, null, 2));

for (const y of [0, 700, 1400, 2100, 2800, 3500]) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, `songs-1920-y${y}.png`) });
}

await page.screenshot({ path: join(OUT, 'songs-1920-full.png'), fullPage: true });
await browser.close();
console.log('Screenshots:', OUT);
