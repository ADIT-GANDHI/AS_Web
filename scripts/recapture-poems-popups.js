const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join('comparison-runs', 'poems-ai-vs-live-1440', 'live');
fs.mkdirSync(OUT, { recursive: true });

async function closeOverlays(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
  // close filter via X if open
  const close = page.locator('.ajab-filter-drawer button').filter({ hasText: '×' }).first();
  if (await close.count()) await close.click().catch(() => {});
  // click backdrop / close icons
  await page.locator('.ajab-filter-drawer [aria-label*="Close" i], .wp-popup-close, .clp-player-popup__close').first().click({ timeout: 1000 }).catch(() => {});
  await page.evaluate(() => {
    document.querySelectorAll('.ajab-filter-drawer').forEach(() => {});
  });
  // force close by toggling see-all if drawer still visible
  const drawer = page.locator('.ajab-filter-drawer');
  if (await drawer.count()) {
    await page.mouse.click(800, 400).catch(() => {});
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(300);
}

(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/poems', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForSelector('.clp-page', { timeout: 60000 });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo(0, 0));

  // Ensure poem stage actions visible
  await page.locator('.clp-actions').scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // NOTES
  await closeOverlays(page);
  await page.locator('.clp-actions button', { hasText: 'NOTES' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '06-notes.png') });
  console.log('notes');

  // GLOSSARY
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.locator('.clp-actions button', { hasText: 'GLOSSARY' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '07-glossary.png') });
  console.log('glossary');

  // LISTEN
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.locator('.clp-actions button', { hasText: 'LISTEN' }).click();
  await page.waitForTimeout(1000);
  await page.locator('.clp-player-popup button[aria-label="Volume"]').click().catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '08-listen.png') });
  console.log('listen');

  // FILTER clean
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('.clp-see-all').click();
  await page.waitForSelector('.ajab-filter-drawer', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, '04-filter-parda.png') });
  console.log('filter');

  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
