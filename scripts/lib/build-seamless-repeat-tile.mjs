/**
 * Build a repeat-y tile from Images/people_mainpage.png:
 * 1. Trim non-repeating black header/footer strips from the design export
 * 2. Crossfade the bottom band into the top row so tiles stack flush
 */

import sharp from 'sharp';

const DEFAULT_CROP_TOP = 20;
const DEFAULT_CROP_BOTTOM = 30;

/**
 * @param {object} opts
 * @param {string} opts.src
 * @param {string} opts.out
 * @param {number} [opts.cropTop]
 * @param {number} [opts.cropBottom]
 * @param {number} [opts.blendPx=72]
 */
export async function buildSeamlessRepeatTile({
  src,
  out,
  cropTop = DEFAULT_CROP_TOP,
  cropBottom = DEFAULT_CROP_BOTTOM,
  blendPx = 72,
}) {
  const meta = await sharp(src).metadata();
  const width = meta.width ?? 1921;
  const fullH = meta.height ?? 1949;
  const cropH = fullH - cropTop - cropBottom;

  const { data, info } = await sharp(src)
    .extract({ left: 0, top: cropTop, width, height: cropH })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels: ch } = info;
  const band = Math.min(blendPx, Math.max(24, Math.floor(h / 5)));
  const outBuf = Buffer.from(data);

  for (let i = 0; i < band; i++) {
    const y = h - band + i;
    const t = band <= 1 ? 1 : i / (band - 1);
    const ease = 0.5 - 0.5 * Math.cos(Math.PI * t);
    for (let x = 0; x < w; x++) {
      const iOut = (y * w + x) * ch;
      const iTop = x * ch;
      for (let c = 0; c < 3; c++) {
        outBuf[iOut + c] = Math.round(data[iOut + c] * (1 - ease) + data[iTop + c] * ease);
      }
    }
  }

  await sharp(outBuf, { raw: { width: w, height: h, channels: ch } })
    .png({ compressionLevel: 6 })
    .toFile(out);

  return { width: w, height: h, cropTop, cropBottom };
}
