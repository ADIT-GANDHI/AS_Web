import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/songs');
  await page.waitForTimeout(2000);
  
  // Click on Filters
  await page.click('button:has-text("Filters")');
  await page.waitForTimeout(800);
  
  // Get all li texts
  const singers = await page.locator('ul li').allInnerTexts();
  console.log(`Total singers listed in drawer: ${singers.length}`);
  
  const matches = singers.filter(s => s.toLowerCase().includes('dayaram') || s.toLowerCase().includes('saroliya'));
  console.log('Singers matching Dayaram or Saroliya:');
  matches.forEach(s => console.log(`  - "${s}"`));
  
  await browser.close();
}

run();
