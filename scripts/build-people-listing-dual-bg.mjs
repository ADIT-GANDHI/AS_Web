/**
 * Build People dual-layer tiles (listing + detail).
 * Sources stay untouched; outputs are *-tile.png for runtime.
 *
 * Listing:
 *   people_newbg.png                  → people_newbg-tile.png (crop+blend)
 * Detail:
 *   people_detailbg.png               → people_detailbg-tile.png (crop+blend)
 * Shared middle white:
 *   people_new_middle_white_layer.png → people_new_middle_white_layer-tile.png
 *     (trim top/bottom transparent+soft fade only; keep L/R wavy alpha)
 *
 * Run: node scripts/build-people-listing-dual-bg.mjs
 *   or: npm run build:people-dual-bg
 */

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { buildSeamlessRepeatTile } from './lib/build-seamless-repeat-tile.mjs';

const ROOT = process.cwd();
const OUT = join(ROOT, 'public');

const LISTING_BG_SRC = join(OUT, 'people_newbg.png');
const LISTING_BG_ORIGINAL = join(OUT, 'people_newbg-original.png');
const LISTING_BG_TILE = join(OUT, 'people_newbg-tile.png');

const DETAIL_BG_SRC = join(OUT, 'people_detailbg.png');
const DETAIL_BG_ORIGINAL = join(OUT, 'people_detailbg-original.png');
const DETAIL_BG_TILE = join(OUT, 'people_detailbg-tile.png');

const MID_SRC = join(OUT, 'people_new_middle_white_layer.png');
const MID_TILE = join(OUT, 'people_new_middle_white_layer-tile.png');

/** Soft fade + clear pad — full opacity (α≈242) starts ~y=22 / ends ~22 from bottom. */
const MID_CROP_TOP = 22;
const MID_CROP_BOTTOM = 22;

async function buildMiddleWhiteTile() {
  const meta = await sharp(MID_SRC).metadata();
  const width = meta.width ?? 1483;
  const fullH = meta.height ?? 3402;
  const cropH = fullH - MID_CROP_TOP - MID_CROP_BOTTOM;

  await sharp(MID_SRC)
    .extract({ left: 0, top: MID_CROP_TOP, width, height: cropH })
    .png({ compressionLevel: 6 })
    .toFile(MID_TILE);

  const outMeta = await sharp(MID_TILE).metadata();
  return { width: outMeta.width, height: outMeta.height };
}

async function buildTextureTile(src, original, tile, label) {
  if (!existsSync(src)) {
    console.error(`Missing ${src}`);
    process.exit(1);
  }
  if (!existsSync(original)) {
    copyFileSync(src, original);
  }
  const built = await buildSeamlessRepeatTile({
    src: original,
    out: tile,
    cropTop: 12,
    cropBottom: 12,
    blendPx: 64,
  });
  console.log(`✅ ${label}  (${built.width}×${built.height}, crop+blend)`);
  return built;
}

if (!existsSync(MID_SRC)) {
  console.error(`Missing ${MID_SRC}`);
  process.exit(1);
}

await buildTextureTile(
  LISTING_BG_SRC,
  LISTING_BG_ORIGINAL,
  LISTING_BG_TILE,
  'people_newbg-tile.png'
);

await buildTextureTile(
  DETAIL_BG_SRC,
  DETAIL_BG_ORIGINAL,
  DETAIL_BG_TILE,
  'people_detailbg-tile.png'
);

const mid = await buildMiddleWhiteTile();
console.log(
  `✅ people_new_middle_white_layer-tile.png  (${mid.width}×${mid.height}, crop ${MID_CROP_TOP}+${MID_CROP_BOTTOM}, L/R alpha kept)`
);
