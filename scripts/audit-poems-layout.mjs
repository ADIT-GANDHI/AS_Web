/**
 * Double-pass audit for /poems — layout vs Figma 362:3254 artboard ratios
 */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const OUT = 'Poems_Comparison';
const VIEWPORTS = [
  [1980, 1114],
  [1920, 1080],
  [1620, 912],
  [1440, 810],
  [1240, 697],
];

// Figma 362:3254 — outer glow circle 362:3325 (visible white halo in PNG)
const FIGMA = {
  haloTop: 301.09 / 4080,
  haloSize: 1309 / 1929,
  audioTopInCircle: (623.07 - 301.09) / 1309,
  navCenterInCircle: (915 + 41.19 / 2 - 301.09) / 1309,
  langTopInCircle: (1248.07 - 301.09) / 1309,
  relatedTop: 1722.01 / 4080,
  chevronTop: 1508 / 4080,
};

async function auditViewport(page) {
  return page.evaluate((figma) => {
  const vw = innerWidth;
  const artboardH = (vw * 4080) / 1929;
  const targetHaloTop = artboardH * figma.haloTop;

  const wrap = document.querySelector('.clp-page-root-wrap');
  const pageEl = document.querySelector('.clp-page');
  const slider = document.querySelector('.clp-slider-wrap');
  const halo = document.querySelector('.clp-halo-circle');
  const audio = document.querySelector('.clp-audio-btn');
  const lang = document.querySelector('.clp-lang-toggle');
  const navL = document.querySelector('.clp-slider-nav.left');
  const navR = document.querySelector('.clp-slider-nav.right');
  const chevron = document.querySelector('.clp-next-chevron');
  const related = document.querySelector('.clp-related');
  const footer = document.querySelector('footer.footer-bg');
  const body = document.body;

  const wrapCs = wrap ? getComputedStyle(wrap) : null;
  const pageCs = pageEl ? getComputedStyle(pageEl) : null;
  const hr = halo?.getBoundingClientRect();
  const ar = audio?.getBoundingClientRect();
  const lr = lang?.getBoundingClientRect();
  const nl = navL?.getBoundingClientRect();
  const nr = navR?.getBoundingClientRect();
  const sr = slider?.getBoundingClientRect();
  const rr = related?.getBoundingClientRect();
  const cr = chevron?.getBoundingClientRect();
  const wr = wrap?.getBoundingClientRect();
  const fr = footer?.getBoundingClientRect();

  const langInsideHalo = hr && lr ? lr.top >= hr.top && lr.bottom <= hr.bottom + 2 : null;

  return {
    artboardH: Math.round(artboardH),
    wrap: {
      height: wr ? Math.round(wr.height) : null,
      scrollH: document.documentElement.scrollHeight,
      bg: wrapCs?.backgroundImage.includes('poems-bg') ?? false,
      overflow: wrapCs?.overflowY,
      bgColor: wrapCs?.backgroundColor,
    },
    bodyBg: getComputedStyle(body).backgroundColor,
    pageMinH: pageCs?.minHeight,
    halo: hr
      ? {
          top: Math.round(hr.top),
          h: Math.round(hr.height),
          topDelta: Math.round(hr.top - targetHaloTop),
          sizeRatio: +(hr.width / vw).toFixed(3),
          targetSizeRatio: +figma.haloSize.toFixed(3),
          audioRatio: +((ar.top - hr.top) / hr.height).toFixed(3),
          targetAudioRatio: +figma.audioTopInCircle.toFixed(3),
          navRatio: nl
            ? +((nl.top + nl.height / 2 - hr.top) / hr.height).toFixed(3)
            : null,
          targetNavRatio: +figma.navCenterInCircle.toFixed(3),
          langInsideHalo,
          langRatio: hr && lr ? +((lr.top - hr.top) / hr.height).toFixed(3) : null,
          targetLangRatio: +figma.langTopInCircle.toFixed(3),
        }
      : null,
    navAlignDiff: nl && nr ? Math.round(nl.top + nl.height / 2 - (nr.top + nr.height / 2)) : null,
    sliderH: sr ? Math.round(sr.height) : null,
    chevronTopRatio: cr ? +((cr.top + scrollY) / artboardH).toFixed(3) : null,
    targetChevronRatio: +figma.chevronTop.toFixed(3),
    relatedTopRatio: rr ? +((rr.top + scrollY) / artboardH).toFixed(3) : null,
    targetRelatedRatio: +figma.relatedTop.toFixed(3),
    gapChevronToRelated: cr && rr ? Math.round(rr.top - cr.bottom) : null,
    footerInsideWrap: wr && fr ? fr.top < wr.bottom : null,
  };
  }, FIGMA);
}

function check(label, data, failures) {
  const h = data.halo;
  if (!h) {
    failures.push(`${label}: missing halo`);
    return;
  }
  if (!data.wrap.bg) failures.push(`${label}: wrap missing poems-bg`);
  if (data.wrap.overflow !== 'auto') failures.push(`${label}: wrap overflow ${data.wrap.overflow}`);
  if (Math.abs(h.topDelta) > 15) {
    failures.push(`${label}: halo top delta ${h.topDelta}px (target ±15)`);
  }
  if (Math.abs(h.sizeRatio - h.targetSizeRatio) > 0.02) {
    failures.push(`${label}: halo width ratio ${h.sizeRatio} vs ${h.targetSizeRatio}`);
  }
  if (Math.abs(h.audioRatio - h.targetAudioRatio) > 0.025) {
    failures.push(`${label}: audio ratio ${h.audioRatio} vs ${h.targetAudioRatio}`);
  }
  if (Math.abs(h.navRatio - h.targetNavRatio) > 0.03) {
    failures.push(`${label}: nav ratio ${h.navRatio} vs ${h.targetNavRatio}`);
  }
  if (h.langInsideHalo === false) {
    failures.push(`${label}: lang toggle outside halo (Figma has it inside circle)`);
  }
  if (h.langRatio !== null && Math.abs(h.langRatio - h.targetLangRatio) > 0.06) {
    failures.push(`${label}: lang ratio ${h.langRatio} vs ${h.targetLangRatio}`);
  }
  if (data.navAlignDiff !== 0) failures.push(`${label}: nav L/R misaligned by ${data.navAlignDiff}px`);
  if (data.pageMinH && parseFloat(data.pageMinH) >= data.artboardH * 0.95) {
    failures.push(`${label}: .clp-page min-height duplicates artboard (${data.pageMinH})`);
  }
}

async function runPass(page, passNum) {
  const failures = [];
  console.log(`\n=== PASS ${passNum} ===`);
  for (const [w, h] of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${BASE}/poems`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const data = await auditViewport(page);
    const label = `${w}x${h}`;
    console.log(label, JSON.stringify(data, null, 0));
    check(label, data, failures);
    if (w === 1920 && passNum === 2) {
      await page.screenshot({ path: `${OUT}/audit_pass2_1920.png`, fullPage: false });
      await page.screenshot({ path: `${OUT}/audit_pass2_1920_full.png`, fullPage: true });
    }
  }
  return failures;
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
const pass1 = await runPass(page, 1);
const pass2 = await runPass(page, 2);
await browser.close();

const all = [...new Set([...pass1, ...pass2])];
console.log(`\nPASS1 failures: ${pass1.length}`);
pass1.forEach((f) => console.log(' -', f));
console.log(`PASS2 failures: ${pass2.length}`);
pass2.forEach((f) => console.log(' -', f));
console.log(`\nUnique failures across both passes: ${all.length}`);
process.exit(all.length ? 1 : 0);
