/**
 * Visual + stacking probe: poems filter vs header at logo position.
 * Usage: node scripts/probe-poems-filter-stack.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const base = process.argv[2] || 'http://localhost:3000';
const outDir = join(process.cwd(), 'scripts', 'probe-output');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function probe(route, label) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('header', { timeout: 60000 });
  const filterBtn = page.locator('button', { hasText: /^Filters$/ }).first();
  await filterBtn.waitFor({ timeout: 30000 });
  await filterBtn.click();
  await page.waitForSelector('.clp-filter-panel, .ajab-filter-list', { timeout: 15000 });
  await page.waitForTimeout(800);

  const metrics = await page.evaluate(() => {
    const header = document.querySelector('header');
    const logo = document.querySelector('.logo');
    const panel = document.querySelector('.clp-filter-panel') || document.querySelector('[class*="filter-panel"]');
    const gradient = document.querySelector('.gradient-bg');
    const hr = header?.getBoundingClientRect();
    const lr = logo?.getBoundingClientRect();
    const pr = panel?.getBoundingClientRect();
    const cx = lr ? lr.left + lr.width / 2 : 80;
    const cy = hr ? hr.top + hr.height / 2 : 80;
    const topEl = document.elementFromPoint(cx, cy);
    const getZ = (el) => {
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        class: el.className?.toString?.().slice(0, 80) || '',
        z: s.zIndex,
        pos: s.position,
        transform: s.transform,
      };
    };
    const chain = [];
    let n = topEl;
    while (n && chain.length < 12) {
      chain.push(getZ(n));
      n = n.parentElement;
    }
    return {
      headerZ: header ? getComputedStyle(header).zIndex : null,
      gradientZ: gradient ? getComputedStyle(gradient).zIndex : null,
      panelZ: panel ? getComputedStyle(panel).zIndex : null,
      panelTop: pr?.top ?? null,
      logoTop: lr?.top ?? null,
      bodyClass: document.body.className,
      topAtLogo: getZ(topEl),
      chain,
    };
  });

  const shot = join(outDir, `${label}-filter-open.png`);
  await page.screenshot({ path: shot, fullPage: false });
  console.log(`\n=== ${label} (${route}) ===`);
  console.log(JSON.stringify(metrics, null, 2));
  console.log(`screenshot: ${shot}`);
  return metrics;
}

try {
  const poems = await probe('/poems', 'poems');
  const songs = await probe('/songs', 'songs');

  const poemsBad = poems.topAtLogo?.class?.includes('clp-filter') || poems.chain.some((c) => c.class?.includes('clp-filter'));
  const songsBad = songs.chain.some((c) => c.class?.includes('ajab-filter') || c.z === '9999');

  if (poemsBad) {
    console.error('\n❌ POEMS: element at logo center is filter panel, not header');
    process.exit(1);
  }
  if (songsBad) {
    console.error('\n⚠ SONGS: may also have stacking issue at logo');
  }
  console.log('\n✅ Stacking probe complete');
} finally {
  await browser.close();
}
