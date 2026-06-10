/**
 * Full Songs bg audit: Load More ×3, screenshots, metrics, pass/fail.
 * Run: node scripts/verify-songs-bg-full.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'Comparison_Out', 'songs-bg-loadmore-test');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function readMetrics(page) {
  return page.evaluate(() => {
    const shell = document.querySelector('.cl-songs-page-shell');
    const footer = document.querySelector('footer.footer-bg');
    const layers = document.querySelector('.cl-songs-bg-layers');
    const tiles = layers ? [...layers.querySelectorAll('.cl-songs-bg-tile')] : [];
    const sheet = !!layers?.querySelector('.cl-songs-bg-sheet');
    const footerEl = footer instanceof HTMLElement ? footer : null;
    const layersEl = layers instanceof HTMLElement ? layers : null;

    const rootRect = document.querySelector('.cl-songs-page-root')?.getBoundingClientRect();
    const footerRect = footerEl?.getBoundingClientRect();
    const layersRect = layersEl?.getBoundingClientRect();

    const footerTop = footerEl?.offsetTop ?? null;
    const bgHeight = layersEl?.offsetHeight ?? 0;
    const expectedBgMax = footerTop != null ? footerTop + 165 : null;

    return {
      visibleSongs: document.querySelectorAll('.cl-song-grid-item').length,
      segmentCount: sheet ? 1 : tiles.length,
      repeatSheet: sheet,
      tileTops: tiles.map((t) => Math.round(t.offsetTop)),
      tileFlipped: tiles.map((t) => t.classList.contains('cl-songs-bg-tile--flipped')),
      bgHeight,
      footerTop,
      shellScrollHeight: shell?.scrollHeight ?? 0,
      expectedBgMax,
      bgWithinFooterCap: expectedBgMax != null ? bgHeight <= expectedBgMax + 2 : null,
      bgExtendsPastFooterWave:
        rootRect && layersRect && footerRect
          ? layersRect.bottom > footerRect.top + 220
          : null,
      hasLoadMore: !!document.querySelector('.cl-load-more-btn'),
      loadMoreVisible: (() => {
        const b = document.querySelector('.cl-load-more-btn');
        if (!b) return false;
        const r = b.getBoundingClientRect();
        return r.height > 0 && r.width > 0;
      })(),
    };
  });
}

async function main() {
  fs.mkdirSync(path.join(OUT, 'seams'), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/songs`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.cl-song-grid-item', { timeout: 180_000 });
  await page.waitForTimeout(2000);

  const steps = [];
  const failures = [];

  for (let step = 0; step <= 3; step++) {
    await page.waitForTimeout(600);
    const m = await readMetrics(page);
    steps.push({ step, ...m });

    await page.screenshot({
      path: path.join(OUT, `comparison-step-${step}.png`),
      fullPage: true,
    });

    await page.screenshot({
      path: path.join(OUT, `comparison-step-${step}-viewport.png`),
      fullPage: false,
    });

    if (m.bgExtendsPastFooterWave) {
      failures.push(`step ${step}: bg extends past footer wave zone`);
    }
    if (m.bgWithinFooterCap === false) {
      failures.push(`step ${step}: bg height ${m.bgHeight} > cap ${m.expectedBgMax}`);
    }

    if (step < 3) {
      const btn = page.locator('.cl-load-more-btn');
      if (!(await btn.isVisible())) {
        failures.push(`step ${step}: Load More not visible but expected`);
        break;
      }
      await btn.click();
      await page.waitForTimeout(1200);
    }
  }

  const final = steps[steps.length - 1];
  if (final) {
    for (const top of final.tileTops.slice(1)) {
      await page.evaluate((y) => window.scrollTo(0, y - 120), top);
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(OUT, 'seams', `join-at-${top}.png`),
      });
    }
    await page.evaluate((y) => {
      const footer = document.querySelector('footer.footer-bg');
      window.scrollTo(0, (footer?.offsetTop ?? y) - 200);
    }, final.footerTop ?? 0);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'seams', 'footer-zone.png') });
  }

  await browser.close();

  const report = {
    url: `${BASE}/songs`,
    capturedAt: new Date().toISOString(),
    viewport: { width: 1440, height: 900 },
    steps,
    failures,
    pass: failures.length === 0,
  };

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Songs BG — Load More comparison</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;background:#f5f5f5}
h1{font-size:1.25rem} .grid{display:grid;gap:24px}
.card{background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.card img{max-width:100%;height:auto;border:1px solid #ddd}
.meta{font-size:13px;color:#444;margin:8px 0}
.fail{color:#c00;font-weight:600}.pass{color:#080}
</style></head><body>
<h1>Songs listing background — Load More ×3</h1>
<p class="${report.pass ? 'pass' : 'fail'}">${report.pass ? 'All checks passed' : 'Issues: ' + failures.join('; ')}</p>
<div class="grid">
${steps.map((s) => `<div class="card"><h2>Step ${s.step} — ${s.visibleSongs} songs</h2>
<p class="meta">bg: ${s.bgHeight}px · footer top: ${s.footerTop}px · continuous marble: ${s.continuousBg ? 'yes' : 'no'}</p>
<img src="comparison-step-${s.step}.png" alt="step ${s.step} full page"/>
<img src="comparison-step-${s.step}-viewport.png" alt="step ${s.step} viewport"/>
</div>`).join('\n')}
<div class="card"><h2>Footer zone</h2><img src="seams/footer-zone.png" alt="footer"/></div>
${final?.tileTops.slice(1).map((t) => `<div class="card"><h2>Join at ${t}px</h2><img src="seams/join-at-${t}.png" alt="join"/></div>`).join('\n') || ''}
</div></body></html>`;

  fs.writeFileSync(path.join(OUT, 'index.html'), html);

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nComparison: ${OUT}/index.html`);

  if (failures.length) {
    console.error('FAILURES:', failures);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
