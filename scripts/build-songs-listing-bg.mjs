/**
 * Build Songs listing background from AllSONGS_2june2026.
 * All motif layers share one 3900px vertical module so repeat-y stays in sync.
 * Marble uses a mirrored 7800px strip (flip at 3900) for seamless seams.
 */

import { mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, 'public/songs-assets/AllSONGS_2june2026');
const OUT_DIR = join(ROOT, 'public/songs-assets');

const W = 1440;
const MODULE_H = 3900;

/** Motif placement inside the 3900px module (fit vs flattened.jpg, sharp marble). */
const TRI_TOP = 1700;
const TAM_TOP = 1210;

const SRC = {
  marble: join(SRC_DIR, 'Alls Songs_2june2026_1background.jpg'),
  triangles: join(SRC_DIR, 'Alls Songs_2june2026_2triangles.png'),
  tamburas: join(SRC_DIR, 'Alls Songs_2june2026_3tamburas.png'),
  flattened: join(SRC_DIR, 'Alls-Songs_2june2026_flattened.jpg'),
};

const OUT = {
  marbleMirror: join(OUT_DIR, 'songs-bg-marble-mirror.png'),
  trianglesTile: join(OUT_DIR, 'songs-bg-triangles-tile.png'),
  tamburasTile: join(OUT_DIR, 'songs-bg-tamburas-tile.png'),
  compositeMirror: join(OUT_DIR, 'songs-bg-composite-mirror.png'),
};

mkdirSync(OUT_DIR, { recursive: true });

async function buildMarbleMirror() {
  const marbleBuf = await sharp(SRC.marble).resize(W, MODULE_H, { fit: 'fill' }).png().toBuffer();
  const flipped = await sharp(marbleBuf).flip('vertical').toBuffer();
  await sharp({
    create: {
      width: W,
      height: MODULE_H * 2,
      channels: 4,
      background: { r: 237, g: 232, b: 223, alpha: 1 },
    },
  })
    .composite([
      { input: marbleBuf, top: 0, left: 0 },
      { input: flipped, top: MODULE_H, left: 0 },
    ])
    .png({ compressionLevel: 6 })
    .toFile(OUT.marbleMirror);
}

async function buildMotifTile(srcPath, top, outPath) {
  await sharp({
    create: {
      width: W,
      height: MODULE_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: srcPath, top, left: 0 }])
    .png({ compressionLevel: 6 })
    .toFile(outPath);
}

async function buildCompositeMirror() {
  const moduleBuf = await sharp(SRC.marble)
    .resize(W, MODULE_H, { fit: 'fill' })
    .composite([
      { input: SRC.triangles, top: TRI_TOP, left: 0 },
      { input: SRC.tamburas, top: TAM_TOP, left: 0 },
    ])
    .png()
    .toBuffer();
  const flipped = await sharp(moduleBuf).flip('vertical').toBuffer();
  await sharp({
    create: {
      width: W,
      height: MODULE_H * 2,
      channels: 4,
      background: { r: 237, g: 232, b: 223, alpha: 1 },
    },
  })
    .composite([
      { input: moduleBuf, top: 0, left: 0 },
      { input: flipped, top: MODULE_H, left: 0 },
    ])
    .png({ compressionLevel: 6 })
    .toFile(OUT.compositeMirror);
}

await buildMarbleMirror();
await buildMotifTile(SRC.triangles, TRI_TOP, OUT.trianglesTile);
await buildMotifTile(SRC.tamburas, TAM_TOP, OUT.tamburasTile);
await buildCompositeMirror();

console.log('✅ songs listing bg (3900px module, synced repeats)');
console.log(`   marble mirror:     ${OUT.marbleMirror}`);
console.log(`   triangles tile:    ${OUT.trianglesTile} (y=${TRI_TOP})`);
console.log(`   tamburas tile:     ${OUT.tamburasTile} (y=${TAM_TOP})`);
console.log(`   composite mirror:  ${OUT.compositeMirror} (QA / fallback)`);
