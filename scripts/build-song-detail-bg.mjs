/**
 * Build song detail marble background — vertically mirrored for seamless repeat-y.
 * Same flip-and-stitch pattern as scripts/build-songs-listing-bg.mjs.
 *
 * The Figma export includes dark/grey edge rows (y=0–1 top, y=7139–7140 bottom).
 * Those must be trimmed before mirroring or they paint a visible grey seam line.
 */

import { mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, 'public/songs-assets');

const SRC = join(OUT_DIR, 'song_detail_3.png');
const OUT = join(OUT_DIR, 'song_detail_3-mirror.png');

const CREAM = { r: 237, g: 232, b: 223, alpha: 1 };

/** Figma export padding — dark / grey rows that are not part of the marble plate. */
const CROP_TOP = 2;
const CROP_BOTTOM = 3;

mkdirSync(OUT_DIR, { recursive: true });

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
