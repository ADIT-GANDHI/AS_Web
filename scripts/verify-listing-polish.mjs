/**
 * PDF-aligned listing polish checks (Reflections intro, Load More when filtered).
 * Run: node scripts/verify-listing-polish.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3000';
const failures = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/reflections`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.clr-intro', { timeout: 60000 });
const introLines = await page.evaluate(() => {
  const el = document.querySelector('.clr-intro');
  if (!el) return 0;
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = range.getClientRects();
  const tops = [...rects].map((r) => Math.round(r.top));
  return new Set(tops).size;
});
if (introLines < 3) {
  failures.push(`reflections intro: ${introLines} line(s) (PDF expects ~3 at 1440px)`);
} else {
  console.log(`✓ reflections intro: ${introLines} lines`);
}

// Figma frame position @ 1920
await page.setViewportSize({ width: 1920, height: 900 });
await page.goto(`${BASE}/reflections`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.clr-intro', { timeout: 60000 });
const pos1920 = await page.evaluate(() => {
  const ir = document.querySelector('.clr-intro')?.getBoundingClientRect();
  return {
    left: ir ? Math.round(ir.left) : 0,
    width: ir ? Math.round(ir.width) : 0,
    belowHeader: ir ? Math.round(ir.top - 191) : 0,
  };
});
if (Math.abs(pos1920.left - 575) > 30) {
  failures.push(`reflections intro left ${pos1920.left}px @ 1920 (expected ~575 centred block)`);
} else {
  console.log(
    `✓ reflections intro @ 1920: left ${pos1920.left}px, width ${pos1920.width}px, y+${pos1920.belowHeader}px`
  );
}
const cardHeights = await page.evaluate(() =>
  [...document.querySelectorAll('.clr-card')]
    .slice(0, 3)
    .map((c) => Math.round(c.getBoundingClientRect().height))
);
if (cardHeights.length >= 3 && new Set(cardHeights).size > 1) {
  failures.push(`reflections cards uneven heights: ${cardHeights.join(', ')}`);
} else if (cardHeights.length >= 3) {
  console.log(`✓ reflections cards uniform height: ${cardHeights[0]}px`);
}
if (pos1920.belowHeader < 4 || pos1920.belowHeader > 14) {
  failures.push(`reflections intro y offset ${pos1920.belowHeader}px (expected ~8 below header)`);
}

// Songs — Load More hidden when A–Z filter shows single tile
await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForSelector('.cl-songs-intro', { timeout: 60000 });
await page.locator('.cl-az-btn', { hasText: 'E' }).click();
await page.waitForTimeout(800);
const songsFiltered = await page.evaluate(() => {
  const countText = document.querySelector('.cl-songs-count')?.textContent?.trim() || '';
  const tiles = document.querySelectorAll('.cl-song-grid-item').length;
  const loadMore = document.querySelector('.cl-load-more-btn');
  return { countText, tiles, loadMoreVisible: Boolean(loadMore && loadMore.offsetParent) };
});
if (songsFiltered.tiles === 1 && songsFiltered.loadMoreVisible) {
  failures.push('songs: Load More visible with only 1 filtered tile');
} else if (songsFiltered.tiles === 1) {
  console.log('✓ songs: Load More hidden when 1 tile (E filter)');
} else {
  console.log(`  songs E filter: ${songsFiltered.tiles} tile(s) — skip load-more check`);
}

// Meta tooltips on song card
const titleAttr = await page
  .locator('.cl-song-card-meta')
  .first()
  .getAttribute('title')
  .catch(() => null);
if (titleAttr && titleAttr.length > 3) {
  console.log('✓ songs: meta title tooltip present');
} else if (songsFiltered.tiles > 0) {
  failures.push('songs: missing title tooltip on sings/poet meta');
}

await browser.close();

if (failures.length) {
  console.error('\n❌ Listing polish checks failed:');
  failures.forEach((f) => console.error('  -', f));
  process.exit(1);
}
console.log('\n✅ Listing polish OK');
