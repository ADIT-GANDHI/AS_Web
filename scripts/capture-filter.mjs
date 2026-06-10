import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Open the filter panel
await page.click('button:has-text("Filters")');
await page.waitForTimeout(1200);

// Select 3 names
const lis = page.locator('ul li');
await lis.nth(0).click(); // Abdullah Ismail Jat
await page.waitForTimeout(300);
await lis.nth(2).click(); // Arun Goyal
await page.waitForTimeout(300);
await lis.nth(4).click(); // Babu Khan Bagadwa
await page.waitForTimeout(500);

// Screenshot: 3 selected
await page.screenshot({
  path: 'D:/Ajab Shahar/final-comparison/panel_zoom.png',
  clip: { x: 0, y: 180, width: 440, height: 680 }
});
console.log('Step 1: 3 items selected — screenshot saved');

// Now remove the 2nd chip (Arun Goyal ×)
// Chips are rendered as buttons with aria-label="Remove <name>"
const removeBtn = page.locator('button[aria-label="Remove Arun Goyal"]');
await removeBtn.click();
await page.waitForTimeout(800);

// Screenshot: after removing Arun Goyal — panel should still be open, 2 chips remain
await page.screenshot({
  path: 'D:/Ajab Shahar/final-comparison/panel_after_remove.png',
  clip: { x: 0, y: 180, width: 440, height: 680 }
});
console.log('Step 2: Removed "Arun Goyal" — panel still open, 2 chips should remain');

// Add one more after the removal
await lis.nth(3).click(); // Asariya Khima Jagariya
await page.waitForTimeout(500);

// Full page screenshot final state
await page.screenshot({ path: 'D:/Ajab Shahar/final-comparison/4_browser_filter_panel.png' });
console.log('Step 3: Added another after removal — full page saved');

await browser.close();
console.log('done');
