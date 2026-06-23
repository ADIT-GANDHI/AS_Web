import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'scripts/probe-output');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle', timeout: 90000 });
await page.click('button:has-text("Filters")');
await page.waitForTimeout(800);

const lis = page.locator('.ajab-filter-list li');
for (const i of [0, 2, 3, 4]) {
  await lis.nth(i).click();
  await page.waitForTimeout(200);
}
await page.waitForTimeout(400);

async function measure(label, scrollPx) {
  const list = page.locator('.ajab-filter-list');
  if (scrollPx) await list.evaluate((el, y) => { el.scrollTop = y; }, scrollPx);
  await page.waitForTimeout(300);

  const m = await page.evaluate(() => {
    const panels = [...document.querySelectorAll('div')].filter((d) => {
      const s = getComputedStyle(d);
      return s.position === 'fixed' && s.left === '0px' && s.width === '422px';
    });
    const panel = panels[0];
    const listEl = document.querySelector('.ajab-filter-list');
    const footers = [...document.querySelectorAll('div')].filter((d) => {
      const s = getComputedStyle(d);
      return s.borderTopWidth === '1px' && s.borderTopColor === 'rgb(177, 177, 177)' && s.paddingBottom === '28px';
    });
    const footer = footers[footers.length - 1];
    const clearBtn = [...document.querySelectorAll('button')].find(
      (b) => b.textContent?.trim().toLowerCase() === 'clear all'
    );
    const pardaImg = panel?.querySelector('img');
    const pr = panel?.getBoundingClientRect();
    const fr = footer?.getBoundingClientRect();
    const cr = clearBtn?.getBoundingClientRect();
    const ir = pardaImg?.getBoundingClientRect();

    return {
      viewportH: window.innerHeight,
      panelH: pr ? Math.round(pr.height) : null,
      panelBottom: pr ? Math.round(pr.bottom) : null,
      pardaImgH: ir ? Math.round(ir.height) : null,
      listScrollTop: listEl ? Math.round(listEl.scrollTop) : 0,
      listScrollH: listEl?.scrollHeight ?? 0,
      listClientH: listEl?.clientHeight ?? 0,
      clearAllBottom: cr ? Math.round(cr.bottom) : null,
      footerBottom: fr ? Math.round(fr.bottom) : null,
      gapClearToPanelBottomPx: pr && cr ? Math.round(pr.bottom - cr.bottom) : null,
      gapFooterToPanelBottomPx: pr && fr ? Math.round(pr.bottom - fr.bottom) : null,
      gapClearToPanelBottomPct: pr && cr ? +(((pr.bottom - cr.bottom) / pr.height) * 100).toFixed(1) : null,
      footerPaddingBottomPx: footer ? parseFloat(getComputedStyle(footer).paddingBottom) : null,
      listPaddingBottomPx: listEl ? parseFloat(getComputedStyle(listEl).paddingBottom) : null,
    };
  });

  await page.screenshot({ path: path.join(OUT, `filter-parda-${label}.png`) });
  return m;
}

const s0 = await measure('scroll0', 0);
const s1 = await measure('scroll1', Math.round(s0.listClientH * 0.95));
const s2 = await measure('scroll2', Math.round(s0.listClientH * 1.9));

console.log(JSON.stringify({ scroll0: s0, scroll1: s1, scroll2: s2 }, null, 2));
await browser.close();
