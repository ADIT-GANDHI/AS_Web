/**
 * Side-by-side audit comparison from latest user screenshots.
 * Output: public/ui-audit-comparison-current.png
 */

import { join } from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const REFLECTIONS = join(
  ROOT,
  'assets/c__Users_adit_AppData_Roaming_Cursor_User_workspaceStorage_a9ac9b690e3ce4043df25b1e863bdec1_images_image-44775aee-f3c5-47bc-8a05-14b40e17fcd6.png'
);
const SONGS = join(
  ROOT,
  'assets/c__Users_adit_AppData_Roaming_Cursor_User_workspaceStorage_a9ac9b690e3ce4043df25b1e863bdec1_images_image-a85568df-24e9-49bb-99be-e3eb6413fb80.png'
);
const OUT = join(ROOT, 'public/ui-audit-comparison-current.png');

const TARGET_W = 720;

async function resizeLabel(src, label) {
  const img = sharp(src);
  const meta = await img.metadata();
  const scale = TARGET_W / (meta.width || TARGET_W);
  const h = Math.round((meta.height || 900) * scale);
  const resized = await img.resize(TARGET_W, h).png().toBuffer();

  const labelSvg = Buffer.from(`
    <svg width="${TARGET_W}" height="36">
      <rect width="100%" height="100%" fill="#111111"/>
      <text x="16" y="24" fill="#ffffff" font-family="Arial, sans-serif" font-size="16">${label}</text>
    </svg>
  `);

  return sharp({
    create: { width: TARGET_W, height: h + 36, channels: 4, background: '#ffffff' },
  })
    .composite([
      { input: labelSvg, top: 0, left: 0 },
      { input: resized, top: 36, left: 0 },
    ])
    .png()
    .toBuffer();
}

const left = await resizeLabel(REFLECTIONS, 'Reflections — current (filter open)');
const right = await resizeLabel(SONGS, 'Songs — current (filter open)');

const leftMeta = await sharp(left).metadata();
const rightMeta = await sharp(right).metadata();
const colH = Math.max(leftMeta.height || 0, rightMeta.height || 0);
const gap = 24;
const totalW = TARGET_W * 2 + gap;

await sharp({
  create: { width: totalW, height: colH + 80, channels: 4, background: '#f4f4f4' },
})
  .composite([
    {
      input: Buffer.from(`
        <svg width="${totalW}" height="80">
          <text x="${totalW / 2}" y="34" text-anchor="middle" fill="#111" font-family="Arial, sans-serif" font-size="22" font-weight="700">UI audit — filter + header (before fixes in this session)</text>
          <text x="${totalW / 2}" y="58" text-anchor="middle" fill="#666" font-family="Arial, sans-serif" font-size="14">Compare overlay, nav counts, filter panel quality</text>
        </svg>
      `),
      top: 0,
      left: 0,
    },
    { input: left, top: 80, left: 0 },
    { input: right, top: 80, left: TARGET_W + gap },
  ])
  .png()
  .toFile(OUT);

console.log(`✅ ${OUT}`);
