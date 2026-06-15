/**
 * Songs: wavy panel from top:0, content below header.
 * Poems: panel box below header (poems-only fix).
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const failures = [];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

async function headerBottom() {
  return page.evaluate(() => document.querySelector('header')?.getBoundingClientRect().bottom ?? 0);
}

// Songs — panel should span from top:0 (wavy under header)
await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: 'Filters' }).click();
await page.waitForTimeout(800);
const songsPanelTop = await page.evaluate(() => {
  const panels = Array.from(document.querySelectorAll('div')).filter(
    (el) => el.style.position === 'fixed' && el.style.zIndex === '9999'
  );
  return panels[0]?.getBoundingClientRect().top ?? -1;
});
if (songsPanelTop > 5) {
  failures.push(`songs: panel top ${songsPanelTop}px (expected ~0 for wavy drawer)`);
} else {
  console.log(`✓ songs: wavy panel from top (${songsPanelTop.toFixed(1)}px)`);
}
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// Poems — panel below header
await page.goto(`${BASE}/poems`, { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: 'Filters' }).click();
await page.waitForSelector('.clp-filter-panel', { timeout: 15000 });
const hb = await headerBottom();
const poemsMetrics = await page.evaluate(() => {
  const panel = document.querySelector('.clp-filter-panel');
  const filterBy = Array.from(document.querySelectorAll('.clp-filter-panel span')).find((el) =>
    el.textContent?.trim().startsWith('Filter by')
  );
  return {
    panelTop: panel?.getBoundingClientRect().top ?? 0,
    filterByTop: filterBy?.getBoundingClientRect().top ?? 0,
    bodyClass: document.body.classList.contains('ajab-poems-filter-drawer-open'),
  };
});
if (!poemsMetrics.bodyClass) failures.push('poems: missing ajab-poems-filter-drawer-open');
if (poemsMetrics.panelTop > 5) {
  failures.push(`poems: panel top ${poemsMetrics.panelTop}px (expected ~0 full wavy shell)`);
} else if (poemsMetrics.filterByTop < hb - 2) {
  failures.push(`poems: filter chrome overlaps header (${poemsMetrics.filterByTop} < ${hb})`);
} else {
  console.log(
    `✓ poems: full panel from top (${poemsMetrics.panelTop.toFixed(1)}px), chrome below header`
  );
}

await browser.close();

if (failures.length) {
  console.error('\n❌ Filter drawer checks failed:');
  failures.forEach((f) => console.error('  -', f));
  process.exit(1);
}
console.log('\n✅ Songs + Poems filter layout OK');
