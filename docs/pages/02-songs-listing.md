# Songs Listing (`/songs`)

**Route:** `/songs`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/songs` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\songs\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLindex.tsx` (`CLSongsIndex`) |
| **Layout provider** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\songs\layout.tsx` → `SongsNavCountProvider` |
| **Background** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\SongsListingBackground.tsx` |

---

## 2. Component tree

```
app/songs/page.tsx
├── SongsListingBackground (marble watermark, scroll-linked)
└── cl-songs-page-shell
    ├── Header.tsx
    ├── main
    │   └── CLSongsIndex (CLindex.tsx)
    │       ├── Loader (panel, while isLoading)
    │       ├── ListingFilterBar
    │       │   └── CLFilterPanel (via panel prop)
    │       │       └── portal drawer: Singer | Poet | Theme columns
    │       ├── cl-az-row (A–Z letter buttons from SONGS_FILTER)
    │       ├── cl-song-grid
    │       │   └── CLSongCard × N
    │       │       └── WavyCard + Link → /songs/details/{id}
    │       └── LoadMoreButton
    └── Footer.tsx
```

**Supporting modules:**

- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongCard.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\ListingFilterBar.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Fillter\CLFilterPanel.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\LoadMoreButton.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\WavyCard.tsx`
- Constants: `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLconstants.ts` (`MOCK_SONGS`, `SONGS_FILTER`, `SONGS_INTRO`)

**Legacy (not used by CL route):** `components/Songs/index.tsx`, `components/Fillter/FilterPanel.tsx` (calls `/Api/song_filters` directly).

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Page root, grid, cards, filter bar, marble listing |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Header.css` / `Footer.css` | Chrome |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Loader.css` | Panel loader |

`CLFilterPanel` uses inline styles + `FILTER_PANEL_SHAPE` asset; no separate CSS file beyond shared tokens.

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/list` | `search=&page={n}&limit=9&singer=&poet=` | Mount + load more | `data[]`, `total`, `status` |
| `GET /Api/song_filters` | — | Mount (themes only) | `data.them[]` or `data.theme[]` → `word_transliteration` |

### Per-song list row fields (`formatSongListItem`)

| API field | UI field |
|-----------|----------|
| `id` | card link id |
| `Songtitle_transliteration` / `song_title` / `umbrellaTitleText` | title |
| `songtitletraan` / `songTitle` | subtitle |
| `singer_display` / `singer` / `singer_names[0]` | singer (filter + card) |
| `poet` / `poet_display` | poet (filter + card) |
| `thumbnailUrl` / `thumbnail_url` | thumb via `resolveCmsAssetUrl` |

**Note:** `singer=` and `poet=` query params are always empty — **no server-side filtering**.

Pagination: `SONGS_PER_PAGE = 9`; `mergeCatalogById` on load more; `catalogHasMore` gates button.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Catalog | **~234 songs** live (`total` from API) | Stable pagination; faster list endpoint |
| Singer/Poet filter chips | **Derived client-side** from loaded pages | Optional: canonical lists from `/Api/song_filters` (`song[]`, `poet[]`) |
| Theme filter chips | From `/Api/song_filters` — **only ~1 test theme** today | Fix key `them` → `theme`; populate real glossary theme taxonomy |
| Theme filtering | **Selected themes do not filter grid** (code comment: skip until per-song theme field exists) | Per-song theme ids or keyword field on list rows |
| `meta_keywords` on list | **Not used** for filters (policy: SEO only) | Structured theme tags if UI should filter by theme |
| Server filters | Unused `singer`/`poet` params | Working server-side filter OR documented as client-only |

---

## 6. Filters

| Filter | Source | Logic | API vs client |
|--------|--------|-------|---------------|
| A–Z letter | `SONGS_FILTER` constant | `Songtitle_transliteration` starts-with match | Client |
| Singer | Unique values from loaded songs | `fieldMatchesFilters` on comma/`&`-split singer field | Client |
| Poet | Unique values from loaded songs | Same on poet field | Client |
| Theme | `/Api/song_filters` labels | Chips shown; **matching not applied** in `filteredSongs` | API labels only; no client match yet |
| Max selections | `MAX_FILTERS = 5` across all types | — | Client |
| Mock singer/poet lists | `CLFilterPanel` `useSongsMockFallback: true` | Used only if `availableSingers/Poets` empty | Client fallback |

**Filter drawer:** `ListingFilterBar` → `CLFilterPanel` with categories Singer / Poet / Theme.

---

## 7. Keywords / glossary / meaning

| Field | Shown on listing? |
|-------|-------------------|
| `meta_keywords` | **No** — not rendered; not used for theme matching |
| `song_filters.them[].word_transliteration` | **Yes** — theme filter drawer only |
| Glossary meanings | **No** on listing cards |

---

## 8. Images

| Location | Source | Placeholder / onError |
|----------|--------|---------------------|
| Card thumbnail | `thumbnail_url` → `resolveCmsAssetUrl` in `CLSongCard` | `CMS_IMAGE_PLACEHOLDER` (`/placeholder.svg`) via `WavyCard` |
| Listing background | `SongsListingBackground` + CSS marble texture | Static/CSS |
| Filter panel shape | `public/songs-assets/song_filter_opaque.svg` | Static |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| Initial `/Api/list` fetch fails (page 1) | `MOCK_SONGS` from `CLconstants.ts`; count = mock length |
| Load more failure | Silent return (keeps prior data) |
| Empty `availableSingers/Poets` + `useSongsMockFallback` | Hardcoded names in `CLFilterPanel.MOCK_FILTERS` |
| Empty theme API | Theme column empty until CMS populates |

---

## 10. Known gaps / CMS action items

1. **Wire theme filter matching** — themes selectable but do not affect `filteredSongs`.
2. **Populate `song_filters.data.theme`** (fix `them` typo) with real taxonomy.
3. **Consider wiring singer/poet lists from `/Api/song_filters`** instead of only derived-from-page data (catalog may be incomplete until all pages loaded).
4. **Performance** — paginated `limit=9` reduces initial payload vs old `limit=1000`; load-more still client-fetches CMS directly (no API proxy).
5. **Legacy `FilterPanel.tsx`** still references `song_filters` — remove or align with CL path.
6. **Server-side filter params** on `/Api/list` unused — document or implement.

---

*Verified against `CLindex.tsx`, `CLSongCard.tsx`, `CLFilterPanel.tsx` — June 2026.*
