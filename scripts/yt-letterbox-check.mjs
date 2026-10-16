import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ids = [
  '186', '77', '29', '216', '6', '52', '86', '26', '199', '247', '106', '184', '56', '205', '207',
];

const outDir = path.resolve('yt-letterbox-check');
await mkdir(outDir, { recursive: true });

async function analyzeBands(shotPath) {
  const { data, info } = await sharp(shotPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const inset = 10; // skip white border
  const band = Math.max(6, Math.floor(height * 0.08));
  const avg = (y0, y1) => {
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = inset; x < width - inset; x++) {
        const i = (y * width + x) * channels;
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        n++;
      }
    }
    return sum / n;
  };
  const top = avg(inset, inset + band);
  const mid = avg(Math.floor(height * 0.42), Math.floor(height * 0.58));
  const bot = avg(height - inset - band, height - inset);
  const blackish = (v) => v < 35;
  return {
    topAvg: +top.toFixed(1),
    midAvg: +mid.toFixed(1),
    botAvg: +bot.toFixed(1),
    letterboxLikely: blackish(top) && blackish(bot) && mid > 50,
    dims: `${width}x${height}`,
  };
}

async function thumbMeta(ytId) {
  for (const name of ['maxresdefault', 'hqdefault', 'sddefault']) {
    const url = `https://i.ytimg.com/vi/${ytId}/${name}.jpg`;
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const meta = await sharp(buf).metadata();
      // YouTube returns a tiny placeholder (~120x90) when maxres missing
      if ((meta.width || 0) < 200) continue;
      return { thumb: name, tw: meta.width, th: meta.height, tar: +(meta.width / meta.height).toFixed(4) };
    } catch {
      /* try next */
    }
  }
  return { thumb: null };
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const results = [];

for (const id of ids) {
  await page.goto(`http://localhost:3000/songs/details/${id}`, {
    waitUntil: 'networkidle',
    timeout: 90000,
  });
  await page.waitForSelector('.cld-video-wrap', { timeout: 30000 });
  // Wait until facade has a non-empty background image and it has loaded
  await page
    .waitForFunction(() => {
      const f = document.querySelector('.ajab-yt-facade');
      if (!f) return false;
      const bg = getComputedStyle(f).backgroundImage || '';
      return bg.includes('ytimg.com');
    }, { timeout: 20000 })
    .catch(() => null);
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const wrap = document.querySelector('.cld-video-wrap');
    const facade = document.querySelector('.ajab-yt-facade');
    if (!wrap) return { ok: false };
    const r = wrap.getBoundingClientRect();
    const bg = facade ? getComputedStyle(facade).backgroundImage : '';
    const m = bg.match(/vi\/([^/]+)\//);
    return {
      ok: true,
      title:
        document.querySelector('.cld-song-header-title')?.textContent?.trim() ||
        '',
      vw: window.innerWidth,
      wrapW: Math.round(r.width),
      wrapH: Math.round(r.height),
      ar: +(r.width / r.height).toFixed(4),
      ytId: m?.[1] || null,
      hasFacade: !!facade,
    };
  });

  const posterPath = path.join(outDir, `song-${id}-poster.png`);
  await page.locator('.cld-video-wrap').screenshot({ path: posterPath });
  const posterAnalysis = await analyzeBands(posterPath);

  // Play: click facade and capture playing iframe frame
  let playAnalysis = null;
  if (info.hasFacade) {
    await page.locator('.ajab-yt-facade').click({ force: true }).catch(() => null);
    await page.waitForSelector('.cld-video-wrap iframe', { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(2500);
    const playPath = path.join(outDir, `song-${id}-play.png`);
    await page.locator('.cld-video-wrap').screenshot({ path: playPath });
    playAnalysis = await analyzeBands(playPath);
  }

  const ytMeta = info.ytId ? await thumbMeta(info.ytId) : {};
  const row = {
    id,
    ...info,
    poster: posterAnalysis,
    play: playAnalysis,
    ...ytMeta,
  };
  results.push(row);
  console.log(JSON.stringify(row));
}

await writeFile(path.join(outDir, 'summary.json'), JSON.stringify(results, null, 2));
await browser.close();

const posterBars = results.filter((r) => r.poster?.letterboxLikely).length;
const playBars = results.filter((r) => r.play?.letterboxLikely).length;
console.log('DONE', results.length);
console.log('poster letterboxLikely', posterBars);
console.log('play letterboxLikely', playBars);
console.log('container AR', results[0]?.ar, 'vs 16:9', +(16 / 9).toFixed(4));
