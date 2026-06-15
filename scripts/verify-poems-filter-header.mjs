/**
 * Poems filter drawer must not overlap sticky header.
 * Run: node scripts/verify-poems-filter-header.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const failures = [];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto(`${BASE}/poems`, { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: 'Filters' }).click();
await page.waitForSelector('.clp-filter-panel', { timeout: 15000 });

const metrics = await page.evaluate(() => {
  const header = document.querySelector('header');
  const panel = document.querySelector('.clp-filter-panel');
  const filterBy = Array.from(document.querySelectorAll('.clp-filter-panel span')).find((el) =>
    el.textContent?.trim().startsWith('Filter by')
  );
  const headerRect = header?.getBoundingClientRect();
  const panelRect = panel?.getBoundingClientRect();
  const filterByRect = filterBy?.getBoundingClientRect();
  const headerBottom = headerRect?.bottom ?? 0;
  const panelTop = panelRect?.top ?? 0;
  const filterByTop = filterByRect?.top ?? 0;
  const logo = document.querySelector('.logo');
  const lr = logo?.getBoundingClientRect();
  const cx = lr ? lr.left + lr.width / 2 : 80;
  const cy = lr ? lr.top + lr.height / 2 : 80;
  const topEl = document.elementFromPoint(cx, cy);
  const logoHitIsFilter = Boolean(
    topEl?.closest?.('.clp-filter-panel') && !topEl?.closest?.('header')
  );
  return {
    headerBottom,
    panelTop,
    filterByTop,
    logoHitIsFilter,
    bodyClass: document.body.classList.contains('ajab-poems-filter-drawer-open'),
  };
});

if (!metrics.bodyClass) {
  failures.push('body missing ajab-poems-filter-drawer-open while panel open');
}
if (metrics.panelTop > 5) {
  failures.push(`panel top ${metrics.panelTop.toFixed(1)}px (expected ~0 full-height wavy shell)`);
}
if (metrics.filterByTop < metrics.headerBottom - 2) {
  failures.push(
    `"Filter by" top ${metrics.filterByTop.toFixed(1)}px overlaps header bottom ${metrics.headerBottom.toFixed(1)}px`
  );
}
if (metrics.logoHitIsFilter) {
  failures.push('logo center hits filter panel — header must stack above drawer (check .clp-page-root)');
}

await browser.close();

if (failures.length) {
  console.error('❌ Poems filter/header check failed:');
  failures.forEach((f) => console.error('  -', f));
  process.exit(1);
}

console.log(
  `✅ Poems filter clears header (panel top ${metrics.panelTop.toFixed(1)}px, header bottom ${metrics.headerBottom.toFixed(1)}px)`
);
