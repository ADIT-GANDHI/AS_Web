/**
 * Smart-harden Songs white parda PNG:
 * - Interior near-white → fully opaque white (no page bleed)
 * - Soft right-edge fringe / baked drop shadow → keep original alpha
 * Reads the current updated PNG (semi) and overwrites it in place.
 * Backup with shadow is kept at *_semitransparent-backup.png.
 */
import sharp from 'sharp';

const SRC = 'public/songs-assets/song_filter_white_480x1660_updated.png';
const OUT = SRC;

/** Alpha at/above this on near-white = body → force opaque. */
const BODY_ALPHA = 220;
/** Luminance at/above this counts as white body (not grey shadow pigment). */
const WHITE_LUM = 245;

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const out = Buffer.from(data);

let bodyFixed = 0;
let fringeKept = 0;

for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a === 0) continue;
    const lum = (r + g + b) / 3;
    if (lum >= WHITE_LUM && a >= BODY_ALPHA) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 255;
      bodyFixed++;
    } else if (a > 0 && a < 255) {
      fringeKept++;
    }
  }
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(OUT);

let opaque = 0;
let semi = 0;
let clear = 0;
for (let i = 3; i < out.length; i += 4) {
  const a = out[i];
  if (a === 0) clear++;
  else if (a === 255) opaque++;
  else semi++;
}
console.log({ w, h, bodyFixed, fringeKept, opaque, semi, clear });
