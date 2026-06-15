/**
 * Programmatic PDF-alignment audit for all comparison-script routes + gaps.
 * Usage: node scripts/pdf-ui-audit-all.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const VIEWPORT = { width: 1440, height: 900 };

const findings = [];
const passes = [];

function pass(id, msg) {
  passes.push({ id, msg });
}
function fail(id, msg) {
  findings.push({ id, severity: 'fail', msg });
}
function warn(id, msg) {
  findings.push({ id, severity: 'warn', msg });
}

async function dismissNewsPopup(page) {
  const close = page.locator('.npc-close');
  if ((await close.count()) && (await close.first().isVisible())) {
    await close.first().click();
    await page.waitForTimeout(400);
  }
}

async function openFilterSelectFirst(page) {
  await page.getByRole('button', { name: /^Filters$/i }).click();
  await page.waitForSelector('button[aria-label="Close filters"]', { timeout: 30000 });
  const first = page.locator("div[style*='z-index: 9999'] li").first();
  if (await first.count()) await first.click({ force: true });
  await page.waitForTimeout(300);
  await page.getByLabel('Close filters').click();
  await page.waitForTimeout(400);
}

async function auditListingNoChips(page, name) {
  await openFilterSelectFirst(page);
  const chips = await page.locator('.cl-active-chips-bar, .cl-active-chip').count();
  if (chips === 0) pass(`${name}-no-chips`, `${name}: no on-page filter chip strip (PDF)`);
  else fail(`${name}-no-chips`, `${name}: ${chips} chip element(s) visible — not in PDF`);
}

const routes = [
  {
    id: 'home',
    path: '/',
    comparison: 'Home/1_Home',
    async check(page) {
      await dismissNewsPopup(page);
      const cards = await page.locator('.clh-card-row').count();
      if (cards >= 5) pass('home-cards', 'Home: 5 hero cards present');
      else warn('home-cards', `Home: only ${cards} hero cards`);
      const popupAuto = await page.locator('.npc-overlay').count();
      if (popupAuto > 0) warn('home-popup-auto', 'Home: news popup open on load (PDF shows content first)');
    },
  },
  {
    id: 'songs-listing',
    path: '/songs',
    comparison: 'Songs/1_Songs_Listing, Songs/2_Filter_Panel',
    async check(page) {
      await page.waitForSelector('.cl-songs-page', { timeout: 60000 });
      await page.waitForFunction(
        () => !document.querySelector('.loader-overlay'),
        { timeout: 120000 }
      );
      await auditListingNoChips(page, 'Songs');
      const cardW = await page
        .locator('.cl-song-grid-item')
        .first()
        .evaluate((el) => Math.round(el.getBoundingClientRect().width))
        .catch(() => null);
      if (cardW && cardW < 250) warn('songs-card-width', `Songs: card ~${cardW}px (PDF spec ~280px)`);
      else if (cardW) pass('songs-card-width', `Songs: card width ${cardW}px`);
    },
  },
  {
    id: 'song-detail',
    path: '/songs/details/260',
    comparison: 'Songs/3_Song_Details',
    async check(page) {
      await page.waitForSelector('.cld-page', { timeout: 180000 }).catch(() => {});
      const notFound = await page.locator('text=Song not found').count();
      if (notFound) {
        warn('song-detail-id', 'Song 260 not found — comparison uses 260; pick valid id');
        return;
      }
      const scrollBox = await page.locator('.cld-description-scroll').count();
      if (scrollBox === 0) pass('song-about-no-scroll', 'Song detail: no inner about scroll box');
      else fail('song-about-no-scroll', 'Song detail: inner scroll box still present');
      const moreBtn = await page.locator('.cld-description-more').count();
      if (moreBtn > 0) pass('song-about-more', 'Song detail: ...more clamp present');
      const junkKw = await page.locator('.cld-keyword-tag:has-text("asdasd")').count();
      if (junkKw === 0) pass('song-keywords-clean', 'Song detail: test keywords hidden');
      else warn('song-keywords-clean', 'Song detail: junk keyword still visible');
    },
  },
  {
    id: 'poems-listing',
    path: '/poems',
    comparison: 'Poems/* (4 screens)',
    async check(page) {
      await page.waitForSelector('.clp-page', { timeout: 120000 });
      const fontSize = await page
        .locator('.clp-poem-text')
        .first()
        .evaluate((el) => getComputedStyle(el).fontSize)
        .catch(() => null);
      if (fontSize === '19px') pass('poems-font', 'Poems: 19px circle text');
      else warn('poems-font', `Poems: font-size ${fontSize} (PDF 19px)`);
    },
  },
  {
    id: 'reflections-listing',
    path: '/reflections',
    comparison: 'Reflections/1,2,3',
    async check(page) {
      await page.waitForSelector('.clr-page', { timeout: 120000 });
      await auditListingNoChips(page, 'Reflections');
    },
  },
  {
    id: 'reflection-detail',
    path: '/reflections/details/3',
    comparison: 'Reflections/4_Reflection_Detail_Scroll',
    async check(page) {
      await page.waitForSelector('.clrd-page', { timeout: 120000 });
      const says = await page.locator('.clrd-page').textContent();
      if (says && !/says KABIR\b/i.test(says)) pass('reflection-speaker', 'Reflection detail: speaker not hardcoded KABIR');
      else if (says) warn('reflection-speaker', 'Reflection detail: still shows "says KABIR"');
    },
  },
  {
    id: 'people-listing',
    path: '/people',
    comparison: 'People/1,2',
    async check(page) {
      await page.waitForSelector('.clpe-page', { timeout: 120000 });
      await auditListingNoChips(page, 'People');
      const links = await page.locator('.clpe-entry a[href^="/people/"]').count();
      const entries = await page.locator('.clpe-entry').count();
      if (links === entries && entries > 0) pass('people-links', 'People: cards are crawlable links');
    },
  },
  {
    id: 'people-detail',
    path: '/people/94',
    comparison: 'People/3_Person_Detail',
    async check(page) {
      await page.waitForSelector('.clped-page', { timeout: 120000 }).catch(() => {});
    },
  },
  {
    id: 'films-listing',
    path: '/films',
    comparison: 'Films/1_Films_Listing',
    async check(page) {
      await page.waitForSelector('.clf-page, .cl-songs-page', { timeout: 120000 }).catch(() => {});
      const series = await page.locator('.clf-series-title').allTextContents();
      if (series.length >= 2 && /Journeys with Kabir/i.test(series[0])) {
        pass('films-order', 'Films: Journeys with Kabir first');
      }
    },
  },
  {
    id: 'film-detail',
    path: '/films/details/13',
    comparison: 'Films/2–4',
    async check(page) {
      await page.waitForSelector('.clfd-page', { timeout: 120000 });
    },
  },
  {
    id: 'about',
    path: '/about?tab=ajab&menu=intro',
    comparison: 'About/1_Intro',
    async check(page) {
      await page.waitForSelector('.about-page-root', { timeout: 60000 });
    },
  },
  {
    id: 'glossary',
    path: '/glossary',
    comparison: 'Glossary/1',
    async check(page) {
      await page.waitForSelector('.glossary-container', { timeout: 60000 });
      const terms = await page.locator('.glossary-item').count();
      if (terms >= 5) pass('glossary-terms', `Glossary: ${terms} terms (mock or API)`);
    },
  },
  {
    id: 'ajab-news',
    path: '/ajab-news',
    comparison: 'Home/3_Ajab_News',
    async check(page) {
      await page.waitForSelector('.cl-news-page', { timeout: 60000 });
    },
  },
  {
    id: 'search',
    path: '/searche?search=farid',
    comparison: 'Home/6_Search_Results',
    async check(page) {
      await page.waitForSelector('.cl-search-page-root', { timeout: 60000 });
    },
  },
  {
    id: 'radio',
    path: '/radio?view=playlists',
    comparison: 'Radio/2_Radio_Viewport',
    async check(page) {
      await page.waitForSelector('.radio-playlists-list', { timeout: 60000 });
    },
  },
  {
    id: 'header-about',
    path: '/songs',
    comparison: '(global — all pages)',
    async check(page) {
      await page.waitForSelector('header', { timeout: 30000 });
      const aboutClass = await page.locator('header a.about-text, header .nav-link--about').count();
      const navLink = await page.locator('header .nav-link--about').count();
      if (navLink > 0) pass('header-about-style', 'Header ABOUT uses nav-link styling');
      else if (aboutClass > 0) warn('header-about-style', 'Header ABOUT still uses about-text class');
      const dropdown = await page.locator('header .nav-link--about').count();
      if (dropdown > 0) pass('header-about-link', 'Header ABOUT link present');
    },
  },
  /** Not captured by comparison script */
  {
    id: 'poem-detail',
    path: '/poems/p1',
    comparison: 'NOT IN COMPARISON SCRIPT',
    async check(page) {
      await page.waitForSelector('.clpd-page, .clp-detail-page', { timeout: 120000 }).catch(() => {});
      const nf = await page.locator('text=Poem not found').count();
      if (nf) warn('poem-detail-route', 'Poem detail /poems/p1 — verify id; no PDF comparison screen');
    },
  },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: VIEWPORT });

console.log(`PDF UI audit — ${BASE}\n`);

for (const route of routes) {
  const url = `${BASE}${route.path}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);
    await route.check(page);
    console.log(`✓ checked ${route.id} (${route.comparison})`);
  } catch (err) {
    fail(`${route.id}-error`, `${route.id}: ${String(err.message || err).slice(0, 120)}`);
    console.log(`✗ ${route.id}: ${err.message}`);
  }
}

await browser.close();

console.log(`\n=== PASS (${passes.length}) ===`);
passes.forEach((p) => console.log(`  [${p.id}] ${p.msg}`));

console.log(`\n=== FINDINGS (${findings.length}) ===`);
findings.forEach((f) => console.log(`  [${f.severity}] ${f.id}: ${f.msg}`));

console.log('\n=== Manual review (open Comparison_Out/index.html) ===');
[
  'Poem detail /poems/[id] — no comparison PNG in pack',
  'Home news popup auto-open — compare Home/1 vs popup behaviour',
  'Song card width ~209px vs PDF 280px — see Songs/1 listing PNG',
].forEach((s) => console.log(`  • ${s}`));

process.exit(findings.filter((f) => f.severity === 'fail').length > 0 ? 1 : 0);
