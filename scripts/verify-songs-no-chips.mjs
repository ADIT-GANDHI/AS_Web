import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.cl-songs-page', { timeout: 60000 });
await page.waitForTimeout(3000);

await page.getByRole('button', { name: /^Filters$/i }).click();
await page.waitForSelector('button[aria-label="Close filters"]', { timeout: 15000 });
const first = page.locator("div[style*='z-index: 9999'] li").first();
if (await first.count()) await first.click({ force: true });
await page.waitForTimeout(300);
await page.getByLabel('Close filters').click();
await page.waitForTimeout(500);

const chipsBar = await page.locator('.cl-active-chips-bar').count();
const chips = await page.locator('.cl-active-chip').count();
const filterPink = await page
  .locator('.cl-filter-trigger-wrap button')
  .first()
  .evaluate((el) => getComputedStyle(el).color);

console.log(
  JSON.stringify({
    chipsBar,
    chips,
    filterTriggerPink: filterPink.includes('227') || filterPink.includes('225'),
    ok: chipsBar === 0 && chips === 0,
  })
);

await browser.close();
process.exit(chipsBar === 0 && chips === 0 ? 0 : 1);
