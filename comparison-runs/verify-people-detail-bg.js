const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:3000/people', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.clpe-page a[href*="/people/"]', { timeout: 60000 });
  const href = await p.locator('.clpe-page a[href*="/people/"]').first().getAttribute('href');
  console.log('href', href);
  await p.goto('http://localhost:3000' + href, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('.clped-page', { timeout: 60000 });
  await p.waitForTimeout(2500);
  const d = await p.evaluate(() => {
    const s = document.querySelector('.repeating-page-bg__sheet');
    const o = document.querySelector('.repeating-page-bg__overlay');
    return {
      url: s && getComputedStyle(s).backgroundImage,
      hasOverlay: Boolean(o),
    };
  });
  console.log(JSON.stringify(d, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
