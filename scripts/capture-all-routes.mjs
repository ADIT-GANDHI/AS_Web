// Sweep capture: take a full-page screenshot of every key route so we can
// cross-check Figma alignment + implementation status in one pass.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SITE_BASE || 'http://localhost:3001';
const OUT = join(__dirname, '..', 'All_Routes_Snapshot');
mkdirSync(OUT, { recursive: true });

const routes = [
  { name: '00-home',                 url: '/',                       group: 'verified' },
  { name: '01-songs-listing',        url: '/songs',                  group: 'verified' },
  { name: '02-song-detail',          url: '/songs/details/1',        group: 'verified' },
  { name: '03-poems',                url: '/poems',                  group: 'verified' },
  { name: '10-reflections-listing',  url: '/reflections',            group: 'pending' },
  { name: '11-reflection-detail',    url: '/reflections/details/1',  group: 'pending' },
  { name: '12-people-listing',       url: '/people',                 group: 'pending' },
  { name: '13-person-detail',        url: '/people/1',               group: 'pending' },
  { name: '14-films-listing',        url: '/films',                  group: 'pending' },
  { name: '15-film-detail',          url: '/films/details/1',        group: 'pending' },
  { name: '20-radio',                url: '/radio',                  group: 'pending' },
  { name: '21-glossary',             url: '/glossary',               group: 'pending' },
  { name: '22-ajab-news',            url: '/ajab-news',              group: 'pending' },
  { name: '23-about',                url: '/about',                  group: 'pending' },
];

async function dismissDevOverlays(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] { display: none !important; }
    `,
  }).catch(() => {});
}

async function loadAndCapture(page, route) {
  const url = `${BASE}${route.url}`;
  process.stdout.write(`→ ${route.name.padEnd(28)} ${route.url} ... `);
  try {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    } catch {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    }
    await page.waitForTimeout(2500);
    await dismissDevOverlays(page);

    // scroll to trigger lazy images
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let y = 0;
        const step = window.innerHeight;
        const max = document.documentElement.scrollHeight;
        const tick = () => {
          window.scrollTo(0, y);
          y += step;
          if (y < max) setTimeout(tick, 80);
          else { window.scrollTo(0, 0); setTimeout(resolve, 500); }
        };
        tick();
      });
    });
    await page.waitForTimeout(500);

    const out = join(OUT, `${route.name}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log('ok');
    return { ok: true, out };
  } catch (e) {
    console.log('FAIL:', e.message);
    return { ok: false, error: e.message };
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const results = [];
for (const route of routes) {
  const r = await loadAndCapture(page, route);
  results.push({ ...route, ...r });
}

console.log('\n— summary —');
for (const r of results) {
  console.log(`${r.group.padEnd(8)} ${r.name.padEnd(28)} ${r.ok ? 'ok' : 'FAIL ' + r.error}`);
}

await browser.close();
