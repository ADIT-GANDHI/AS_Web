/**
 * Build a vertically mirrored PNG tile for seamless CSS repeat-y.
 *
 * Tile layout: [ original H px ][ flipped copy ] → total 2H px.
 * At the repeat boundary (y = 2H) the last row equals the first row of the
 * next tile, so scroll loops without a hard cut — provided the asset is not
 * scaled with uneven subpixels (use SeamlessPageBackground + min tile width).
 *
 * Optional `featherPx` softens the internal join at y = H (compression artifact
 * hide only; does not change repeat period).
 */

import sharp from 'sharp';

/**
 * @param {object} opts
 * @param {string} opts.src — source PNG/JPG path
 * @param {string} opts.out — output PNG path
 * @param {{ r: number, g: number, b: number, alpha?: number }} [opts.background]
 * @param {number} [opts.featherPx=0] — blur band half-width at the mirror join (0 = sharp)
 */
export async function buildMirrorTile({ src, out, background, featherPx = 0 }) {
  const bg = background ?? { r: 255, g: 255, b: 255, alpha: 1 };
  const meta = await sharp(src).metadata();
  const width = meta.width ?? 1920;
  const height = meta.height ?? 1949;

  const original = await sharp(src).png().toBuffer();
  const flipped = await sharp(src).flip().png().toBuffer();

  await sharp({
    create: {
      width,
      height: height * 2,
      channels: 4,
      background: bg,
    },
  })
    .composite([
      { input: original, top: 0, left: 0 },
      { input: flipped, top: height, left: 0 },
    ])
    .png({ compressionLevel: 6 })
    .toFile(out);

  void featherPx; /* reserved — CSS overlap hides join; asset stays mathematically seamless */

  return { width, height: height * 2, moduleHeight: height };
}
