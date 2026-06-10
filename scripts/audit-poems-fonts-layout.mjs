/**
 * Audit poems listing + detail: layout ratios and computed fonts vs Figma 362:3254
 */
import { chromium } from 'playwright';

const BASE = process.env.SITE_BASE || 'http://localhost:3000';

const FIGMA_FONTS = {
  intro: { family: 'Lora', style: 'italic', weight: '400', size: 20 },
  count: { family: 'Lora', style: 'normal', weight: '400', size: 27 },
  seeAll: { family: 'Merriweather Sans', style: 'normal', weight: '400', size: 21 },
  poemText: { family: 'Lora', style: 'italic', weight: '400', size: 28 },
  poet: { family: 'Merriweather Sans', style: 'normal', weight: '300', size: 18 },
  notesGlossary: { family: 'Merriweather Sans', style: 'normal', weight: '300', size: 18 },
  relatedTitle: { family: 'Lora', style: 'normal', weight: '400', size: 30 },
  relatedTab: { family: 'Merriweather Sans', style: 'normal', weight: '300', size: 22 },
  relatedItemTitle: { family: 'Lora', style: 'normal', weight: '400', size: 26 },
  relatedItemDesc: { family: 'Merriweather Sans', style: 'normal', weight: '300', size: 18 },
  seeMore: { family: 'Merriweather Sans', style: 'normal', weight: '400', size: 20 },
};

function fontStyle(cs) {
  return {
    family: cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
    style: cs.fontStyle,
    weight: cs.fontWeight,
    size: Math.round(parseFloat(cs.fontSize)),
  };
}

function matchFont(actual, expected, label) {
  const issues = [];
  if (!actual.family.toLowerCase().includes(expected.family.toLowerCase().split(' ')[0])) {
    issues.push(`${label}: family got "${actual.family}" want "${expected.family}"`);
  }
  if (expected.style === 'italic' && actual.style !== 'italic') {
    issues.push(`${label}: style got "${actual.style}" want italic`);
  }
  if (expected.style === 'normal' && actual.style === 'italic') {
    issues.push(`${label}: style unexpectedly italic`);
  }
  const w = parseInt(actual.weight, 10);
  const ew = parseInt(expected.weight, 10);
  if (Math.abs(w - ew) > 50) {
    issues.push(`${label}: weight got ${actual.weight} want ${expected.weight}`);
  }
  if (Math.abs(actual.size - expected.size) > 1) {
    issues.push(`${label}: size got ${actual.size}px want ${expected.size}px`);
  }
  return issues;
}

async function measureFonts(page) {
  return page.evaluate(() => {
    const cs = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        family: s.fontFamily.split(',')[0].replace(/['"]/g, '').trim(),
        style: s.fontStyle,
        weight: s.fontWeight,
        size: Math.round(parseFloat(s.fontSize)),
      };
    };
    return {
      intro: cs('.clp-intro'),
      count: cs('.clp-count'),
      seeAll: cs('.clp-seeall'),
      poemText: cs('.clp-poem-text'),
      poet: cs('.clp-poem-poet'),
      notesGlossary: cs('.clp-notes-glossary'),
      relatedTitle: cs('.clp-related-title'),
      relatedTab: cs('.clp-related-tab'),
      relatedItemTitle: cs('.clp-related-itemtitle'),
      relatedItemDesc: cs('.clp-related-itemdesc'),
      seeMore: cs('.clp-related-seemore'),
      langBtn: cs('.clp-lang-btn'),
      langBtnSize: (() => {
        const b = document.querySelector('.clp-lang-btn')?.getBoundingClientRect();
        return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null;
      })(),
      audioBtn: (() => {
        const b = document.querySelector('.clp-audio-btn')?.getBoundingClientRect();
        return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null;
      })(),
      isDetail: !!document.querySelector('.clp-page--detail'),
    };
  });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

console.log('\n=== POEMS LISTING — fonts & layout @ 1920×1080 ===\n');
await page.goto(`${BASE}/poems`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.clp-page-root-wrap', { timeout: 15000 });
const listingFonts = await measureFonts(page);

const listingIssues = [];
for (const [key, exp] of Object.entries(FIGMA_FONTS)) {
  const actual = listingFonts[key];
  if (!actual) {
    listingIssues.push(`${key}: element missing`);
    continue;
  }
  listingIssues.push(...matchFont(actual, exp, key));
}
if (listingFonts.langBtnSize?.w !== 55) {
  listingIssues.push(`langBtn: size ${listingFonts.langBtnSize?.w}×${listingFonts.langBtnSize?.h} want 55×55`);
}
if (listingFonts.audioBtn?.w < 100) {
  listingIssues.push(`audioBtn: size ${listingFonts.audioBtn?.w}×${listingFonts.audioBtn?.h} want ~113×113`);
}

const layout = await page.evaluate(() => {
  const artboardH = (innerWidth * 4080) / 1929;
  const ratio = (el) => {
    const r = el?.getBoundingClientRect();
    return r ? +((r.top + scrollY) / artboardH).toFixed(3) : null;
  };
  const halo = document.querySelector('.clp-halo-circle');
  const hr = halo?.getBoundingClientRect();
  return {
    haloTop: ratio(halo),
    haloWidthRatio: hr ? +(hr.width / innerWidth).toFixed(3) : null,
    introTop: ratio(document.querySelector('.clp-intro')),
    relatedTop: ratio(document.querySelector('.clp-related')),
    chevronTop: ratio(document.querySelector('.clp-next-chevron')),
    langInViewport: (() => {
      const l = document.querySelector('.clp-lang-toggle')?.getBoundingClientRect();
      return l ? l.bottom <= innerHeight : false;
    })(),
  };
});

console.log('Computed fonts (listing):');
console.log(JSON.stringify(listingFonts, null, 2));
console.log('\nLayout ratios (listing):', layout);
console.log('Figma targets: haloTop 0.074, haloWidth 0.679, introTop 0.050, relatedTop 0.422, chevronTop 0.370');

if (listingIssues.length) {
  console.log('\nListing font/size issues:');
  listingIssues.forEach((i) => console.log('  ✗', i));
} else {
  console.log('\n✓ Listing fonts match Figma tokens');
}

console.log('\n=== POEMS DETAIL — fonts @ 1920×1080 (/poems/1) ===\n');
await page.goto(`${BASE}/poems/1`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('.clp-page--detail', { timeout: 30000 });
const detailFonts = await measureFonts(page);
console.log(JSON.stringify(detailFonts, null, 2));

const detailIssues = [];
if (detailFonts.poemText?.size !== 28) {
  detailIssues.push(`detail poemText: ${detailFonts.poemText?.size}px (Figma/PDF listing uses 28px; detail override is 19px)`);
}
if (detailFonts.poet?.size !== 18) {
  detailIssues.push(`detail poet: ${detailFonts.poet?.size}px (Figma 18px; detail override is 16px)`);
}
if (detailFonts.count?.size !== 27) {
  detailIssues.push(`detail title/count: ${detailFonts.count?.size}px italic ${detailFonts.count?.weight} (listing/Figma: Lora Regular 27px; detail uses 20px Light italic)`);
}
if (detailFonts.audioBtn?.w !== 113 && detailFonts.audioBtn?.w < 100) {
  detailIssues.push(`detail audioBtn: ${detailFonts.audioBtn?.w}px (listing/Figma ~113px; detail uses 56px)`);
}

if (detailIssues.length) {
  console.log('\nDetail vs Figma listing spec (intentional overrides noted):');
  detailIssues.forEach((i) => console.log('  ⚠', i));
}

await browser.close();
