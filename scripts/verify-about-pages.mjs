/**
 * Verify About pages match PDF tab spec (7.About_01.05.2025).
 * Run: node scripts/verify-about-pages.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';

const EXPECTED = {
  ajab: ['INTRO', 'TRANSLIT GUIDE', 'COPYRIGHTS'],
  kabir: ['INTRO', 'TEAM', 'FILMS', 'BOOKS', 'SHABAD SHAALA'],
};

const failures = [];

async function checkTab(page, brand) {
  const url = `${BASE}/about?tab=${brand}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('.about-toggle-wrap', { timeout: 30000 });

  const tabs = await page.locator('.about-toggle-btn').allTextContents();
  const normalized = tabs.map((t) => t.trim().replace(/\s+/g, ' '));

  for (const expected of EXPECTED[brand]) {
    if (!normalized.includes(expected)) {
      failures.push(`${brand}: missing tab "${expected}" (got: ${normalized.join(' | ')})`);
    }
  }

  for (const tab of normalized) {
    if (!EXPECTED[brand].includes(tab)) {
      failures.push(`${brand}: unexpected tab "${tab}"`);
    }
  }

  const brandSwitch = await page.locator('.about-brand-switch').count();
  if (brandSwitch > 0) {
    failures.push(`${brand}: brand switch still visible (should use header ABOUT only)`);
  }

  const logoAlt = brand === 'ajab' ? 'Ajab Shahar' : 'Kabir Project';
  const logo = page.locator(`.about-logo-wrap img[alt="${logoAlt}"]`);
  if ((await logo.count()) === 0) {
    failures.push(`${brand}: missing logo alt="${logoAlt}"`);
  }

  if (brand === 'ajab') {
    await page.locator('.about-toggle-btn', { hasText: 'INTRO' }).click();
    await page.waitForTimeout(500);
    const intro = await page.locator('.about-section-label').first().textContent();
    if (!intro?.includes('Introduction to Ajab Shahar')) {
      failures.push(`ajab intro: expected "Introduction to Ajab Shahar", got "${intro}"`);
    }
  }

  if (brand === 'kabir') {
    await page.locator('.about-toggle-btn', { hasText: 'INTRO' }).click();
    await page.waitForTimeout(500);
    const intro = await page.locator('.about-section-label').first().textContent();
    if (!intro?.includes('Introduction to Kabir Project')) {
      failures.push(`kabir intro: expected "Introduction to Kabir Project", got "${intro}"`);
    }
  }

  console.log(`✓ ${brand}: tabs [${normalized.join(' | ')}], logo OK`);
}

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await checkTab(page, 'ajab');
  await checkTab(page, 'kabir');
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('\n❌ About verification failed:');
  failures.forEach((f) => console.error('  -', f));
  process.exit(1);
}

console.log('\n✅ About pages match PDF tab spec');
