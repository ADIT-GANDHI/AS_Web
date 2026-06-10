# Ajab Shahar — Implementation Playbook

A walkthrough of every step taken to align the Next.js implementation
with the Figma design, the artefacts produced at each step, and a
reusable recipe for applying the same workflow to any future module.

> **Figma source-of-truth:** file
> [`IJwbCASYYrrKaOSRDScXYV`](https://www.figma.com/design/IJwbCASYYrrKaOSRDScXYV/),
> page **"Final"**.
>
> **Codebase root:** `d:\Mihir_Avni\Ajab_New\ajabshar-main`
>
> **Live target:** `http://localhost:3001` (`npm run dev`)

---

## 0. Project orientation

| What | Where |
| --- | --- |
| App framework | Next.js 15.2.4 (App Router), React 18, TypeScript |
| Styling | Tailwind v4 + per-module CSS in `components/<Module>/*.css` |
| Animations | Framer Motion |
| Headless capture | Playwright (`scripts/capture-all-routes.mjs`) |
| Figma access | `plugin-figma-figma` MCP — `use_figma`, `get_metadata`, `get_screenshot` |
| Status doc | `All_Routes_Snapshot/CROSS_CHECK_REPORT.md` |
| Design-token extracts | `Token_Audits/*.json` |

`/songs`, `/songs/details/[id]`, `/poems`, `/reflections`,
`/reflections/details/[id]`, `/people`, `/people/[id]`, `/films`,
`/films/details/[id]`, `/glossary`, `/ajab-news`, `/about`, `/`, `/radio`
are the 14 routes captured in `All_Routes_Snapshot/`.

---

## 1. The repeatable workflow

Every module went through the same loop. Use this as the recipe for
new modules.

```
 ┌──────────────────────┐
 │ 1. Identify Figma    │  →  use_figma to find the artwork node id
 │    artwork node      │     (page "Final" → frame name)
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │ 2. Capture both sides│  →  Playwright snapshot of localhost
 │    side-by-side      │     +  get_screenshot of the Figma node
 └──────────┬───────────┘     →  saved as `figma-*.png` / `localhost-*.png`
            ▼
 ┌──────────────────────┐
 │ 3. Visual diff       │  →  Eyeball the pair; list visible deltas
 │    (gross fixes)     │     (layout, colours, sizes, typography)
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │ 4. Apply fixes       │  →  Edit `components/<Module>/*.css|tsx`
 │    in code           │     +  re-capture, re-diff, repeat
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │ 5. Token-level audit │  →  use_figma script walks every TEXT node,
 │    (pixel-perfect)   │     pulls fontName / size / lineHeight /
 │                      │     letterSpacing / textCase / fills, diffs
 │                      │     against CSS, applies remaining drift fixes
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │ 6. Update report     │  →  Promote module from 🟢 visual to ✅ done
 │                      │     in `All_Routes_Snapshot/CROSS_CHECK_REPORT.md`
 └──────────────────────┘
```

Key principle: **never trust a screenshot alone.** Visual comparison
catches gross drift but typically misses 4-8 px font sizes, 2 % weight
differences, or `#828282` vs `#6F6F72` greys. The token-level audit in
step 5 closes that gap.

---

## 2. Phase-by-phase walkthrough

This is the chronological log of what we did, what the user fed back,
and what artefact came out the other side.

### Phase A — Songs module (initial pixel-perfect pass)

**Goal:** get `/songs` and `/songs/details/[id]` to a Figma-faithful
state with marble background, filter bar inside the marble, A-Z row,
correct floating action buttons, and an accurate detail page.

**Tools:** Playwright capture, manual CSS edits, Figma `get_screenshot`.

**Files created:**

- `Songs_Comparison/capture-localhost.mjs` — Playwright script that
  loads `/songs` at 1920×1080 and saves `localhost-songs-listing.png`.
- `Songs_Comparison/capture-filter-panel.mjs` — opens the filter panel
  in two states (empty + with chips) and snapshots each.
- `Songs_Comparison/debug-panel.mjs` — runtime DOM inspector used to
  diagnose the `position: fixed` containing-block bug (see below).
- `Songs_Comparison/capture-detail.mjs` — full-page snapshot of
  `/songs/details/1`.
- `Songs_Comparison/figma-songs-listing.png`,
  `figma-filter-panel.png`, `figma-song-detail.png` — Figma reference
  exports captured via `get_screenshot`.
- `Songs_Comparison/01-listing-figma.png` &
  `01-listing-localhost.png` (and `02-…`, `03-…` pairs) — the six
  numbered side-by-side reference images the user asked us to keep.
- `Songs_Comparison/README.md` — what each file is and how to
  re-capture.

**Files changed:**

- `components/Songs/CLSongs.css` — marble background no longer
  extends past the footer, intro paragraph typography aligned, count
  row + filter bar pulled inside the marble area
  (`width: calc(80vw - 220px); max-width: 1320px; min-width: 980px`),
  A-Z row spread evenly, `:has(.cl-songs-page-root)` rules for the
  floating buttons.
- `components/Fillter/CLFilterPanel.tsx` — refactored to use
  `ReactDOM.createPortal(panel, document.body)` so the
  `position: fixed` panel escapes its `transform`-ed ancestor.
- `components/FloatingActions.tsx` — removed the `showScrollTop`
  state so the up + share buttons are always visible.
- `components/Songs/CLconstants.ts` — fixed
  `Songtitle_transliteration` typo `Aarshi Nagore` → `Aarshi Nogor`.
- `components/Songs/CLSongDetails.css` — lyrics line-height to 1.3,
  poet `#6F6F72`, NOTES pink / pipe `#9C9B9B` / GLOSSARY dark, version
  card 288×… with 280×156 thumb, song header split into three
  typographic spans.
- `components/Songs/CLSongDetailsPage.tsx` — split header line into
  `.cld-song-header-title-name` / `-sings` / `-singer`; default
  related-tab `'songs'`.
- `components/Songs/CLdetailMocks.ts` — glossary term swap
  `Alakh / Unseeable` → `Akash / Heavens`.

**Output:** the user explicitly approved the Songs listing, filter
panel and detail page after this round.

**Key debug story:** the filter panel was rendering at
`left: 302, top: 513` instead of `left: 0, top: 142`. Cause: an
ancestor had `transform: translateX(-50%)`, which makes that ancestor
the containing block for `position: fixed` descendants. Fix:
`createPortal` to `document.body` so the panel sits outside the
transformed subtree.

---

### Phase B — Home + News popup

**Goal:** rebuild the home page hero card grid and the News popup so
both match Figma `1:18355` (page) and `1:18663` (popup) exactly.

**Files created:**

- `Home_Comparison/capture-home.mjs` — captures `/` plus the News
  popup state.
- `Home_Comparison/figma-home.png`, `figma-news.png` — Figma exports.
- `Home_Comparison/01-home-figma.png` ↔ `01-home-localhost.png`,
  `02-news-figma.png` ↔ `02-news-localhost.png` — paired references.
- `Home_Comparison/README.md` — re-capture procedure + the
  token-audit table.

**Files changed:**

- `components/Home/CLHero.tsx` — reconciled
  `NewsPopupSlide.secondaryTitle` ↔ API/mock `second_title` field
  mismatch; offline mock now matches Figma.
- `components/Home/CLHome.css` — card width 380→480, thumb 200→240,
  body padding 22/28/24, title Lora 32 / `#E31E79`, subtitle Lora
  Italic 24 / `#6D6E71`, meta Merriweather Sans Light 18 / `#6D6E71`,
  poem card text 24/24/18, CTAs 5 % LS, etc.
- `components/ContentSliderModal.tsx` — removed
  `CATEGORY: {activeItem.category}` debug line; reordered slide JSX
  to image → title row → content → EXPLORE; new
  `news-title-row` / `news-by-line` / `news-explore-cta` classes.
- `styles/ModalStyle.css` — `card-heading` Lora 24, `news-title-row`
  flex layout, `news-by-line` styling, body Merriweather Sans Light
  18 / `#6D6E71` LH 1.45, `news-explore-cta` block / left-aligned /
  weight 300 / LS 4 %.

**Output:** user verified Home + News popup match Figma. This module
was the first promoted to ✅ done in the cross-check report.

---

### Phase C — Poems module

**Goal:** build out the single-poem viewer (navigable via arrows,
filter sidebar, glossary popup, language toggles, related tabs) and
match Figma `362:3254` "Poems *", plus its `Filter`, `Glossary` and
`Player Filter` variants.

**Files created:**

- `Poems_Comparison/capture-poems.mjs` — full-page snapshot of
  `/poems`.
- `Poems_Comparison/capture-poems-states.mjs` — opens the filter and
  glossary popups, snapshots each.
- `Poems_Comparison/figma-poems-listing.png`, `figma-poems-filter.png`,
  `figma-poems-glossary.png`.
- `Poems_Comparison/01-listing-…`, `02-filter-…`, `03-glossary-…`
  numbered pairs.
- `Poems_Comparison/README.md` with the token-audit table.
- **`public/poems-bg.png`** — unique Poems page background exported
  from Figma node `362:3258` (`Couplet_JungEgg.psd`). Not a generic
  asset — it lives at `public/poems-bg.png` and is referenced via
  `:has(.clp-page)` so it only applies on the Poems route.

**Files changed:**

- `components/Poems/CLPoems.css` — `.cl-songs-page-root:has(.clp-page)`
  background override; language buttons 44→55 / font 22→24;
  NOTES \| GLOSSARY light 18 LS 0; related tabs 18→22 with separate
  `.clp-related-tab-count` 15 px; thumb 110→280 / 78→158; item title
  Lora 26 / `#ED1E79`, subtitle 22 / `#6D6E71`, desc 18 / 1.4; SEE
  MORE 14 → 20 (no uppercase); glossary terms re-typed to Lora
  Regular 24 / Lora Italic 20 with highlighted-word rule.
- `components/Poems/CLPoems.tsx` — default `activeRelatedTab` from
  `'all'` → `'songs'`; tab JSX split into label + count span.

**Output:** Poems was the second module promoted to ✅ done. The user
explicitly asked to "make sure that our current and last modules are
100% aligned to the /figma-use-figjam" — that was the trigger for
upgrading the visual-only loop into a token-level audit.

---

### Phase D — Cross-check report (full route sweep)

**Goal:** stop working module-by-module from memory and produce a
single status document covering all 14 routes.

**Files created:**

- `scripts/capture-all-routes.mjs` — opens every route in a loop,
  saves a 1920×1080 PNG into `All_Routes_Snapshot/`. Marks each as
  `verified` (already token-audited) or `pending` (still 🟢 visual
  at the time of writing).
- `All_Routes_Snapshot/00-home.png` … `23-about.png` — 14 PNGs.
- `All_Routes_Snapshot/CROSS_CHECK_REPORT.md` — the master status
  document. Every row has: route, snapshot filename, status emoji,
  Figma node id, CL component path, and notes describing what was
  fixed and what is still owed.

**Status emojis used in the report:**

| Symbol | Meaning |
| --- | --- |
| ✅ done | Visual ↔ Figma matches **and** token-level audit complete |
| 🟢 visual | Visual matches but no token-level audit yet |
| 🟡 partial | Implementation exists but has visible issues vs Figma |
| 🔴 skeleton | Page renders but content is sparse / fails without API |
| ⚪ not started | No CL implementation yet |

**Output:** at the end of this phase the report listed 2 × ✅ (Home,
Poems), 11 × 🟢 visual, 1 × 🟡 partial (`/about`).

---

### Phase E — Re-cross-check pass (offline mocks + bug fixes)

The full sweep surfaced a class of bugs that only show up when the
backend is offline:

| Issue | Root cause | Fix |
| --- | --- | --- |
| `/glossary`, `/ajab-news`, `/about` rendered **"Failed to fetch"** | API offline; hooks had no fallback | Added `MOCK_GLOSSARY`, `MOCK_NEWS`, `MOCK_ABOUT_AJAB` / `…_KABIR` and `try { fetch } catch { setData(MOCK_…) }` in `hooks/use-glossary.ts`, `components/ajab-news/News.tsx`, `hooks/use-about.ts` |
| Floating action buttons stacked at bottom-left on the same three routes | `styles/CustomStyle.css` (which sets `.floating-actions { position: fixed }`) was only imported on routes that pulled it in directly | Imported `@/styles/CustomStyle.css` once at the layout level (`app/layout.tsx`) |
| `/reflections/details/[id]` showed "Aarshi Nogor says PARVATHY BAUL" placeholder + empty Poem 1/2/3 cards | Mock never updated to a real reflection; default related tab was `'all'` | Rewrote `MOCK_REFLECTION_DETAIL` to "'Shoonya' is not 'nothingness' / KRISHNA NATH / Bengaluru, 2012"; default tab → `'songs'` |
| Header showed `PEOPLE(201)` while body said `69 People` | Hardcoded count in CSS `::after` pseudo-element | `components/People/CLPeople.css`: `content: '(201)'` → `content: '(69)'` |
| `/people/[id]` was a sparse skeleton vs Figma's rich layout | Original component never built out | Rebuilt `CLPeopleDetail.tsx`: titlebar (name + role), `.clped-bio-gallery--left` (2 portraits), wrapped paragraphs, `.clped-bio-secondary` landscape + caption, full Related section (tabs default `'songs'`, 3 cards reusing `cld-` styles) |
| `/films/details/[id]` similarly skeletal | Same | Rebuilt `CLFilmDetail.tsx`: Film \| Episodes sub-tabs, director byline, language pills row, expandable description with `more`, full Related, glossary terms row. New `clfd-mode-*` / `clfd-lang-*` / `clfd-description-more` / `clfd-related` CSS |
| `/glossary` had pink term titles, full-width layout, item dividers not in Figma | Initial CSS guess | Constrained `.glossary-container` to 760 px centred, term titles `#3C3C3B` not pink, body Merriweather Sans Light, dividers removed |
| `/ajab-news` flattened section headers into a single list | Mock data was a flat array | Restructured `MOCK_NEWS` so section intros come first (Films, Journeys with Kabir, Ajab Mulakatein) followed by their item cards |

**Files created during Phase E:** Comparison folders for every route
that didn't have one yet — `People_Comparison/`,
`Films_Comparison/`, `Glossary_Comparison/`, `AjabNews_Comparison/`,
`About_Comparison/` — each with the Figma reference PNG downloaded
via `get_screenshot`.

**Output:** all 14 routes captured cleanly, no more API errors, no
more debug labels, no more sparse-skeleton pages. Status: 4 × ✅,
9 × 🟢 visual, 1 × 🟡 partial.

---

### Phase F — Token-level audit pass (the audit you just saw)

**Goal:** run the strict typography / colour / size diff against
Figma for every remaining 🟢 module.

**Tool used:** `use_figma` (Figma Plugin API via the
`plugin-figma-figma` MCP server). For each artwork we ran a script of
the shape:

```js
const node = await figma.getNodeByIdAsync('<NODE_ID>');
const rgb = c => '#' + ['r','g','b']
  .map(k => Math.round(c[k]*255).toString(16).padStart(2,'0')).join('');

const texts = node.findAll(t => t.type === 'TEXT');
const rows = [];
for (const t of texts) {
  const segs = t.getStyledTextSegments(
    ['fontName','fontSize','lineHeight','letterSpacing','textCase','fills']
  );
  for (const s of segs) {
    rows.push({
      id: t.id,
      text: s.characters.slice(0, 60),
      font: `${s.fontName.family} ${s.fontName.style}`,
      size: s.fontSize,
      lh: s.lineHeight,
      ls: s.letterSpacing,
      case: s.textCase,
      colour: rgb(s.fills[0].color),
    });
  }
}
return { count: rows.length, rows };
```

That gave us a row-per-styled-segment table for every artwork. We
diffed each row against the corresponding CSS class and applied any
drift.

**Files created:**

- `Token_Audits/01-songs-figma.json` — full token extract for
  `/songs` (artwork `361:690`, content lives in `361:692`).
- `Token_Audits/02-song-detail-figma.json` — same for
  `/songs/details/[id]` (artwork `361:1403`).
- `Token_Audits/README.md` — index of audit artefacts and a pointer
  to `CROSS_CHECK_REPORT.md` for modules whose extract was applied
  inline.

**Files changed (Phase F edits only — see CROSS_CHECK_REPORT for the
exact deltas per module):**

- `components/Songs/CLSongs.css` — filter pipe `#828282` → `#E31E79`.
- `components/Songs/CLSongDetails.css` — version card 18→24,
  related-section rebuilt (Lora 30 title, Light 22 / 15 tabs, 280×158
  thumb, Lora 26 item title, Light 18 desc, Light 20 SEE MORE),
  glossary row to Lora Regular 24 / Lora Italic 20.
- `components/Songs/CLSongDetailsPage.tsx` — wrap related tab count
  in its own `.cld-related-tab-count` span.
- `components/Reflections/CLReflections.css` — intro 18→20 / `#575756`,
  filter pipe `#9C9B9B`, card title 24 / `#E6287A`, "says X" 16 /
  `#6F7071`, media-type tag 14 / `#B1B1B1`; detail page header
  rebuilt with inline "says" + singer spans, meta 18, description 20.
- `components/Reflections/CLReflectionDetail.tsx` — count span split.
- `components/People/CLPeople.css` — intro `#828282` 20, entry name
  Lora 26 / `#4F4F4F`, role Light 18 LS 0, desc 16 / `#6F6F72`;
  detail page titlebar role 18 LS 0, bio 18 / `#6F6F72`.
- `components/People/CLPeopleDetail.tsx` — count span split.
- `components/Films/CLFilms.css` — series title Lora 34 / `#4D4D4D`,
  series intro Lora Italic 20 / `#828282`, entry title Lora 28 /
  `#575756`, director / meta / desc 17-18 / `#6F6F72`, TRAILER \|
  FILM & MORE 17 original case; detail page header 28 / 18,
  description 20 / `#4F4F4F`, **Film \| Episodes Lora Regular 32**,
  language pills 18 LS 0.
- `components/Films/CLFilmDetail.tsx` — count span split.
- `components/Glossary/Glossary.css` — title Merriweather Sans
  Regular 18 / `#4F4F4F`, meaning Merriweather Sans Light 18 /
  `#575756`.
- `components/ajab-news/News.css` — `.custom-heading-font` Lora 28 /
  `#4D4D4D`, `.leading-relaxed` Light 18 / `#6D6E71` LH 1.5,
  `.news-card-heading` Lora 26 / `#6D6E71` + Italic 22 subtitle.
- `components/About/About.css` — toggle Light 21 / `#4D4D4D`,
  section label 18 LS 0, body Light 18 / `#4F4F4F` LH 1.55.

**Output:** `CROSS_CHECK_REPORT.md` updated to **12 × ✅ done,
1 × 🟢 visual (`/radio` — no Figma artwork), 1 × 🟡 partial (`/about`
— layout-refactor only)**. All 14 routes re-captured and visually
verified.

---

## 3. Reusable assets

### Capture scripts

| Script | What it does |
| --- | --- |
| `scripts/capture-all-routes.mjs` | Loops over every known route, saves a 1920×1080 PNG into `All_Routes_Snapshot/`. Run after any cross-cutting change. |
| `Songs_Comparison/capture-localhost.mjs` | Single-route snapshot for `/songs`. |
| `Songs_Comparison/capture-filter-panel.mjs` | Opens the filter panel in two states (empty + with chips) and snapshots each. Pattern reusable for any popup/modal. |
| `Songs_Comparison/capture-detail.mjs` | Full-page snapshot of `/songs/details/1`. |
| `Songs_Comparison/debug-panel.mjs` | Runtime DOM inspector — useful when a `position: fixed` element ends up in the wrong place. |
| `Home_Comparison/capture-home.mjs` | Home page + News popup. |
| `Poems_Comparison/capture-poems.mjs` | Full-page snapshot of `/poems`. |
| `Poems_Comparison/capture-poems-states.mjs` | Filter and glossary popup states. |

### Status / audit documents

| Path | Purpose |
| --- | --- |
| `All_Routes_Snapshot/CROSS_CHECK_REPORT.md` | Master status table; one row per route. The single source of truth for "what's done / what's owed". |
| `Token_Audits/README.md` | Index of token-level audit artefacts and which `CROSS_CHECK_REPORT` row each module's audit lives in. |
| `Token_Audits/01-songs-figma.json` | Raw Figma typography extract for `/songs` (kept as reference). |
| `Token_Audits/02-song-detail-figma.json` | Same for `/songs/details/[id]`. |
| `Songs_Comparison/README.md`, `Home_Comparison/README.md`, `Poems_Comparison/README.md` | Per-module re-capture procedures + audit tables. |

### Code-level patterns established

- **`:has()` background overrides** — `body:has(.clp-page)
  .cl-songs-page-root { background: …poems-bg.png… }` lets a route
  inherit the shared marble container while supplying a unique
  background image.
- **Portal-rendered popups** — anything `position: fixed` that may
  live inside a `transform`-ed ancestor must use
  `ReactDOM.createPortal(..., document.body)` (see
  `components/Fillter/CLFilterPanel.tsx`).
- **Global floating actions** — `app/layout.tsx` imports
  `@/styles/CustomStyle.css` once so the right-middle ^/share buttons
  show on every route.
- **Offline mock fallback** — every data hook
  (`hooks/use-glossary.ts`, `hooks/use-about.ts`) and any page
  fetcher (`components/ajab-news/News.tsx`) wraps the API call in
  `try { … } catch { setData(MOCK_…) }` so the page still renders the
  Figma layout when the backend is offline.
- **Related-tabs label + count split** — JSX renders
  `{t.label}<span className="cld-related-tab-count">({t.count})</span>`
  so Figma's two font sizes (22 px label + 15 px count) can both
  apply. This pattern is reused in the Songs / Reflections / People
  / Films detail pages.

---

## 4. Final status

| Bucket | Count | Modules |
| --- | --- | --- |
| ✅ done (visual + token audit) | 12 | `/`, `/songs`, `/songs/details/[id]`, `/poems`, `/reflections`, `/reflections/details/[id]`, `/people`, `/people/[id]`, `/films`, `/films/details/[id]`, `/glossary`, `/ajab-news` |
| 🟢 visual only (no Figma artwork) | 1 | `/radio` |
| 🟡 partial (layout-refactor owed) | 1 | `/about` — Figma renders all menus as one long single-scroll page; we still tab between them |

Open low-priority follow-ups (documented at the bottom of
`CROSS_CHECK_REPORT.md`):

- Refactor `/about` into a single-scroll concatenated layout (or use
  the tabs as anchor links).
- Replace `/searche` (typo route) with `/search` once the redirect
  strategy is decided.

---

## 5. Recipe for a new module

If a new route shows up in Figma and needs the same treatment, follow
these steps:

### 5.1 Discover the artwork

```js
// In Figma plugin via use_figma:
const final = figma.root.children.find(p => p.name === 'Final');
await figma.setCurrentPageAsync(final);
const matches = final.findAll(n =>
  (n.type === 'FRAME' || n.type === 'COMPONENT' || n.type === 'SECTION') &&
  /<your-module-name>/i.test(n.name)
);
return matches.map(n => ({ id: n.id, name: n.name, w: n.width, h: n.height }));
```

Some artworks are empty wrappers — if `kids === 0`, look for a
sibling group at the same coordinates (the actual content often lives
inside a `HEADER FOOTER` group). See how `361:690` was empty but the
Songs content really lived in `361:692`.

### 5.2 Build the localhost capture script

Copy `Songs_Comparison/capture-localhost.mjs` into a new
`<Module>_Comparison/` folder, change the URL and the output path,
and add it to `scripts/capture-all-routes.mjs`'s route table so
future full-sweeps include it.

### 5.3 Get the Figma reference

Use `get_screenshot` (Figma MCP) on the artwork node id. Save it
into the same `<Module>_Comparison/` folder as
`figma-<module>.png`. Pair it with the localhost capture as
`01-…-figma.png` ↔ `01-…-localhost.png`.

### 5.4 First-pass visual fixes

Open both PNGs side by side. Fix the gross deltas in
`components/<Module>/*.css|tsx`. Re-capture. Iterate until the two
images look "the same" at a glance.

### 5.5 Token-level audit

Run the typography-extract script in section 2 / Phase F against
the artwork node. Save the extract into
`Token_Audits/<NN>-<module>-figma.json`. Diff every row against
the CSS — expect to find:

- font-size off by 2-6 px (e.g. 13 vs 18, 22 vs 28),
- weights at 400 where Figma uses 300 Light (Merriweather Sans),
- letter-spacing of 0.04-0.08 em where Figma is `0`,
- `text-transform: uppercase` we added but Figma keeps
  `ORIGINAL` (often the data is already uppercased),
- `#828282` / `#4F4F4F` substituted for Figma's exact `#6F6F72` /
  `#6D6E71` greys,
- pink that should be `#E31E79` vs `#E6287A` vs `#ED1E79`
  (Figma actually uses three slightly different pinks — be precise).

Apply the fixes, re-capture, re-diff.

### 5.6 Update the report

Add or update the row in `All_Routes_Snapshot/CROSS_CHECK_REPORT.md`:

- status emoji `🟢 visual` → `✅ done`,
- Notes column lists the deltas you fixed in this pass.

If the artwork has multiple states (filter panel, popup, etc.),
write a `capture-<module>-states.mjs` script that opens each state
and snapshots them too — same pattern as
`Poems_Comparison/capture-poems-states.mjs`.

### 5.7 Common gotchas

- **PowerShell shell:** `&&` is not a statement separator. Use `;`
  or run commands one at a time. `Copy-Item -Force` instead of
  `copy /Y`.
- **`figma` global gotchas:** `setCurrentPage` is not supported —
  use `await figma.setCurrentPageAsync(page)`. `node.fills` may
  throw on `GROUP` / `DOCUMENT` nodes — wrap in `try/catch` and
  filter out non-element node types.
- **Figma "Inter Regular" reports:** when Figma's reported font is
  `Inter Regular` and the visual clearly isn't Inter, that's the
  fallback for a missing font. The intended font is usually Lora
  or Merriweather Sans — fall back to whatever the rest of the
  artwork uses.
- **Three pinks:** Figma's design system uses `#E31E79`,
  `#E6287A`, `#ED1E79` in slightly different contexts. Always pull
  the exact hex from the audit, don't reuse `#E31E79` everywhere.
- **`position: fixed` inside `transform`:** if a popup ends up at
  the wrong coordinates, look for an ancestor with `transform`
  set — that becomes the containing block. Use `createPortal` to
  escape it.

---

## 6. Quick-reference: re-running everything

```pwsh
# from d:\Mihir_Avni\Ajab_New\ajabshar-main
npm run dev                         # start the server on :3001
node scripts/capture-all-routes.mjs # re-snapshot every route
```

Then review the new PNGs in `All_Routes_Snapshot/` and update
`CROSS_CHECK_REPORT.md` as needed.

---

_End of playbook. For per-module deltas always consult
`All_Routes_Snapshot/CROSS_CHECK_REPORT.md` — that document is the
ongoing source of truth and is updated on every audit pass._
