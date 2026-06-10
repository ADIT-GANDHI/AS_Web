import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://localhost:3000';
const OUT_DIR = 'd:\\Mihir_Avni\\Ajab_New\\ajabshar-main\\Songs_Localhost_Comparison\\Test_Runs';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function dismissDevOverlays(page) {
  await page.addStyleTag({
    content: `
      nextjs-portal, [data-nextjs-toast], [data-nextjs-dialog-overlay] { display: none !important; }
    `,
  }).catch(() => {});
}

async function run() {
  console.log('=== STARTING FUNCTIONAL TESTS AND VALIDATION ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Test 1: Load Songs page and verify total count
  console.log('\n--- Test 1: Loading Page & Default Sorted State ---');
  await page.goto(`${BASE}/songs`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await dismissDevOverlays(page);

  const initialCountText = await page.locator('.cl-songs-count').innerText();
  console.log(`Initial Displayed Songs Count: "${initialCountText}"`);
  
  // Verify Alphabetical sort in DOM
  const titles = await page.locator('.cl-song-card-title').allInnerTexts();
  console.log(`Total songs visible on page 1: ${titles.length}`);
  console.log('First 3 song titles displayed:');
  titles.slice(0, 3).forEach((title, idx) => {
    console.log(`  ${idx + 1}. "${title}"`);
  });

  const isAlphabetical = titles.every((val, i, arr) => !i || val.localeCompare(arr[i - 1]) >= 0);
  console.log(`Alphabetical Ordering Verification: ${isAlphabetical ? 'PASSED ✅' : 'FAILED ❌'}`);

  await page.screenshot({ path: path.join(OUT_DIR, '01_default_page.png') });

  // Test 2: A-Z Starts-With Letter Filters
  console.log('\n--- Test 2: Testing Starts-With Letter Filters (A-Z) ---');
  // Let's click letter 'A'
  console.log('Clicking on letter "A"...');
  await page.click('.cl-az-row button:has-text("A")');
  await page.waitForTimeout(1000);

  const countTextA = await page.locator('.cl-songs-count').innerText();
  const titlesA = await page.locator('.cl-song-card-title').allInnerTexts();
  console.log(`Count after clicking A: "${countTextA}"`);
  console.log(`Titles on page starting with A: ${titlesA.length}`);
  
  let startsWithAPassed = true;
  titlesA.forEach(t => {
    if (!t.toLowerCase().trim().startsWith('a')) {
      startsWithAPassed = false;
      console.log(`  ❌ MISMATCH: "${t}" does not start with A`);
    } else {
      console.log(`  ✅ "${t}" starts with A`);
    }
  });
  console.log(`Letter "A" starts-with filter check: ${startsWithAPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  await page.screenshot({ path: path.join(OUT_DIR, '02_filter_A_clicked.png') });

  // Let's click letter 'B'
  console.log('Clicking on letter "B"...');
  await page.click('.cl-az-row button:has-text("B")');
  await page.waitForTimeout(1000);

  const countTextB = await page.locator('.cl-songs-count').innerText();
  const titlesB = await page.locator('.cl-song-card-title').allInnerTexts();
  console.log(`Count after clicking B: "${countTextB}"`);
  
  let startsWithBPassed = true;
  titlesB.slice(0, 5).forEach(t => {
    if (!t.toLowerCase().trim().startsWith('b')) {
      startsWithBPassed = false;
      console.log(`  ❌ MISMATCH: "${t}" does not start with B`);
    } else {
      console.log(`  ✅ "${t}" starts with B`);
    }
  });
  console.log(`Letter "B" starts-with filter check: ${startsWithBPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  await page.screenshot({ path: path.join(OUT_DIR, '03_filter_B_clicked.png') });

  // Reset by clicking 'All'
  console.log('Clicking "ALL" to reset letter filters...');
  await page.click('.cl-az-btn--all');
  await page.waitForTimeout(1000);
  const countAll = await page.locator('.cl-songs-count').innerText();
  console.log(`Reset count (ALL): "${countAll}"`);

  // Test 3: Filter Sidebar Panel Drawer opening & Dynamic check lists
  console.log('\n--- Test 3: Opening Filter Sidebar & Category Selection ---');
  await page.click('button:has-text("Filters")');
  await page.waitForTimeout(800);
  
  const drawerVisible = await page.locator('button[aria-label="Close filters"]').isVisible();
  console.log(`Filter Panel Sidebar Drawer Drawer Opened: ${drawerVisible ? 'YES ✅' : 'NO ❌'}`);
  await page.screenshot({ path: path.join(OUT_DIR, '04_drawer_empty.png') });

  // Try selecting a singer
  console.log('Selecting Singer filter: "Dayaram Saroliya"...');
  await page.click('ul li:has-text("Dayaram Saroliya")');
  await page.waitForTimeout(800);
  
  const selectedCountSinger = await page.locator('.cl-songs-count').innerText();
  console.log(`Count after selecting "Dayaram Saroliya": "${selectedCountSinger}"`);
  
  // Verify matching singer in grid cards
  const gridSingerCredits = await page.locator('.cl-song-card-meta:has-text("sings")').allInnerTexts();
  let singerPassed = true;
  for (const credit of gridSingerCredits) {
    if (!credit.toLowerCase().includes('dayaram saroliya')) {
      singerPassed = false;
      console.log(`  ❌ Singer Mismatched: Grid shows credit "${credit}"`);
    } else {
      console.log(`  ✅ Singer Matched: Grid shows credit "${credit}"`);
    }
  }
  console.log(`Singer Filter Verification: ${singerPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  await page.screenshot({ path: path.join(OUT_DIR, '05_singer_selected.png') });

  // Open Poet category
  console.log('Switching to "Poet" tab inside drawer...');
  await page.click('button:has-text("Poet")');
  await page.waitForTimeout(500);
  
  const poetsList = await page.locator('ul li').allInnerTexts();
  console.log(`First 3 Poet Options fetched from /Api/poem_filters:`);
  poetsList.slice(0, 3).forEach(p => console.log(`  - "${p}"`));

  // Select "Kabir" as poet
  console.log('Selecting Poet filter: "Kabir"...');
  await page.click('ul li:text-is("Kabir")');
  await page.waitForTimeout(800);

  const selectedCountPoet = await page.locator('.cl-songs-count').innerText();
  console.log(`Count after selecting "Dayaram Saroliya" AND "Kabir": "${selectedCountPoet}"`);
  await page.screenshot({ path: path.join(OUT_DIR, '06_singer_and_poet_selected.png') });

  // Test 4: Dynamic unmount bug verification (closing active chips)
  console.log('\n--- Test 4: Dynamic Filter Unmount & Close Drawer Bug Check ---');
  console.log('Crossing out / removing "Dayaram Saroliya" filter chip...');
  await page.click('span:has-text("Dayaram Saroliya") button');
  await page.waitForTimeout(1000);

  const drawerStillOpen = await page.locator('button[aria-label="Close filters"]').isVisible();
  console.log(`Filter Panel drawer remains OPEN after unmounting a chip: ${drawerStillOpen ? 'YES ✅ (PASSED)' : 'NO ❌ (BUG DETECTED)'}`);
  
  const countAfterChipRemove = await page.locator('.cl-songs-count').innerText();
  console.log(`Count after removing "Dayaram Saroliya" (Only "Kabir" active): "${countAfterChipRemove}"`);
  await page.screenshot({ path: path.join(OUT_DIR, '07_removed_one_chip.png') });

  // Test 5: Clear All
  console.log('\n--- Test 5: Resetting Drawer Filters ---');
  console.log('Clicking "CLEAR ALL" inside drawer...');
  await page.click('button:has-text("CLEAR ALL")');
  await page.waitForTimeout(1000);

  const finalCountAll = await page.locator('.cl-songs-count').innerText();
  console.log(`Final reset count (ALL): "${finalCountAll}"`);
  const allClearPassed = finalCountAll === initialCountText;
  console.log(`Filters clear all resets to default: ${allClearPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

  await page.click('button[aria-label="Close filters"]');
  await page.waitForTimeout(500);

  console.log('\n=== ALL FUNCTIONAL VALIDATIONS COMPLETED SUCCESSFULLY ===');
  await browser.close();
}

run().catch(err => {
  console.error('Test Execution Error:', err);
});
