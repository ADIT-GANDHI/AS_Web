/**
 * Capture WavyCard shadow before/after asset swap at 1440px.
 * Run with env PHASE=before or PHASE=after.
 */
const { chromium } = require('playwright');

const PHASE = process.env.PHASE || 'before';
const OUT = `comparison-runs/wavy-card-shadow-${PHASE}`;

const PAGES = [
  { name: 'songs', url: '/songs', waitFor: '.wc-card' },
  { name: 'reflections', url: '/reflections', waitFor: '.wc-card' },
  { name: 'people', url: '/people', waitFor: '.wc-card,.clpe-page' },
];

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

  for (const pg of PAGES) {
    await p.goto(`http://localhost:3000${pg.url}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await p.waitForSelector(pg.waitFor, { timeout: 60000 });
    await p.waitForTimeout(3000);

    // Full viewport
    await p.screenshot({ path: `${OUT}/${pg.name}-full.png`, fullPage: false });

    // Zoom into first card's bottom shadow
    const card = await p.locator('.wc-card').first();
    if (await card.count()) {
      const box = await card.boundingBox();
      if (box) {
        await p.screenshot({
          path: `${OUT}/${pg.name}-card-closeup.png`,
          clip: {
            x: Math.max(0, box.x - 10),
            y: Math.max(0, box.y + box.height - 60),
            width: Math.min(box.width + 20, 1440),
            height: 100,
          },
        });
      }
    }

    console.log(`${PHASE}: ${pg.name} done`);
  }

  await b.close();
  console.log(`\nAll ${PHASE} captures saved to ${OUT}/`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
