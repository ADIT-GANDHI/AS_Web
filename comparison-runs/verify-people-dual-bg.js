/** Verify People listing dual-layer bg geometry + scroll seams. */
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const asset404 = [];
  p.on('response', (r) => {
    if (r.status() >= 400 && /people_new|middle_white/.test(r.url())) {
      asset404.push(`${r.status()} ${r.url()}`);
    }
  });

  await p.goto('http://localhost:3000/people', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForSelector('.clpe-page', { timeout: 60000 });
  await p.waitForTimeout(3500);

  const info = await p.evaluate(() => {
    const bg = document.querySelector('.repeating-page-bg');
    const sheets = [...document.querySelectorAll('.repeating-page-bg__sheet')];
    const overlay = document.querySelector('.repeating-page-bg__overlay');
    const overlaySheet = document.querySelector('.repeating-page-bg__overlay-sheet');
    const s0 = sheets[0] && getComputedStyle(sheets[0]);
    const ov = overlay && overlay.getBoundingClientRect();
    const os = overlaySheet && getComputedStyle(overlaySheet);
    return {
      sheetCount: sheets.length,
      textureUrl: s0?.backgroundImage,
      textureSize: s0?.backgroundSize,
      overlayW: ov && Math.round(ov.width),
      overlayLeft: ov && Math.round(ov.left),
      overlayRight: ov && Math.round(ov.right),
      expectedMidW: Math.round(1440 * (1483 / 1922)),
      overlayBgSize: os?.backgroundSize,
      overlayUrl: os?.backgroundImage,
      bgH: bg && Math.round(bg.getBoundingClientRect().height),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('ASSET 404s:', asset404.length ? asset404 : 'none');
  console.log(
    'middle art-ratio width:',
    info.overlayW === info.expectedMidW ? 'MATCH' : `MISMATCH ${info.overlayW} vs ${info.expectedMidW}`
  );
  console.log(
    'middle centered:',
    info.overlayLeft != null && Math.abs(info.overlayLeft - (1440 - info.overlayW) / 2) <= 1
      ? 'YES'
      : `NO left=${info.overlayLeft}`
  );

  // detail must still use old plate
  await p.goto('http://localhost:3000/people/0', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await p.waitForTimeout(3000);
  const detail = await p.evaluate(() => {
    const s0 = document.querySelector('.repeating-page-bg__sheet');
    const overlay = document.querySelector('.repeating-page-bg__overlay');
    return {
      url: s0 && getComputedStyle(s0).backgroundImage,
      hasOverlay: Boolean(overlay),
    };
  });
  console.log('DETAIL:', JSON.stringify(detail));

  await p.goto('http://localhost:3000/people', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.clpe-page', { timeout: 60000 });
  await p.waitForTimeout(2500);

  for (const y of [0, 1200, 2500, 4000]) {
    await p.evaluate((yy) => window.scrollTo(0, yy), y);
    await p.waitForTimeout(500);
    await p.screenshot({
      path: `comparison-runs/people-dual-y${y}.png`,
      clip: { x: 0, y: 150, width: 1440, height: 600 },
    });
  }

  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
