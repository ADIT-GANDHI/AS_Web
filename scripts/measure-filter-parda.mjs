import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'scripts/probe-output');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.cl-filter-trigger', { timeout: 120000 });
await page.click('.cl-filter-trigger');
await page.waitForTimeout(800);

const lis = page.locator('.cl-filter-parda-list li:not(.is-empty)');
for (const i of [0, 2, 3, 4]) {
  await lis.nth(i).click();
  await page.waitForTimeout(200);
}
await page.waitForTimeout(400);

async function measure(label, scrollPx) {
  const list = page.locator('.cl-filter-parda-list');
  if (scrollPx) await list.evaluate((el, y) => { el.scrollTop = y; }, scrollPx);
  await page.waitForTimeout(300);

  const m = await page.evaluate(() => {
    const panel = document.querySelector('.cl-filter-parda-panel');
    const pardaImg = panel?.querySelector('.cl-filter-parda-bg img');
    const clearBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim().toLowerCase() === 'clear all'
    );
    const pr = panel?.getBoundingClientRect();
    const ir = pardaImg?.getBoundingClientRect();
    const cr = clearBtn?.getBoundingClientRect();
    const vh = window.innerHeight;
    return {
      viewportH: vh,
      pardaH: ir ? Math.round(ir.height) : null,
      panelBottom: pr ? Math.round(pr.bottom) : null,
      pardaEndsBelowViewport: pr ? Math.round(pr.bottom - vh) : null,
      gapClearToPardaBottomPx: ir && cr ? Math.round(ir.bottom - cr.bottom) : null,
      gapClearToPardaBottomPct: ir && cr ? +(((ir.bottom - cr.bottom) / ir.height) * 100).toFixed(1) : null,
      listScrollTop: document.querySelector('.cl-filter-parda-list')?.scrollTop ?? 0,
    };
  });

  await page.screenshot({ path: path.join(OUT, `filter-parda-${label}.png`) });
  return m;
}

const s0 = await measure('scroll0', 0);
const listH = await page.locator('.cl-filter-parda-list').evaluate((el) => el.clientHeight);
const s1 = await measure('scroll1', Math.round(listH * 0.95));
const s2 = await measure('scroll2', Math.round(listH * 1.9));

// Page scroll — parda should end above marble
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(OUT, 'filter-parda-page-scroll.png') });
const pageScroll = await page.evaluate(() => {
  const panel = document.querySelector('.cl-filter-parda-panel');
  const pr = panel?.getBoundingClientRect();
  return {
    panelTop: pr ? Math.round(pr.top) : null,
    panelBottom: pr ? Math.round(pr.bottom) : null,
    scrollY: window.scrollY,
  };
});

console.log(JSON.stringify({ scroll0: s0, scroll1: s1, scroll2: s2, pageScroll }, null, 2));
await browser.close();
