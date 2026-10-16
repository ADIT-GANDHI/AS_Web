import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.join('comparison-runs', 'filter-drawer-1440');
fs.mkdirSync(OUT, { recursive: true });

async function openFilters(page, how) {
  if (how === 'seeall') {
    await page.locator('button:has-text("See All")').first().click();
    return;
  }
  if (how === 'radio') {
    const selectors = [
      'button:has-text("Filters")',
      '[aria-label*="ilter" i]',
      'button.radio-filter',
      '.radio-filter-btn',
      'button:has-text("Filter")',
    ];
    for (const s of selectors) {
      const el = page.locator(s).first();
      if ((await el.count()) > 0) {
        await el.click();
        return;
      }
    }
    throw new Error('no radio filter control');
  }
  // ListingFilterBar: pink "Filters" text/button
  const candidates = [
    'button:has-text("Filters")',
    'button:has-text("FILTERS")',
    '[class*="filter"]:has-text("Filters")',
  ];
  for (const s of candidates) {
    const el = page.locator(s).first();
    if ((await el.count()) > 0) {
      await el.click();
      return;
    }
  }
  // fallback: click text Filters
  await page.getByText('Filters', { exact: true }).first().click();
}

async function measureDrawer(page) {
  const drawer = page.locator('.ajab-filter-drawer');
  await drawer.waitFor({ state: 'visible', timeout: 8000 });

  return drawer.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const close = Array.from(el.querySelectorAll('button')).find(
      (b) =>
        (b.getAttribute('aria-label') || '') === 'Close filters' ||
        b.textContent.trim() === '×'
    );
    const closeRect = close ? close.getBoundingClientRect() : null;

    const topZone = Array.from(el.querySelectorAll('button, span'))
      .map((n) => {
        const r = n.getBoundingClientRect();
        return {
          t: (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48),
          left: Math.round(r.left),
          right: Math.round(r.right),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          h: Math.round(r.height),
        };
      })
      .filter(
        (n) =>
          n.h > 0 &&
          n.h < 40 &&
          n.top >= rect.top &&
          n.top < rect.top + 280 &&
          n.t.length > 0 &&
          n.t.length < 40
      );

    const overlaps = [];
    if (closeRect) {
      for (const n of topZone) {
        if (n.t === '×') continue;
        const overlapsX = n.left < closeRect.right && n.right > closeRect.left;
        const overlapsY = n.top < closeRect.bottom && n.bottom > closeRect.top;
        if (overlapsX && overlapsY) overlaps.push(n.t);
      }
    }

    // header labels that share one horizontal band with close
    const headerLabels = topZone.filter(
      (n) =>
        n.t !== '×' &&
        (n.t === 'Filter by' ||
          n.t === '|' ||
          /^(Singer|Poet|Theme|Speaker|Format|Poets|Themes|Curated)$/.test(n.t))
    );

    const labelBottoms = headerLabels.map((n) => n.bottom);
    const labelTops = headerLabels.map((n) => n.top);
    const sameLine =
      headerLabels.length <= 1
        ? true
        : Math.max(...labelBottoms) - Math.min(...labelTops) < 28;

    const rightmostLabel = headerLabels
      .filter((n) => n.t !== 'Filter by' && n.t !== '|')
      .sort((a, b) => b.right - a.right)[0];

    const gapToClose =
      closeRect && rightmostLabel
        ? Math.round(closeRect.left - rightmostLabel.right)
        : null;

    const bgLayer = el.querySelector('[aria-hidden="true"]');
    const bgOpacity = bgLayer ? getComputedStyle(bgLayer).opacity : null;

    // elementsFromPoint mid-drawer — first non-drawer hit would mean bleed
    const x = rect.left + rect.width * 0.5;
    const y = rect.top + Math.min(rect.height * 0.55, 450);
    const stack = document.elementsFromPoint(x, y).slice(0, 6).map((node) => ({
      tag: node.tagName,
      cls: String(node.className || '').slice(0, 50),
      inDrawer: el.contains(node) || node === el,
    }));

    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      backgroundColor: style.backgroundColor,
      bgOpacity,
      close: closeRect
        ? {
            left: Math.round(closeRect.left),
            right: Math.round(closeRect.right),
            top: Math.round(closeRect.top),
          }
        : null,
      headerLabels,
      sameLine,
      gapToClose,
      overlaps,
      stack,
      overflowPastDrawer: rightmostLabel
        ? rightmostLabel.right > rect.right - 2
        : false,
    };
  });
}

const PAGES = [
  { path: '/songs', how: 'filters', name: 'songs' },
  { path: '/reflections', how: 'filters', name: 'reflections' },
  { path: '/people', how: 'filters', name: 'people' },
  { path: '/poems', how: 'seeall', name: 'poems' },
  { path: '/radio', how: 'radio', name: 'radio' },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const results = [];

for (const item of PAGES) {
  const entry = { name: item.name, path: item.path };
  try {
    await page.goto(`http://localhost:3000${item.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(1200);
    await openFilters(page, item.how);
    await page.waitForTimeout(700);
    const data = await measureDrawer(page);
    entry.ok =
      data.width >= 370 &&
      data.width <= 450 &&
      data.overlaps.length === 0 &&
      data.sameLine === true &&
      (data.gapToClose == null || data.gapToClose >= 4) &&
      !data.overflowPastDrawer &&
      Number(data.bgOpacity) >= 0.99;
    entry.data = data;
    const shot = path.join(OUT, `${item.name}.png`);
    await page.screenshot({
      path: shot,
      clip: { x: 0, y: 0, width: 520, height: 440 },
    });
    entry.shot = shot;
    // close
    const closeBtn = page.locator(
      '.ajab-filter-drawer button[aria-label="Close filters"]'
    );
    if ((await closeBtn.count()) > 0) await closeBtn.click();
    else await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } catch (err) {
    entry.ok = false;
    entry.error = String(err.message || err);
    try {
      await page.screenshot({
        path: path.join(OUT, `${item.name}-error.png`),
        clip: { x: 0, y: 0, width: 520, height: 440 },
      });
    } catch {
      /* ignore */
    }
  }
  results.push(entry);
  console.log(
    JSON.stringify(
      {
        name: entry.name,
        ok: entry.ok,
        error: entry.error,
        width: entry.data?.width,
        sameLine: entry.data?.sameLine,
        gapToClose: entry.data?.gapToClose,
        overlaps: entry.data?.overlaps,
        bgOpacity: entry.data?.bgOpacity,
        labels: entry.data?.headerLabels?.map((l) => l.t),
      },
      null,
      2
    )
  );
}

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
await browser.close();

const failed = results.filter((r) => !r.ok);
console.log('\nSUMMARY', {
  passed: results.filter((r) => r.ok).length,
  failed: failed.map((f) => f.name),
});
process.exit(failed.length ? 1 : 0);
