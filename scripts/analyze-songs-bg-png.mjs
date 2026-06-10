/**
 * Scan songs_main_page.png for horizontal cream bands (marble vs flat fill).
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imgPath = path.join(__dirname, '..', 'public', 'songs-assets', 'songs_main_page.png');
const imgUrl = `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const bands = await page.evaluate(async (url) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Sample center 40% width (marble panel, skip side gutters)
  const x0 = Math.floor(w * 0.3);
  const x1 = Math.floor(w * 0.7);
  const rows = [];
  for (let y = 0; y < h; y++) {
    let sumR = 0,
      sumG = 0,
      sumB = 0,
      sumVar = 0,
      n = 0;
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sumR += r;
      sumG += g;
      sumB += b;
      n++;
    }
    const avgR = sumR / n;
    const avgG = sumG / n;
    const avgB = sumB / n;
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const dr = data[i] - avgR;
      const dg = data[i + 1] - avgG;
      const db = data[i + 2] - avgB;
      sumVar += dr * dr + dg * dg + db * db;
    }
    const variance = sumVar / n;
    const creamish = avgR > 228 && avgG > 224 && avgB > 215 && variance < 120;
    rows.push({ y, avgR: Math.round(avgR), avgG: Math.round(avgG), avgB: Math.round(avgB), variance: Math.round(variance), creamish });
  }

  const creamRuns = [];
  let start = null;
  for (const r of rows) {
    if (r.creamish && start === null) start = r.y;
    if (!r.creamish && start !== null) {
      creamRuns.push({ start, end: r.y - 1, height: r.y - start });
      start = null;
    }
  }
  if (start !== null) creamRuns.push({ start, end: h - 1, height: h - start });

  const marbleSlices = [];
  let runStart = null;
  for (const r of rows) {
    const isMarble = r.variance > 250 && !(r.avgR > 235 && r.avgG > 232 && r.variance < 80);
    if (isMarble && runStart === null) runStart = r.y;
    if (!isMarble && runStart !== null) {
      const len = r.y - runStart;
      if (len >= 200) marbleSlices.push({ start: runStart, end: r.y - 1, height: len });
      runStart = null;
    }
  }
  if (runStart !== null) {
    const len = h - runStart;
    if (len >= 200) marbleSlices.push({ start: runStart, end: h - 1, height: len });
  }

  return { w, h, creamRuns: creamRuns.filter((r) => r.height > 8), marbleSlices };
}, imgUrl);

const sample = await page.evaluate(async (url) => {
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
    img.src = url;
  });
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;
  const x0 = Math.floor(w * 0.3);
  const x1 = Math.floor(w * 0.7);
  const out = [];
  for (let y = 0; y < h; y += 40) {
    let v = 0,
      n = 0,
      r = 0,
      g = 0,
      b = 0;
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    r /= n;
    g /= n;
    b /= n;
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      const dr = data[i] - r;
      const dg = data[i + 1] - g;
      const db = data[i + 2] - b;
      v += dr * dr + dg * dg + db * db;
    }
    out.push({ y, variance: Math.round(v / n), r: Math.round(r), g: Math.round(g), b: Math.round(b) });
  }
  return out;
}, imgUrl);

console.log(JSON.stringify({ ...bands, samples: sample }, null, 2));
await browser.close();
