/**
 * Cross-check client fixes on local dev and/or production frontend.
 * Usage: node scripts/cross-check-live.mjs [baseUrl]
 * Default bases: http://localhost:3000 and https://ajab.damnetworks.com/new
 */
import { chromium } from 'playwright';

const bases = process.argv[2]
  ? [process.argv[2].replace(/\/$/, '')]
  : ['http://localhost:3000', 'https://ajab.damnetworks.com/new'];

const checks = [];

async function probe(base) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1536, height: 900 } });
  const row = { base, pages: {} };

  const go = async (path, name, fn) => {
    const url = `${base}${path}`;
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2500);
      const status = res?.status() ?? 0;
      const result = await fn(page);
      row.pages[name] = { url, status, ok: status < 400, ...result };
    } catch (err) {
      row.pages[name] = { url, ok: false, error: String(err.message || err).slice(0, 200) };
    }
  };

  await go('/reflections', 'reflections', async (p) => {
    const filtersPink = await p.locator('.cl-filter-trigger-wrap button').first().evaluate((el) => {
      const c = getComputedStyle(el).color;
      return c.includes('227') || c.includes('225') || c.toLowerCase().includes('rgb(227');
    });
    const allIdle = await p.locator('.cl-az-btn--all-idle').count();
    const grid = await p.locator('.cl-song-grid-item').count();
    const thumbH = await p.locator('.clr-card .wc-thumb').first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return Math.round(r.height);
    }).catch(() => null);
    return { filtersPink, allIdleGrey: allIdle > 0, cards: grid, thumbHeightPx: thumbH };
  });

  await go('/reflections/details/63', 'reflectionDetail', async (p) => {
    const hasBody = (await p.locator('.clrd-page, .clr-detail').count()) > 0;
    const keywords = await p.locator('.cld-keyword-tag').count();
    const notFound = await p.locator('text=Reflection not found').count();
    return { hasBody, keywordLinks: keywords, notFound: notFound > 0 };
  });

  await go('/people', 'people', async (p) => {
    const filtersPink = await p.locator('.cl-filter-trigger-wrap button').first().evaluate((el) => {
      const c = getComputedStyle(el).color;
      return c.includes('227') || c.includes('225');
    }).catch(() => false);
    const entries = await p.locator('.clpe-entry').count();
    return { filtersPink, entries };
  });

  await go('/films/details/38', 'filmDetail', async (p) => {
    const langToggle = await p.locator('.film-lang-toggle').count();
    const langJustify = await p.locator('.film-lang-toggle').first().evaluate((el) => getComputedStyle(el).justifyContent).catch(() => null);
    const episodesTab = await p.locator('button:has-text("Episodes")').count();
    const related = await p.locator('.clfd-page .cld-related').first().boundingBox().catch(() => null);
    const content = await p.locator('.clfd-content').first().boundingBox().catch(() => null);
    const aligned =
      related && content ? Math.abs(related.x - content.x) < 8 : null;
    return { langToggle, langJustify, episodesTab, relatedAlignedToContent: aligned };
  });

  await go('/about?tab=ajab', 'about', async (p) => {
    const hasAbout = (await p.locator('.about-page-root, .glossary-page-root, [class*="about"]').count()) > 0;
    const loading = await p.locator('text=Loading about').count();
    const err = await p.locator('text=Error loading').count();
    return { hasAboutShell: hasAbout, loading: loading > 0, error: err > 0 };
  });

  await go('/glossary', 'glossary', async (p) => {
    const allActive = await p.locator('.cl-az-btn--all.active').count();
    const items = await p.locator('.glossary-item').count();
    const gridCols = await p.locator('.glossary-item-title').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns).catch(() => null);
    return { allButtonActive: allActive > 0, termCount: items, titleGrid: gridCols };
  });

  await go('/poems', 'poems', async (p) => {
    const audioBtn = await p.locator('.clp-audio-btn').first().boundingBox().catch(() => null);
    const chevronsDown = await p.locator('.clp-next-chevron').count();
    await p.locator('.clp-seeall').click({ timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(800);
    const catalog = await p.locator('.clp-poem-catalog').count();
    const catalogItems = await p.locator('.clp-poem-catalog-item').count();
    return {
      audioBtnPx: audioBtn ? Math.round(audioBtn.width) : null,
      chevronsDownRemoved: chevronsDown === 0,
      catalogVisible: catalog > 0,
      catalogItems,
    };
  });

  await go('/songs/details/260', 'songDetail', async (p) => {
    const keywords = await p.locator('.cld-keyword-tag').count();
    return { keywordLinks: keywords };
  });

  await go('/searche?search=love', 'search', async (p) => {
    const results = await p.locator('.search-results, [class*="search"]').count();
    return { hasSearchShell: results > 0 };
  });

  await browser.close();
  checks.push(row);
}

for (const base of bases) {
  console.log(`\n=== Probing ${base} ===`);
  try {
    await probe(base);
    const row = checks[checks.length - 1];
    console.log(JSON.stringify(row, null, 2));
  } catch (e) {
    console.error(`Failed ${base}:`, e.message);
  }
}
