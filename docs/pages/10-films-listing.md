# Films Listing (`/films`)

**Route:** `/films`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/films` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\films\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Films\CLFilms.tsx` |
| **Field utils** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Films\filmFieldUtils.ts` |

---

## 2. Component tree

```
app/films/page.tsx
└── CLFilms.tsx
    ├── RepeatingPageBackground (FILMS_LISTING_BG — zardozi motif)
    ├── Header.tsx
    ├── main.clf-page
    │   ├── Count ({totalFilms} Films)
    │   └── series[] map
    │       ├── clf-series-title + intro
    │       └── clf-entry rows (click → /films/details/{id})
    │           ├── thumbnail
    │           ├── title + subtitle
    │           ├── director, duration, year, languages
    │           ├── description (guarded)
    │           └── TRAILER | FILM & MORE links
    └── Footer.tsx
```

**Mocks:** `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Films\CLFilmsMocks.ts` (`MOCK_FILM_SERIES`, `TOTAL_FILMS`)

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Films\CLFilms.css` | Series layout, entries, green medallion bg |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Page shell |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/film_list` | (no pagination in CL path — single fetch) | Mount | `data[]`, `total` |

### Row mapping (`mapFilmItem`)

| API field | UI |
|-----------|-----|
| `id` | route id |
| `english_transliteration` / `original_title` | title |
| `english_translation` | subtitle |
| `director_name_english` / `director_names_english` | director (via `formatFilmDirector`) |
| `duration` | duration |
| `year_of_production` / `year` | year |
| `language` | languages |
| `thumbnail_excerpt` / `description` | description via `getFilmListingBlurb` (**length > 10 guard**) |
| `thumbnail_url` | thumb via `thumbUrl()` |
| `series_title` | grouping key (default "Journeys with Kabir") |
| `series_description` | series intro paragraph |

**Series ordering:** hardcoded `['Journeys with Kabir', 'Ajab Mulakatein']` sort after API grouping.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Catalog | **24 films** live | `series_title` + `series_description` on each row |
| Grouping | Client groups flat list by `series_title` | Explicit series entity optional |
| Junk excerpts | Single-char `thumbnail_excerpt` ("t") **filtered out** ✅ | Clean excerpt text |
| Nav count | `--clf-nav-count` on `:root` | Header badge wiring |
| Pagination | Single bulk fetch (no load more) | Paginate if catalog grows |

---

## 6. Filters

**None** on films listing. No filter API. Optional future client filters by series/language not implemented.

---

## 7. Keywords / glossary / meaning

| Field | Shown? |
|-------|--------|
| `meta_keywords` | **No** |
| `thumbnail_excerpt` | Description slot (guarded) |
| Glossary | **No** on listing |

---

## 8. Images

| Location | Source | Placeholder / onError |
|----------|--------|---------------------|
| Entry thumb | `thumbnail_url` → `AJAB_API_BASE` + path | Listing row may hide broken thumb (check `CLFilms.tsx` img onError) |
| Background | `FILMS_LISTING_BG` tile | Static |

`thumbUrl()` handles leading `/` vs bare `uploads/…`.

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| `film_list` failure / 15s timeout | `MOCK_FILM_SERIES`, `TOTAL_FILMS` |
| Empty `data` | Loading message then empty series |

---

## 10. Known gaps / CMS action items

1. **Series metadata** — intro falls back to generic Kabir Project blurb when `series_description` empty.
2. **No pagination** — all films in one request (fine at 24; scale later).
3. **Header films count** — CSS var only.
4. **Legacy `components/Films/index.tsx`** — non-CL path.
5. **Description quality** — guard hides junk but CMS should fix at source.

---

*Verified against `CLFilms.tsx`, `filmFieldUtils.ts` — June 2026.*
