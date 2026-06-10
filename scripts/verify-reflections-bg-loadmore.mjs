/**
 * Reflections listing — bg height + nav count after Load More.
 * Run: node scripts/verify-reflections-bg-loadmore.mjs
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'Comparison_Out', 'reflections-bg-loadmore-test');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function readState(page) {
  return page.evaluate(() => {
    const layers = document.querySelector('.clr-bg-layers');
    const songsAfter = getComputedStyle(document.querySelector('.nav-link--songs')).content;
    const reflectionsAfter = getComputedStyle(document.querySelector('.nav-link--reflections')).content;
    const songsSpan = document.querySelector('.nav-link--songs .nav-link-songs-count');
    return {
      bgHeight: layers ? Math.round(layers.getBoundingClientRect().height) : 0,
      shellHeight: Math.round(document.querySelector('.cl-songs-page-shell')?.scrollHeight || 0),
      rootBg: getComputedStyle(document.querySelector('.cl-songs-page-root')).backgroundColor,
      sheetRepeat: layers
        ? getComputedStyle(layers.querySelector('.clr-bg-sheet')).backgroundRepeat
        : null,
      songsNavAfter: songsAfter,
      reflectionsNavAfter: reflectionsAfter,
      songsSpanVisible: songsSpan ? getComputedStyle(songsSpan).display !== 'none' : false,
      docHeight: document.documentElement.scrollHeight,
    };
  });
}

async function sampleBgAtScroll(page, y) {
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
  await page.waitForTimeout(300);
  return page.evaluate((scrollY) => {
    const x = Math.round(window.innerWidth / 2);
    const sampleY = scrollY + Math.round(window.innerHeight * 0.5);
    const el = document.elementFromPoint(x, sampleY);
    const bg = el ? getComputedStyle(el).backgroundColor : 'none';
    const layers = document.querySelector('.clr-bg-layers');
    const layerRect = layers?.getBoundingClientRect();
    const pastBg = layerRect ? sampleY > layerRect.bottom + window.scrollY : null;
    return { scrollY, sampleY, pastBg, hitTag: el?.tagName, hitClass: el?.className?.slice?.(0, 80) };
  }, y);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/reflections`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.cl-song-grid-item, .clr-grid-status', { timeout: 120_000 });
  await page.waitForTimeout(1500);

  const states = [];
  for (let step = 0; step <= 3; step++) {
    const state = await readState(page);
    const cards = await page.locator('.cl-song-grid-item').count();
    states.push({ step, cards, ...state });

    await page.screenshot({
      path: path.join(OUT, `step-${step}-cards-${cards}.png`),
      fullPage: step > 0,
    });

    if (step < 3) {
      const btn = page.locator('.cl-load-more-btn');
      if (!(await btn.isVisible())) break;
      await btn.click();
      await page.waitForTimeout(1200);
    }
  }

  const finalScroll = states[states.length - 1]?.docHeight || 4000;
  const scrollSamples = [];
  for (const y of [0, 2000, 4000, finalScroll - 900].filter((v) => v >= 0)) {
    scrollSamples.push(await sampleBgAtScroll(page, y));
  }

  await browser.close();

  const report = {
    url: `${BASE}/reflections`,
    states,
    scrollSamples,
    bgTracksShell: states.every((s) => s.bgHeight >= s.shellHeight - 50),
    songsCountHidden: states.every((s) => !s.songsSpanVisible && s.songsNavAfter === 'none'),
    reflectionsCountShown: states.every((s) => s.reflectionsNavAfter !== 'none'),
  };

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
