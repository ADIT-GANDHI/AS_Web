const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join('comparison-runs', 'films-ai-vs-live-1440', 'live');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const metrics = {};

  await page.goto('http://localhost:3000/films', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.clf-page', { timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, '01-listing-top.png') });
  await page.screenshot({ path: path.join(OUT, '01-listing-full.png'), fullPage: true });
  metrics.listing = await page.evaluate(() => {
    const series = document.querySelector('.clf-series');
    const thumb = document.querySelector('.clf-entry-thumb');
    const title = document.querySelector('.clf-entry-title');
    const subtitle = document.querySelector('.clf-entry-subtitle');
    const director = document.querySelector('.clf-entry-director-name');
    const meta = document.querySelector('.clf-entry-meta');
    const links = document.querySelector('.clf-entry-links')?.textContent?.replace(/\s+/g,' ').trim();
    const intro = document.querySelector('.clf-series-intro');
    const count = document.querySelector('.clf-count');
    const r = (el) => el && (() => { const b = el.getBoundingClientRect(); return { L: Math.round(b.left), W: Math.round(b.width), H: Math.round(b.height) }; })();
    return {
      count: count?.textContent?.trim(),
      seriesTitles: [...document.querySelectorAll('.clf-series-title')].map(e => e.textContent.trim()),
      seriesW: r(series),
      thumb: r(thumb),
      thumbPad: thumb && getComputedStyle(thumb).padding,
      titleColor: title && getComputedStyle(title).color,
      titleSize: title && getComputedStyle(title).fontSize,
      subtitleColor: subtitle && getComputedStyle(subtitle).color,
      directorColor: director && getComputedStyle(director).color,
      metaText: meta?.textContent?.trim(),
      links,
      introSample: intro?.textContent?.trim()?.slice(0, 80),
      hasPageIntro: !!document.querySelector('.clf-page-intro, .clf-intro'),
      filmSeriesLabel: [...document.querySelectorAll('.clf-series')].some(s => /FILM SERIES/i.test(s.textContent||'')),
    };
  });

  await page.locator('.clf-entry-thumb').first().click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, '02-trailer-popup.png') });
  metrics.popup = await page.evaluate(() => {
    const frame = document.querySelector('.cfp-frame');
    const overlay = document.querySelector('.cfp-overlay');
    const close = document.querySelector('.cfp-close');
    const iframe = document.querySelector('.cfp-iframe');
    const fr = frame?.getBoundingClientRect();
    return {
      open: !!overlay,
      frameW: fr && Math.round(fr.width),
      frameH: fr && Math.round(fr.height),
      closeColor: close && getComputedStyle(close).color,
      overlayBg: overlay && getComputedStyle(overlay).backgroundColor,
      src: iframe?.getAttribute('src')?.slice(0, 70),
    };
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.goto('http://localhost:3000/films/details/2', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.clfd-page', { timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, '03-detail-top.png') });
  await page.screenshot({ path: path.join(OUT, '03-detail-full.png'), fullPage: true });
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '03-detail-mid.png') });
  metrics.detail = await page.evaluate(() => {
    const content = document.querySelector('.clfd-content');
    const video = document.querySelector('.clfd-video-wrap');
    const title = document.querySelector('.clfd-header-title');
    const sub = document.querySelector('.clfd-header-subtitle');
    const by = document.querySelector('.clfd-header-byline');
    const year = document.querySelector('.clfd-header-year');
    const mode = document.querySelector('.clfd-mode-row')?.textContent?.replace(/\s+/g,' ').trim();
    const langs = document.querySelector('.clfd-lang-toggle, .film-lang-toggle')?.textContent?.replace(/\s+/g,' ').trim();
    const related = document.querySelector('.cld-related, .clfd-page .cld-related');
    const gloss = document.querySelector('.gs-strip, .clfd-glossary-strip');
    const r = (el) => el && (() => { const b = el.getBoundingClientRect(); return { L: Math.round(b.left), W: Math.round(b.width), T: Math.round(b.top) }; })();
    return {
      content: r(content),
      video: r(video),
      title: title?.textContent?.trim(),
      titleColor: title && getComputedStyle(title).color,
      subtitle: sub?.textContent?.trim(),
      byline: by?.textContent?.replace(/\s+/g,' ').trim(),
      year: year?.textContent?.trim(),
      mode,
      langs,
      hasRelated: !!related,
      hasGlossary: !!gloss,
      relatedTitle: related?.querySelector('.cld-related-title, .explore-title')?.textContent?.trim(),
    };
  });

  fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
