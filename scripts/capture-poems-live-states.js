/**
 * Capture Poems localhost states at 1440 matching AI/PDF pages.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.join('comparison-runs', 'poems-ai-vs-live-1440', 'live');
fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name, fullPage = false) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage });
  console.log('saved', name);
}

async function closeFilter(page) {
  const close = page.locator('.ajab-filter-drawer button[aria-label="Close"], .ajab-filter-drawer .ajab-filter-close, .cl-filter-panel button').filter({ hasText: /^×$|^x$/i }).first();
  if (await close.count()) {
    await close.click({ force: true }).catch(() => {});
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(400);
  // Click outside if still open
  const still = await page.locator('.ajab-filter-drawer, .cl-filter-panel').count();
  if (still) {
    await page.locator('.clp-intro').click({ force: true }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function openSidePanel(page, label) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.locator('.clp-poem-stage').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.locator('.clp-actions button', { hasText: label }).click({ force: true });
  await page.waitForTimeout(900);
}

(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/poems', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('.clp-page', { timeout: 60000 });
  await page.waitForTimeout(2500);

  await shot(page, '01-main-top.png', false);
  await shot(page, '01-main-full.png', true);

  await page.locator('.clp-related').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const themeBtn = page.locator('.clp-related .explore-theme').nth(1);
  if (await themeBtn.count()) {
    await themeBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
  }
  await shot(page, '02-explore.png', false);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);

  await page.locator('.clp-see-all').click({ force: true });
  await page.waitForTimeout(1200);
  await shot(page, '04-filter-parda.png', false);
  await closeFilter(page);

  await openSidePanel(page, 'NOTES');
  await shot(page, '06-notes.png', false);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await openSidePanel(page, 'GLOSSARY');
  await shot(page, '07-glossary.png', false);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  await openSidePanel(page, 'LISTEN');
  await page.locator('button[aria-label="Volume"]').evaluate((el) => el.click()).catch(() => {});
  await page.waitForTimeout(300);
  await shot(page, '08-listen.png', false);

  await b.close();
  console.log('live captures done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
