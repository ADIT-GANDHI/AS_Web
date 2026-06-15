/**
 * Visit main routes, scroll full page, report console errors and layout issues.
 * Usage: node scripts/scroll-all-pages.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:3000').replace(/\/$/, '');

const routes = [
  '/',
  '/songs',
  '/songs/details/260',
  '/poems',
  '/poems/1',
  '/reflections',
  '/reflections/details/63',
  '/people',
  '/people/1',
  '/films',
  '/films/details/38',
  '/about?tab=ajab',
  '/glossary',
  '/ajab-news',
  '/radio',
  '/searche?search=kabir',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1536, height: 900 } });

const consoleErrors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('pageerror', (err) => consoleErrors.push(String(err.message || err)));

const results = [];

for (const path of routes) {
  const url = `${base}${path}`;
  const row = { path, url, status: null, ok: true, notes: [] };
  consoleErrors.length = 0;

  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    row.status = res?.status() ?? 0;
    if (row.status >= 400) {
      row.ok = false;
      row.notes.push(`HTTP ${row.status}`);
    }

    await page.waitForTimeout(3500);

    const loaderVisible = await page.locator('.loader-overlay').isVisible().catch(() => false);
    if (loaderVisible) {
      row.notes.push('loader still visible after wait');
    }

    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const steps = Math.min(8, Math.max(1, Math.ceil(scrollHeight / 900)));
    for (let i = 0; i <= steps; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((scrollHeight * i) / steps));
      await page.waitForTimeout(400);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    const glossaryTerms = await page.locator('.gs-term-word').count();
    if (glossaryTerms > 0) {
      const pinkDefault = await page.locator('.gs-term-word').evaluateAll((els) =>
        els.filter((el) => {
          const c = getComputedStyle(el).color;
          return c.includes('227') || c.includes('225');
        }).length
      );
      if (pinkDefault > 0) row.notes.push(`${pinkDefault} glossary terms pink by default`);
    }

    const dupKeyErrors = consoleErrors.filter((t) => /same key/i.test(t));
    if (dupKeyErrors.length) row.notes.push(`${dupKeyErrors.length} duplicate-key errors`);

    const hardErrors = consoleErrors.filter(
      (t) => !/same key/i.test(t) && !/favicon/i.test(t) && !/404.*\.(png|jpg|svg)/i.test(t)
    );
    if (hardErrors.length) {
      row.ok = false;
      row.notes.push(`console: ${hardErrors[0].slice(0, 120)}`);
    }
  } catch (err) {
    row.ok = false;
    row.notes.push(String(err.message || err).slice(0, 160));
  }

  results.push(row);
  const flag = row.ok ? 'PASS' : 'FAIL';
  console.log(`${flag} ${path}${row.notes.length ? ` — ${row.notes.join('; ')}` : ''}`);
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length} routes, ${failed.length} failed`);
if (failed.length) process.exit(1);
