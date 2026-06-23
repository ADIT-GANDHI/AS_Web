/**
 * PDF vs live — parda scrolls with page and ends at asset height (no load-more extension).
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'scripts/probe-output');
const PDF_REF = path.join(
  OUT,
  'pdf-full-page-reference.png'
);
const USER_PDF = path.join(
  process.cwd(),
  'assets/c__Users_adit_AppData_Roaming_Cursor_User_workspaceStorage_a9ac9b690e3ce4043df25b1e863bdec1_images_image-c841380e-9032-4ef4-a82e-93d04dde0cb6.png'
);

if (!fs.existsSync(PDF_REF) && fs.existsSync(USER_PDF)) {
  fs.copyFileSync(USER_PDF, PDF_REF);
}

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle', timeout: 90000 });
await page.click('button:has-text("Filters")');
await page.waitForTimeout(600);

// scroll top
await page.screenshot({ path: path.join(OUT, 'filter-parda-scroll-top.png') });

// scroll past parda end (1424px)
await page.evaluate(() => window.scrollTo(0, 1600));
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, 'filter-parda-after-scroll.png') });

const metrics = await page.evaluate(() => {
  const root = document.querySelector('.cl-filter-parda-root');
  const r = root?.getBoundingClientRect();
  return {
    pardaPosition: root ? getComputedStyle(root).position : null,
    pardaHeight: r?.height,
    scrollY: window.scrollY,
    pardaTopInViewport: r?.top,
    pardaBottomInViewport: r?.bottom,
    pardaGoneFromView: r ? r.bottom < 0 : null,
  };
});

const pdfPath = fs.existsSync(PDF_REF) ? PDF_REF.replace(/\\/g, '/') : '';
const topPath = path.join(OUT, 'filter-parda-scroll-top.png').replace(/\\/g, '/');
const afterPath = path.join(OUT, 'filter-parda-after-scroll.png').replace(/\\/g, '/');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { background:#111; color:#eee; font-family:system-ui,sans-serif; padding:20px; margin:0; }
  h1 { font-size:17px; margin:0 0 6px; }
  p { font-size:12px; color:#aaa; margin:0 0 16px; max-width:1100px; line-height:1.5; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .cell img { width:100%; border:1px solid #444; display:block; }
  .lbl { font-size:11px; color:#f472b6; text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; font-weight:600; }
  .row2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px; }
  code { background:#222; padding:2px 5px; border-radius:3px; font-size:11px; }
</style></head><body>
<h1>Filter parda — PDF vs implementation (scroll behaviour)</h1>
<p>PDF: one BG strip from header, fixed height, ends before footer — load more does not extend it.
Live: <code>position:absolute</code> at document top, <code>422×1424px</code>, <code>no-repeat</code>. After scroll ~1600px the parda has scrolled away.</p>
<div class="grid">
  <div class="cell"><div class="lbl">PDF reference (full page)</div>${pdfPath ? `<img src="file:///${pdfPath}"/>` : ''}</div>
  <div class="cell"><div class="lbl">Live — filters open, page top</div><img src="file:///${topPath}"/></div>
</div>
<div class="row2">
  <div class="cell"><div class="lbl">Live — scrolled past parda end (y≈1600)</div><img src="file:///${afterPath}"/></div>
  <div class="cell"><div class="lbl">Measured</div><pre style="font-size:11px;color:#ccc;white-space:pre-wrap">${JSON.stringify(metrics, null, 2)}</pre></div>
</div>
</body></html>`;

const htmlPath = path.join(OUT, '_filter-scroll-comparison.html');
fs.writeFileSync(htmlPath, html);
const cmp = await browser.newPage({ viewport: { width: 1200, height: 1100 } });
await cmp.goto(`file:///${htmlPath.replace(/\\/g, '/')}`);
await cmp.waitForTimeout(400);
await cmp.screenshot({ path: path.join(OUT, 'filter-parda-comparison-scroll.png'), fullPage: true });

console.log(JSON.stringify(metrics, null, 2));
console.log('Saved:', path.join(OUT, 'filter-parda-comparison-scroll.png'));

await browser.close();
