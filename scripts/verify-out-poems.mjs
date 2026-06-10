/**
 * Verify poems in static out/ export (served at /new).
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'out');
const BASE = '/new';
const PORT = 4174;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function resolveFile(urlPath) {
  if (!urlPath.startsWith(BASE)) return null;
  let rel = decodeURIComponent(urlPath.slice(BASE.length));
  if (rel === '' || rel === '/') rel = '/index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  if (!path.extname(rel)) rel += '.html';
  const file = path.join(OUT, rel.replace(/^\//, '').replace(/\//g, path.sep));
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  return null;
}

const server = http.createServer((req, res) => {
  const file = resolveFile(req.url?.split('?')[0] ?? '');
  if (!file) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, resolve));
const BASE_URL = `http://127.0.0.1:${PORT}${BASE}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const failures = [];
const passes = [];

async function checkPoemsListing() {
  await page.goto(`${BASE_URL}/poems`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.clp-page-root-wrap', { timeout: 15000 });

  const data = await page.evaluate(() => {
    const wrap = document.querySelector('.clp-page-root-wrap');
    const halo = document.querySelector('.clp-halo-circle');
    const seeAll = document.querySelector('.clp-seeall');
    const lang = document.querySelector('.clp-lang-toggle');
    const wrapCs = wrap ? getComputedStyle(wrap) : null;
    const vw = innerWidth;
    const artboardH = (vw * 4080) / 1929;
    const wr = wrap?.getBoundingClientRect();
    const hr = halo?.getBoundingClientRect();
    return {
      hasWrap: !!wrap,
      hasHalo: !!halo,
      hasSeeAll: !!seeAll,
      seeAllClickable: seeAll ? !seeAll.hasAttribute('disabled') : false,
      hasLangInHalo: !!halo?.querySelector('.clp-lang-toggle'),
      bgHasPoems: wrapCs?.backgroundImage.includes('poems-bg') ?? false,
      bgPrefixed: wrapCs?.backgroundImage.includes('/new/poems-bg') ?? false,
      haloSizeRatio: hr && artboardH ? hr.width / vw : null,
      haloTopPx: hr?.top ?? null,
      targetHaloTop: artboardH * (301.09 / 4080),
    };
  });

  if (!data.hasWrap) failures.push('listing: missing .clp-page-root-wrap');
  else passes.push('listing: .clp-page-root-wrap present');
  if (!data.hasHalo) failures.push('listing: missing .clp-halo-circle');
  else passes.push('listing: halo circle present');
  if (!data.bgHasPoems) failures.push('listing: poems-bg not in background');
  else passes.push('listing: poems-bg background loaded');
  if (!data.bgPrefixed) failures.push('listing: background URL missing /new prefix');
  else passes.push('listing: /new/poems-bg.png path OK');
  if (!data.hasSeeAll) failures.push('listing: missing See All');
  else passes.push('listing: See All present');
  if (!data.hasLangInHalo) failures.push('listing: lang toggle not inside halo');
  else passes.push('listing: lang toggle inside halo');

  const haloTopDelta = Math.abs((data.haloTopPx ?? 0) - data.targetHaloTop);
  if (haloTopDelta > 8) {
    failures.push(`listing: halo top off by ${Math.round(haloTopDelta)}px (got ${Math.round(data.haloTopPx)}, want ~${Math.round(data.targetHaloTop)})`);
  } else {
    passes.push(`listing: halo top within ${Math.round(haloTopDelta)}px`);
  }
  if (data.haloSizeRatio && Math.abs(data.haloSizeRatio - 0.679) > 0.02) {
    failures.push(`listing: halo width ratio ${data.haloSizeRatio?.toFixed(3)} (want ~0.679)`);
  } else {
    passes.push(`listing: halo width ratio ${data.haloSizeRatio?.toFixed(3)}`);
  }

  const bgReq = page.locator('xpath=//*[contains(@style,"poems-bg") or contains(@class,"clp-page-root-wrap")]').first();
  void bgReq;
  const resp = await page.request.get(`${BASE_URL}/poems-bg.png`);
  if (!resp.ok()) failures.push(`asset: /new/poems-bg.png HTTP ${resp.status()}`);
  else passes.push('asset: poems-bg.png HTTP 200');
}

async function checkPoemDetail() {
  await page.goto(`${BASE_URL}/poems/1`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.clp-page-root-wrap, .clp-page', { timeout: 15000 });

  const data = await page.evaluate(() => {
    const wrap = document.querySelector('.clp-page-root-wrap') || document.querySelector('.cl-songs-page-root');
    const notes = document.querySelector('.clp-notes-btn, [class*="notes"]');
    const glossary = document.querySelector('.clp-glossary-btn, [class*="glossary"]');
    const related = document.querySelector('.clp-related, .poems-related');
    const wrapCs = wrap ? getComputedStyle(wrap) : null;
    return {
      hasRoot: !!wrap,
      bgHasPoems: wrapCs?.backgroundImage.includes('poems-bg') ?? false,
      hasNotesOrGlossary: !!(notes || glossary),
      hasRelated: !!related,
      title: document.title,
    };
  });

  if (!data.hasRoot) failures.push('detail: missing page root');
  else passes.push('detail /poems/1: page root present');
  if (!data.bgHasPoems) failures.push('detail: poems-bg not applied');
  else passes.push('detail: poems-bg background');
  passes.push(`detail: title="${data.title.slice(0, 50)}..."`);
}

try {
  await checkPoemsListing();
  await checkPoemDetail();
} catch (e) {
  failures.push(`runtime: ${e.message}`);
} finally {
  await browser.close();
  server.close();
}

console.log('\n=== out/ poems verification ===\n');
passes.forEach((p) => console.log(`  ✓ ${p}`));
if (failures.length) {
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  console.log(`\n❌ ${failures.length} issue(s)\n`);
  process.exit(1);
}
console.log(`\n✅ All ${passes.length} checks passed\n`);
