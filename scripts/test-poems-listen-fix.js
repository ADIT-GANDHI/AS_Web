const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = path.join('comparison-runs', 'poems-listen-fix');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await chromium.launch({ headless: true });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('page:' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('c:' + m.text().slice(0, 140));
  });

  await page.goto('http://localhost:3000/poems', {
    waitUntil: 'networkidle',
    timeout: 120000,
  });
  await page.waitForSelector('.clp-page', { timeout: 60000 });
  await page.waitForTimeout(3000);

  await page.locator('.clp-actions button', { hasText: 'LISTEN' }).click();
  await page.waitForTimeout(1500);

  let meta = await page.evaluate(() => {
    const pop = document.querySelector('.clp-player-popup');
    const poem = document.querySelector('.clp-poem-text');
    const pr = pop?.getBoundingClientRect();
    const lr = poem?.getBoundingClientRect();
    const clips = [...document.querySelectorAll('.clp-player-clip')].map(
      (b) => b.querySelector('.clp-player-clip-name')?.textContent
    );
    const overlap =
      pr && lr
        ? !(pr.right < lr.left || pr.left > lr.right || pr.bottom < lr.top || pr.top > lr.bottom)
        : null;
    return {
      open: !!pop,
      left: pr && Math.round(pr.left),
      poemRight: lr && Math.round(lr.right),
      gap: pr && lr ? Math.round(pr.left - lr.right) : null,
      overlap,
      clips,
      clipCount: clips.length,
      iframe: !!document.querySelector('.clp-soundcloud-widget'),
    };
  });
  console.log('listen open', JSON.stringify(meta, null, 2));
  await page.screenshot({ path: path.join(OUT, 'listen.png') });

  const clipBtns = page.locator('.clp-player-clip');
  const n = await clipBtns.count();
  if (n > 1) {
    await clipBtns.nth(1).click();
    await page.waitForTimeout(800);
    const active = await page.locator('.clp-player-clip.is-active .clp-player-clip-name').textContent();
    console.log('selected 2nd', active);
  }

  await page.locator('.clp-player-play').click();
  await page.waitForTimeout(3500);
  const playing = await page.evaluate(() => {
    const times = [...document.querySelectorAll('.clp-player-timeline .clp-player-time')].map(
      (el) => el.textContent
    );
    const pct = document.querySelector('.clp-player-progress__fill')?.getAttribute('style');
    return {
      times,
      pct,
      playingBtn: !!document.querySelector('.clp-player-play.is-playing'),
    };
  });
  console.log('after play', playing);

  await page.locator('button[aria-label="Volume"]').click();
  await page.waitForTimeout(300);
  const volCount = await page.locator('.clp-player-volume-slider').count();
  console.log('volume visible', volCount);
  if (volCount) {
    await page.locator('.clp-player-volume-slider').evaluate((el) => {
      el.value = '0.2';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.locator('.clp-actions button', { hasText: 'NOTES' }).click();
  await page.waitForTimeout(800);
  meta = await page.evaluate(() => {
    const sheet = document.querySelector('.clp-side-sheet');
    const r = sheet?.getBoundingClientRect();
    return {
      open: !!sheet,
      left: r && Math.round(r.left),
      title: (sheet?.textContent || '').slice(0, 90),
      h: r && Math.round(r.height),
    };
  });
  console.log('notes', meta);
  await page.screenshot({ path: path.join(OUT, 'notes.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  await page.locator('.clp-actions button', { hasText: 'GLOSSARY' }).click();
  await page.waitForTimeout(800);
  meta = await page.evaluate(() => {
    const sheet = document.querySelector('.clp-side-sheet');
    const r = sheet?.getBoundingClientRect();
    return {
      open: !!sheet,
      left: r && Math.round(r.left),
      sample: (sheet?.textContent || '').slice(0, 100),
      h: r && Math.round(r.height),
    };
  });
  console.log('glossary', meta);
  await page.screenshot({ path: path.join(OUT, 'glossary.png') });

  console.log('errors', errors.slice(0, 15));
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
