import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join } from 'path';

const OUT = join(process.cwd(), 'Comparison_Out', 'Songs_BG_Check');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const vw of [1920, 1440]) {
  const page = await browser.newPage({ viewport: { width: vw, height: 1080 } });
  await page.goto('http://localhost:3000/songs', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    let y = 0;
    while (y < document.documentElement.scrollHeight) {
      window.scrollTo(0, y);
      y += step;
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 800);
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(OUT, `songs-listing-${vw}-scroll.png`), fullPage: false });
  await page.screenshot({ path: join(OUT, `songs-listing-${vw}-full.png`), fullPage: true });
}
await browser.close();
console.log('Wrote screenshots to', OUT);
