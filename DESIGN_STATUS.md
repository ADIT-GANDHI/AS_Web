# Ajab Shahar — Design Implementation Status

> **Last updated:** 14 May 2026 (afternoon)  
> **Reference viewport (Figma):** 1920 × 1080 px  
> **Test viewports covered so far:** 1920 px (desktop), 1440 px (laptop), 1280 px (laptop), 1024 px (small laptop)

---

## 1. Figma Assets in Use

| File | Native Size | Role |
|------|-------------|------|
| `songs_main_page.png` | 1920 × 2850 | Full-page marble/diamond background |
| `Header.png` | 1940 × 213 | White header panel + wavy bottom edge |
| `Footer.png` | 1920 × 666 | Wavy top edge + solid black footer body |
| `Fotter_tree.png` | 61 × 66 | Silhouette tree on footer wave (Songs pages only) |
| `song_filter.png` | variable | Mask for the filter panel wavy right edge |
| `search_icon.png` | 32 × 32 | Search icon in header |
| `radio.png` | 50 × 56 | Radio/TV icon in header |

---

## 2. What Has Been Done

### 2.1 Background (marble)
- **Asset integrated:** `songs_main_page.png` used as the full-page CSS background via `.cl-songs-page-root`.
- **Background size = `100vw auto`:** The marble always spans the full viewport width, scaling proportionally with the viewport. This is the only strategy that keeps the **decorative diamond-frame patterns and instrument silhouettes visible at every viewport width** (locking to a fixed 1920 px would clip those frame edges off-screen on laptops, which was the broken state observed before this fix).
- **Vertical tiling:** `repeat-y` added so very tall pages tile the marble cleanly downward.
- **White fallback:** `#ffffff` fallback colour added so the page never shows a blank background during image load.

### 2.2 Header
- **Asset integrated:** `Header.png` (white panel + wave) used as the header's CSS background.
- **Fixed height:** `--ajab-header-height: 192px` — matches the Figma reference exactly.
- **Background size = `100% 100%`:** Header.png is stretched to fill the header element so the wave always spans the full viewport width. The gentle wave shape tolerates slight horizontal scaling without visible distortion, and crucially nothing is clipped on laptop viewports.
- **Responsive nav font sizes:** Media-query breakpoints at 1600, 1366, 1200, and 1024 px reduce font sizes and logo margin so the nav never overflows.

### 2.3 Footer
- **Asset integrated:** `Footer.png` (wave + black slab) as the footer's CSS background.
- **Responsive spacing (vw units):**
  - `margin-top: clamp(-160px, -8.333vw, -80px)` — overlap scales with viewport so the wave always covers the marble above.
  - `padding-top: clamp(100px, 9.375vw, 180px)` — content start tracks the wave bottom.
- **Black gradient fallback:** A `linear-gradient(transparent → #000)` sits behind `Footer.png` so the footer body is always black even when `Footer.png`'s rendered height (which scales with viewport width) does not reach the bottom of the element. This fixed the "credits on marble" bug that was visible at 1440 px.
- **Responsive footer-inner gap:** Reduced from `10rem` to `3.5rem` at ≤ 1440 px; fixed-width text elements inside columns allowed to shrink.

### 2.4 Footer Tree (Songs pages only)
- **Asset integrated:** `Fotter_tree.png` rendered via CSS `::after` pseudo-element.
- **Responsive position:** `top: 4.167vw` (= 80 px at 1920 px) tracks the wave crest proportionally so the tree sits on the crest at every viewport width.
- **Correctly scoped:** Tree only appears on Songs listing (`body:has(.cl-songs-page)`) and Song detail (`body:has(.cld-page)`) pages — not on Home or other pages.

### 2.5 Filter Panel
- `song_filter.png` applied as a `mask-image` to give the filter panel its wavy right edge.
- `box-shadow` removed (was betraying the wavy mask outline).

### 2.6 General / Cross-page
- Horizontal overflow (`overflow-x: hidden`) fixed on the Song detail page.
- CSS scoping via `body:has()` ensures Songs-specific styles (tree, footer z-index, floating buttons) do not bleed into the Home, Poems, People, Films, or Reflections pages.
- Floating action button sizes (scroll-up: 42×43 px, share: 49×49 px) match Figma exactly, scoped to Songs pages only.

---

## 3. Current State — Screenshots (14 May 2026, afternoon)

### 3.1 Songs Listing Page

| Viewport | What looks correct | Known issues |
|----------|--------------------|--------------|
| 1920 px | Header wave ✓, marble bg ✓ (full diamond frame visible), 3-col cards ✓, footer wave + tree ✓, credits ✓ | Mock data — all card images are the same singer |
| 1440 px | Header wave ✓, marble bg ✓ (full diamond frame visible), 3-col cards ✓, footer ✓, credits ✓ | Mock data |
| 1280 px | Header ✓, marble ✓, 3-col cards ✓ (gap reduced to 40 px), footer ✓ | Mock data |
| 1024 px | Header ✓ (nav tight but readable), marble ✓, **2-col cards** (wrapped because 3 × 288 + gaps > 924 px usable), footer ✓ | 3-col → 2-col wrap may not match Figma; need stakeholder decision |

### 3.2 Song Detail Page
- All four viewports render header, marble, detail content, and footer consistently.
- Detail page has not been pixel-audited against its Figma frame.

### 3.3 Home Page
- Shares the same marble background (intentional per Figma).
- No footer tree (correct — tree is Songs-only).

---

## 4. Remaining Issues / Unsatisfied Items

These are the known gaps that still need to be addressed.

### 4.1 Header — visual alignment vs Figma
- **Issue:** The Figma `Header.png` shows the wave starting very low in the image (the white body is roughly 75–80% of the image height; the wave transition occupies the bottom 20–25%). At some viewports the gap between the header bottom and the first content element looks different from Figma.
- **Action needed:** Measure in Figma the exact pixel distance from the bottom of the header wave to the first text element (intro paragraph). Replicate that gap via a top padding or `margin-top` on `.cl-songs-page`.

### 4.2 Header — nav cramping at 1024 px and below
- **Issue:** At 1024 px viewport, the logo + 5 nav items + ABOUT + search + radio crowd together. The current breakpoint at 1024 px shrinks fonts and logo, but the result still feels tight.
- **Action needed:** Either introduce a hamburger menu earlier (e.g. at < 1100 px) or further reduce nav spacing / font sizes.

### 4.3 Card grid wrap at 1024 px (3-col → 2-col)
- **Issue:** Card grid is 3 × 288 px + 2 × 24 px gap = 912 px. With 50 px padding inside `.cl-songs-inner`, usable area is 924 px at 1024 px viewport. The grid fits in theory but the responsive `padding: 0 20px` rule reduces it further, pushing the third column to wrap.
- **Action needed:** Decide whether the Figma design wants 3 columns to be preserved at all desktop/laptop widths (then we need to reduce card width below 1100 px), or whether 2-column is the intended responsive behaviour.

### 4.4 Card grid — spacing and sizing vs Figma
- **Issue:** Card sizes (288 × ~287 px), 88 px column-gap, 53 px row-gap are pixel-matched at 1920 px. The 40 px / 24 px column-gap fallbacks for smaller breakpoints are reasonable but have not been Figma-validated.
- **Action needed:** Open Figma, confirm card width and gap at 1440 px / 1280 px frames (if those frames exist) or confirm that proportional scaling is acceptable.

### 4.5 Song Detail Page — video placeholder and lyrics area
- **Issue:** The video section and lyrics panel have not been compared against the Figma detail-page frame.
- **Action needed:** Full pixel audit of the detail page: version slider dimensions, video container aspect ratio, lyrics typography, "Related" section card row.

### 4.6 Other Pages (Poems, People, Reflections, Films)
- **Issue:** No visual audit has been done on these pages against their Figma frames.
- **Action needed:** Capture screenshots of each page at 1920 px and 1440 px and compare to Figma exports.

### 4.7 Mobile / Tablet (< 768 px)
- **Issue:** No responsive work has been done below the laptop breakpoint. The hamburger menu opens but the overall layout has not been reviewed.
- **Action needed:** Define mobile breakpoints, adjust typography scale, card grid (1-col on mobile), and ensure footer columns stack correctly.

### 4.8 Filter Panel (side panel) — full visual audit
- **Issue:** The wavy right edge is masked via `song_filter.png`. Internal layout (sliders, checkboxes, labels) has not been compared to Figma.
- **Action needed:** Open the filter panel and do a side-by-side comparison with the Figma filter frame.

### 4.9 Performance — image loading
- **Issue:** `songs_main_page.png` (1920 × 2850) is a large PNG loaded on every page that uses `.cl-songs-page-root`. No lazy-loading or optimised WebP variant exists.
- **Action needed:** Convert `songs_main_page.png`, `Header.png`, and `Footer.png` to WebP. Add `loading="eager"` and a `<link rel="preload">` for the header asset since it appears above the fold.

### 4.10 Real Data Integration
- **Issue:** All pages currently display mock/seed data. The card images are all the same (same singer photograph).
- **Action needed:** Connect the live API or provide production seed data so visual review reflects real content diversity (different song images, title lengths, etc.).

---

## 5. Recommended Next Steps (Priority Order)

1. **[ HIGH ] Pixel-audit the header gap** — Figma → measure spacing from header wave bottom to first content element (intro paragraph). Update `.cl-songs-page` `padding-top` to match.
2. **[ HIGH ] Pixel-audit song cards vs Figma** — card width, height, image ratio, gap values at 1920 px reference frame.
3. **[ HIGH ] Decide 1024 px card layout** — 3-col (requires narrower cards) or 2-col (current behaviour)? Needs stakeholder input.
4. **[ HIGH ] Tighten header at < 1100 px** — either earlier hamburger menu or further font/spacing reduction.
5. **[ MEDIUM ] Song detail page visual audit** — full Figma comparison.
6. **[ MEDIUM ] Filter panel internal layout** — side-by-side vs Figma.
7. **[ LOW ] Other pages** — Poems, People, Reflections, Films visual audits.
8. **[ LOW ] Mobile layout** — below 768 px breakpoint.
9. **[ LOW ] Performance** — WebP assets, preload header image.
10. **[ LOW ] Real data** — wire up production API so visual review uses real content.

---

## 6. Files Changed (This Sprint)

| File | What changed |
|------|--------------|
| `components/Songs/CLSongs.css` | Marble bg size `100% auto` → `1920px auto`; tree `top: 80px` → `4.167vw`; footer z-index + inner scoping |
| `styles/Header.css` | Header bg `100% 100%` → `1920px 192px`; `--ajab-header-height` locked to `192px` |
| `styles/Footer.css` | Gradient fallback layer; `margin-top`/`padding-top` converted to `clamp(…vw…)`; responsive `footer-inner` gap at ≤ 1440 px |
| `components/Songs/CLSongDetails.css` | Horizontal overflow fix for detail page |
| `components/Header.tsx` | Replaced SVG icons with Figma-exported `search_icon.png` and `radio.png` |
| `public/songs-assets/` | Added all 7 Figma-exported PNG assets from `Images/` folder |

---

## 7. How to Test Locally

```bash
# Start dev server
npm run dev

# Open in browser
# Desktop:  http://localhost:3000/songs   (resize to 1920 px)
# Laptop:   http://localhost:3000/songs   (resize to 1440 px or 1280 px)
# Detail:   http://localhost:3000/songs/details/1

# Run automated scroll-screenshot audit (captures each page at 1920/1440/1280 px)
node scripts/_deep-audit.mjs
# → outputs to _deep-audit/ folder
```

---

*This document should be updated after every working session.*
