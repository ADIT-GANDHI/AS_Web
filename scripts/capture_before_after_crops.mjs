import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const DEST_BASE = 'd:\\Mihir_Avni\\Ajab_New\\ajabshar-main\\Songs_Localhost_Comparison';
const DEST_LISTING = path.join(DEST_BASE, '1_Songs_Listing');
const DEST_FILTER = path.join(DEST_BASE, '2_Filter_Panel');
const DEST_DETAILS = path.join(DEST_BASE, '3_Song_Details');

// Ensure directories exist
fs.mkdirSync(DEST_LISTING, { recursive: true });
fs.mkdirSync(DEST_FILTER, { recursive: true });
fs.mkdirSync(DEST_DETAILS, { recursive: true });

async function dismissDevOverlays(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] { display: none !important; }
    `,
  }).catch(() => {});
}

async function safeElementScreenshot(page, selector, outputPath, index = 0) {
  try {
    const locator = page.locator(selector);
    const count = await locator.count();
    if (count === 0) {
      console.warn(`No elements matched selector: ${selector}`);
      return false;
    }
    const element = locator.nth(index);
    if (await element.isVisible()) {
      await element.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(300); // stable layout/scroll

      const box = await element.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        await element.screenshot({ path: outputPath });
        console.log(`Saved: ${path.basename(outputPath)}`);
        return true;
      } else {
        console.warn(`Skipping screenshot for ${selector}: zero-size bounding box`, box);
      }
    } else {
      console.warn(`Element is not visible: ${selector}`);
    }
  } catch (err) {
    console.error(`Failed to screenshot ${selector}:`, err);
  }
  return false;
}

async function run() {
  const VIEW_W = 1440;
  const VIEW_H = 900; // Standard viewport height so fixed elements center within standard viewport correctly

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: VIEW_W, height: VIEW_H },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log('--- Navigating to /songs ---');
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await dismissDevOverlays(page);

  // Full page listing
  await page.screenshot({ path: path.join(DEST_LISTING, 'localhost-songs-listing.png'), fullPage: true });
  console.log('Saved: localhost-songs-listing.png');

  // 1. Logo Nudge Crop
  await page.screenshot({
    path: path.join(DEST_LISTING, 'localhost-logo-zone.png'),
    clip: { x: 0, y: 0, width: 320, height: 160 }
  });
  console.log('Saved: localhost-logo-zone.png');

  // 2. Intro Text Crop
  await safeElementScreenshot(page, '.cl-songs-intro', path.join(DEST_LISTING, 'localhost-intro-zone.png'));

  // 3. Filter Bar (A-Z) Crop
  await safeElementScreenshot(page, '.cl-filter-bar', path.join(DEST_LISTING, 'localhost-filter-bar-zone.png'));

  // 4. Song Card Crop
  await safeElementScreenshot(page, '.cl-song-grid-item', path.join(DEST_LISTING, 'localhost-song-card-zone.png'), 0);

  // --- FILTER SIDE Drawer ---
  console.log('--- Opening Filter Panel ---');
  await page.click('button:has-text("Filters")');
  await page.waitForTimeout(1000);
  await dismissDevOverlays(page);

  // Empty Filter Panel Crop
  await page.screenshot({
    path: path.join(DEST_FILTER, 'localhost-filter-panel-empty.png'),
    clip: { x: 0, y: 0, width: 440, height: 900 }
  });
  console.log('Saved: localhost-filter-panel-empty.png');

  // Select some filters
  const lis = page.locator('ul li');
  console.log('Selecting filter items...');
  try {
    await lis.nth(0).click(); // First singer
    await page.waitForTimeout(300);
    await lis.nth(2).click(); // Third singer
    await page.waitForTimeout(500);
  } catch (err) {
    console.warn('Could not click filter items:', err.message);
  }

  // Active Filter Panel Crop
  await page.screenshot({
    path: path.join(DEST_FILTER, 'localhost-filter-panel-with-chips.png'),
    clip: { x: 0, y: 0, width: 440, height: 900 }
  });
  console.log('Saved: localhost-filter-panel-with-chips.png');

  // Close filter drawer
  try {
    await page.click('button[aria-label="Close filters"]');
    await page.waitForTimeout(500);
  } catch (err) {
    console.warn('Could not close filter drawer:', err.message);
  }

  // --- DETAIL PAGE ---
  console.log('--- Navigating to /songs/details/1 ---');
  await page.goto(`${BASE}/songs/details/1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await dismissDevOverlays(page);

  // Full page details
  await page.screenshot({ path: path.join(DEST_DETAILS, 'localhost-song-detail.png'), fullPage: true });
  console.log('Saved: localhost-song-detail.png');

  // 1. Versions Carousel Crop
  await safeElementScreenshot(page, '.cld-versions-section', path.join(DEST_DETAILS, 'localhost-versions-carousel.png'));

  // 2. Video Player Frame Crop (capturing full alignment container)
  await safeElementScreenshot(page, '.cld-detail-body-align', path.join(DEST_DETAILS, 'localhost-video-player.png'));

  // 3. Metadata details row Crop
  await safeElementScreenshot(page, '.cld-song-header', path.join(DEST_DETAILS, 'localhost-details-header.png'));

  // 4. Script Selector buttons (अ, ā, a) Crop
  await safeElementScreenshot(page, '.cld-lang-toggle', path.join(DEST_DETAILS, 'localhost-script-selectors.png'));

  // 5. Keyword tag list Crop
  await safeElementScreenshot(page, '.cld-keywords-wrap', path.join(DEST_DETAILS, 'localhost-keywords.png'));

  // 6. Notes popup trigger Crop
  await safeElementScreenshot(page, '.cld-notes-glossary-row', path.join(DEST_DETAILS, 'localhost-notes-triggers.png'));

  // 7. Click on Notes and capture popup drawer
  console.log('Opening Notes Sidebar...');
  try {
    await page.click('button:has-text("NOTES")');
    await page.waitForTimeout(800);
    
    // Notes drawer might be fixed position. Let's take page viewport screenshot instead or safeElementScreenshot
    // Let's use page screenshot with clip or just full sidebar
    await safeElementScreenshot(page, '.cld-notes-sidebar', path.join(DEST_DETAILS, 'localhost-notes-popup.png'));

    // Close Notes
    await page.click('.cld-notes-sidebar-close');
    await page.waitForTimeout(500);
  } catch (err) {
    console.warn('Failed to open/screenshot/close notes sidebar:', err.message);
  }

  // 8. Related list section Crop
  await safeElementScreenshot(page, '.cld-related', path.join(DEST_DETAILS, 'localhost-related-list.png'));

  await browser.close();
  console.log('--- ALL SCREENSHOTS SAVED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('Playwright execution error:', err);
});
