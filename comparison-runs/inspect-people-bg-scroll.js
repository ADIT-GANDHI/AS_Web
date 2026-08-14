/** Inspect People listing bg while scrolling — current live behavior. */
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:3000/people', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('.clpe-page', { timeout: 60000 });
  await p.waitForTimeout(3000);

  const info = await p.evaluate(() => {
    const shell = document.querySelector('.cl-songs-page-shell');
    const bg = document.querySelector('.repeating-page-bg');
    const sheets = [...document.querySelectorAll('.repeating-page-bg > div')];
    const cs = bg ? getComputedStyle(bg) : null;
    const sheet0 = sheets[0] ? getComputedStyle(sheets[0]) : null;
    return {
      shellH: shell?.clientHeight,
      bgH: bg?.getBoundingClientRect().height,
      sheetCount: sheets.length,
      bgImage: sheet0?.backgroundImage?.slice(0, 80),
      bgSize: sheet0?.backgroundSize,
      bgRepeat: sheet0?.backgroundRepeat,
      tileUrl: sheet0?.backgroundImage,
    };
  });
  console.log('CURRENT BG:', JSON.stringify(info, null, 2));

  // scroll and sample screenshots at several Y positions to check seams
  const positions = [0, 800, 1600, 2400, 3200];
  for (const y of positions) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(400);
    await p.screenshot({
      path: `comparison-runs/people-scroll-y${y}.png`,
      clip: { x: 0, y: 200, width: 1440, height: 500 },
    });
  }

  // load more if present to grow page
  const loadMore = p.getByRole('button', { name: /load more/i });
  if (await loadMore.count()) {
    await loadMore.first().click();
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 900));
    await p.waitForTimeout(500);
    await p.screenshot({ path: 'comparison-runs/people-scroll-bottom.png', fullPage: false });
    const h2 = await p.evaluate(() => ({
      scrollH: document.documentElement.scrollHeight,
      bgH: document.querySelector('.repeating-page-bg')?.getBoundingClientRect().height,
    }));
    console.log('AFTER LOAD MORE:', h2);
  }

  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
