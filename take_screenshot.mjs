import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.setViewportSize({width: 1440, height: 900});
  
  console.log('Navigating...');
  await p.goto('http://localhost:3000/songs', {waitUntil: 'domcontentloaded', timeout: 30000});
  
  // Wait for "Filters" text to appear (means page rendered)
  await p.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.textContent?.trim() === 'Filters');
  }, { timeout: 30000 });
  
  console.log('Page loaded, clicking Filters...');
  
  const allButtons = await p.$$('button');
  for (const btn of allButtons) {
    const text = await btn.textContent();
    if (text && text.trim() === 'Filters') {
      await btn.click();
      console.log('Clicked Filters');
      break;
    }
  }
  
  await p.waitForTimeout(2000);
  
  // Full screenshot
  await p.screenshot({path: 'filter_open.png', fullPage: false});
  console.log('Saved filter_open.png');
  
  // Zoom into just the right edge of the filter panel
  await p.screenshot({
    path: 'filter_edge_zoom.png',
    fullPage: false,
    clip: { x: 340, y: 100, width: 160, height: 700 }
  });
  console.log('Saved filter_edge_zoom.png');
  
  await b.close();
})().catch(e => {
  console.error(e.message);
  process.exit(1);
});
