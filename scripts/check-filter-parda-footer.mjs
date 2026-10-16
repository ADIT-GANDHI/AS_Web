import { chromium } from 'playwright';
import fs from 'fs';

fs.mkdirSync('comparison-runs/filter-parda-footer', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const { path, open } of [
  {
    path: '/poems',
    open: async () => {
      await page.locator('button:has-text("See All")').first().click();
    },
  },
  {
    path: '/songs',
    open: async () => {
      await page.getByText('Filters', { exact: true }).first().click();
    },
  },
]) {
  await page.goto(`http://localhost:3000${path}`, {
    waitUntil: 'networkidle',
    timeout: 90000,
  });
  await page.waitForTimeout(1000);
  await open();
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);

  const m = await page.evaluate(() => {
    const d = document.querySelector('.ajab-filter-drawer');
    const f = document.querySelector('footer.footer-bg');
    const content = d?.querySelector(':scope > div[style*="padding-top"]');
    const dr = d.getBoundingClientRect();
    const fr = f.getBoundingClientRect();
    return {
      path: location.pathname,
      drawerH: Math.round(dr.height),
      footerTop: Math.round(fr.top),
      footerZ: getComputedStyle(f).zIndex,
      padBottom: content ? getComputedStyle(content).paddingBottom : null,
      hardCut: Math.abs(dr.bottom - fr.top) < 2 && dr.height < window.innerHeight - 2,
    };
  });
  console.log(JSON.stringify(m));

  const name = path.replace('/', '') || 'home';
  await page.screenshot({
    path: `comparison-runs/filter-parda-footer/${name}-junction.png`,
    clip: { x: 0, y: 200, width: 480, height: 500 },
  });
}

await browser.close();
