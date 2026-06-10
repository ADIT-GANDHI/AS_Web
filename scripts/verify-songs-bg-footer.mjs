/** Ensure marble bg stops at footer (not through black footer body). */
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'Comparison_Out', 'songs-bg-loadmore-test');
const BASE = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/songs`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('.cl-song-grid-item', { timeout: 180_000 });
  await page.waitForTimeout(2000);

  for (let i = 0; i < 3; i++) {
    await page.locator('.cl-load-more-btn').click();
    await page.waitForTimeout(1000);
  }

  const metrics = await page.evaluate(() => {
    const shell = document.querySelector('.cl-songs-page-shell');
    const footer = document.querySelector('footer.footer-bg');
    const layers = document.querySelector('.cl-songs-bg-layers');
    const footerRect = footer?.getBoundingClientRect();
    const layersRect = layers?.getBoundingClientRect();
    return {
      footerTop: footer instanceof HTMLElement ? footer.offsetTop : null,
      shellScrollHeight: shell?.scrollHeight ?? null,
      bgLayersHeight: layers?.offsetHeight ?? null,
      bgBottom: layersRect?.bottom ?? null,
      footerTopViewport: footerRect?.top ?? null,
      bgExtendsPastFooter:
        layersRect && footerRect ? layersRect.bottom > footerRect.top + 200 : null,
    };
  });

  await page.screenshot({ path: path.join(OUT, 'footer-check-full.png'), fullPage: true });

  console.log(JSON.stringify(metrics, null, 2));
  if (metrics.bgExtendsPastFooter) {
    console.error('FAIL: bg extends too far past footer top');
    process.exit(1);
  }
  console.log('PASS: bg capped before footer black zone');

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
