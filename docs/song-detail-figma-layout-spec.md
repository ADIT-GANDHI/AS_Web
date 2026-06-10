# Song detail page — Figma layout specification (`361:1406`)

**Companion:** for “design vs shipped + API” see **`song-detail-figma-vs-implementation-post-api.md`**.

This document records **bounding boxes and spacing** pulled from the Figma design file via **`get_metadata`** on node **`361:1406`** (group “Song detail” artboard). Coordinates are in **Figma’s absolute space** for that node; values are rounded to the nearest pixel unless noted.

**Design file:** [Ajab Shahar Designs (New)](https://www.figma.com/design/IJwbCASYYrrKaOSRDScXYV/Ajab-Shahar-Designs--New-?node-id=361-1406)  
**fileKey:** `IJwbCASYYrrKaOSRDScXYV`  
**nodeId (MCP):** `361:1406`

---

## 1. Column alignment (left edges)

These elements share the **same left edge** (~**457 px** in the export), i.e. one vertical alignment column for cards + media block:

| Element | Figma node | `x` | `width` |
|--------|------------|-----|--------|
| First version card (outer group) | `361:1446` | 457 | 288 |
| Video outer (vector frame) | `361:1465` | 457 | 1027 |
| Video inner clip | `361:1467` | 467 | 1007 |
| About / description block | `361:1472` | 457 | 1004 |
| Related block outer | `361:1509` | 452 | 1034 |

**Title row** (`361:1463`) sits slightly **inset** vs the video left: **`x` ≈ 464** (~**7 px** to the right of the video outer edge) — an optical choice in the file.

---

## 2. “4 Song Versions” header + rule

| Property | Value | Node |
|----------|--------|------|
| Title text | **215 × 34** at (866, 256) | `361:1409` |
| Rule under title | **381 × 0** (hairline) at (780, 302) | `361:1410` |

Title and rule are **horizontally centred** in the full frame (not left-aligned to the 457 px column).

---

## 3. Version cards row

| Card | Outer group node | Position (`x`, `y`) | Size (`w × h`) |
|------|------------------|---------------------|----------------|
| Left (current / grey title) | `361:1446` | (457, 347) | 288 × 322 |
| Middle | `361:1423` | (827, 347) | 288 × 327 |
| Right | `361:1414` | (1196, 347) | 288 × 319 |

**Thumb clip** (280 × 156 class boxes): e.g. `361:1449` at (461, 350) — **~4 px** inset from card outer on the left.

**Horizontal gap** (outer left to outer left):  
Middle − Left ≈ **827 − (457 + 288) = 82 px** (spacing between card columns).

**Nav chevrons** live in group `361:1411` (wide strip with vectors at **x ≈ 367** and **x ≈ 1548**) — i.e. **outside** the card column so they do not shift the first card’s left edge.

---

## 4. Song header + video + about (group `361:1462`)

Nested group **`361:1462`**: position (**457**, **783**), size **1027 × 756** (approx.).

| Block | Node | Position (`x`, `y`) | Size (`w × h`) |
|-------|------|---------------------|----------------|
| Title line (“Aarshi Nogor sings…”) | `361:1463` | (464, 783) | 370 × 36 |
| Location / year (right) | `361:1464` | (1333, 798) | 139 × 20 |
| Video outer | `361:1465` | (457, 827) | 1027 × 588 |
| Video inner clip | `361:1467` | (467, 837) | 1007 × 568 |
| About text (3 lines + more) | `361:1472` / `361:1473`–`361:1475` | (457, 1458) | 1004 × 81 (group) |

### Vertical spacing (derived)

| Between | Δ `y` (px, rounded) |
|----------|---------------------|
| Bottom of title (`361:1463`, `y + h` ≈ **819**) → top of video outer (`361:1465`, `y` ≈ **827**) | **~8** |
| Bottom of video (`827 + 588` ≈ **1415**) → top of about group (`361:1472`, `y` ≈ **1458**) | **~43** |

About line metrics in file: line boxes **~25 px** tall, **28 px** between baselines (`1473` → `1474` → `1475`).

---

## 5. Language toggle + main title + lyrics

| Element | Node | Position (`x`, `y`) | Size (`w × h`) |
|---------|------|---------------------|----------------|
| Script buttons group | `361:1480` | (850, 1676) | 240 × 44 |
| Big title “Aarshi Nogor” | `361:1476` | (861, 1784) | 220 × 46 |
| “poet LALON FAKIR” | `361:1477` | (893, 1845) | 153 × 23 |
| Lyrics stack (centred column) | `361:1488` | (754, 1917) | 423 × 862 |

Lyric text lines in Figma use **~26 px** row height in the export list (`361:1489` … `361:1508`).

---

## 6. Notes + glossary + related + glossary strip

| Element | Node | Position (`x`, `y`) | Size (`w × h`) |
|---------|------|---------------------|----------------|
| “NOTES \| GLOSSARY” | `361:1478` | (882, 2827) | 164 × 23 |
| Song Notes card stack | `361:1575` | (375, 2361) | 332 × 432 |
| Related section outer | `361:1509` | (452, 2997) | 1034 × 1118 |
| “Related” title | `361:1512` | (461, 2997) | 104 × 38 |
| Tabs line | `361:1568` | (461, 3063) | 635 × 28 |
| Related row thumb | `361:1535` / similar | (452, 3151) | 318 × 186 |
| Related row text column | `361:1544` | (781, 3158) | 662 × 145 |
| Glossary pill background | `361:1569` | (460, 3935) | 1015 × 180 |

---

## 7. Implementation cross-walk (CSS / tokens)

| Figma idea | Code location |
|------------|----------------|
| Shared **1100 px** column | `.cld-versions-section` + `.cld-detail-body-align` (same `max-width`) |
| **Body** left = **first card** left | `.cld-detail-body-align { padding-left: calc(44px + 16px); }` — matches in-flow chevron + `gap` (cards unchanged) |
| Video width **~1027 px** max in column | `.cld-video-wrap { max-width: 1027px; width: 100%; }` |
| About width **1004 px** max | `.cld-description { max-width: 1004px; }` |
| Title → video **~8 px** | `.cld-song-header { margin: 80px 0 8px; }` |
| Video → about **~43 px** | `.cld-video-wrap { margin: 0 0 43px; }` |
| Card width **288** | `--ajab-card-w` in `globals.css` |

---

## 8. Change log

| Date | Change |
|------|--------|
| 2026-05-14 | Initial spec from `get_metadata` on `361:1406`; alignment via `.cld-detail-body-align` inset (cards unchanged). |
