const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join('comparison-runs', 'films-ai-ui-final');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/films', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForSelector('.clf-page', { timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, 'listing.png') });

  const listing = await page.evaluate(() => ({
    intro: !!document.querySelector('.clf-page-intro'),
    label: document.querySelector('.clf-series-title-label')?.textContent?.trim(),
    titleColor: getComputedStyle(document.querySelector('.clf-entry-title')).color,
    meta: document.querySelector('.clf-entry-meta')?.textContent?.trim(),
    autoPopup: !!document.querySelector('.cfp-overlay'),
  }));

  await page.locator('.clf-entry-thumb').first().click();
  await page.waitForTimeout(800);
  const popup = await page.locator('.cfp-overlay').count();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.goto('http://localhost:3000/films/details/2', {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  });
  await page.waitForSelector('.clfd-page', { timeout: 90000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUT, 'detail.png') });

  const detail = await page.evaluate(() => ({
    explore: document.querySelector('.cld-related-title')?.textContent?.trim(),
    year: !!document.querySelector('.clfd-header-year'),
    gloss: !!document.querySelector('.clfd-glossary-strip, .clfd-glossary-align .gs-strip'),
    contentW: Math.round(document.querySelector('.clfd-content')?.getBoundingClientRect().width || 0),
    tabs: [...document.querySelectorAll('.cld-related-tab')]
      .map((t) => t.textContent.replace(/\s+/g, ' ').trim())
      .slice(0, 5),
  }));

  console.log(JSON.stringify({ listing, popup, detail }, null, 2));
  fs.writeFileSync(path.join(OUT, 'check.json'), JSON.stringify({ listing, popup, detail }, null, 2));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
