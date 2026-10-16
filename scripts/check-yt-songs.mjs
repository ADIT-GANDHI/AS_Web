import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3000/songs', {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.waitForTimeout(2500);
const href = await page.locator('a[href*="/songs/details/"]').first().getAttribute('href');
console.log('href', href);
await page.goto(`http://localhost:3000${href}`, {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.waitForTimeout(2500);
const before = await page.evaluate(() => {
  const wrap = document.querySelector('.cld-video-wrap');
  return {
    hasWrap: !!wrap,
    hasFacade: !!wrap?.querySelector('.ajab-yt-facade'),
    hasIframe: !!wrap?.querySelector('iframe'),
    playBtn: !!wrap?.querySelector('.ajab-yt-play'),
    watchLater: /watch later/i.test(wrap?.textContent || ''),
  };
});
console.log('before', before);
await page.locator('.cld-video-wrap').first().screenshot({
  path: 'comparison-runs/yt-facade-check/songs-before.png',
});
if (before.hasFacade) {
  await page.locator('.ajab-yt-facade').first().click();
  await page.waitForTimeout(800);
  console.log(
    'after',
    await page.evaluate(() => {
      const wrap = document.querySelector('.cld-video-wrap');
      return {
        hasFacade: !!wrap?.querySelector('.ajab-yt-facade'),
        hasIframe: !!wrap?.querySelector('iframe'),
        src: wrap?.querySelector('iframe')?.src?.slice(0, 100),
      };
    })
  );
}
await browser.close();
process.exit(before.hasFacade && !before.hasIframe && before.playBtn && !before.watchLater ? 0 : 1);
