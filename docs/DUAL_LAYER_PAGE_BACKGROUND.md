# Dual-layer page background (texture + middle white layer)

This document describes how to split a single baked background plate into **two independent repeat-y layers** — a full-bleed texture and a centered translucent "parda" (middle white strip) — while keeping the same seamless scroll experience.

Proven on **People listing** (`/people`) and **People detail** (`/people/[id]`). Reuse for any module that needs the same treatment.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  .repeating-page-bg  (absolute, full shell height)      │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Sheet A — texture tile, 100% width, repeat-y     │  │
│  │  Sheet B — same tile, shifted -6px (hides gaps)   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────┐                │
│  │  Overlay — middle white, centered   │  z-index: 1   │
│  │  width = shell × widthRatio         │                │
│  │  repeat-y on its own period         │                │
│  └─────────────────────────────────────┘                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Content (`main`) sits above both layers via `z-index: 10`.

---

## Assets required

| Asset | Role | Notes |
|-------|------|-------|
| **Texture BG** (e.g. `people_newbg.png`) | Full-bleed repeating pattern | Should be roughly square or landscape; same width as the combined design artboard |
| **Middle white layer** (e.g. `people_new_middle_white_layer.png`) | Centered translucent parda | Narrower than BG; transparent outside the wavy edges; alpha ≈ 240–255 inside |

Place source PNGs in `public/`.

---

## Step-by-step: adding dual-layer BG to a new module

### 1. Prepare source assets

Drop them in `public/`:
- `public/<module>_bg.png` — texture
- `public/<module>_middle_white_layer.png` — parda (or reuse `people_new_middle_white_layer.png`)

### 2. Measure the middle layer's transparent padding

```bash
python -c "
from PIL import Image
im = Image.open('public/<module>_middle_white_layer.png').convert('RGBA')
w,h = im.size; px = im.load()
full_top = next(y for y in range(h) if max(px[x,y][3] for x in range(0,w,3)) >= 240)
full_bot = next(h-1-y for y in range(h-1,-1,-1) if max(px[x,y][3] for x in range(0,w,3)) >= 240)
print(f'crop top={full_top}  bottom={full_bot}')
"
```

These values become `MID_CROP_TOP` / `MID_CROP_BOTTOM` in the build script.

### 3. Add entries to the build script

Edit `scripts/build-people-listing-dual-bg.mjs` (or create a new module-specific script):

```js
const MODULE_BG_SRC = join(OUT, '<module>_bg.png');
const MODULE_BG_ORIGINAL = join(OUT, '<module>_bg-original.png');
const MODULE_BG_TILE = join(OUT, '<module>_bg-tile.png');

await buildTextureTile(MODULE_BG_SRC, MODULE_BG_ORIGINAL, MODULE_BG_TILE, '<module>_bg-tile.png');
```

For the middle layer, if reusing People's, skip — the existing tile works. If new:

```js
await sharp(MID_SRC)
  .extract({ left: 0, top: MID_CROP_TOP, width, height: cropH })
  .png({ compressionLevel: 6 })
  .toFile(MID_TILE);
```

Run: `node scripts/build-people-listing-dual-bg.mjs`

### 4. Register tiles in `lib/pageBackgroundTiles.ts`

```ts
export const MODULE_BG_TEXTURE: PageBackgroundTile = {
  url: tileUrl('/<module>_bg-tile.png'),
  tileWidth: <built width>,
  tileHeight: <built height>,
  fallbackColor: '#f7f6f4',  // match the dominant edge colour
};

// If using a new middle white layer:
export const MODULE_MIDDLE_WHITE: PageBackgroundTile = {
  url: tileUrl('/<module>_middle_white_layer-tile.png'),
  tileWidth: <built width>,
  tileHeight: <built height>,
  fallbackColor: 'transparent',
};

export const MODULE_MIDDLE_WIDTH_RATIO = <middle source width> / <texture source width>;
```

### 5. Wire the component

In your page component (e.g. `CLModule.tsx`):

```tsx
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import {
  MODULE_BG_TEXTURE,
  MODULE_MIDDLE_WHITE,         // or PEOPLE_LISTING_MIDDLE_WHITE if reusing
  MODULE_MIDDLE_WIDTH_RATIO,   // or PEOPLE_LISTING_MIDDLE_WIDTH_RATIO
} from '@/lib/pageBackgroundTiles';

// Inside the shell:
<RepeatingPageBackground
  containerRef={shellRef}
  tile={MODULE_BG_TEXTURE}
  overlay={{
    tile: MODULE_MIDDLE_WHITE,
    widthRatio: MODULE_MIDDLE_WIDTH_RATIO,
    singleSheet: true,  // translucent layers: single sheet avoids double-alpha
  }}
/>
```

### 6. CSS — disable root background

```css
.cl-songs-page-root:has(.your-page-class) {
  position: relative;
  background-color: #ffffff;
  background-image: none;
}
```

### 7. Add to prebuild (package.json)

Append your build script to the `prebuild` chain:

```json
"prebuild": "... && node scripts/build-<module>-dual-bg.mjs"
```

Or add a dedicated npm script:

```json
"build:<module>-dual-bg": "node scripts/build-<module>-dual-bg.mjs"
```

### 8. Add tile outputs to `fix-basepath-assets.mjs`

In the `ASSET_PREFIXES` array, add any new tile filenames so the deploy script handles basePath prefixing:

```js
'<module>_bg-tile.png',
'<module>_middle_white_layer-tile.png',
```

### 9. Verify

```bash
# Dev server
npm run dev
# Open the page, scroll extensively, Load More if applicable
# Check for horizontal bands / gaps between tiles
```

---

## Key decisions

| Decision | Guidance |
|----------|----------|
| **Single vs dual sheet for the overlay** | Use `singleSheet: true` when the overlay has alpha < 255 (translucent). Dual sheets would double the opacity at the overlap band. |
| **Independent vs locked periods** | If BG is soft texture and middle is a solid wash, independent `repeat-y` is fine (different tile heights). If motifs must align, build tiles to share a common period or pre-composite. |
| **Middle crop values** | Measure where full alpha begins. Crop to that row so stacked tiles meet solid-to-solid. Keep L/R transparent for the organic edge. |
| **BG crop + blend** | Use the existing `buildSeamlessRepeatTile` helper. Adjust `cropTop`/`cropBottom`/`blendPx` until a 3× stacked preview shows no seam. |

---

## Reverting to single-plate

Each module keeps the old wiring commented:

```tsx
// OLD: single-plate
// <RepeatingPageBackground containerRef={shellRef} tile={OLD_TILE} />
```

To revert:
1. Uncomment the old line, remove the dual-layer `<RepeatingPageBackground>`.
2. Restore the old import (e.g. `PEOPLE_LISTING_BG`).
3. No tile rebuild needed — old plate is still in `public/`.

---

## File reference (People implementation)

| File | Role |
|------|------|
| `public/people_newbg.png` | Listing texture source |
| `public/people_detailbg.png` | Detail texture source |
| `public/people_new_middle_white_layer.png` | Middle white source (shared) |
| `public/people_newbg-tile.png` | Built listing tile |
| `public/people_detailbg-tile.png` | Built detail tile |
| `public/people_new_middle_white_layer-tile.png` | Built middle tile (cropped) |
| `scripts/build-people-listing-dual-bg.mjs` | Build script |
| `lib/pageBackgroundTiles.ts` | Tile registry |
| `components/shared/RepeatingPageBackground.tsx` | Render component (overlay prop) |
| `components/shared/RepeatingPageBackground.css` | Overlay positioning |
| `components/People/CLPeople.tsx` | Listing wiring |
| `components/People/CLPeopleDetail.tsx` | Detail wiring |
| `components/People/CLPeople.css` | Root CSS overrides |

---

## Related docs

- `docs/SEAMLESS_PAGE_BACKGROUND.md` — single-plate repeat-y system (predecessor)
- `scripts/lib/build-seamless-repeat-tile.mjs` — crop + blend helper
