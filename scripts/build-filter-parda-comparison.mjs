/**
 * Side-by-side: PDF reference vs live filter parda implementation.
 * Output: scripts/probe-output/filter-parda-comparison.png
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'scripts/probe-output');
const PDF_REF = path.join(OUT, 'pdf-reference-filter-panel.png');
const LIVE_FULL = path.join(OUT, 'filter-parda-live-crop.png');
const COMPARISON = path.join(OUT, 'filter-parda-comparison.png');

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle', timeout: 90000 });
await page.click('button:has-text("Filters")');
await page.waitForTimeout(700);

// Match PDF: 4 selected filters visible in footer
const lis = page.locator('.cl-filter-parda-list li:not(.is-empty)');
const count = await lis.count();
for (const i of [0, 2, 4, 6]) {
  if (i < count) {
    await lis.nth(i).click();
    await page.waitForTimeout(150);
  }
}
await page.waitForTimeout(400);

// Crop live parda panel only (422px wide, top of viewport through ~780px — shows header + list + chips)
await page.locator('.cl-filter-parda-panel').screenshot({ path: LIVE_FULL });

const pdfExists = fs.existsSync(PDF_REF);
const pdfPath = pdfExists ? PDF_REF.replace(/\\/g, '/') : '';
const livePath = LIVE_FULL.replace(/\\/g, '/');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #1a1a1a; font-family: system-ui, sans-serif; color: #eee; padding: 24px; }
  h1 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
  p { font-size: 13px; color: #aaa; margin-bottom: 20px; max-width: 1200px; line-height: 1.5; }
  .row { display: flex; gap: 24px; align-items: flex-start; }
  .col { flex: 0 0 auto; }
  .label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
    color: #f472b6; margin-bottom: 10px; }
  .sub { font-size: 11px; color: #888; margin-bottom: 8px; max-width: 480px; }
  img { display: block; border: 1px solid #444; background: #fff; max-height: 820px; width: auto; }
  .notes { margin-top: 20px; font-size: 12px; color: #9ca3af; max-width: 1000px; }
  .notes li { margin: 4px 0; }
</style></head><body>
  <h1>Filter parda — PDF vs implementation</h1>
  <p>Left: PDF/Figma reference you provided. Right: live build at localhost:3000/songs (Filters open, 4 selections, 1440×900).</p>
  <div class="row">
    <div class="col">
      <div class="label">PDF reference</div>
      <div class="sub">Original parda artwork, chip footer, bottom margin</div>
      ${pdfExists ? `<img src="file:///${pdfPath}" alt="PDF reference" />` : '<p>PDF reference image missing</p>'}
    </div>
    <div class="col">
      <div class="label">Our implementation</div>
      <div class="sub">song_filter_opaque.svg 422×1424 · bottom inset 120px (~10.4%)</div>
      <img src="file:///${livePath}" alt="Live implementation" />
    </div>
  </div>
  <ul class="notes">
    <li>Parda height: 1424px (native SVG) — not stretched to viewport</li>
    <li>CLEAR ALL ~148px above parda bottom (28px footer padding + 120px inset)</li>
    <li>Scroll page to see parda end; scroll list for long API names</li>
  </ul>
</body></html>`;

const htmlPath = path.join(OUT, '_filter-comparison.html');
fs.writeFileSync(htmlPath, html);

const cmp = await browser.newPage({ viewport: { width: 1100, height: 920 } });
await cmp.goto(`file:///${htmlPath.replace(/\\/g, '/')}`);
await cmp.waitForTimeout(500);
await cmp.screenshot({ path: COMPARISON, fullPage: true });

console.log('Saved:', COMPARISON);
console.log('Live crop:', LIVE_FULL);

await browser.close();
