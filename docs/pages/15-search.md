# Search Results (`/searche`)

**Route:** `/searche` (intentional spelling — matches legacy CMS path)

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/searche?search={query}` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\searche\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\searche\SearchResults.tsx` |
| **Search utils** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\utils\search.ts` |
| **Header typeahead** | Same endpoint in `Header.tsx` |

---

## 2. Component tree

```
app/searche/page.tsx
├── Header.tsx
├── main
│   └── Suspense → SearchResults.tsx
│       ├── Query display + result count
│       ├── Filter chips (ALL, SONGS, POEMS, REFLECTIONS, PEOPLE, FILMS)
│       ├── Result sections per category
│       │   └── result row (thumb, title, subtitle, description, Link)
│       └── Empty / loading states
└── Footer.tsx
```

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\searche\SearchResults.css` | Results layout, filters, cards |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Header.css` | Chrome |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/nitesh` | `search={q}` | `searchParams.search` changes | `status`, `total`, `counts`, `results` |

**Endpoint constant:** `SEARCH_ENDPOINT = ${AJAB_API_BASE}/Api/nitesh`

Normalized by `normalizeSearchPayload()` into typed `SearchApiResponse`.

### Per-category result fields

| Category | Title (`getPrimaryText`) | Secondary | Description | Image (`getImageUrl`) |
|----------|-------------------------|-----------|-------------|----------------------|
| songs | `umbrellaTitleText`, `Songtitle_transliteration`, … | `singer`, `song_title_hindi` | `about`, `meta_description`, … | `thumbnail_url`, YouTube fallback |
| poems | `original_title`, `couplet_transliteration`, … | `poet` | `couplet_translation`, … | thumb fields |
| reflections | `title` | — | `about`, `meta_description` | thumb fields |
| people | `person_name_english` | — | `profile`, `about` | `profile_image`, thumb |
| films | `english_transliteration`, … | `director_name_english` | description fields | thumb fields |

**Asset base:** `${AJAB_API_BASE}/uploads` for non-leading-slash paths; leading `/` → `AJAB_API_BASE` prefix.

### Detail links

Same as Header: `/songs/details/{id}`, `/poems/{id}`, `/reflections/details/{id}`, `/people/{id}`, `/films/details/{id}`.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| reflections / people / films | **Hits** for queries like `ram`, `kabir` | — |
| songs / poems | Often **0 hits** despite 234 songs / 245 poems in catalog | Full-text index on transliterated titles + lyrics |
| `total` / `counts` | Used for filter chip badges | Accurate per-category counts |
| OTHER category | **Removed** from UI (always 0) | — |
| Query echo | Displays user query string | — |

**Sample probes (from audit):**

| Query | songs | poems | reflections | people | films |
|-------|-------|-------|-------------|--------|-------|
| `ram` | 0 | 0 | 10 | 4 | 10 |
| `kabir` | 0 | 0 | 10 | 4 | 10 |
| `mhaane` | 0 | 0 | 0 | 0 | 0 |

---

## 6. Filters

| Filter | Source | Logic | API vs client |
|--------|--------|-------|---------------|
| Category chips | `FILTER_ORDER` | Client shows subset of results for SONGS, POEMS, etc. | **Client filter** on same API response |
| ALL | — | All categories with hits | Client |

Changing chip does **not** refetch — single API call per query.

---

## 7. Keywords / glossary / meaning

| Field | Shown? |
|-------|--------|
| `meta_keywords` | **No** |
| Hit `description` / `about` / `profile` | **Yes** — stripped HTML |
| Glossary term matches | **Not a separate bucket** in search API |

KeywordCloud on detail pages links **to** this page via `/searche?search=`.

---

## 8. Images

| Location | Source | Fallback |
|----------|--------|----------|
| Result thumb | Multiple thumb field names | YouTube `mqdefault.jpg` for songs with video id |
| Missing thumb | — | Row renders without image |

Paths starting with `/` use CMS base; bare filenames use `/uploads/`.

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| API failure | `emptySearchResponse` |
| Missing query param | Empty state / prompt |
| Header search failure | Same empty response |

No static mock search results.

---

## 10. Known gaps / CMS action items

1. **Index songs and poems** in `/Api/nitesh` — highest priority CMS fix.
2. **Typo route `/searche`** — document for stakeholders; redirect optional.
3. **No pagination** — all results returned in one payload; may need `page` param for large hit sets.
4. **Debounce** only in Header (300ms); results page refetches on every query change.
5. **Glossary search** — not integrated; users cannot search glossary terms via nitesh.

---

*Verified against `SearchResults.tsx`, `lib/utils/search.ts` — June 2026.*
