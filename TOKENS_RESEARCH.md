# Ajab Shahar — Design Tokens & Dynamic Data Research

_Scope: started from the Songs module, applies to every module._

This document answers two related questions:

1. **Dynamic data** — when the API returns titles / subtitles / meta of varying length (or missing fields), how do the cards behave, and do the pixel distances still match Figma?
2. **Constants / tokens** — if we want everything (gaps, font sizes, colors, the "side white bars" around the marble background, etc.) to be driven from a single source of truth, how do we get there?

Both questions are connected: a token system makes the layout deterministic, which means dynamic data only changes _content_, never _structure_.

---

## 1. Dynamic data behaviour (Songs module)

### 1.1 What the data actually contains

`fetchSongs()` in `components/Songs/CLindex.tsx` normalises each API row into:

```ts
{
  id,
  Songtitle_transliteration, // pink title (Lora 24)         — can be 1–3 lines
  songtitletraan,            // italic translation (Lora 20) — can be 0–2 lines
  singer,                    // "sings <SINGER>" (MWS-L 16)  — can be empty
  poet,                      // "poet <POET>"   (MWS-L 16)  — can be empty
  thumbnailUrl,
}
```

So the four content slots that drive card height are: **title**, **subtitle**, **sings**, **poet**. Any of them may be missing or longer than the design mock.

### 1.2 Pixel distances inside the card (from Figma `361:692`)

Measured directly from the Figma file via the plugin API on text-node `absoluteBoundingBox` coordinates:

| Element | y-position | Distance to next element |
| --- | --- | --- |
| Thumbnail bottom | `21406.27` | **0 px** (title hugs the thumb) |
| Title top "Aarshi Nogor" | `21405.68` | **0 px** between title bottom and subtitle top |
| Subtitle top "City Of Mirrors" | `21436.23` | **7.34 px** between subtitle bottom and meta top |
| Meta group top "sings…/poet…" | `21469.57` | n/a — line-height handles the inter-line gap |
| Card visible bottom (no shadow) | `21536.82` | **24 px** of body bottom padding |

So the body uses **0 / 7 / 24** padding-bottom (no `margin-bottom` on title; line-heights do the work for the subtitle and the two meta lines). Our CSS now mirrors that exactly via tokens:

```91:103:app/globals.css
  --ajab-card-body-pad-x:  16px;
  --ajab-card-body-pad-t:  0px;     /* title sits flush with thumb              */
  --ajab-card-body-pad-b:  24px;
  --ajab-card-title-mb:    0px;     /* subtitle abuts title (no gap in Figma)   */
  --ajab-card-subtitle-mb: 7px;     /* Figma title-row→meta-row gap             */
  --ajab-card-radius:      4px;
  --ajab-card-shadow:      0 4px 14px rgba(0, 0, 0, 0.10);
```

And the grid spacing comes from Figma's card-to-card measurements:

- Column pitch (left edges) = `369.06 px` → column gap = `369.06 − 287.99 ≈ 88 px`
- Row pitch (with shadow) = `370.08 px` → row gap = `370.08 − 317.04 ≈ 53 px`

Tokenised as:

```105:108:app/globals.css
  /* ── Grid spacing (Figma 361:692, 3-col layout) ── */
  --ajab-grid-col-gap:     88px;
  --ajab-grid-row-gap:     53px;
  --ajab-grid-max-w:       1140px;  /* 3·288 + 2·88 = 1040, padded to 1140      */
```

### 1.3 Strategy for keeping pixel distances when content varies

There are two valid strategies. We use a **mix of both** depending on the slot.

| Slot | Strategy | Rationale |
| --- | --- | --- |
| Title | **Auto-grow up to 3 lines, clamp after** (`-webkit-line-clamp: 3`) + max-width 256 | Figma's mock already shows the row growing when one card wraps to 2 lines — same behaviour. 3 is the safety cap so a freak 80-char title doesn't blow the card. |
| Subtitle | **`min-height` reserves the slot** + clamp at 2 lines | Even when the translation is missing, we keep the vertical slot intact so the meta lines don't slide up. |
| Meta (`sings X`, `poet Y`) | **Conditionally rendered** (skip the row entirely if value is empty) + `text-overflow: ellipsis` per line | An orphan "sings " label would look like a bug. |
| Card height | `flex: 1` on the card inside a grid with `align-items: stretch` | The row's tallest card sets the height; the rest stretch to match. This is exactly what Figma does (row 1 cards are 287, row 2 cards are 311 because one of them has a 2-line title). |

The full CSS:

```248:316:components/Songs/CLSongs.css
/* ── Pink title (tokens) — Figma 361:716: Lora 24 / #E31E79.
   max-width 256 keeps wrap point identical to Figma's 2-line variant.
   line-clamp: 3 defensively protects layout against very long API titles. */
.cl-song-card-title {
  color: var(--ajab-pink-primary);
  font-family: var(--ajab-font-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--ajab-fs-h5);
  line-height: var(--ajab-lh-base);
  letter-spacing: 0;
  max-width: 256px;
  word-break: break-word;
  overflow-wrap: anywhere;
  margin: 0 0 var(--ajab-card-title-mb);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Italic subtitle (tokens) — Figma 361:717: Lora Italic 20 / #828282.
   min-height 26 preserves the vertical slot when the API row has no
   translation, so the meta block doesn't slide up. */
.cl-song-card-subtitle {
  color: var(--ajab-ink-300);
  font-family: var(--ajab-font-serif);
  font-weight: 400;
  font-style: italic;
  font-size: var(--ajab-fs-body-lg);
  line-height: var(--ajab-lh-base);
  letter-spacing: 0;
  margin: 0 0 var(--ajab-card-subtitle-mb);
  min-height: 26px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cl-song-card-subtitle:empty { margin-bottom: var(--ajab-card-subtitle-mb); }

/* ── Meta lines: sings / poet (tokens) — Figma 361:718: Merriweather
   Sans Light 16 / #4F4F4F. Single-line per meta; ellipsis on overflow. */
.cl-song-card-meta {
  font-family: var(--ajab-font-sans);
  font-size: var(--ajab-fs-body-sm);
  line-height: var(--ajab-lh-base);
  letter-spacing: 0;
  color: var(--ajab-ink-700);
  font-weight: 300;
  font-style: normal;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

And the orphan-label guard in JSX:

```44:71:components/Songs/CLSongCard.tsx
        {/* Pink title — transliteration (always reserves a slot) */}
        <div className="cl-song-card-title">
          {item.Songtitle_transliteration || '\u00A0'}
        </div>

        {/* Gray subtitle — translation (slot stays via min-height) */}
        <div className="cl-song-card-subtitle">
          {item.songtitletraan || ''}
        </div>

        {/* sings NAME — only render if singer present */}
        {singerDisplay && (
          <div className="cl-song-card-meta">
            <span className="cl-song-card-meta-label">sings </span>
            <span className="cl-song-card-meta-value">{singerDisplay}</span>
          </div>
        )}

        {/* poet NAME — only render if poet present */}
        {poetDisplay && (
          <div className="cl-song-card-meta">
            <span className="cl-song-card-meta-label">poet </span>
            <span className="cl-song-card-meta-value">{poetDisplay}</span>
          </div>
        )}
```

### 1.4 Stress-test evidence

`Songs_Comparison/stress-test-dynamic.mjs` mutates the live DOM to simulate four problematic scenarios and saves a screenshot of each:

| File | Scenario | Result |
| --- | --- | --- |
| `stress-01-long-titles.png` | All cards have 3-line titles | All cards same height (row stretches), title clamped at 3 lines, body padding preserved |
| `stress-02-missing-subtitle.png` | Every other card has no subtitle | min-height keeps the subtitle slot; meta lines do not jump up |
| `stress-03-missing-poet.png` | Every other card has no poet line | "poet " orphan label is absent; row peers still align (the 2-meta cards dictate row height) |
| `stress-04-mixed-lengths.png` | Same row contains a 1-line, 2-line and 3-line title side-by-side | All three cards stretch to the height of the 3-line card; their content stays top-anchored, body bottom-padding intact |

Run locally:

```bash
npm run dev
node Songs_Comparison/stress-test-dynamic.mjs
```

---

## 2. Constants / tokens — current state and target state

### 2.1 Where we started (audit)

`rg`-counted occurrences across **source** CSS (excluding `node_modules` and `.next`):

| What | Source files | Approx occurrences |
| --- | --- | --- |
| Pink hex (`#E31E79` / `#E6287A` / `#ED1E79`) | 25 | 130+ |
| Any hex color | 40 | 500+ |
| `font-family: 'Lora'` | 25 | 85+ |
| `font-family: 'Merriweather Sans'` | 30 | 125+ |

Every redesign right now means hunting through 25–40 files. A token layer collapses that to one.

### 2.2 The four approaches we considered

| Approach | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **A. CSS custom properties** in `app/globals.css` | Native, no build step, work in pseudo-elements & `:has()`, runtime-themeable, dev-tools friendly | Not type-checked from JS, names are strings | **Picked as the primary layer.** |
| **B. Tailwind v4 `@theme inline`** | Auto-generates utility classes (`text-ajab-pink`), works alongside (A) | Codebase is mostly hand-written CSS, not Tailwind utilities, so we'd be re-styling everything | Secondary — add later if/when components migrate to utility classes |
| **C. TypeScript `lib/design-tokens.ts`** | Type-safe, IDE autocomplete, usable from inline `style={{}}`, Framer Motion, Playwright tests | Has to be kept in sync with (A); doesn't help raw CSS files | **Picked as a secondary mirror** of (A) |
| **D. Pipe Figma Variables → CSS** | Figma is the literal source of truth; reflows whenever designer publishes | The current Figma file (`IJwbCASYYrrKaOSRDScXYV`) has **no variables defined** (`get_variable_defs` returns `{}`). Would need designer to define them first. | **Not currently viable.** Re-evaluate once design team converts the file. |

### 2.3 What we shipped — the two-layer system

**Layer 1: CSS** (`app/globals.css`)

A single `:root` block that names every brand color, the type scale, the card geometry, the grid spacing and the page chrome. Every other CSS file consumes these via `var(--ajab-…)`.

```70:115:app/globals.css
/* ─────────────────────────────────────────────────────────────────────
   AJAB SHAHAR DESIGN TOKENS (single source of truth, mirrored in
   lib/design-tokens.ts). All new CSS should reference these instead of
   hard-coding hex / px values. See TOKENS_RESEARCH.md.
   ─────────────────────────────────────────────────────────────────── */
:root {
  /* ── Brand colour palette ── */
  --ajab-pink-primary: #E31E79;   /* Songs/About headings, active state         */
  --ajab-pink-card:    #E6287A;   /* Reflection card title, slightly redder     */
  --ajab-pink-related: #ED1E79;   /* Related-item active, "see more"            */

  --ajab-ink-900:      #3C3C3B;   /* Body text, primary dark                    */
  --ajab-ink-800:      #4D4D4D;   /* Section titles                             */
  --ajab-ink-700:      #4F4F4F;   /* Card title default                         */
  --ajab-ink-600:      #575756;   /* Glossary body, intro italics               */
  --ajab-ink-500:      #6D6E71;   /* Card meta default                          */
  --ajab-ink-400:      #6F6F72;   /* Card description, related subtitle         */
  --ajab-ink-300:      #828282;   /* Subtitle (italic), pipe separator          */
  --ajab-ink-200:      #9C9B9B;   /* Inactive pipe (poems)                      */
  --ajab-ink-100:      #B1B1B1;   /* Media-type tag                             */
```

**Layer 2: TS** (`lib/design-tokens.ts`)

Hand-mirrored constants, identical values, in a typed object. Use this from components, Framer Motion, Playwright, anywhere JS:

```19:38:lib/design-tokens.ts
export const tokens = {
  color: {
    // Brand pink — three closely-related shades the design uses
    pinkPrimary: '#E31E79',
    pinkCard:    '#E6287A',
    pinkRelated: '#ED1E79',

    // Ink (greyscale) scale, dark → light
    ink900: '#3C3C3B',
    ink800: '#4D4D4D',
    ink700: '#4F4F4F',
    ink600: '#575756',
    ink500: '#6D6E71',
    ink400: '#6F6F72',
    ink300: '#828282',
    ink200: '#9C9B9B',
    ink100: '#B1B1B1',

    surface: '#FFFFFF',
    pageBg:  '#F8F8F8',
  },
```

### 2.4 Full-codebase migration (completed)

Initially only Songs was migrated as proof of concept. Following that we ran a one-shot sweep across **all** source CSS in `app/`, `components/` and `styles/`:

```bash
node scripts/migrate-tokens.mjs        # apply (in-place)
node scripts/migrate-tokens.mjs --dry  # report only
```

The script (`scripts/migrate-tokens.mjs`) is purely textual — it finds-and-replaces:

- 16 brand colors (3 pinks + 12 inks + the typo variants `#6D6F71`, `#6F7071`, `#6F7072`, `#6D7172`, `#E6257A`)
- 4 font-family patterns (Lora / Merriweather Sans, with or without generic fallback)
- 15 standard `font-size: NNpx` declarations across the type scale

It **never** touches `app/globals.css` or `styles/globals.css` (token sources).

**Migration result:**

| Run | Files updated | Substitutions |
| --- | ---: | ---: |
| Pass 1 (colors + fonts + sizes) | 28 | 1056 |
| Pass 2 (no-fallback font-family + typo-color fixes) | 13 | 33 |
| Pass 3 (E6257A typo) | 2 | 3 |
| Pass 4 (manual `'Lora', italic` typo in `Home/Poem/Poem.css`) | 1 | 1 |
| **Total** | **28 unique** | **1093** |

After the sweep, **every brand pink hex in the codebase** lives only in `app/globals.css`:

```bash
$ rg -i "#E31E79|#E6287A|#ED1E79" --type css -l app/ components/ styles/
# → empty in components/ and styles/; only app/globals.css matches.
```

Same for `font-family: 'Lora', serif` and `font-family: 'Merriweather Sans', sans-serif` — only the token definitions remain.

**Visual verification:** all 14 routes were re-captured via `node scripts/capture-all-routes.mjs` after the migration; visual output is unchanged.

### 2.4.1 What this means in practice

Edit `--ajab-pink-primary: #E31E79;` in `app/globals.css` to any other color and refresh — **every** instance across **every** module updates instantly:

- Songs / Song detail (title, filters, pipes, "see more")
- Home page card titles, footer "About / Support / Stay Connected"
- Poems language toggles, glossary highlights
- Reflections card titles
- People nav highlight, person detail titles
- Films active language pill, director byline, mode tabs
- Glossary highlighted term, About page-menu active state
- Header, footer, search overlay, news popup

Same for fonts (one edit changes Lora everywhere), the type scale (one edit changes every `--ajab-fs-h5: 24px` consumer), and the card geometry (`--ajab-card-w`, `--ajab-card-radius`, `--ajab-card-shadow`).

### 2.5 Known remaining off-palette colors

A small set of light/dark greys is still inlined because they aren't part of the principled Figma palette (mostly Tailwind UI defaults from the original scaffold). They are NOT part of the brand and changing the tokens won't affect them. Frequency snapshot:

| Hex | Count | Likely category |
| --- | ---: | --- |
| `#ffffff` | 19 | White (button bg, modal bg, etc.) — intentional |
| `#282828`, `#2a2a2a` | 16 | Footer / hero dark backgrounds |
| `#f0f0f0`, `#d8d8d8`, `#e0e0e0`, `#ececec`, `#e8e8e8`, `#ededed`, `#e6e6e6`, `#e5e5e5` | 39 | Borders, dividers, light hover states |
| `#6e6e6e`, `#4a4a4a`, `#a7a7a7`, `#6b6b6b`, `#8a8a8a`, `#999999`, `#9a9a9a`, `#4b5563`, `#b3b3b3`, `#c0c0c0`, `#c7c7c7`, `#c9c9c9`, `#cfcfcf`, `#d5d5d5`, `#d9d9d9`, `#dadada`, `#dddddd` | ~50 | Off-palette greys (code drift) |
| `#16a34a` | 2 | Tailwind green (success icon) |

If you want these consolidated too, the path is: pick a target ink token for each one, add the mapping to `scripts/migrate-tokens.mjs` `COLOUR_MAP`, re-run. Watch for visual shifts since some of these are deliberately off-palette (e.g., footer dark bg).

### 2.6 Songs card — original PoC details

The Songs card flow was the proof-of-concept consumer. Token usage on the card:

```219:248:components/Songs/CLSongs.css
.cl-song-card {
  width: var(--ajab-card-w);
  min-height: var(--ajab-card-h-min);
  flex: 1;
  background: var(--ajab-surface);
  border-radius: var(--ajab-card-radius) var(--ajab-card-radius) 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: var(--ajab-card-shadow);
  transition: box-shadow 0.25s ease;
  overflow: visible;
  position: relative;
}
```

Visual output is bit-for-bit identical to the pre-refactor version (`Songs_Comparison/localhost-songs-listing.png`).

### 2.5 The "side white bars" question

You asked specifically about the white space on the left/right of the marble background. That's the gap between the page edge and the marble texture. Today the marble width is `80vw`, centered, so each side bar is `10vw`. Now tokenised:

```119:124:app/globals.css
  /* ── Page chrome (marble / "white side bars") ── */
  --ajab-page-marble-w:    80vw;    /* width of marble background               */
  --ajab-page-side-w:      10vw;    /* visible white gutter on each side        */
  --ajab-page-max-w:       1320px;  /* clamp at this width on large monitors    */
  --ajab-page-min-w:       980px;
  --ajab-page-pad-x:       40px;
```

To change the side bar width globally we change `--ajab-page-side-w` (and `--ajab-page-marble-w` to match). All marble backgrounds (`.cl-songs-page-root`, `.cl-songs-page-root:has(.clp-page)`, etc.) can be migrated to reference these so the side-bar dimension lives in one place.

---

## 3. Migration recipe for the remaining modules

Apply this checklist for each module CSS file (Home, Poems, Reflections, People, Films, Glossary, About, News, Search):

1. **Find-and-replace colors** with token vars:
   - `#E31E79` → `var(--ajab-pink-primary)`
   - `#E6287A` → `var(--ajab-pink-card)`
   - `#ED1E79` → `var(--ajab-pink-related)`
   - `#3C3C3B` → `var(--ajab-ink-900)`
   - `#4D4D4D` → `var(--ajab-ink-800)`
   - `#4F4F4F` → `var(--ajab-ink-700)`
   - `#575756` → `var(--ajab-ink-600)`
   - `#6D6E71` → `var(--ajab-ink-500)`
   - `#6F6F72` → `var(--ajab-ink-400)`
   - `#828282` → `var(--ajab-ink-300)`
   - `#9C9B9B` → `var(--ajab-ink-200)`
   - `#B1B1B1` → `var(--ajab-ink-100)`
2. **Replace font-family** strings with `var(--ajab-font-serif)` or `var(--ajab-font-sans)`.
3. **Replace common font-sizes** (14/15/16/18/20/22/24/26/28/30/32/34 px) with `var(--ajab-fs-…)`.
4. **Replace line-heights** with `var(--ajab-lh-tight|base|relaxed)`.
5. **Where the module reuses card geometry** (Films listing, Reflections listing, Home cards, etc.), reference `--ajab-card-*` tokens for width / shadow / padding to keep all card-based listings consistent.

After each module is migrated, run `node scripts/capture-all-routes.mjs` and diff against the saved Figma artwork.

---

## 4. Sync strategies (future work)

Right now `app/globals.css` and `lib/design-tokens.ts` are hand-mirrored. Three options to remove that maintenance burden:

| Option | Implementation | Effort | Notes |
| --- | --- | --- | --- |
| **TS-as-source, generate CSS at build time** | A `scripts/build-tokens.mjs` reads `lib/design-tokens.ts` and writes a `tokens.css` imported from `globals.css`. | ~50 LOC + a `prebuild` npm script | Best of both worlds: type-safety in TS, automatic CSS, no drift. Recommended if we keep going. |
| **CSS-as-source, parse → emit TS** | Run `postcss` on `globals.css`, walk `:root` declarations, emit `lib/design-tokens.ts`. | ~80 LOC | Useful if a designer prefers to edit CSS directly. |
| **Figma Variables → both** | Once the Figma file has variables defined, call `get_variable_defs` and emit both. | Blocked on Figma setup | The true single source of truth. Track separately. |

Until one of these lands, the rule is: **edit `app/globals.css` first, then update `lib/design-tokens.ts` to match.** Add a comment to each entry pointing to the Figma node it came from so future edits stay anchored to a real design source.

---

## 5. Quick-reference file map

| File | Role |
| --- | --- |
| `app/globals.css` | Token declarations (`:root`) and font-face imports |
| `lib/design-tokens.ts` | Typed TS mirror of the tokens |
| `components/Songs/CLSongs.css` | Proof-of-concept consumer (card + grid token-driven) |
| `components/Songs/CLSongCard.tsx` | Conditionally renders meta lines; sub-slot has `min-height` for missing data |
| `Songs_Comparison/stress-test-dynamic.mjs` | Playwright stress-test: long titles, missing subtitle, missing poet, mixed-length rows |
| `Songs_Comparison/stress-01..04*.png` | Saved evidence of dynamic-data behaviour |
| `IMPLEMENTATION_PLAYBOOK.md` | The pre-existing top-level playbook; refer to its module-by-module recipe |
| `TOKENS_RESEARCH.md` | (this file) — the research / migration plan |
