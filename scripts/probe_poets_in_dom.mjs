import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/songs');
  await page.waitForTimeout(2000);
  
  // Click on Filters
  await page.click('button:has-text("Filters")');
  await page.waitForTimeout(800);
  
  // Switch to Poet tab
  await page.click('button:has-text("Poet")');
  await page.waitForTimeout(500);
  
  // Get all li texts
  const poets = await page.locator('ul li').allInnerTexts();
  console.log(`Total poets listed in drawer: ${poets.length}`);
  
  const kabirPoets = poets.filter(p => p.toLowerCase().includes('kabir'));
  console.log('Poets containing "Kabir" in the drawer checklist:');
  kabirPoets.forEach(p => console.log(`  - "${p}"`));
  
  await browser.close();
}

run();
