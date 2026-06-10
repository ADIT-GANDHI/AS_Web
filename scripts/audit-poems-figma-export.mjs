/**
 * Audit poems in static out/ export — layout + fonts vs Figma 362:3254
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'out');
const BASE = '/new';
const PORT = 4180;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  if (!urlPath.startsWith(BASE)) return null;
  let rel = decodeURIComponent(urlPath.slice(BASE.length));
  if (!rel || rel === '/') rel = '/index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  if (!path.extname(rel)) rel += '.html';
  const file = path.join(OUT, rel.replace(/^\//, '').replace(/\//g, path.sep));
  return fs.existsSync(file) ? file : null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url?.split('?')[0] ?? '');
  if (!file) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((r) => server.listen(PORT, r));
const BASE_URL = `http://127.0.0.1:${PORT}${BASE}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

async function auditPage(url, isDetail) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.clp-page-root-wrap', { timeout: 30000 });
  await page.waitForTimeout(1500);

  return page.evaluate(({ isDetail }) => {
    const artboardH = (innerWidth * 4080) / 1929;
    const targetHaloTop = artboardH * (301.09 / 4080);
    const wrap = document.querySelector('.clp-page-root-wrap');
    const halo = document.querySelector('.clp-halo-circle');
    const hr = halo?.getBoundingClientRect();
    const wr = wrap?.getBoundingClientRect();
    const wrapCs = wrap ? getComputedStyle(wrap) : null;

    const fontOf = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        family: s.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
        style: s.fontStyle,
        weight: s.fontWeight,
        size: Math.round(parseFloat(s.fontSize)),
        color: s.color,
      };
    };

    const ratio = (el) => {
      const r = el?.getBoundingClientRect();
      return r ? +((r.top + scrollY) / artboardH).toFixed(3) : null;
    };

    return {
      isDetail,
      wrapBg: wrapCs?.backgroundImage.includes('poems-bg') ?? false,
      haloTopPx: hr?.top ?? null,
      haloTopDelta: hr ? Math.round(Math.abs(hr.top - targetHaloTop)) : null,
      haloSizeRatio: hr ? +(hr.width / innerWidth).toFixed(3) : null,
      introRatio: ratio(document.querySelector('.clp-intro')),
      chevronRatio: ratio(document.querySelector('.clp-next-chevron')),
      relatedRatio: ratio(document.querySelector('.clp-related')),
      langInHalo: (() => {
        const l = document.querySelector('.clp-lang-toggle')?.getBoundingClientRect();
        return hr && l ? l.top >= hr.top && l.bottom <= hr.bottom + 4 : null;
      })(),
      fonts: {
        intro: fontOf('.clp-intro'),
        count: fontOf('.clp-count'),
        seeAll: fontOf('.clp-seeall'),
        poemText: fontOf('.clp-poem-text'),
        poet: fontOf('.clp-poem-poet'),
        notesGlossary: fontOf('.clp-notes-glossary'),
        relatedTitle: fontOf('.clp-related-title'),
        relatedTab: fontOf('.clp-related-tab'),
        relatedItemTitle: fontOf('.clp-related-itemtitle'),
        relatedItemDesc: fontOf('.clp-related-itemdesc'),
        seeMore: fontOf('.clp-related-seemore'),
      },
      langBtn: (() => {
        const b = document.querySelector('.clp-lang-btn')?.getBoundingClientRect();
        return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null;
      })(),
      audioBtn: (() => {
        const b = document.querySelector('.clp-audio-btn')?.getBoundingClientRect();
        return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null;
      })(),
      relatedItems: document.querySelectorAll('.clp-related-item').length,
      hasNotesGlossary: !!document.querySelector('.clp-notes-glossary'),
    };
  }, { isDetail });
}

const listing = await auditPage(`${BASE_URL}/poems`, false);
const detail = await auditPage(`${BASE_URL}/poems/1`, true);

await browser.close();
server.close();

const FIGMA = {
  fonts: {
    intro: { family: 'Lora', style: 'italic', weight: '400', size: 20 },
    count: { family: 'Lora', style: 'normal', weight: '400', size: 27 },
    seeAll: { family: 'Merriweather Sans', weight: '400', size: 21 },
    poemText: { family: 'Lora', style: 'italic', weight: '400', size: 28 },
    poet: { family: 'Merriweather Sans', weight: '300', size: 18 },
    notesGlossary: { family: 'Merriweather Sans', weight: '300', size: 18 },
    relatedTitle: { family: 'Lora', weight: '400', size: 30 },
    relatedTab: { family: 'Merriweather Sans', weight: '300', size: 22 },
    relatedItemTitle: { family: 'Lora', weight: '400', size: 26 },
    relatedItemDesc: { family: 'Merriweather Sans', weight: '300', size: 18 },
    seeMore: { family: 'Merriweather Sans', weight: '400', size: 20 },
  },
  layout: {
    haloTopDeltaMax: 8,
    haloSizeRatio: 0.679,
    introTop: 0.05,
    chevronTop: 0.37,
    relatedTop: 0.422,
    langBtn: 55,
    audioBtnListing: 113,
  },
};

function checkFont(actual, exp, label) {
  const issues = [];
  if (!actual) return [`${label}: missing`];
  if (!actual.family.toLowerCase().includes(exp.family.toLowerCase().split(' ')[0])) {
    issues.push(`${label}: font ${actual.family} ${actual.style} ${actual.weight} ${actual.size}px — want ${exp.family} ${exp.style || 'normal'} ${exp.weight} ${exp.size}px`);
  } else if (exp.style === 'italic' && actual.style !== 'italic') {
    issues.push(`${label}: should be italic (${actual.size}px)`);
  } else if (Math.abs(actual.size - exp.size) > 1) {
    issues.push(`${label}: ${actual.size}px — want ${exp.size}px (${exp.family} ${exp.weight})`);
  } else if (Math.abs(parseInt(actual.weight, 10) - parseInt(exp.weight, 10)) > 50) {
    issues.push(`${label}: weight ${actual.weight} — want ${exp.weight}`);
  }
  return issues;
}

console.log('\n======== POEMS AUDIT (static out/ @ 1920×1080) ========\n');

console.log('--- LISTING /poems ---');
console.log('Layout:', {
  wrapBg: listing.wrapBg,
  haloTopDelta: listing.haloTopDelta,
  haloSizeRatio: listing.haloSizeRatio,
  introRatio: listing.introRatio,
  chevronRatio: listing.chevronRatio,
  relatedRatio: listing.relatedRatio,
  langInHalo: listing.langInHalo,
  langBtn: listing.langBtn,
  audioBtn: listing.audioBtn,
});

const listingLayoutIssues = [];
if (!listing.wrapBg) listingLayoutIssues.push('Background poems-bg not applied');
if ((listing.haloTopDelta ?? 99) > FIGMA.layout.haloTopDeltaMax) listingLayoutIssues.push(`Halo top off by ${listing.haloTopDelta}px (want ≤${FIGMA.layout.haloTopDeltaMax})`);
if (Math.abs((listing.haloSizeRatio ?? 0) - FIGMA.layout.haloSizeRatio) > 0.02) listingLayoutIssues.push(`Halo width ratio ${listing.haloSizeRatio} (want ${FIGMA.layout.haloSizeRatio})`);
if (Math.abs((listing.introRatio ?? 0) - FIGMA.layout.introTop) > 0.03) listingLayoutIssues.push(`Intro stack low/high by ${Math.round(((listing.introRatio ?? 0) - FIGMA.layout.introTop) * 1000) / 10}% vs Figma`);
if (Math.abs((listing.chevronRatio ?? 0) - FIGMA.layout.chevronTop) > 0.025) listingLayoutIssues.push(`Chevron at ${listing.chevronRatio} (Figma ${FIGMA.layout.chevronTop})`);
if (Math.abs((listing.relatedRatio ?? 0) - FIGMA.layout.relatedTop) > 0.025) listingLayoutIssues.push(`Related at ${listing.relatedRatio} (Figma ${FIGMA.layout.relatedTop})`);
if (listing.langBtn?.w !== 55) listingLayoutIssues.push(`Lang buttons ${listing.langBtn?.w}px (want 55px)`);
if ((listing.audioBtn?.w ?? 0) < 100) listingLayoutIssues.push(`Audio button ${listing.audioBtn?.w}px (want ~113px)`);

const listingFontIssues = [];
for (const [k, exp] of Object.entries(FIGMA.fonts)) {
  listingFontIssues.push(...checkFont(listing.fonts[k], exp, k));
}

console.log('\nListing fonts (computed):');
console.log(JSON.stringify(listing.fonts, null, 2));

console.log('\n--- DETAIL /poems/1 ---');
console.log('Layout:', {
  haloTopDelta: detail.haloTopDelta,
  haloSizeRatio: detail.haloSizeRatio,
  langInHalo: detail.langInHalo,
  audioBtn: detail.audioBtn,
  relatedItems: detail.relatedItems,
});
console.log('\nDetail fonts (computed):');
console.log(JSON.stringify(detail.fonts, null, 2));

const detailIssues = [];
if (detail.fonts.poemText && detail.fonts.poemText.size !== 28) {
  detailIssues.push(`Poem body ${detail.fonts.poemText.size}px italic — Figma listing uses Lora Italic 28px; detail CSS intentionally uses 19px (PDF compact)`);
}
if (detail.fonts.poet && detail.fonts.poet.size !== 18) {
  detailIssues.push(`Poet line ${detail.fonts.poet.size}px — Figma 18px Light; detail uses 16px`);
}
if (detail.fonts.count && detail.fonts.count.size !== 27) {
  detailIssues.push(`Title ${detail.fonts.count.size}px weight ${detail.fonts.count.weight} — Figma count is Lora Regular 27px; detail uses 20px Light italic`);
}
if ((detail.audioBtn?.w ?? 0) < 100) {
  detailIssues.push(`Audio button ${detail.audioBtn?.w}px — listing/Figma ~113px; detail uses 56px`);
}

console.log('\n======== SUMMARY ========\n');
if (listingLayoutIssues.length) {
  console.log('Listing layout gaps:');
  listingLayoutIssues.forEach((i) => console.log('  ⚠', i));
} else console.log('Listing layout: ✓ aligned at 1920×1080');

if (listingFontIssues.length) {
  console.log('\nListing font gaps:');
  listingFontIssues.filter((i) => !i.includes('missing')).forEach((i) => console.log('  ⚠', i));
  listingFontIssues.filter((i) => i.includes('missing')).forEach((i) => console.log('  ·', i));
} else console.log('Listing fonts: ✓ match Figma weight/style/size');

if (detailIssues.length) {
  console.log('\nDetail page vs Figma (mostly intentional overrides):');
  detailIssues.forEach((i) => console.log('  ⚠', i));
}

console.log('');
