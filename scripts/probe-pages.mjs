import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const base = process.argv[2] || 'http://localhost:3000';
const OUT = join(process.cwd(), 'Comparison_Out', 'Page_Check');
mkdirSync(OUT, { recursive: true });

const routes = [
  { name: 'home', path: '/' },
  { name: 'songs', path: '/songs' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
const failed = [];

page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on('response', (r) => {
  if (r.status() >= 400 && r.url().includes(base.replace(/https?:\/\/[^/]+/, ''))) {
    failed.push(`${r.status()} ${r.url()}`);
  }
  if (r.status() >= 400 && (r.url().includes('_next') || r.url().includes('.css') || r.url().includes('.js'))) {
    failed.push(`${r.status()} ${r.url().split('?')[0]}`);
  }
});

const results = [];

for (const route of routes) {
  errors.length = 0;
  const url = `${base}${route.path}`;
  let status = null;
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
    status = res?.status() ?? null;
  } catch (e) {
    status = `goto failed: ${e.message}`;
  }
  await page.waitForTimeout(6000);

  const snap = await page.evaluate(() => {
    const body = document.body;
    const text = (body?.innerText || '').trim();
    return {
      title: document.title,
      textLen: text.length,
      textSample: text.slice(0, 120),
      hasHeader: !!document.querySelector('header'),
      hasFooter: !!document.querySelector('footer'),
      hasMain: !!document.querySelector('main'),
      hasBuildError: text.includes('Build Error') || text.includes('Module parse failed'),
      hasNextError: !!document.querySelector('nextjs-portal'),
      songCards: document.querySelectorAll('.cl-song-card').length,
      homeCards: document.querySelectorAll('.clh-card').length,
      bgSheet: !!document.querySelector('.cl-songs-bg-sheet'),
      visibleChildren: body?.children?.length ?? 0,
    };
  });

  await page.screenshot({ path: join(OUT, `${route.name}-1920.png`), fullPage: false });

  results.push({
    route: route.path,
    url,
    httpStatus: status,
    ...snap,
    consoleErrors: [...new Set(errors)].slice(0, 5),
  });
}

console.log(JSON.stringify({ base, results, failedAssets: [...new Set(failed)].slice(0, 15) }, null, 2));
await browser.close();
