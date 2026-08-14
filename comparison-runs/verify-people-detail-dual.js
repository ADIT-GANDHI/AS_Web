const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const bad = [];
  p.on('response', (r) => {
    if (r.status() >= 400 && /people_detailbg|middle_white/.test(r.url())) {
      bad.push(`${r.status()} ${r.url()}`);
    }
  });

  await p.goto('http://localhost:3000/people', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.clpe-page a[href*="/people/"]', { timeout: 60000 });
  const href = await p.locator('.clpe-page a[href*="/people/"]').first().getAttribute('href');
  await p.goto('http://localhost:3000' + href, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('.clped-page', { timeout: 60000 });
  await p.waitForTimeout(3500);

  const info = await p.evaluate(() => {
    const sheets = [...document.querySelectorAll('.repeating-page-bg__sheet')];
    const overlay = document.querySelector('.repeating-page-bg__overlay');
    const overlaySheet = document.querySelector('.repeating-page-bg__overlay-sheet');
    const s0 = sheets[0] && getComputedStyle(sheets[0]);
    const ov = overlay && overlay.getBoundingClientRect();
    const os = overlaySheet && getComputedStyle(overlaySheet);
    return {
      textureUrl: s0?.backgroundImage,
      textureSize: s0?.backgroundSize,
      sheetCount: sheets.length,
      overlayW: ov && Math.round(ov.width),
      overlayLeft: ov && Math.round(ov.left),
      expectedMidW: Math.round(1440 * (1483 / 1922)),
      overlayUrl: os?.backgroundImage,
      hasOverlay: Boolean(overlay),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('404s:', bad.length ? bad : 'none');
  console.log(
    'art-ratio:',
    info.overlayW === info.expectedMidW ? 'MATCH' : `MISMATCH ${info.overlayW} vs ${info.expectedMidW}`
  );
  console.log(
    'centered:',
    Math.abs(info.overlayLeft - (1440 - info.overlayW) / 2) <= 1 ? 'YES' : 'NO'
  );

  for (const y of [0, 1500, 3000]) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(400);
    await p.screenshot({
      path: `comparison-runs/people-detail-dual-y${y}.png`,
      clip: { x: 0, y: 120, width: 1440, height: 650 },
    });
  }

  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
