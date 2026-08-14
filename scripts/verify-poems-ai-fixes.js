/**
 * Verify Poems AI gap fixes at 1440 — Explore, Listen, Notes, Filter chips.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join('comparison-runs', 'poems-ai-vs-live-1440', 'verify');
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log('saved', name);
}

(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/poems', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('.clp-page', { timeout: 60000 });
  await page.waitForTimeout(2500);

  // Explore checks
  await page.locator('.clp-related').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const exploreMeta = await page.evaluate(() => {
    const row = document.querySelector('.clp-related .explore-titlerow');
    const thumb = document.querySelector('.clp-related .explore-thumb');
    const desc = document.querySelector('.clp-related .explore-itemdesc');
    const title = row?.querySelector('.explore-itemtitle');
    const sub = row?.querySelector('.explore-itemsubtitle');
    const rowCs = row ? getComputedStyle(row) : null;
    const thumbCs = thumb ? getComputedStyle(thumb) : null;
    let sameLine = false;
    if (title && sub) {
      const tr = title.getBoundingClientRect();
      const sr = sub.getBoundingClientRect();
      sameLine = Math.abs(tr.top - sr.top) < 8;
    }
    return {
      flexWrap: rowCs?.flexWrap || null,
      thumbRadius: thumbCs?.borderRadius || null,
      sameLine,
      descHasLiteralNn: desc ? /\\n/.test(desc.textContent || '') : null,
      descSample: (desc?.textContent || '').slice(0, 120),
    };
  });
  console.log('explore', JSON.stringify(exploreMeta, null, 2));
  await shot(page, 'explore.png');

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  // Filter chips — select first two poets
  await page.locator('.clp-see-all').click();
  await page.waitForTimeout(1000);
  await page.locator('.ajab-filter-drawer button', { hasText: 'Poets' }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  const poetButtons = page.locator('.ajab-filter-drawer [class*="ajab"], .ajab-filter-drawer button').filter({
    hasNotText: /Poets|Themes|CLEAR|Filter|ORAL/i,
  });
  // Click first two selectable list items in drawer body
  const listItems = page.locator('.ajab-filter-drawer button').filter({ hasText: /.+/ });
  const texts = await listItems.allTextContents();
  let picked = 0;
  for (let i = 0; i < texts.length && picked < 2; i++) {
    const t = (texts[i] || '').trim();
    if (!t || /^(Poets|Themes|CLEAR ALL|Clear all|Filter by)$/i.test(t)) continue;
    if (t.length > 40) continue;
    await listItems.nth(i).click().catch(() => {});
    picked += 1;
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(600);
  const chipCount = await page.locator('.ajab-filter-selections button').count();
  const poetsColor = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.ajab-filter-drawer button')];
    const poets = btns.find((b) => /^Poets$/i.test((b.textContent || '').trim()));
    return poets ? getComputedStyle(poets).color : null;
  });
  console.log('filter chips', { chipCount, poetsColor, picked });
  await shot(page, 'filter-chips.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Notes
  await page.locator('.clp-actions button', { hasText: 'NOTES' }).click();
  await page.waitForTimeout(800);
  const notesMeta = await page.evaluate(() => {
    const pop = document.querySelector('.clp-notes-popup, .wp-popup--anchored');
    if (!pop) return null;
    const r = pop.getBoundingClientRect();
    return {
      left: Math.round(r.left),
      right: Math.round(r.right),
      centerX: Math.round((r.left + r.right) / 2),
      body: (pop.textContent || '').slice(0, 160),
    };
  });
  console.log('notes', notesMeta);
  await shot(page, 'notes.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Listen
  await page.locator('.clp-actions button', { hasText: 'LISTEN' }).click();
  await page.waitForTimeout(1000);
  const listenMeta = await page.evaluate(() => {
    const pop = document.querySelector('.clp-player-popup');
    if (!pop) return null;
    const r = pop.getBoundingClientRect();
    const singers = [...pop.querySelectorAll('li')].map((li) =>
      (li.querySelector('div > div')?.textContent || li.textContent || '').split('\n')[0].trim()
    );
    const unique = new Set(singers.filter(Boolean));
    const progress = !!pop.querySelector('.clp-player-progress');
    const iframe = pop.querySelector('iframe');
    const iframeHidden =
      !iframe ||
      (iframe.offsetWidth <= 2 && iframe.offsetHeight <= 2) ||
      getComputedStyle(iframe).opacity === '0';
    return {
      top: Math.round(r.top),
      right: Math.round(r.right),
      width: Math.round(r.width),
      singers,
      uniqueCount: unique.size,
      progress,
      iframeHidden,
    };
  });
  console.log('listen', JSON.stringify(listenMeta, null, 2));
  await shot(page, 'listen.png');

  await b.close();
  console.log('verify done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
