import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/** Spot-check Songs detail video wrap after 16:9 change (viewport 1440). */
const ids = ['186', '77', '29', '247', '106', '184', '216', '52'];

const outDir = path.resolve('yt-letterbox-check');
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const rows = [];
for (const id of ids) {
  await page.goto(`http://localhost:3000/songs/details/${id}`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForSelector('.cld-video-wrap', { timeout: 25000 });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const el = document.querySelector('.cld-video-wrap');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      vw: window.innerWidth,
      aspectRatio: cs.aspectRatio,
      w: Math.round(r.width * 100) / 100,
      h: Math.round(r.height * 100) / 100,
      measuredAr: +(r.width / r.height).toFixed(4),
      target169: +(16 / 9).toFixed(4),
      border: cs.borderTopWidth,
    };
  });

  const shot = path.join(outDir, `post-16x9-song-${id}.png`);
  await page.locator('.cld-video-wrap').screenshot({ path: shot });
  rows.push({ id, ...info, shot });
  console.log(JSON.stringify(rows[rows.length - 1]));
}

await writeFile(path.join(outDir, 'verify-16x9.json'), JSON.stringify(rows, null, 2));
await browser.close();

const allOk = rows.every(
  (r) =>
    r &&
    r.vw === 1440 &&
    (r.aspectRatio === '16 / 9' || r.aspectRatio === '16/9') &&
    Math.abs(r.measuredAr - 16 / 9) < 0.01
);
console.log(allOk ? 'VERIFY_OK' : 'VERIFY_FAIL');
