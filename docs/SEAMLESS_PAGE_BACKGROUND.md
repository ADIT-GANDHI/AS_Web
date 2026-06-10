# Seamless page background (repeat-y)

This document describes how listing and detail pages get a **continuous vertical background** when content grows (scroll, Load More, long bios). The pattern is proven on **People listing** (`/people`) and is reused on People detail, Films, Films detail, and Reflections.

## Problem

Design exports (`Images/*.png`) are single artboards. Using them with naive CSS:

```css
background: url(/plate.png) repeat-y;
background-size: 100% auto;
```

often shows:

- **White or dark horizontal bands** between tiles (browser sub-pixel rounding).
- **Misaligned pattern** (top row ≠ bottom row on the source file).
- **Wrong filenames** (`*-mirror.png`) that doubled height and put a visible seam mid-tile.

## Solution (three parts)

### 1. Asset pipeline (`scripts/build-page-backgrounds.mjs`)

| Output | Source | Notes |
|--------|--------|--------|
| `public/people_mainpage-original.png` | `Images/people_mainpage.png` | Unaltered reference |
| `public/people_mainpage.png` | same | Trim 20px top + 30px bottom black bars, blend bottom → top row |
| `public/people_detail.png` | `Images/people_detail.png` | Exact copy (top/bottom row already match) |
| `public/reflections_mainpage.png` | `Images/reflections_mainpage.png` | Trim + blend (crop 70+45) |
| `public/reflections_detail.png` | `Images/reflection_detail.png` | Trim + blend (crop 65+45) |
| `public/film-page-bg-original.png` | existing `film-page-bg.png` | Backup before processing |
| `public/film-page-bg.png` | same | Trim + blend (crop 45+45) |
| `public/film_detail.png` | `Images/film_detail.png` | Trim + blend (crop 75+15) |

Core helper: `scripts/lib/build-seamless-repeat-tile.mjs`

- Crops fixed header/footer strips that must not repeat.
- Crossfades the bottom band into the **top row** so tile *N* bottom = tile *N+1* top.

**Do not** use vertical mirror tiles for these plates unless the art is symmetric; mirror seams show between list rows.

```bash
npm run build:page-bg
# or full prebuild (includes this script)
```

After changing crop/blend values, update `tileHeight` in `lib/pageBackgroundTiles.ts` to match the built PNG height.

### 2. React layer (`components/shared/RepeatingPageBackground.tsx`)

- Mounts on `.cl-songs-page-shell` with a `ref` (same as Songs listing).
- `ResizeObserver` sets layer height = main + footer (includes Load More growth).
- **Dual sheets**: two identical `repeat-y` layers, second shifted up 6px.
- **Tile height**: `ceil(scaledHeight) + 4px` so tiles overlap slightly and hide 1px gaps.

```tsx
import { useRef } from 'react';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { PEOPLE_LISTING_BG } from '@/lib/pageBackgroundTiles';

export default function MyListingPage() {
  const shellRef = useRef<HTMLDivElement>(null);

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={PEOPLE_LISTING_BG} />
        <Header />
        <main className="relative z-10">{/* content */}</main>
        <Footer />
      </div>
    </div>
  );
}
```

### 3. Page CSS

Root only provides fallback colour; **no** `background-image` on the root when the repeat layer is active:

```css
.cl-songs-page-root:has(.clpe-page) {
  position: relative;
  overflow-x: hidden;
  background-color: #ffffff;
  background-image: none;
}
```

Content (`main`, cards, list rows) stays `background: transparent`.

## Tile registry (`lib/pageBackgroundTiles.ts`)

```ts
export const PEOPLE_LISTING_BG = {
  url: '/people_mainpage.png',
  tileWidth: 1921,
  tileHeight: 1899,      // must match built PNG height
  fallbackColor: '#f7f6f4',
};
```

Import the constant for your module; pass it to `RepeatingPageBackground`.

## Checklist for a new page

1. Add source PNG under `Images/` (or `public/` with an `-original` backup).
2. Measure or tune `cropTop` / `cropBottom` in `build-page-backgrounds.mjs` (see comments in script).
3. Run `npm run build:page-bg` and note output dimensions.
4. Add entry to `lib/pageBackgroundTiles.ts`.
5. Wrap page in `cl-songs-page-root--listing` + `cl-songs-page-shell` + `ref`.
6. Render `<RepeatingPageBackground containerRef={shellRef} tile={...} />` before `<Header />`.
7. Set `:has(.your-page-class)` root to `background-image: none` and matching `fallbackColor`.
8. Verify: scroll, Load More 3–5×, hard refresh — no horizontal band between sections.

## Reflections listing cards — lower wave

Cards use shared `WavyCard` (`components/shared/WavyCard.css`):

- `wc-body::before` — wavy seam between thumb and body (`/song-card-bottom.png`).
- `wc-card::after` — paper drop shadow under the card (`/song-card-bottom-shadow.png`).

**Do not override** `.clr-card::after` with a narrow width + white gradient (that caused the wrong “double step” look on marble). Use the default `WavyCard` bottom ornament; module CSS may only set `--wc-thumb-h`, shadows, and body `min-height`.

## Files reference

| File | Role |
|------|------|
| `docs/SEAMLESS_PAGE_BACKGROUND.md` | This guide |
| `scripts/build-page-backgrounds.mjs` | Builds all tiles |
| `scripts/lib/build-seamless-repeat-tile.mjs` | Crop + bottom→top blend |
| `lib/pageBackgroundTiles.ts` | URLs + dimensions |
| `components/shared/RepeatingPageBackground.tsx` | Runtime layer |
| `components/shared/RepeatingPageBackground.css` | Layer layout |
| `components/shared/WavyCard.css` | Card lower wave (all modules) |

## Deprecated

- `SeamlessPageBackground` + `*-mirror.png` — do not use for People / Films / Reflections listing.
- `CLPeopleListingBackground.tsx` — replaced by `RepeatingPageBackground`.
