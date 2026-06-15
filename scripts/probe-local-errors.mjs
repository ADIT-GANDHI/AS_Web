import { chromium } from 'playwright';

const paths = [
  '/',
  '/reflections',
  '/reflections/details/63',
  '/people',
  '/songs',
  '/songs/details/260',
  '/poems',
  '/glossary',
  '/about?tab=ajab',
  '/films/details/38',
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const issues = [];

page.on('console', (msg) => {
  if (msg.type() === 'error') {
    issues.push({ kind: 'console', text: msg.text() });
  }
});
page.on('pageerror', (err) => {
  issues.push({ kind: 'pageerror', text: String(err.message || err) });
});

for (const path of paths) {
  const url = `http://localhost:3000${path}`;
  const row = { path, url, status: null, issues: [] };
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    row.status = res?.status() ?? null;
    await page.waitForTimeout(3000);
    const body = await page.locator('body').innerText();
    row.hasNextError =
      body.includes('Application error') ||
      body.includes('Unhandled Runtime Error') ||
      body.includes('Internal Server Error');
    row.errorSnippet = row.hasNextError ? body.slice(0, 400) : '';
  } catch (err) {
    row.failed = String(err.message || err).slice(0, 300);
  }
  console.log(JSON.stringify(row));
}

const unique = [...new Map(issues.map((i) => [i.text, i])).values()];
console.log('\n=== Unique console/page errors ===');
console.log(JSON.stringify(unique.slice(0, 30), null, 2));

await browser.close();
