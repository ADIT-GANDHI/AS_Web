# Global Header & Footer

**Scope:** Site chrome rendered on nearly every route — navigation, search overlay, newsletter footer, floating actions.  
**CMS base:** `https://ajab.designanddevelopment.in/admin` (override via `NEXT_PUBLIC_AJAB_API_BASE` in `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\ajabEnv.ts`)

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URLs** | All routes — Header/Footer are imported per-page, not in root layout |
| **Root layout** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\layout.tsx` — only `globals.css`, `CustomStyle.css`, `FloatingActions` |
| **Header** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Header.tsx` |
| **Footer** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Footer.tsx` |
| **Floating actions** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\FloatingActions.tsx` (global, from layout) |
| **Nav data** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\data.ts` → `navigationItems`, `footerLinks` |
| **Loader** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Loader.tsx` (used by listing/detail shells, not header itself) |

### Nav count providers (context)

| Context | Provider layout | Consumed by Header |
|---------|-----------------|-------------------|
| Songs count | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\songs\layout.tsx` → `SongsNavCountContext` | `SONGS (N)` badge |
| Poems count | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\poems\layout.tsx` → `PoemsNavCountContext` | `POEMS (N)` badge |
| Reflections count | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\reflections\layout.tsx` → `ReflectionsNavCountContext` | `REFLECTIONS (N)` badge |
| People count | CSS variable `--clpe-nav-count` set on `document.documentElement` by `CLPeople.tsx` | Not wired in Header nav link |
| Films count | CSS variable `--clf-nav-count` set by `CLFilms.tsx` | Not wired in Header nav link |

---

## 2. Component tree

```
app/layout.tsx
├── children (page routes)
└── FloatingActions

Per-page shell (typical)
├── Header.tsx
│   ├── Link → / (logo from public/logo.svg)
│   ├── nav → navigationItems (SONGS, POEMS, REFLECTIONS, PEOPLE, FILMS)
│   │   └── SongsNavCountContext / PoemsNavCountContext / ReflectionsNavCountContext badges
│   ├── ABOUT dropdown → /about?tab=ajab | /about?tab=kabir
│   ├── Search toggle → header-search-overlay
│   │   ├── debounced fetch → /Api/nitesh
│   │   └── Link results → detail routes per category
│   ├── Link → /radio (radio icon, pink when on /radio)
│   └── Mobile menu (full-screen overlay)
├── <main> (page content)
└── Footer.tsx
    ├── About blurb (static copy)
    ├── Newsletter form (client-only, no API)
    ├── footerLinks.main navigation
    ├── footerLinks.social
    └── Kabir logo (public/k_logo.svg)
```

**Search overlay sub-tree:** input row → ALL RESULTS row (navigates to `/searche?search=`) → per-category sections (max 3 items each) → empty state.

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Header.css` | Nav links, search overlay, header curve, active states, count badges |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Footer.css` | Footer grid, newsletter form, pink links |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Shared tokens (`--ajab-pink-primary`, fonts) — imported on many pages |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\globals.css` | Root body styles |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Loader.css` | Full-screen / panel loader (opaque white per UI audit) |

**Static assets in Header:** `public/songs-assets/search_icon.png`, `radio.png`, `radio-pink.png`, `Header.png` (curve).

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET {AJAB_API_BASE}/Api/nitesh` | `search={query}` | Header search overlay open + query non-empty; 300ms debounce | `counts.songs/poems/reflections/people/films`, `results.*[]` — normalized by `lib/utils/search.ts` |
| `GET {AJAB_API_BASE}/Api/list` | `page=1&limit=1` | Songs layout pages may populate count via context (not Header-direct) | `total` → nav badge via `SongsNavCountContext` |
| *(implicit)* | — | People/Films pages set CSS vars | Not read by Header today |

**Search result field mapping (title display):**

| Category | Primary title fields |
|----------|---------------------|
| songs | `umbrellaTitleText`, `Songtitle_transliteration`, `song_title_english`, `songTitle`, … |
| poems | `original_title`, `poem_title_english`, `couplet_transliteration`, … |
| reflections | `title`, `reflection_title_english` |
| people | `person_name_english`, `person_name` |
| films | `film_title_english`, `english_transliteration`, `english_translation` |

**Detail href mapping:** songs → `/songs/details/{id}`, poems → `/poems/{id}`, reflections → `/reflections/details/{id}`, people → `/people/{id}`, films → `/films/details/{id}`.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Nav counts (Songs/Poems/Reflections) | Live `total` from list APIs when user visits those sections | Stable `total` on first paint; optional lightweight `/Api/counts` |
| Nav counts (People/Films) | Set in page CSS vars only — **not shown in Header** | Wire Header badges or dedicated count endpoint |
| Header search | Live `/Api/nitesh`; songs/poems often **0 hits** for common transliterated queries | Full-text index across songs + poems + all modules |
| Newsletter subscribe | UI only — clears input, **no backend** | Mailing-list API or third-party integration |
| About dropdown | Static links with `?tab=` query | No API needed |
| Footer copy | Hardcoded marketing text | Optional CMS-managed footer snippets |

---

## 6. Filters

Header has **no listing filters**. Search acts as a global filter:

| Source | Logic | API vs client |
|--------|-------|---------------|
| Typeahead | Debounced `GET /Api/nitesh?search=` | Server search |
| Category sections | Only categories with `counts[cat] > 0` | Client filters empty sections |
| Full results | User submits → `/searche?search=` | Same API on results page |

---

## 7. Keywords / glossary / meaning

| Field | Shown in Header? | Notes |
|-------|------------------|-------|
| `meta_keywords` | **No** | SEO only — never rendered in header/search UI |
| Search hit descriptions | **Yes** (results page; header shows titles only) | `stripHtml` on `about`, `profile`, etc. |
| Glossary terms | **No** in header | Glossary is `/glossary` only |

---

## 8. Images

| Asset | Source | Placeholder / onError |
|-------|--------|----------------------|
| Site logo | `public/logo.svg` | Static |
| Search icon | `public/songs-assets/search_icon.png` | Static |
| Radio icons | `public/songs-assets/radio.png`, `radio-pink.png` | Static |
| Header curve | `public/songs-assets/Header.png` | Static |
| Footer Kabir logo | `public/k_logo.svg` | Static |
| Search result thumbs | Built on **SearchResults** page from `thumbnail_url`, YouTube `mqdefault.jpg` | Empty string → no image in header typeahead |

---

## 9. Mock fallbacks

| Feature | Fallback |
|---------|----------|
| Search API failure | `emptySearchResponse` — zero counts, empty arrays |
| Nav counts | `null` until context populated — badge hidden when `null` or `0` |
| Newsletter | No fallback — form resets locally |

---

## 10. Known gaps / CMS action items

1. **Index songs and poems in `/Api/nitesh`** — common queries (`ram`, `kabir`, song titles) return 0 song/poem hits while reflections/people/films return results.
2. **People/Films nav counts** — CSS variables exist but Header does not display `(N)` for PEOPLE or FILMS.
3. **Newsletter** — no API; subscribe button is non-functional beyond UX.
4. **Mobile nav** — Poems count badge missing on mobile menu (desktop has Songs + Reflections only).
5. **Search debounce** — 300ms; no request cancellation beyond `isCancelled` flag on unmount.
6. **CORS / latency** — all search calls are browser-side to CMS origin; no Next.js API proxy.

---

*Verified against `Header.tsx`, `Footer.tsx`, `lib/utils/search.ts`, and nav context layouts — June 2026.*
