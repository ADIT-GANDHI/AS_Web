#!/usr/bin/env node
/**
 * Capture Home listing at 1920 and 1440 (no news popup).
 *   node scripts/capture-home-viewports.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'Comparison_Out', 'Home_ThreeWay');
const BASE = (process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

async function dismissNews(page) {
  await page.keyboard.press('Escape').catch(() => {});
  const close = page.locator('.npc-close');
  if (await close.isVisible().catch(() => false)) {
    await close.click().catch(() => {});
  }
  await page.waitForTimeout(400);
}

async function scrollHome(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0;
      const step = window.innerHeight;
      const max = document.documentElement.scrollHeight;
      const tick = () => {
        window.scrollTo(0, y);
        y += step;
        if (y < max) setTimeout(tick, 120);
        else {
          window.scrollTo(0, 0);
          setTimeout(resolve, 700);
        }
      };
      tick();
    });
  });
}

async function capture(width) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForSelector('.cl-home-page-root', { timeout: 60_000 });
  await dismissNews(page);
  await scrollHome(page);
  await page.waitForTimeout(600);
  const outFile = path.join(OUT, `localhost-home-${width}.png`);
  await page.screenshot({ path: outFile, fullPage: true });
  const metrics = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.clh-card')];
    return {
      gap: getComputedStyle(document.querySelector('.clh-cards')).gap,
      cards: cards.map((c) => ({
        w: Math.round(c.getBoundingClientRect().width),
        h: Math.round(c.getBoundingClientRect().height),
      })),
      titleFs: getComputedStyle(document.querySelector('.clh-card-title')).fontSize,
    };
  });
  await browser.close();
  console.log(width, outFile, metrics);
}

await mkdir(OUT, { recursive: true });
for (const w of [1920, 1440]) {
  await capture(w);
}
