/**
 * Visual audit: screenshots + cream-band pixel check at gutter.
 * Run: node scripts/audit-songs-bg-visual.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'Comparison_Out', 'songs-bg-loadmore-test', 'audit');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

fs.mkdirSync(OUT, { recursive: true });

async function sampleBgColors(page, label) {
  return page.evaluate((lbl) => {
    const layers = document.querySelector('.cl-songs-bg-layers');
    if (!layers) return { error: 'no layers' };
    const r = layers.getBoundingClientRect();
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const samples = [];
    const scrollY = window.scrollY;
    for (const pageY of [400, 550, 700, 850, 1100]) {
      const viewY = pageY - scrollY;
      if (viewY < 0 || viewY > window.innerHeight) continue;
      const x = 72;
      const el = document.elementFromPoint(x, viewY);
      if (el && !layers.contains(el) && el !== document.documentElement) {
        samples.push({ pageY, skipped: true, el: el.className?.toString?.().slice(0, 40) });
        continue;
      }
      samples.push({ pageY, viewY, note: lbl });
    }
    const tiles = [...layers.querySelectorAll('.cl-songs-bg-tile')].map((t) => ({
      cap: t.classList.contains('cl-songs-bg-tile--cap'),
      top: t.offsetTop,
      h: t.offsetHeight,
      bgY: getComputedStyle(t.querySelector('.cl-songs-bg-tile-inner')).getPropertyValue('--songs-tile-bg-y'),
    }));
    return { scrollY, tiles, samples };
  }, label);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/songs`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForSelector('.cl-song-grid-item', { timeout: 180_000 });
await page.waitForTimeout(2000);

await page.screenshot({ path: path.join(OUT, 'step0-top.png') });

let info = await sampleBgColors(page, 'initial');
fs.writeFileSync(path.join(OUT, 'metrics-step0.json'), JSON.stringify(info, null, 2));

await page.click('.cl-load-more-btn');
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, 'step1-full.png'), fullPage: true });

for (const scroll of [0, 520, 1100]) {
  await page.evaluate((y) => window.scrollTo(0, y), scroll);
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, `step1-scroll-${scroll}.png`) });
}

info = await sampleBgColors(page, 'after-load1');
fs.writeFileSync(path.join(OUT, 'metrics-step1.json'), JSON.stringify(info, null, 2));

for (let i = 0; i < 2; i++) {
  const btn = page.locator('.cl-load-more-btn');
  if (await btn.isVisible()) await btn.click();
  await page.waitForTimeout(800);
}
await page.screenshot({ path: path.join(OUT, 'step3-full.png'), fullPage: true });

await browser.close();
console.log('Audit written to', OUT);
