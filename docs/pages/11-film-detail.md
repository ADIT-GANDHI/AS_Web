# Film Detail (`/films/details/[id]`)

**Route:** `/films/details/{id}`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/films/details/[id]` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\films\details\[id]\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Films\CLFilmDetail.tsx` |

---

## 2. Component tree

```
app/films/details/[id]/page.tsx
└── CLFilmDetail.tsx
    ├── RepeatingPageBackground (FILMS_DETAIL_BG)
    ├── Loader (while loading)
    ├── Header.tsx
    ├── main.clfd-page
    │   ├── Title + subtitle + director + meta row
    │   ├── LiteYouTubeEmbed (active language version)
    │   ├── FilmLanguageToggle (language versions from film_list siblings)
    │   ├── Description (expandable)
    │   ├── Tabs: Film | Episodes (sibling films in series)
    │   ├── Episode list (related series entries)
    │   ├── Related section (tabs)
    │   └── GlossaryStrip (FILM_GLOSSARY mock)
    └── Footer.tsx
```

**Utils:** `filmFieldUtils.ts` — `extractYouTubeId`, `getFilmDescription`, `formatFilmDirector`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Films\CLFilms.css` | Detail layout |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Films\FilmLanguageToggle.css` | Language switcher |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongDetails.css` | Related rows |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Root |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |
| `react-lite-youtube-embed/dist/LiteYouTubeEmbed.css` | Player |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/film_list` | — | Mount (nav count) | `total` |
| `GET /Api/explore_film` | `film_id={id}` | Mount | Full film `data` |
| `GET /Api/film_list` | `page=1&limit=400` | After explore | Sibling episodes + language versions |
| `GET /Api/related` | `film_id={id}` | After load | Related buckets |

### explore_film fields (`mapApiItem`)

| API field | UI |
|-----------|-----|
| `english_transliteration` / `original_title` | title |
| `english_translation` | subtitle |
| `director_name_english` | director |
| `duration`, `year_of_production`, `language` | meta |
| `about` / description fields | `getFilmDescription()` |
| `youtube_video_id` | video embed |
| `thumbnail_url` | thumb |
| `series_title` | episode grouping |

### Sibling logic

- **Episodes:** same `series_title` or normalized title base
- **Language versions:** same normalized base + language suffix in title `(English)` etc.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Film detail | **Live** `explore_film` (~150ms) | Stable YouTube ids per language |
| Episodes | Derived from `film_list` siblings | Explicit `episodes[]` on series |
| Language versions | Heuristic from title suffixes | Explicit `language_versions[]` |
| Related | Live `/Api/related` | Keywords + cross-links |
| Glossary strip | **Mock `FILM_GLOSSARY`** | CMS glossary terms per film |

---

## 6. Filters

**None.** Language toggle switches `activeVideoId` client-side among discovered versions.

Episode tab filters sibling rows client-side from cached `film_list`.

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `FILM_GLOSSARY` mock | `GlossaryStrip` — static terms |
| Related keywords | **Not wired** to KeywordCloud on film detail |
| `meta_keywords` | **Not shown** |

---

## 8. Images

| Location | Source | Placeholder |
|----------|--------|-------------|
| Episode thumbs | `thumbnail_url` from list rows | Empty if missing |
| YouTube | LiteYouTubeEmbed poster | YouTube CDN |
| Background | `FILMS_DETAIL_BG` | Static |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| No id | `MOCK_FILM_DETAIL`, `MOCK_FILM_EPISODES` |
| explore failure but id in mock series | `buildMockDetailState(id)` |
| explore failure unknown id | `data: null` → not found path |
| Related failure | `FILM_RELATED` mock |
| Glossary | Always includes `FILM_GLOSSARY` mock terms |

---

## 10. Known gaps / CMS action items

1. **Language versions heuristic** — fragile; CMS should expose explicit version records.
2. **Episode detection** — series grouping by string match; needs structured series id.
3. **Glossary not API-driven** — wire related keywords or film glossary ids.
4. **KeywordCloud** — parity with song/reflection/people detail pages.
5. **15s timeout** on explore fetch — abort → mock path.

---

*Verified against `CLFilmDetail.tsx` — June 2026.*
