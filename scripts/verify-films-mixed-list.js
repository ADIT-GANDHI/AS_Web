const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/films', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('.clf-page', { timeout: 60000 });
  await page.waitForTimeout(2500);

  const before = await page.evaluate(() => ({
    count: document.querySelector('.clf-count')?.textContent?.trim(),
    series: [...document.querySelectorAll('.clf-series-title')].map((el) =>
      el.textContent.trim()
    ),
    filmsPer: [...document.querySelectorAll('.clf-series')].map((s) => ({
      title: s.querySelector('.clf-series-title')?.textContent?.trim(),
      n: s.querySelectorAll('.clf-entry').length,
      titles: [...s.querySelectorAll('.clf-entry-title')]
        .map((t) => t.textContent.trim())
        .slice(0, 6),
    })),
    loadMore: !!document.querySelector('button[aria-label="Load more films"]'),
    autoPopup: !!document.querySelector('.cfp-overlay'),
  }));
  console.log('before', JSON.stringify(before, null, 2));

  if (before.loadMore) {
    await page.locator('button[aria-label="Load more films"]').click();
    await page.waitForTimeout(2500);
  }

  const after = await page.evaluate(() => ({
    series: [...document.querySelectorAll('.clf-series-title')].map((el) =>
      el.textContent.trim()
    ),
    filmSlots: document.querySelectorAll('.clf-entry').length,
    loadMore: !!document.querySelector('button[aria-label="Load more films"]'),
  }));
  console.log('after', JSON.stringify(after, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
