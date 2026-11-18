/**
 * Prepare shared white filter parda from the designer Illustrator export:
 * 1) Opaque white body only (no page bleed through the curtain)
 * 2) Keep designer soft-shadow / fringe alpha exactly as exported (NO boost)
 * 3) Fill left artboard gap with white so the curtain is flush to the viewport
 * 4) Build drawer PNG (Lanczos pre-stretch) — CSS scaleY must stay 1
 *
 * Wave density knob (below): `sy`
 *   - LOWER sy  → MORE waves (less vertical stretch)  e.g. 1.15, 1.0
 *   - HIGHER sy → FEWER waves (more stretch)          e.g. 1.35, 1.45
 * After changing `sy`, run:  node scripts/prepare-songs-parda.mjs
 * Then hard-refresh. Do NOT use CSS scaleY to tune waves (pixelates).
 *
 * Does not invent a stronger drop-shadow. CSS must not add one either.
 */
import sharp from 'sharp';

const MASTER = 'public/songs-assets/song_filter_white_480x1660_updated.png';
const DRAWER = 'public/songs-assets/song_filter_white_parda_drawer@2x.png';
const BODY_ALPHA = 220;
const WHITE_LUM = 245;

const { data, info } = await sharp(MASTER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width;
const h = info.height;
const out = Buffer.from(data);

let bodyFixed = 0;
let fringeKept = 0;
let leftFilled = 0;

for (let y = 0; y < h; y++) {
  let firstSolid = -1;
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a === 0) continue;
    const lum = (r + g + b) / 3;
    // Opaque white body only — leave soft fringe / dark shadow pigment alone.
    if (lum >= WHITE_LUM && a >= BODY_ALPHA) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 255;
      bodyFixed++;
      if (firstSolid < 0) firstSolid = x;
    } else if (a > 0 && a < 255) {
      fringeKept++;
    }
  }
  // Flush left: fill transparent artboard margin up to the solid body.
  if (firstSolid > 0) {
    for (let x = 0; x < firstSolid; x++) {
      const i = (y * w + x) * 4;
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      out[i + 3] = 255;
      leftFilled++;
    }
  }
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toFile(MASTER);

/* Lower sy → more waves in the drawer. Keep stretch in this Lanczos bake
   (not CSS scaleY) so the edge stays smooth. PREV 1.45 looked a bit sparse vs live. */
const sy = 1.25;
/* 3× drawer (360×900) for crisp AA when showing denser waves. */
const outW = 1080;
const outH = 2700;
const boxH = Math.round(outH / sy);
const covered = await sharp(MASTER)
  .ensureAlpha()
  .resize(outW, boxH, { fit: 'cover', position: 'right', kernel: sharp.kernel.lanczos3 })
  .png()
  .toBuffer();
await sharp(covered)
  .resize(outW, outH, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(DRAWER);

const check = await sharp(DRAWER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const dw = check.info.width;
const dh = check.info.height;
const left = [];
for (let x = 0; x < 8; x++) {
  let s = 0;
  let c = 0;
  for (let y = Math.floor(dh * 0.25); y < Math.floor(dh * 0.75); y++) {
    s += check.data[(y * dw + x) * 4 + 3];
    c++;
  }
  left.push(Math.round(s / c));
}

console.log({
  master: { w, h, bodyFixed, fringeKept, leftFilled },
  drawer: { w: dw, h: dh, leftAvgA: left.join(',') },
});
