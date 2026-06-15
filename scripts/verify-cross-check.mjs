/**
 * Cross-check key pages: routes, filters, about tabs, header dropdown.
 * Run: node scripts/verify-cross-check.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const failures = [];
const passes = [];

function pass(msg) {
  passes.push(msg);
  console.log(`✓ ${msg}`);
}

function fail(msg) {
  failures.push(msg);
  console.error(`✗ ${msg}`);
}

const ROUTES = [
  '/',
  '/songs',
  '/poems',
  '/reflections',
  '/people',
  '/films',
  '/about?tab=ajab',
  '/about?tab=kabir',
  '/radio',
  '/glossary',
  '/ajab-news',
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

for (const route of ROUTES) {
  const res = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (!res || !res.ok()) {
    fail(`${route} → HTTP ${res?.status() ?? 'no response'}`);
    continue;
  }
  const hasHeader = (await page.locator('header').count()) > 0;
  if (!hasHeader) fail(`${route} → missing header`);
  else pass(`${route} → ${res.status()} + header`);
}

// About tabs
for (const [brand, tabs] of Object.entries({
  ajab: ['INTRO', 'TRANSLIT GUIDE', 'COPYRIGHTS'],
  kabir: ['INTRO', 'TEAM', 'FILMS', 'BOOKS', 'SHABAD SHAALA'],
})) {
  await page.goto(`${BASE}/about?tab=${brand}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.about-toggle-btn', { timeout: 30000 });
  const found = (await page.locator('.about-toggle-btn').allTextContents()).map((t) =>
    t.trim().replace(/\s+/g, ' ')
  );
  for (const t of tabs) {
    if (!found.includes(t)) fail(`about/${brand}: missing tab ${t}`);
  }
  for (const t of found) {
    if (!tabs.includes(t)) fail(`about/${brand}: extra tab ${t}`);
  }
  if ((await page.locator('.about-brand-switch').count()) > 0) {
    fail(`about/${brand}: brand switch should not show`);
  }
  if (found.length === tabs.length) pass(`about/${brand}: tabs [${found.join(' | ')}]`);
}

// Header ABOUT dropdown
await page.goto(`${BASE}/songs`, { waitUntil: 'domcontentloaded' });
await page.hover('.about-nav-dropdown-wrap');
await page.waitForSelector('.about-nav-dropdown-link', { state: 'visible', timeout: 5000 });
const dd = await page.locator('.about-nav-dropdown-link').allTextContents();
if (!dd.some((t) => t.includes('AJAB SHAHAR')) || !dd.some((t) => t.includes('KABIR PROJECT'))) {
  fail('header ABOUT dropdown missing links');
} else pass('header ABOUT dropdown visible on hover');

// Songs filter — wavy from top
await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: 'Filters' }).click();
await page.waitForTimeout(600);
const songsPanelTop = await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('div')).find(
    (n) => n.style.position === 'fixed' && n.style.zIndex === '9999'
  );
  return el?.getBoundingClientRect().top ?? -1;
});
if (songsPanelTop > 5) fail(`songs filter panel top ${songsPanelTop}px (expected ~0)`);
else pass(`songs filter wavy panel from top (${songsPanelTop.toFixed(1)}px)`);
await page.locator('body').click({ position: { x: 700, y: 400 } }).catch(() => {});
await page.waitForTimeout(300);

// Poems filter — below header
await page.goto(`${BASE}/poems`, { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: 'Filters' }).click();
await page.waitForSelector('.clp-filter-panel', { timeout: 15000 });
const poemsCheck = await page.evaluate(() => {
  const hb = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
  const pt = document.querySelector('.clp-filter-panel')?.getBoundingClientRect().top ?? 0;
  return { hb, pt, bodyClass: document.body.classList.contains('ajab-poems-filter-drawer-open') };
});
if (!poemsCheck.bodyClass) fail('poems filter: missing body class');
if (poemsCheck.pt > 5) {
  fail(`poems filter panel not full height (top ${poemsCheck.pt}px, expected ~0)`);
} else {
  const filterByTop = await page.evaluate(() => {
    const filterBy = Array.from(document.querySelectorAll('.clp-filter-panel span')).find((el) =>
      el.textContent?.trim().startsWith('Filter by')
    );
    return filterBy?.getBoundingClientRect().top ?? 0;
  });
  if (filterByTop < poemsCheck.hb - 2) {
    fail(`poems filter chrome overlaps header (${filterByTop}px < ${poemsCheck.hb}px)`);
  } else {
    pass(`poems filter full panel + chrome below header`);
  }
}

// Reflections filter opens (own component)
await page.goto(`${BASE}/reflections`, { waitUntil: 'networkidle', timeout: 60000 });
const reflFilterBtn = page.getByRole('button', { name: 'Filter' });
if ((await reflFilterBtn.count()) === 0) fail('reflections: no Filter button');
else {
  await reflFilterBtn.click();
  await page.waitForTimeout(500);
  const hasFixed = await page.evaluate(() =>
    Array.from(document.querySelectorAll('div')).some(
      (n) => getComputedStyle(n).position === 'fixed' && n.textContent?.includes('Filter by')
    )
  );
  if (!hasFixed) fail('reflections filter panel did not open');
  else pass('reflections filter opens');
}

// No double /new/ in dev (sanity)
const homeHtml = await (await page.goto(`${BASE}/`))?.text();
if (homeHtml?.includes('/new/new/')) fail('home HTML contains /new/new/ double basePath');

await browser.close();

console.log(`\n--- Summary: ${passes.length} passed, ${failures.length} failed ---`);
if (failures.length) {
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}
console.log('✅ Cross-check complete');
