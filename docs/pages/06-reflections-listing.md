# Reflections Listing (`/reflections`)

**Route:** `/reflections`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/reflections` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\reflections\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Reflections\CLReflections.tsx` |
| **Layout** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\reflections\layout.tsx` → `ReflectionsNavCountProvider` |

---

## 2. Component tree

```
app/reflections/page.tsx
└── CLReflections.tsx
    ├── RepeatingPageBackground (REFLECTIONS_LISTING_BG tile)
    ├── Header.tsx
    ├── main.clr-page
    │   ├── REFLECTIONS_INTRO
    │   ├── Count heading
    │   ├── ListingFilterBar
    │   │   └── CLFilterPanel (Speaker | Format | Theme labels remapped)
    │   ├── cl-song-grid (3-column wavy cards)
    │   │   └── ReflectionCard (inline)
    │   │       └── WavyCard as="a" → /reflections/details/{id}
    │   └── LoadMoreButton
    └── Footer.tsx
```

**Supporting:**

- `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\speakerNames.ts` — `getSpeakerNameMap()` from `/Api/person_list`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\pageBackgroundTiles.ts` → `REFLECTIONS_LISTING_BG`
- Mocks: `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Reflections\CLReflectionMocks.ts`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Reflections\CLReflections.css` | Cards, mediatype tag (pink), grid |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Shared listing shell |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/reflection_list` | `page={n}&limit=6` | Mount + load more | `data[]`, `total` |
| `GET /Api/reflection_filter` | — | Mount | `speaker[]`, `theme[]` (format **ignored**) |
| `GET /Api/person_list` | `page=1&limit=500` | Via `getSpeakerNameMap()` (cached) | `id`, `person_name_english` → resolve `speaker_id` |

### List row mapping (`mapReflectionListItem`)

| API field | UI |
|-----------|-----|
| `id` | card link |
| `title` | card title |
| `speaker_id` | `saysBy` via speaker map (**not** `person_name_english` on row) |
| `reflection_excerpt` / `thumbnail_excerpt` | description |
| `format` | `mediaType` badge (INTERVIEW, ESSAY, …) |
| `thumbnail_url` | `${AJAB_API_BASE}${thumbnail_url}` |
| `related_keywords` | comma-separated ids → theme filter matching |

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Catalog | **~81 reflections** live | More entries; clean excerpts |
| Speakers | **183** filter speakers; card `saysBy` from person map | Consistent `speaker_id` on every row |
| Themes | **7** API themes; matched via `related_keywords` ids | Expanded theme taxonomy |
| Formats | **Hardcoded** `Interview, Visual Story, Essay, Audio Story` | Fix `reflection_filter.format` (currently person objects) |
| Live `format` values | Mostly `Interview` in list data | Diverse format values for filter usefulness |
| Excerpts | Some CMS placeholders ("test") | Real `reflection_excerpt` copy |

---

## 6. Filters

| Filter | UI label | Source | Logic | API vs client |
|--------|----------|--------|-------|---------------|
| Speaker | "Speaker" (Singer slot) | `reflection_filter.speaker` or `REFLECTIONS_FALLBACK_SPEAKERS` | `saysBy` includes selected speaker (case-insensitive) | API labels; **client match** |
| Format | "Format" (Poet slot) | `REFLECTIONS_FORMAT_OPTIONS` hardcoded | `mediaType` exact match | **Client only** |
| Theme | "Theme" | `reflection_filter.theme` or fallback | `relatedKeywordIds` contains theme id from `themeIdByLabel` | API ids; **client match** |

`ListingFilterBar` uses `categoryLabels: { Singer: 'Speaker', Poet: 'Format', Theme: 'Theme' }`.

Pagination: 6 per API page; `visibleCount` client slice; load more fetches next API page.

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `related_keywords` | **Not shown** — used only for theme filter id matching |
| `meta_keywords` | **Not shown** |
| `reflection_excerpt` | Card description |
| Theme `word_transliteration` | Filter drawer labels |

No glossary popup on listing cards.

---

## 8. Images

| Location | Source | Placeholder / onError |
|----------|--------|---------------------|
| Card thumb | `thumbnail_url` prefixed with `AJAB_API_BASE` | `onError` → inline SVG cream placeholder with pink play icon |
| Empty thumb | — | WavyCard text-only body |
| Page background | `RepeatingPageBackground` marble/tree tile | Static asset |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| `reflection_list` page 1 failure | `MOCK_REFLECTIONS` |
| `reflection_filter` failure | `REFLECTIONS_FALLBACK_SPEAKERS`, `REFLECTIONS_FALLBACK_THEMES` |
| Speaker map failure | Empty map → blank `saysBy` |
| Format list | Always `REFLECTIONS_FORMAT_OPTIONS` |

---

## 10. Known gaps / CMS action items

1. **Fix `reflection_filter.data.format`** — must return format strings, not person records.
2. **CMS "test" excerpt** on one card — data quality (UI audit #6).
3. **`person_name_english` on list API is poet attribution**, not speaker — document for CMS editors; frontend uses `speaker_id`.
4. **Format filter** limited when all rows are `Interview`.
5. **No excerpt length guard** — unlike Films (`length > 10`); consider same guard for `thumbnail_excerpt`.
6. **Mediatype color** — fixed to pink in CSS (UI audit #5 ✅).

---

*Verified against `CLReflections.tsx`, `speakerNames.ts` — June 2026.*
