import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/poems', {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.waitForTimeout(800);
await page.locator('button:has-text("See All")').first().click();
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(800);

const hit = await page.evaluate(() => {
  const pts = [
    [80, 850],
    [200, 700],
    [200, 320],
    [500, 700],
  ];
  return pts.map(([x, y]) => {
    const stack = document.elementsFromPoint(x, y).slice(0, 6).map((el) => ({
      tag: el.tagName,
      cls: String(el.className || '').slice(0, 50),
      z: getComputedStyle(el).zIndex,
    }));
    return { x, y, stack };
  });
});
console.log(JSON.stringify(hit, null, 2));
await page.screenshot({
  path: 'comparison-runs/filter-parda-footer/poems-full-bottom.png',
  clip: { x: 0, y: 250, width: 700, height: 650 },
});
await browser.close();
