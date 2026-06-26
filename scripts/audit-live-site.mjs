/**
 * Comprehensive live site audit — hits every page and sub-URL on the production server.
 * Reports: HTTP errors, JS console errors, "not found" text, missing /new/ in links,
 * wrong redirects, and takes screenshots for visual confirmation.
 *
 * Usage: node scripts/audit-live-site.mjs
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';

const BASE = 'http://ajab.damnetworks.com';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'scripts', 'audit-screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// ── All URLs to test ─────────────────────────────────────────────────
const LISTING_PAGES = [
  { name: 'Home',        url: `${BASE}/` },
  { name: 'Songs',       url: `${BASE}/songs/` },
  { name: 'Poems',       url: `${BASE}/poems/` },
  { name: 'Reflections', url: `${BASE}/reflections/` },
  { name: 'People',      url: `${BASE}/people/` },
  { name: 'Films',       url: `${BASE}/films/` },
  { name: 'Glossary',    url: `${BASE}/glossary/` },
  { name: 'About',       url: `${BASE}/about/` },
  { name: 'Radio',       url: `${BASE}/radio/` },
  { name: 'Ajab News',   url: `${BASE}/ajab-news/` },
];

// Detail pages — test a few IDs for each section
const DETAIL_PAGES = [
  { name: 'Song 252',          url: `${BASE}/songs/details/252` },
  { name: 'Song 1',            url: `${BASE}/songs/details/1` },
  { name: 'Song 100',          url: `${BASE}/songs/details/100` },
  { name: 'Reflection 1',      url: `${BASE}/reflections/details/1` },
  { name: 'Reflection 63',     url: `${BASE}/reflections/details/63` },
  { name: 'Poem 1',            url: `${BASE}/poems/1` },
  { name: 'Poem 50',           url: `${BASE}/poems/50` },
  { name: 'People 1',          url: `${BASE}/people/1` },
  { name: 'People 10',         url: `${BASE}/people/10` },
  { name: 'Film 1',            url: `${BASE}/films/details/1` },
  { name: 'Film 10',           url: `${BASE}/films/details/10` },
];

const ALL_PAGES = [...LISTING_PAGES, ...DETAIL_PAGES];

const results = [];
let passCount = 0;
let failCount = 0;

function log(msg) { process.stdout.write(msg + '\n'); }

function slug(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function testPage(browser, { name, url }) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
    page.on('requestfailed', req => {
      const u = req.url();
      if (u.includes('ajab.damnetworks.com') || u.includes('localhost')) {
        networkErrors.push(`${req.failure()?.errorText} — ${u}`);
      }
    });

    // Track which JS chunk files 404 (real problem vs CMS image 404s which are expected)
    const chunkErrors = [];
    page.on('response', resp => {
      const u = resp.url();
      if (resp.status() === 404 && (u.includes('/_next/') || u.includes('/static/'))) {
        chunkErrors.push(u.split('/').pop());
      }
    });

  const issues = [];
  let finalUrl = url;
  let httpStatus = null;

  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    httpStatus = response?.status();
    finalUrl = page.url();

    // Wait for client-side rendering — pages fetch from API so need extra time
    await page.waitForTimeout(8000);

    // ── Check 1: HTTP status ──────────────────────────────────────────
    if (httpStatus && httpStatus >= 400) {
      issues.push(`HTTP ${httpStatus}`);
    }

    // ── Check 2: Redirected away from /new/ ──────────────────────────
    if (!finalUrl.includes('/new/') && !finalUrl.includes('/new?')) {
      issues.push(`REDIRECT: ended up at ${finalUrl} (missing /new/)`);
    }

    // ── Check 3: Page title / Not Found text ─────────────────────────
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    if (bodyText.toLowerCase().includes('not found') || bodyText.toLowerCase().includes('404')) {
      // Ignore the custom 404 page itself
      if (!url.includes('404')) {
        issues.push(`PAGE SHOWS "not found" or 404 content`);
      }
    }
    if (bodyText.toLowerCase().includes('song not found')) {
      issues.push(`SONG NOT FOUND — usePathname id extraction may have failed`);
    }
    if (bodyText.toLowerCase().includes('reflection not found')) {
      issues.push(`REFLECTION NOT FOUND`);
    }

    // ── Check 4: Links missing /new/ ─────────────────────────────────
    const badLinks = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll('a[href]')];
      return anchors
        .map(a => a.getAttribute('href'))
        .filter(href => {
          if (!href) return false;
          // Internal paths that should have /new/ but don't
          const internalPaths = ['/songs/', '/poems/', '/reflections/', '/people/', '/films/', '/glossary', '/about', '/radio', '/ajab-news'];
          return internalPaths.some(p => href.startsWith(p));
        });
    });
    if (badLinks.length > 0) {
      issues.push(`LINKS MISSING /new/: ${badLinks.slice(0, 3).join(', ')}${badLinks.length > 3 ? ` ...+${badLinks.length - 3} more` : ''}`);
    }

    // ── Check 5: Page is blank (no meaningful content) ────────────────
    const mainContent = await page.evaluate(() => {
      const main = document.querySelector('main, .cl-songs-page-root, .clr-page-root, header, .gradient-bg');
      return main ? main.innerText?.trim().length : 0;
    });
    if (mainContent === 0 || mainContent < 10) {
      issues.push(`PAGE APPEARS BLANK (no main content detected)`);
    }

    // ── Check 6: JS chunk 404s (real problem — not CMS image/API 404s) ─
    if (chunkErrors.length > 0) {
      issues.push(`MISSING JS CHUNKS (404): ${chunkErrors.slice(0, 3).join(', ')}`);
    }

    // ── Check 7: Console errors (filter out expected noise) ───────────
    const relevantErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise rejection') &&
      !e.includes('uploads/') &&       // CMS image 404s are expected
      !e.includes('thumbnail') &&
      !e.includes('api/') &&
      !e.includes('Api/')
    );
    if (relevantErrors.length > 0) {
      issues.push(`JS ERRORS: ${relevantErrors.slice(0, 2).join(' | ')}`);
    }

    // Take screenshot
    const ssPath = path.join(SCREENSHOTS_DIR, `${slug(name)}.png`);
    await page.screenshot({ path: ssPath, fullPage: false });

    const status = issues.length === 0 ? '✅ PASS' : '❌ FAIL';
    if (issues.length === 0) passCount++;
    else failCount++;

    log(`${status}  ${name.padEnd(22)} ${url}`);
    issues.forEach(i => log(`         ⚠  ${i}`));
    results.push({ name, url, finalUrl, httpStatus, issues, screenshot: ssPath });

  } catch (err) {
    failCount++;
    const errMsg = err.message?.split('\n')[0] || String(err);
    log(`❌ FAIL  ${name.padEnd(22)} ${url}`);
    log(`         ⚠  ERROR: ${errMsg}`);
    results.push({ name, url, finalUrl, httpStatus, issues: [`ERROR: ${errMsg}`] });
  } finally {
    await page.close();
  }
}

(async () => {
  log('\n═══════════════════════════════════════════════════════════════════');
  log('  Ajab Shahar — Live Site Audit');
  log(`  Target: ${BASE}`);
  log('═══════════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });

  for (const pageConfig of ALL_PAGES) {
    await testPage(browser, pageConfig);
  }

  await browser.close();

  // ── Summary ──────────────────────────────────────────────────────────
  log('\n═══════════════════════════════════════════════════════════════════');
  log(`  RESULTS: ${passCount} passed, ${failCount} failed out of ${ALL_PAGES.length} pages`);
  log('═══════════════════════════════════════════════════════════════════');

  if (failCount > 0) {
    log('\n  FAILED PAGES:');
    results.filter(r => r.issues.length > 0).forEach(r => {
      log(`  • ${r.name}: ${r.issues.join('; ')}`);
    });
  }

  log(`\n  Screenshots saved to: scripts/audit-screenshots/`);
  log('');
})();
