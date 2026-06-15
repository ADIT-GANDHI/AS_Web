import { chromium } from 'playwright';

const path = process.argv[2] || '/poems';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

const res = await page.goto(`http://localhost:3000${path}`, {
  waitUntil: 'load',
  timeout: 120000,
});
await page.waitForTimeout(5000);
console.log({ path, status: res?.status(), errors });
await browser.close();
