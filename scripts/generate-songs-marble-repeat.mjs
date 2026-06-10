/**
 * Crop a marble-only strip from songs_main_page.png (no cream bands).
 * Used with background-size: 100% auto + repeat-y (never stretched).
 * Output: public/songs-assets/songs_marble_repeat.png
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', 'public', 'songs-assets', 'songs_main_page.png');
const OUT = path.join(__dirname, '..', 'public', 'songs-assets', 'songs_marble_repeat.png');

/** Marble texture only — ends before the 571px cream slab in the full composite. */
const CROP_Y = 340;
const CROP_H = 220;

const imgUrl = `data:image/png;base64,${fs.readFileSync(SRC).toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const png = await page.evaluate(
  async ({ url, cropY, cropH }) => {
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const w = img.naturalWidth;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = cropH;
    c.getContext('2d').drawImage(img, 0, cropY, w, cropH, 0, 0, w, cropH);
    return c.toDataURL('image/png').split(',')[1];
  },
  { url: imgUrl, cropY: CROP_Y, cropH: CROP_H },
);

fs.writeFileSync(OUT, Buffer.from(png, 'base64'));
console.log(`Wrote ${OUT} (1920×${CROP_H})`);
await browser.close();
