import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/radio', {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.waitForTimeout(1000);
await page.locator('button.radio-tab', { hasText: 'PLAYLISTS' }).click();
await page.waitForTimeout(1000);
await page.locator('button.radio-playlist-filter-trigger').first().click();
await page.waitForTimeout(700);

const data = await page.locator('.ajab-filter-drawer').evaluate((el) => {
  const rect = el.getBoundingClientRect();
  const close = Array.from(el.querySelectorAll('button')).find(
    (b) => (b.getAttribute('aria-label') || '') === 'Close filters'
  );
  const cr = close.getBoundingClientRect();
  const labels = Array.from(el.querySelectorAll('button, span'))
    .map((n) => {
      const r = n.getBoundingClientRect();
      return {
        t: (n.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        left: Math.round(r.left),
        right: Math.round(r.right),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        h: Math.round(r.height),
      };
    })
    .filter(
      (n) =>
        n.h > 0 &&
        n.h < 40 &&
        n.top >= rect.top &&
        n.top < rect.top + 260 &&
        n.t.length > 0 &&
        n.t.length < 40
    );
  const interesting = labels.filter((n) =>
    /Filter by|Singer|Poet|Theme|Curated|Format|Speaker|^\||^×$/.test(n.t)
  );
  const cats = interesting.filter((n) =>
    /^(Singer|Poet|Theme|Curated|Speaker|Format)$/.test(n.t)
  );
  const rightmost = [...cats].sort((a, b) => b.right - a.right)[0];
  const nonX = interesting.filter((l) => l.t !== '×');
  return {
    width: Math.round(rect.width),
    labels: interesting.map((l) => l.t),
    gap: rightmost ? Math.round(cr.left - rightmost.right) : null,
    sameLine: nonX.length
      ? Math.max(...nonX.map((l) => l.bottom)) -
          Math.min(...nonX.map((l) => l.top)) <
        28
      : true,
    opacity: getComputedStyle(el.querySelector('[aria-hidden="true"]')).opacity,
    bg: getComputedStyle(el).backgroundColor,
  };
});

await page.screenshot({
  path: 'comparison-runs/filter-drawer-1440/radio.png',
  clip: { x: 0, y: 0, width: 520, height: 440 },
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
