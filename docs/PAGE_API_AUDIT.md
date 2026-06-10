# Page-by-page CMS API audit

**Audit date:** 7 June 2026  
**CMS base probed:** `https://ajab.designanddevelopment.in/admin`  
**Frontend default:** `lib/ajabEnv.ts` → same URL unless `NEXT_PUBLIC_AJAB_API_BASE` is set  

This document maps **every user-facing route** to the **API calls it makes**, what the live CMS returns today, what the UI actually uses, and where mocks or workarounds still apply.

To re-run the probe:

```bash
node scripts/probe-cms-apis.mjs
# writes scripts/probe-cms-apis-output.json
```

---

## Executive summary

| Area | Live API? | Filter API? | Main gap |
|------|-----------|-------------|----------|
| Home | Yes | — | Some `latest` cards have sparse fields (e.g. person placeholder) |
| Songs listing | Yes | **Not wired** — built from `/Api/list` | `/Api/song_filters` is live but **unused** by CL UI |
| Song detail | Yes (slow) | — | `/Api/explore_songs` takes **~60s**; `/Api/song_versions` often empty |
| Poems listing | Yes | **Yes** — `/Api/poem_filters` | Theme list in API has **1 test entry**; themes also derived from `meta_keywords` |
| Poem detail | Partial | — | `?id=` returns a page of poems, not a single record (works if first item matches) |
| Reflections | Yes | **Partial** — speakers/themes live; format hardcoded | CMS `reflection_filter.format` contains **people**, not formats |
| People | Yes | **No API** — static categories in UI | Filters are client-side only |
| Films | Yes | — | Listing + detail work |
| Glossary | Yes (thin) | — | Only **1** term → app falls back to **mock glossary** |
| About | Yes (mixed) | — | Ajab tab has placeholder `copyrights` → **full tab uses mock**; Kabir tab mostly placeholder |
| Ajab News | Yes | — | 13 items; popup slides render when `popup_items` present |
| Search | Yes | — | Songs/poems often **0** hits for typical queries; reflections/people/films work |
| Radio | **No API** | Mock only | Entire page is static mock data |

**Bottom line on filters:** Filter endpoints **are live now** (`song_filters`, `poem_filters`, `reflection_filter`). The Songs page still **does not call** `song_filters`; it derives Singer/Poet/Theme chips from each song in `/Api/list`. Poems and Reflections **do** call their filter APIs for poets/speakers and themes.

---

## Master endpoint health matrix

All requests returned **HTTP 200** and `status: true` unless noted.

| Endpoint | Latency (sample) | Records (`total`) | Used by (active CL routes) |
|----------|------------------|-------------------|----------------------------|
| `GET /Api/home` | ~1s | `latest` object | `/` (`CLHero.tsx`) |
| `GET /Api/news` | ~30ms | 13 | `/`, `/ajab-news` |
| `GET /Api/list` | **5–30s** at `limit=1000` | **234** songs | `/songs`, song detail nav, SSG |
| `GET /Api/song_filters` | ~200ms | 234 singers, 245 poets, **1** theme | **Legacy only** (`FilterPanel.tsx`) — **not** `/songs` |
| `GET /Api/explore_songs?song_id=&language=` | **~60s** | 1 song object | `/songs/details/[id]` |
| `GET /Api/song_versions?song_id=` | ~1s | Often **0** | Legacy `SongDetailsClient` only |
| `GET /Api/related?song_id=` | ~3s | keywords + related buckets | Song detail |
| `GET /Api/poems` | ~200ms | **245** | `/poems`, poem detail |
| `GET /Api/poem_filters` | ~400ms | **183** poets, **1** theme | `/poems` filter drawer |
| `GET /Api/reflection_list` | ~300ms | **81** | `/reflections`, reflection detail SSG |
| `GET /Api/reflection_filter` | ~300ms | 183 speakers, 7 themes, 183 “format”* | `/reflections` filter drawer |
| `GET /Api/person_list` | ~350ms | **183** | `/people`, people detail |
| `GET /Api/explore_person?person_id=` | ~500ms | 1 person | `/people/[id]` |
| `GET /Api/film_list` | ~300ms | **24** | `/films`, film detail |
| `GET /Api/explore_film?film_id=` | ~150ms | 1 film | `/films/details/[id]` |
| `GET /Api/explore_reflection?reflection_id=` | ~100ms | 1 reflection | `/reflections/details/[id]` |
| `GET /Api/glossary` | ~130ms | **1** | `/glossary` |
| `GET /Api/about` | ~200ms | sections object | `/about` |
| `GET /Api/nitesh?search=` | ~1–2s | varies | Header search, `/searche` |

\* `reflection_filter.data.format` is **mis-populated** (person `first_name` objects, not Interview/Essay/etc.). The app intentionally keeps Format options hardcoded.

---

## Route-by-route breakdown

### `/` — Home

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/home` | Mount (`CLHero.tsx`) | `latest.song`, `.poem`, `.reflection`, `.person`, `.film` | Cards show **live** featured content when `status` + `latest` present |
| `GET /Api/news` | Mount | 13 news rows with `popup_items` | “Ajab News” popup uses live slides (`category: single \| multiple`) |

**What you get:** Rich song object (lyrics HTML, singer/poet, YouTube id, thumbnails under `uploads/thumbnails/…`). Reflection and film cards are usable. The `latest.person` sample in the probe was a **test record** (“new singer”, unpublished).

**What you don’t get / fallbacks:** On network failure, `CLHomeMocks` remain in state until API succeeds. No separate filter API on home.

---

### `/songs` — Songs listing

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/list?page=1&limit=1000&search=&singer=&poet=` | Mount (`CLindex.tsx`) | 234 songs, `total: 234` | Grid shows **live songs**; nav count **234** |

**Filter behaviour (important):**

| Source | Called? | What it provides |
|--------|---------|------------------|
| `/Api/song_filters` | **No** (CL path) | 234 `singer_name`, 245 `poet_name`, 1 `them[].word_transliteration` (key is **`them`**, not `theme`) |
| Derived from `/Api/list` | **Yes** | Singers/poets from `singer` / `singer_display` / `singer_names`; themes from **`meta_keywords`** split on `,` and `&` |

**Field coverage on full list (n=234):**

- Singer present: **233 / 234**
- Poet present: **233 / 234**
- `meta_keywords` present: **229 / 234** → ~**569** unique theme keyword tokens when split

**`CLFilterPanel`:** Receives `availableSingers/Poets/Themes` from parent. `useSongsMockFallback: true` means if a category were empty, hardcoded mock names would show — with live list data, **mock singers/poets are not used**; themes come from keywords.

**What you get now:** Full catalog, working A–Z filter, working multi-select Singer/Poet/Theme filters aligned to list data.

**What you don’t get:**

- Dedicated theme taxonomy from CMS (`song_filters.data.them` has only 1 test value: `"Saudaagir asdasdasd"`).
- Server-side filter query params (`singer=`, `poet=` on `/Api/list`) — UI filters **client-side** after bulk fetch.
- `/Api/song_filters` integration on the CL songs page (legacy `components/Songs/index.tsx` + `FilterPanel.tsx` still reference it).

**Performance note:** `limit=1000` regularly takes **15–30s** in browser; risk of timeout on slow networks. Comment in code mentions a proxy route that is **not** implemented under `app/api/`.

---

### `/songs/details/[id]` — Song detail

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/list?page=1&limit=1` | Mount | `total: 234` | Header “SONGS (234)” count |
| `GET /Api/explore_songs?song_id={id}&language=hindi` | Mount | Full song + lyrics HTML | Main content **live** if response completes |
| `GET /Api/explore_songs?...&language=english` | Background | English translation fields | Merged into lyrics/title without reload |
| `GET /Api/related?song_id={id}` | After song load | `data`: keywords, songs, poems, reflections, people, films | Related section **live** |

**What you get:** Lyrics (original, transliteration, translation), about HTML, YouTube id, singer/poet display, thumbnails, meta fields.

**What you don’t get / risks:**

- **`explore_songs` is very slow (~60s)** for song id `260` in testing — users on default fetch timeouts may see **`MOCK_DETAIL`** fallback.
- **`/Api/song_versions`** returned **0** versions for tested ids — CL detail uses `[songDetails]` as a single version, not the versions carousel API.
- Legacy `SongDetailsClient.tsx` still calls `song_versions`; CL path does not.

---

### `/poems` — Poems listing

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/poems?page=1&limit=…` | Mount | **245** poems | Carousel + listing **live** |
| `GET /Api/poem_filters` | Filter panel mount | **183** poets, **1** theme | Poet chips **live**; theme list mostly from API entry or fallback |

**`poem_filters` shape:**

```json
{
  "data": {
    "poets": [{ "id", "first_name", "middle_name", "last_name", "poet_name" }],
    "themes": [{ "id", "word_transliteration" }]
  }
}
```

Frontend maps `poet_name` and `word_transliteration` (`CLPoemFilterPanel.tsx`).

**Filter matching:** Selected poets/themes are matched against each poem’s `attributed_poet` / `poet` and `meta_keywords` (`CLPoems.tsx`) — same pattern as songs.

**What you get:** Full poem bodies (`original_text`, `english_transliteration_text`, `english_translation_text`), notes, glossary snippet, thumbnails.

**What you don’t get:**

- Rich theme taxonomy (API themes: **1** test string). Many themes only appear if present in per-poem `meta_keywords`.
- Audio: `soundCloud_track_url` / `soundCloud_iD` often empty → player popup still uses **mock singers** in `CLPoemPopups.tsx`.

---

### `/poems/[id]` — Poem detail

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/poems?id={id}` | Mount | Returns **paginated list** (e.g. 10 items), not an isolated record | Uses **`data[0]`** only |
| `GET /Api/related?poem_id={id}` | After load | Related buckets | Via `lib/mapRelatedResponse.ts` |

**CMS bug / gap:** `?id=305` returned 10 poems with first id `305` — filtering by id is unreliable. Detail works when the intended poem is first in the array; otherwise wrong poem or mock.

**SSG:** `app/poems/[id]/page.tsx` uses `GET /Api/poems?page=1&limit=400` for static paths.

---

### `/reflections` — Reflections listing

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/reflection_list?page=1&limit=200` | Mount | **81** reflections | Cards **live** |
| `GET /Api/reflection_filter` | Mount | 183 speakers, 7 themes | Speaker/theme filter options **live** |

**Format filter:** Hardcoded `['Interview', 'Visual Story', 'Essay', 'Audio Story']` — **not** from API (`CLReflectionFilterPanel.tsx` comment documents CMS `format` field bug).

**Live reflection `format` values in list:** Probe of 200 items showed only **`Interview`** — may limit format filter usefulness even when hardcoded.

**What you get:** Title, excerpt, thumbnail, `person_name_english` as speaker, format label.

**What you don’t get:** Correct `reflection_filter.data.format` (contains person records). Theme count small (7) vs 81 reflections.

---

### `/reflections/details/[id]` — Reflection detail

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/reflection_list?page=1&limit=1` | Nav count | `total` | Header count |
| `GET /Api/explore_reflection?reflection_id={id}` | Mount | Full reflection | Interview video id, essay HTML, etc. |

**What you get:** Rich detail payload (youtube id, interview fields, essay content, related ids).

---

### `/people` — People listing

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/person_list?page=1&limit=400` | Mount | **183** people | Grid **live** |

**Filters:** `CLPeopleFilterPanel` uses **static categories** (Poets, Singers, Writers, …) — **no** `/Api/person_filters` exists. Filtering is client-side by role/tags.

**What you get:** `person_name_english`, `person_name`, occupation, thumbnail, about/profile HTML.

---

### `/people/[id]` — Person detail

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/person_list?page=1&limit=1` | Nav count | `total` | Header count |
| `GET /Api/explore_person?person_id={id}` | Mount | Full profile + related id lists | Detail **live** |
| `GET /Api/related?person_id={id}` | Related block | Cross-content links | When wired in detail component |

---

### `/films` — Films listing

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/film_list` | Mount | **24** films | Cards **live** |

No filter API; optional client filters only.

---

### `/films/details/[id]` — Film detail

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/film_list` | Nav / fallback | Catalog | Count + list fallback |
| `GET /Api/explore_film?film_id={id}` | Mount | Full film | Player, about, directors |
| `GET /Api/film_list?page=1&limit=400` | Related carousel | Sibling films | Live |

---

### `/glossary` — Glossary

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/glossary` | Mount (`use-glossary.ts`) | **1** term (`total: 1`) | **`MOCK_GLOSSARY`** shown |

**Quality gate:** Even when API returns data, entries with term length > 60 or meaning < 30 chars after stripping HTML are rejected; fewer than 3 “real” entries → mock.

**What you get from API:** Structure is correct (`glossary_term`, `glossary_meaning`, related ids).

**What you don’t get:** Enough real terms to pass the gate — page is effectively **mock-driven** today.

---

### `/about` — About

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/about` | Mount (`use-about.ts`) | `data.ajab_shahar.menus`, `data.kabir_project.menus` | **Mixed** |

**Ajab Shahar tab:** Menus `intro`, `translit guide`, `copyrights`. `copyrights` content is placeholder (`dgfdgfhgjhkj`, 12 chars). `isMenuMapMeaningful` requires **every** entry ≥ 20 chars → **entire Ajab tab falls back to `MOCK_ABOUT_AJAB`**.

**Kabir Project tab:** Menus exist but `films`, `books`, `shabad shaala` entries are ~5 chars → **falls back to `MOCK_ABOUT_KABIR`**. `team` has long content (2174 chars) but one bad entry fails the whole tab.

---

### `/ajab-news` — Ajab News

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/news` | Mount | 13 items | Listing **live** |
| `GET /Api/news?news_id={id}` | Optional detail | Single news | `News.tsx` / `CLNews.tsx` |

**What you get:** `news_title`, content HTML, `thumbnail_image`, nested `popup_items` with images.

---

### `/searche` — Search results

| Call | When | Live result | UI outcome |
|------|------|-------------|------------|
| `GET /Api/nitesh?search={q}` | Query change | `counts` + `results` per category | Normalized in `lib/utils/search.ts` |

**Sample probes:**

| Query | songs | poems | reflections | people | films | total |
|-------|-------|-------|-------------|--------|-------|-------|
| `ram` | 0 | 0 | 10 | 4 | 10 | 24 |
| `kabir` | 0 | 0 | 10 | 4 | 10 | 24 |
| `mhaane` | 0 | 0 | 0 | 0 | 0 | 0 |

**Gap:** Song/poem search appears **under-indexed or not wired** in CMS for common transliterated titles — UI may show empty song/poem columns despite 234 songs in catalog.

Header (`Header.tsx`) uses the same endpoint for typeahead.

---

### `/radio` — Radio

| API calls | **None** |
|-----------|----------|

`CLRadio.tsx` uses `MOCK_PLAYLISTS`, mock tracks, and `CLFilterPanel` with **no** `availableSingers` from API — only mock fallback lists. No CMS radio/playlists endpoint is integrated.

---

## Filter APIs — deep dive

### `GET /Api/song_filters` — **LIVE, unused on CL Songs**

```json
{
  "status": true,
  "data": {
    "song": [{ "id", "singer_name" }],
    "poet": [{ "id", "poet_name" }],
    "them": [{ "id", "word_transliteration" }]
  }
}
```

| Field | Count | Notes |
|-------|-------|-------|
| `song` | 234 | Matches catalog singer count |
| `poet` | 245 | More than unique poets on songs — may include unused poets |
| `them` | **1** | Typo key **`them`**; value looks like test data |

**Who calls it:** `components/Fillter/FilterPanel.tsx` (legacy songs stack).  
**Who does not:** `CLindex.tsx`, `CLFilterPanel.tsx`.

**Recommendation:** Either wire CL songs to this endpoint for canonical singer/poet lists, or remove dead code path. Fix CMS key `them` → `theme` and populate real theme taxonomy.

---

### `GET /Api/poem_filters` — **LIVE, used**

| Field | Count | Frontend mapping |
|-------|-------|------------------|
| `poets[].poet_name` | 183 | Filter drawer Poet column |
| `themes[].word_transliteration` | **1** | Filter drawer Theme column (weak) |

Poem **filtering** still matches `meta_keywords` on loaded poems, so themes can work for poems that have keywords even when API theme list is tiny.

---

### `GET /Api/reflection_filter` — **LIVE, partially used**

| Field | Count | Frontend mapping |
|-------|-------|------------------|
| `speaker` | 183 | Combined `first_name` + `middle_name` + `last_name` |
| `theme` | 7 | `word_transliteration` |
| `format` | 183 | **Ignored** — data is person objects, not formats |

Format options stay hardcoded in `CLReflectionFilterPanel.tsx`.

---

## Mock & fallback matrix

| Page / feature | Trigger for mock |
|----------------|------------------|
| Home cards | Fetch error only (mocks preloaded, replaced on success) |
| Songs listing | Fetch error → `MOCK_SONGS` |
| Songs filter chips | Empty derived lists + `useSongsMockFallback` → mock names (not triggered with live list) |
| Song detail | `explore_songs` fail/timeout → `MOCK_DETAIL`, `MOCK_VERSIONS`, `MOCK_RELATED` |
| Poems | Fetch error → `MOCK_POEMS` |
| Poem filters | API fail → `FALLBACK_FILTERS` in `CLPoemFilterPanel` |
| Reflections | Fetch error → `MOCK_REFLECTIONS` |
| Reflection formats | Always hardcoded (CMS format broken) |
| People | Fetch error → `MOCK_PEOPLE` |
| Glossary | < 3 quality terms → `MOCK_GLOSSARY` |
| About | Any menu entry < 20 chars plain text → full tab mock |
| Radio | Always mock |
| Poem player singers | No audio API → mock names in popup |

---

## Performance & reliability risks

1. **`/Api/list?limit=1000`** — 5–30s; blocks songs listing loader.
2. **`/Api/explore_songs`** — ~60s observed; high chance of client timeout → mock detail page.
3. **Bulk fetches in browser** — No Next.js API proxy despite comments; all calls are client-side to CMS origin (CORS must allow browser — currently works).
4. **Poem detail by id** — CMS ignores id filter semantics; fragile `data[0]` usage.

---

## Recommended next steps

### CMS backend

1. Populate **`song_filters.data.theme`** (fix `them` typo) with real theme taxonomy.
2. Populate **`poem_filters.themes`** beyond test data.
3. Fix **`reflection_filter.format`** to return format strings, not people.
4. Index **songs/poems in `/Api/nitesh`** search.
5. Make **`/Api/poems?id=`** return a single poem or correct filtered result.
6. Optimize **`/Api/explore_songs`** response time (< 5s target).
7. Add more **glossary** entries; fix **about** placeholder sections.

### Frontend

1. **Wire `/songs` to `/Api/song_filters`** for singer/poet lists (keep theme from keywords or use fixed theme API when ready).
2. Add **server-side proxy** or ISR for `/Api/list` bulk fetch to avoid browser timeouts.
3. Increase **timeout** or show loading state for `explore_songs` (60s+).
4. **Radio** — integrate when CMS endpoints exist.
5. Remove or align **legacy** `FilterPanel` / `SongDetailsClient` if CL routes are canonical.

---

## Related docs & tooling

| Asset | Purpose |
|-------|---------|
| `scripts/probe-cms-apis.mjs` | Re-run live endpoint probe |
| `scripts/probe-cms-apis-output.json` | Last probe raw JSON |
| `docs/CMS_API.md` | Integration overview |
| `docs/API_REFERENCE.md` | Endpoint reference |
| `e2e/cms-api.spec.ts` | Playwright smoke test for `/Api/list` |

---

*Generated from live HTTP probes against `https://ajab.designanddevelopment.in/admin` and static analysis of `components/` and `app/` route files.*
