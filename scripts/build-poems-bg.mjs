/**
 * Poems page BG — mirror stack for seamless repeat-y.
 * Source: public/poems_newbg.png (from New_UI/Poems_13July2026.ai monochrome plate).
 * Output: public/poems_newbg-tile.png = [original][flipped] so tile edges match.
 *
 * Run: node scripts/build-poems-bg.mjs
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { buildMirrorTile } from './lib/build-mirror-tile.mjs';

const ROOT = process.cwd();
const SRC = join(ROOT, 'public/poems_newbg.png');
const OUT = join(ROOT, 'public/poems_newbg-tile.png');

if (!existsSync(SRC)) {
  console.error(`Missing ${SRC}`);
  process.exit(1);
}

const built = await buildMirrorTile({
  src: SRC,
  out: OUT,
  background: { r: 224, g: 224, b: 224, alpha: 1 },
});

console.log('✅ poems_newbg-tile.png (mirrored repeat-y)');
console.log(`   source: ${SRC}`);
console.log(`   module: ${built.width}×${built.moduleHeight}`);
console.log(`   mirror: ${OUT} (${built.width}×${built.height})`);
