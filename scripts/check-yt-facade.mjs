import { chromium } from 'playwright';
import fs from 'fs';

fs.mkdirSync('comparison-runs/yt-facade-check', { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const results = [];

async function checkDetail(name, url) {
  const entry = { name, url };
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2500);

    const before = await page.evaluate(() => {
      const wrap =
        document.querySelector('.cld-video-wrap') ||
        document.querySelector('.clrd-video-wrap') ||
        document.querySelector('.clfd-video-wrap');
      if (!wrap) return { error: 'no video wrap' };
      const facade = wrap.querySelector('.ajab-yt-facade');
      const iframe = wrap.querySelector('iframe');
      const text = (wrap.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        hasFacade: !!facade,
        hasIframe: !!iframe,
        playBtn: !!wrap.querySelector('.ajab-yt-play'),
        hasWatchLater: /watch later/i.test(text),
        hasShare: /\bshare\b/i.test(text),
        wrapText: text.slice(0, 80),
      };
    });
    entry.before = before;

    await page.locator('.cld-video-wrap, .clrd-video-wrap, .clfd-video-wrap').first().screenshot({
      path: `comparison-runs/yt-facade-check/${name}-before.png`,
    }).catch(async () => {
      await page.screenshot({
        path: `comparison-runs/yt-facade-check/${name}-before.png`,
        fullPage: false,
      });
    });

    if (before.hasFacade) {
      await page.locator('.ajab-yt-facade').first().click();
      await page.waitForTimeout(800);
      entry.afterClick = await page.evaluate(() => {
        const wrap =
          document.querySelector('.cld-video-wrap') ||
          document.querySelector('.clrd-video-wrap') ||
          document.querySelector('.clfd-video-wrap');
        return {
          hasFacade: !!wrap?.querySelector('.ajab-yt-facade'),
          hasIframe: !!wrap?.querySelector('iframe'),
          iframeSrc: wrap?.querySelector('iframe')?.src?.slice(0, 120) || null,
        };
      });
    }

    entry.ok =
      before.hasFacade &&
      !before.hasIframe &&
      before.playBtn &&
      !before.hasWatchLater &&
      entry.afterClick?.hasIframe === true &&
      entry.afterClick?.hasFacade === false;
  } catch (err) {
    entry.ok = false;
    entry.error = String(err.message || err);
  }
  results.push(entry);
  console.log(JSON.stringify(entry, null, 2));
}

// Resolve real IDs from listing APIs via page fetch
const ids = await page.evaluate(async () => {
  const base = 'https://ajab-admin.damnetworks.com/admin';
  const out = {};
  try {
    const s = await fetch(`${base}/Api/song_list?page=1&limit=1`).then((r) => r.json());
    out.song = String(s?.data?.[0]?.id || '1');
  } catch {
    out.song = '1';
  }
  try {
    const r = await fetch(`${base}/Api/reflection_list?page=1&limit=1`).then((x) =>
      x.json()
    );
    out.reflection = String(r?.data?.[0]?.id || '1');
  } catch {
    out.reflection = '1';
  }
  try {
    const f = await fetch(`${base}/Api/film_list?page=1&limit=10`).then((x) => x.json());
    const rows = Array.isArray(f?.data) ? f.data : [];
    let filmId = null;
    for (const row of rows) {
      if (row?.type === 'series' && Array.isArray(row.films) && row.films[0]?.id) {
        filmId = String(row.films[0].id);
        break;
      }
      if (row?.id && row?.type !== 'series') {
        filmId = String(row.id);
        break;
      }
    }
    out.film = filmId || '2';
  } catch {
    out.film = '2';
  }
  return out;
});

console.log('ids', ids);

await checkDetail('songs', `http://localhost:3000/songs/details/${ids.song}`);
await checkDetail(
  'reflections',
  `http://localhost:3000/reflections/details/${ids.reflection}`
);
await checkDetail('films', `http://localhost:3000/films/details/${ids.film}`);

const failed = results.filter((r) => !r.ok);
console.log('\nSUMMARY', {
  passed: results.filter((r) => r.ok).length,
  failed: failed.map((f) => f.name),
});
await browser.close();
process.exit(failed.length ? 1 : 0);
