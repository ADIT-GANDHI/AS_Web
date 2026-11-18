/**
 * Song detail marble background tile → `song_detail_3-mirror.png`.
 *
 * Prefer a designer-provided tile when present:
 *   1) `song_detail_3-mirror.jpg`  (new designer export)
 *   2) else build from `song_detail_3.png` (module + vertical flip for repeat-y)
 *
 * The Figma `song_detail_3.png` export includes dark/grey edge rows (y=0–1 top,
 * y=7139–7140 bottom). Those must be trimmed before mirroring or they paint a
 * visible grey seam line.
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'public/songs-assets');

const DESIGNER_JPG = join(OUT_DIR, 'song_detail_3-mirror.jpg');
const SRC = join(OUT_DIR, 'song_detail_3.png');
const OUT = join(OUT_DIR, 'song_detail_3-mirror.png');

const CREAM = { r: 237, g: 232, b: 223, alpha: 1 };

/** Figma export padding — dark / grey rows that are not part of the marble plate. */
const CROP_TOP = 2;
const CROP_BOTTOM = 3;

mkdirSync(OUT_DIR, { recursive: true });

if (existsSync(DESIGNER_JPG)) {
  await sharp(DESIGNER_JPG).png({ compressionLevel: 9 }).toFile(OUT);
  const meta = await sharp(OUT).metadata();
  console.log('✅ song detail bg (designer jpg → png)');
  console.log(`   source:  ${DESIGNER_JPG}`);
  console.log(`   mirror:  ${OUT} (${meta.width}×${meta.height})`);
  process.exit(0);
}

const meta = await sharp(SRC).metadata();
const W = meta.width;
const fullH = meta.height;
const MODULE_H = fullH - CROP_TOP - CROP_BOTTOM;

const moduleBuf = await sharp(SRC)
  .extract({ left: 0, top: CROP_TOP, width: W, height: MODULE_H })
  .png()
  .toBuffer();

const flipped = await sharp(moduleBuf).flip('vertical').toBuffer();

await sharp({
  create: {
    width: W,
    height: MODULE_H * 2,
    channels: 4,
    background: CREAM,
  },
})
  .composite([
    { input: moduleBuf, top: 0, left: 0 },
    { input: flipped, top: MODULE_H, left: 0 },
  ])
  .png({ compressionLevel: 6 })
  .toFile(OUT);

console.log('✅ song detail bg (mirrored repeat-y tile)');
console.log(`   source:  ${SRC} (${W}×${fullH}, crop top ${CROP_TOP} / bottom ${CROP_BOTTOM})`);
console.log(`   module:  ${W}×${MODULE_H}`);
console.log(`   mirror:  ${OUT} (${W}×${MODULE_H * 2})`);
