const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join('comparison-runs', 'poems-ai-audit-2026-08');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:3000/poems', { waitUntil: 'networkidle', timeout: 90000 });
  await p.waitForSelector('.clp-page', { timeout: 60000 });
  await p.waitForTimeout(2500);

  await p.screenshot({ path: path.join(OUT, 'live-top.png'), fullPage: false });
  await p.screenshot({ path: path.join(OUT, 'live-full.png'), fullPage: true });

  // Explore band
  await p.locator('.clp-related, .explore-section').first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(OUT, 'live-explore.png'), fullPage: false });

  // LISTEN if available
  const listen = p.locator('.clp-actions button', { hasText: 'LISTEN' }).first();
  if (await listen.count()) {
    await listen.click().catch(() => {});
    await p.waitForTimeout(1000);
    await p.screenshot({ path: path.join(OUT, 'live-listen.png'), fullPage: false });
  }

  // See All parda
  await p.locator('.clp-see-all').first().click().catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(OUT, 'live-seeall-parda.png'), fullPage: false });

  const metrics = await p.evaluate(() => {
    const measure = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140),
        x: Math.round(r.left),
        y: Math.round(r.top + window.scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
        fontStyle: cs.fontStyle,
        fontWeight: cs.fontWeight,
        color: cs.color,
        lineHeight: cs.lineHeight,
      };
    };

    const map = {};
    const sels = {
      intro: '.clp-intro',
      count: '.clp-count',
      seeAll: '.clp-see-all',
      prev: '.clp-prevnext',
      next: '.clp-prevnext--next',
      poem: '.clp-poem-text',
      poet: '.clp-poem-poet',
      translator: '.clp-translator',
      lang: '.clp-lang-toggle',
      langBtn: '.clp-lang-btn',
      actions: '.clp-actions',
      divider: '.clp-explore-divider',
      explore: '.clp-related.explore-section',
      exploreTitle: '.clp-related .explore-title',
      exploreThemes: '.clp-related .explore-themes',
      exploreItem: '.clp-related .explore-item',
      exploreTitleItem: '.clp-related .explore-itemtitle',
      exploreDesc: '.clp-related .explore-itemdesc',
      exploreFormat: '.clp-related .explore-format',
      exploreSeeMore: '.clp-related .explore-seemore, .clp-related .cld-related-seemore, .explore-seemore',
      filterPanel: '.cl-filter-panel, .listing-filter-panel, [class*="FilterPanel"]',
      listenPanel: '.clp-listen-panel, .clp-player, [class*="listen"]',
    };
    for (const [k, sel] of Object.entries(sels)) map[k] = measure(sel);

    // Filter panel open state
    const openPanels = [...document.querySelectorAll('[class*="filter"], [class*="parda"], [class*="drawer"], aside')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 200 && r.height > 300 && getComputedStyle(el).visibility !== 'hidden';
      })
      .map((el) => ({
        className: String(el.className).slice(0, 120),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
        x: Math.round(el.getBoundingClientRect().left),
        text: (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200),
      }));

    const exploreFormats = [...document.querySelectorAll('.clp-related .explore-format')].map((el) => ({
      text: el.textContent.trim(),
      color: getComputedStyle(el).color,
    }));

    const hasSeeMore = !!document.querySelector(
      '.clp-related .explore-seemore, .clp-related a, .clp-related button'
    );
    const seeMoreCandidates = [...document.querySelectorAll('.clp-related a, .clp-related button')]
      .map((el) => (el.textContent || '').trim())
      .filter((t) => /see more|more/i.test(t));

    return {
      map,
      openPanels: openPanels.slice(0, 8),
      exploreFormats: exploreFormats.slice(0, 6),
      seeMoreCandidates,
      contentW: getComputedStyle(document.querySelector('.clp-page-root-wrap') || document.body).getPropertyValue('--clp-content-w').trim(),
      poemItalic: map.poem?.fontStyle,
      translatorPresent: !!(map.translator && map.translator.text),
      langCount: document.querySelectorAll('.clp-lang-btn').length,
      themeCount: document.querySelectorAll('.clp-related .explore-theme').length,
      itemCount: document.querySelectorAll('.clp-related .explore-item').length,
    };
  });

  fs.writeFileSync(path.join(OUT, 'live-metrics.json'), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
