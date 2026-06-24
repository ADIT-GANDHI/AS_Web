/**
 * Compare filter parda edge: opacity 1.0 vs 0.95 vs 0.92, SVG vs PNG.
 * Output: scripts/probe-output/filter-parda-edge-comparison.png
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'scripts/probe-output');
fs.mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { label: 'SVG opacity 1.0', opacity: 1, src: '/songs-assets/song_filter_opaque.svg' },
  { label: 'SVG opacity 0.95 (live)', opacity: 0.95, src: '/songs-assets/song_filter_opaque.svg' },
  { label: 'SVG opacity 0.92', opacity: 0.92, src: '/songs-assets/song_filter_opaque.svg' },
  { label: 'PNG opacity 0.95', opacity: 0.95, src: '/songs-assets/song_filter_opaque.png' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.cl-filter-trigger', { timeout: 120000 });
await page.click('.cl-filter-trigger');
await page.waitForTimeout(700);

const lis = page.locator('.cl-filter-parda-list li:not(.is-empty)');
for (const i of [0, 2, 4]) {
  if (i < (await lis.count())) {
    await lis.nth(i).click();
    await page.waitForTimeout(120);
  }
}
await page.waitForTimeout(300);

const crops = [];

for (const v of VARIANTS) {
  await page.evaluate(
    ({ opacity, src }) => {
      const img = document.querySelector('.cl-filter-parda-bg');
      if (!(img instanceof HTMLImageElement)) return;
      img.style.opacity = String(opacity);
      img.src = src;
    },
    { opacity: v.opacity, src: v.src }
  );
  await page.waitForTimeout(350);

  const panel = page.locator('.cl-filter-parda-panel');
  const box = await panel.boundingBox();
  if (!box) continue;

  const edgePath = path.join(OUT, `filter-parda-edge-${v.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`);
  await page.screenshot({
    path: edgePath,
    clip: {
      x: box.x + box.width - 48,
      y: box.y + 120,
      width: 56,
      height: 520,
    },
  });
  crops.push({ label: v.label, path: edgePath });
}

const fullPath = path.join(OUT, 'filter-parda-opacity-full.png');
await page.evaluate(() => {
  const img = document.querySelector('.cl-filter-parda-bg');
  if (img instanceof HTMLImageElement) {
    img.style.opacity = '0.95';
    img.src = '/songs-assets/song_filter_opaque.svg';
  }
});
await page.waitForTimeout(200);
await page.locator('.cl-filter-parda-panel').screenshot({ path: fullPath });

const cells = crops
  .map(
    (c) =>
      `<div class="cell"><div class="lbl">${c.label}</div><img src="file:///${c.path.replace(/\\/g, '/')}" width="56" height="520" style="image-rendering:auto;width:100%;height:auto;border:1px solid #444"/></div>`
  )
  .join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body{background:#111;color:#eee;font-family:system-ui,sans-serif;padding:20px;margin:0}
  h1{font-size:17px;margin:0 0 8px}
  p{font-size:12px;color:#aaa;margin:0 0 16px;max-width:900px;line-height:1.5}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:1100px}
  .lbl{font-size:10px;color:#f472b6;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;font-weight:600}
  .full{margin-top:16px;max-width:422px}
  .full img{width:100%;border:1px solid #444}
</style></head><body>
<h1>Filter parda — edge &amp; opacity comparison</h1>
<p>Right-edge crop (56×520px) over marble. Recommended live: <strong>SVG @ 0.95</strong> (matches legacy FilterPanel).</p>
<div class="grid">${cells}</div>
<div class="full"><div class="lbl">Full panel — SVG 0.95 (live default)</div><img src="file:///${fullPath.replace(/\\/g, '/')}"/></div>
</body></html>`;

const htmlPath = path.join(OUT, '_filter-edge-comparison.html');
fs.writeFileSync(htmlPath, html);

const cmp = await browser.newPage({ viewport: { width: 1100, height: 900 } });
await cmp.goto(`file:///${htmlPath.replace(/\\/g, '/')}`);
await cmp.waitForTimeout(400);
await cmp.screenshot({
  path: path.join(OUT, 'filter-parda-edge-comparison.png'),
  fullPage: true,
});

console.log('Saved:', path.join(OUT, 'filter-parda-edge-comparison.png'));
console.log('Crops:', crops.map((c) => path.basename(c.path)).join(', '));

await browser.close();
