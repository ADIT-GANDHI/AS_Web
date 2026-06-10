/**
 * Read-only component review for /poems and /poems/[id]
 * Does NOT fail CI — prints human-readable deltas vs Figma ratios
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const OUT = 'Poems_Comparison';
const PLATFORMS = [
  { name: 'desktop-1920', w: 1920, h: 1080 },
  { name: 'laptop-1440', w: 1440, h: 810 },
  { name: 'tablet-1240', w: 1240, h: 697 },
];

const FIGMA_LISTING = {
  introTop: 205 / 4080,
  countTop: 340.85 / 4080,
  seeAllTop: 405.29 / 4080,
  haloTop: 301.09 / 4080,
  chevronTop: 1508 / 4080,
  relatedTop: 1722.01 / 4080,
  defaultRelatedTab: 'SONGS',
};

async function measureListing(page) {
  return page.evaluate((figma) => {
    const artboardH = (innerWidth * 4080) / 1929;
    const r = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const intro = r('.clp-intro');
    const count = r('.clp-count-row');
    const seeall = r('.clp-seeall-row');
    const halo = r('.clp-halo-circle');
    const chevron = r('.clp-next-chevron');
    const related = r('.clp-related');
    const activeTab = document.querySelector('.clp-related-tab.active')?.textContent?.trim();
    const tabs = [...document.querySelectorAll('.clp-related-tab')].map((t) => t.textContent?.trim());
    const glossary = document.querySelector('.glossary-strip, [class*="GlossaryStrip"]');
    const filterBtn = document.querySelector('.clp-seeall-row button, .clp-seeall-row [class*="filter"]');
    const notesVisible = !!document.querySelector('.clp-notes-glossary');
    const langVisible = !!document.querySelector('.clp-lang-toggle');
    const langInView = (() => {
      const el = document.querySelector('.clp-lang-toggle');
      if (!el) return false;
      const b = el.getBoundingClientRect();
      return b.top >= 0 && b.bottom <= innerHeight;
    })();

    const ratio = (top) => (top + scrollY) / artboardH;

    return {
      artboardH: Math.round(artboardH),
      introTopRatio: intro ? +ratio(intro.top).toFixed(3) : null,
      countTopRatio: count ? +ratio(count.top).toFixed(3) : null,
      seeAllTopRatio: seeall ? +ratio(seeall.top).toFixed(3) : null,
      haloTopRatio: halo ? +ratio(halo.top).toFixed(3) : null,
      chevronTopRatio: chevron ? +ratio(chevron.top).toFixed(3) : null,
      relatedTopRatio: related ? +ratio(related.top).toFixed(3) : null,
      figma: figma,
      activeRelatedTab: activeTab,
      relatedTabs: tabs,
      relatedItemCount: document.querySelectorAll('.clp-related-item').length,
      glossaryPresent: !!glossary,
      notesGlossaryRendered: notesVisible,
      langToggleInViewport: langInView,
      langToggleExists: langVisible,
      poemText: document.querySelector('.clp-poem-text')?.textContent?.trim().slice(0, 30),
      countText: document.querySelector('.clp-count')?.textContent?.trim(),
    };
  }, FIGMA_LISTING);
}

async function measureDetail(page, id) {
  await page.goto(`${BASE}/poems/${id}`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const wrap = document.querySelector('.clp-page-root-wrap');
    const halo = document.querySelector('.clp-halo-circle');
    const related = document.querySelector('.clp-related');
    const notFound = document.body.textContent?.includes('Poem not found');
    const cs = wrap ? getComputedStyle(wrap) : null;
    return {
      hasWrap: !!wrap,
      hasHalo: !!halo,
      hasRelated: !!related,
      notFound,
      bg: cs?.backgroundImage.includes('poems-bg') ?? false,
      isDetailClass: document.querySelector('.clp-page--detail') !== null,
      langInsideHalo: (() => {
        const h = halo?.getBoundingClientRect();
        const l = document.querySelector('.clp-lang-toggle')?.getBoundingClientRect();
        return h && l ? l.top >= h.top && l.bottom <= h.bottom + 2 : null;
      })(),
      title: document.querySelector('.clp-count')?.textContent?.trim().slice(0, 40),
    };
  });
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

// discover a valid poem id
await page.goto(`${BASE}/poems`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const poemId = await page.evaluate(() => {
  const link = document.querySelector('a[href^="/poems/"]');
  return link?.getAttribute('href')?.split('/').pop() || null;
});

console.log('Valid poem id for detail check:', poemId);
console.log('\n========== LISTING /poems — component deltas vs Figma ==========\n');

for (const p of PLATFORMS) {
  await page.setViewportSize({ width: p.w, height: p.h });
  await page.goto(`${BASE}/poems`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const m = await measureListing(page);
  await page.screenshot({ path: `${OUT}/review_listing_${p.name}.png`, fullPage: false });

  const deltas = {
    intro: m.introTopRatio !== null ? +(m.introTopRatio - m.figma.introTop).toFixed(3) : null,
    count: m.countTopRatio !== null ? +(m.countTopRatio - m.figma.countTop).toFixed(3) : null,
    seeAll: m.seeAllTopRatio !== null ? +(m.seeAllTopRatio - m.figma.seeAllTop).toFixed(3) : null,
    halo: m.haloTopRatio !== null ? +(m.haloTopRatio - m.figma.haloTop).toFixed(3) : null,
    chevron: m.chevronTopRatio !== null ? +(m.chevronTopRatio - m.figma.chevronTop).toFixed(3) : null,
    related: m.relatedTopRatio !== null ? +(m.relatedTopRatio - m.figma.relatedTop).toFixed(3) : null,
  };

  console.log(`--- ${p.name} (${p.w}x${p.h}) ---`);
  console.log('  Intro top ratio     ', m.introTopRatio, 'figma', m.figma.introTop, 'delta', deltas.intro);
  console.log('  Count row ratio     ', m.countTopRatio, 'figma', m.figma.countTop, 'delta', deltas.count);
  console.log('  See-all row ratio   ', m.seeAllTopRatio, 'figma', m.figma.seeAllTop, 'delta', deltas.seeAll);
  console.log('  Halo top ratio      ', m.haloTopRatio, 'figma', m.figma.haloTop, 'delta', deltas.halo);
  console.log('  Chevron ratio       ', m.chevronTopRatio, 'figma', m.figma.chevronTop, 'delta', deltas.chevron);
  console.log('  Related ratio       ', m.relatedTopRatio, 'figma', m.figma.relatedTop, 'delta', deltas.related);
  console.log('  Active related tab  ', m.activeRelatedTab, '(figma default: SONGS)');
  console.log('  Related items shown ', m.relatedItemCount);
  console.log('  Lang in viewport    ', m.langToggleInViewport, '| notes/glossary row', m.notesGlossaryRendered);
  console.log('');
}

console.log('\n========== DETAIL /poems/[id] ==========\n');
if (poemId) {
  for (const p of PLATFORMS) {
    await page.setViewportSize({ width: p.w, height: p.h });
    const d = await measureDetail(page, poemId);
    if (p.name === 'desktop-1920') {
      await page.screenshot({ path: `${OUT}/review_detail_${p.name}.png`, fullPage: false });
    }
    console.log(`--- ${p.name} ---`, JSON.stringify(d));
  }
} else {
  console.log('No poem id found — detail page not audited');
}

await browser.close();
