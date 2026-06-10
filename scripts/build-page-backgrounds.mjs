/**
 * Build repeat-y tiles for listing/detail pages from Images/ design exports.
 * Run: node scripts/build-page-backgrounds.mjs
 */

import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { buildSeamlessRepeatTile } from './lib/build-seamless-repeat-tile.mjs';

const ROOT = process.cwd();
const OUT = join(ROOT, 'public');

const TARGETS = [
  {
    label: 'people listing',
    src: join(ROOT, 'Images/people_mainpage.png'),
    out: join(OUT, 'people_mainpage.png'),
    original: join(OUT, 'people_mainpage-original.png'),
    cropTop: 20,
    cropBottom: 30,
    blendPx: 72,
  },
  {
    label: 'people detail',
    src: join(ROOT, 'Images/people_detail.png'),
    out: join(OUT, 'people_detail.png'),
    copyOnly: true,
  },
  {
    label: 'reflections listing',
    src: join(ROOT, 'Images/reflections_mainpage.png'),
    out: join(OUT, 'reflections_mainpage.png'),
    original: join(OUT, 'reflections_mainpage-original.png'),
    cropTop: 70,
    cropBottom: 45,
    blendPx: 80,
  },
  {
    label: 'reflections detail',
    src: join(ROOT, 'Images/reflection_detail.png'),
    out: join(OUT, 'reflections_detail.png'),
    original: join(OUT, 'reflections_detail-original.png'),
    cropTop: 65,
    cropBottom: 45,
    blendPx: 80,
  },
  {
    label: 'films listing',
    src: join(OUT, 'film-page-bg.png'),
    out: join(OUT, 'film-page-bg.png'),
    original: join(OUT, 'film-page-bg-original.png'),
    cropTop: 45,
    cropBottom: 45,
    blendPx: 72,
  },
  {
    label: 'films detail',
    src: join(ROOT, 'Images/film_detail.png'),
    out: join(OUT, 'film_detail.png'),
    original: join(OUT, 'film_detail-original.png'),
    cropTop: 75,
    cropBottom: 15,
    blendPx: 72,
  },
];

mkdirSync(OUT, { recursive: true });

for (const t of TARGETS) {
  if (t.copyOnly) {
    copyFileSync(t.src, t.out);
    const meta = await sharp(t.out).metadata();
    console.log(`✅ ${t.out.replace(ROOT + '/', '')}  (${meta.width}×${meta.height}, exact copy)`);
    continue;
  }

  if (t.original) {
    if (!existsSync(t.original)) copyFileSync(t.src, t.original);
  }

  const built = await buildSeamlessRepeatTile({
    src: t.original ?? t.src,
    out: t.out,
    cropTop: t.cropTop,
    cropBottom: t.cropBottom,
    blendPx: t.blendPx,
  });

  console.log(
    `✅ ${t.out.replace(ROOT + '/', '')}  (${built.width}×${built.height}, ${t.label}, crop ${t.cropTop}+${t.cropBottom})`
  );
}
