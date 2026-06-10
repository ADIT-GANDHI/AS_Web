# Ajab Shahar — CMS HTTP API reference

This document is the **single intensive reference** for JSON endpoints the Next.js app calls under the CMS base URL. It complements **`docs/CMS_API.md`** (env, bases, CORS) with **per-route behaviour**, **payload shapes**, and **known errors**.

> **Base URL:** `https://ajab.designanddevelopment.in/admin` (set via `NEXT_PUBLIC_AJAB_API_BASE`)  
> **All requests:** `GET`, `cache: 'no-store'` unless noted. Media paths are relative to the same origin; prefix with `AJAB_API_BASE`.

---

## Master Quick-Reference Table

All endpoints used in the codebase, their current staging status, every known error, and exactly how the code handles it.

| # | Endpoint | Module / File | Staging Status | Known Errors | How We Handle It |
|---|----------|---------------|---------------|--------------|-----------------|
| 1 | `GET /Api/list` | Songs listing · `CLindex.tsx` | ✅ Works | `status:false` if no results; empty `data[]` on bad params; returns ~234 songs (IDs non-sequential) | `try/catch` → falls back to `MOCK_SONGS`; `setSongsNavTotal` always called |
| 2 | `GET /Api/list?limit=1` | Songs nav count · `CLSongDetailsClient.tsx` | ✅ Works | Returns only total — no song data | Reads only `data.total` via `parseCatalogTotal()`; falls back to `201` |
| 3 | `GET /Api/list?limit=1000` | Songs SSG params · `app/songs/details/[id]/page.tsx` | ✅ Works | Large payload (~234 songs); slow on first cold fetch | Fetches all IDs once at build time for `generateStaticParams()` |
| 4 | `GET /Api/song_filters` | Songs filter panel · `CLFilterPanel.tsx` | ✅ Works | Network fail → empty panel | `try/catch` → filter panel shows empty / only client-derived options |
| 5 | `GET /Api/poem_filters` | Songs + Poems filters · `CLindex.tsx`, `CLPoemFilterPanel.tsx` | ✅ Works | 178 poets, 1 test theme ("Saudaagir asdasdasd") | Poets extracted and capitalised; themes shown as-is; fallback: derive poets from song data |
| 6 | `GET /Api/explore_songs` | Song detail · `CLSongDetailsClient.tsx` | ✅ Works | `status:false` → `"Song not found."`; duplicate JSON keys `year`/`Year`; ~8–12s response latency | `status === false` → falls back to `MOCK_DETAIL`; fullscreen white loader shown during wait |
| 7 | `GET /Api/song_versions` | Song versions strip · `CLSongDetailsClient.tsx` | ❌ **Broken — HTTP 500** | HTML "Database Error" page returned instead of JSON; `response.json()` throws for valid song IDs | `readJson()` checks `res.ok` before parsing; on failure, versions strip shows only the current song (from `explore_songs`) |
| 8 | `GET /Api/related?song_id` | Song detail related · `CLSongDetailsClient.tsx` | ✅ Works | `status:false` → `"Song not found."`; fetched after main song resolves | Falls back to `MOCK_RELATED`; loaded lazily (non-blocking for first paint) |
| 9 | `GET /Api/poems` | Poems listing · `CLPoems.tsx`, `poemsService.ts` | ✅ Works | `note_text`, `glossary`, `english_translation_text` all `null` on staging; 10/page default | Falls back to `MOCK_POEMS`; null fields → NOTES/GLOSSARY buttons hidden per spec |
| 10 | `GET /Api/poems/{id}` | Poem detail · `poemsService.ts` | ✅ Works | Same null fields as listing | Fetched via service; error → empty / mock state |
| 11 | `GET /Api/poem_filters` | Poems filter panel · `CLPoemFilterPanel.tsx` | ✅ Works | 1 test theme in staging | Filter panel populated; themes section appears sparse |
| 12 | `GET /Api/poem_listing` | ~~Poems listing (legacy)~~ | ✅ Works (superseded) | Returns less data than `/Api/poems` | **No longer used** — `CLPoems.tsx` migrated to `/Api/poems` |
| 13 | `GET /Api/related?poem_id` | Poem detail related · `poemsService.ts` | ✅ Works | `status:false` when poem missing | `try/catch` in service; fallback to `getRelatedByPoemId` |
| 14 | `GET /Api/reflection_list` | Reflections listing · `CLReflections.tsx`, SSG | ✅ Works | Limit 200 used; `format` field incorrect for filter | `try/catch` → falls back to `MOCK_REFLECTIONS` |
| 15 | `GET /Api/reflections` | Alt reflections · `CLReflections.tsx` | ✅ Works | Overlaps with `reflection_list` | Both exist in codebase; `reflection_list` preferred |
| 16 | `GET /Api/reflection_filter` | Reflections filter · `CLReflectionFilterPanel.tsx` | ✅ Works | `format` field returns incorrect data (hardcoded in comment) | Format values hardcoded as fallback; API value not trusted |
| 17 | `GET /Api/explore_reflection` | Reflection detail · `CLReflectionDetail.tsx` | ✅ Works | `status:false` when missing | `try/catch` → `LoadingShell` then error state |
| 18 | `GET /Api/related?reflection_id` | Reflection detail related · service | ✅ Works | `status:false` when missing | Service `try/catch` |
| 19 | `GET /Api/person_list` | People listing · `CLPeople.tsx`, SSG | ✅ Works | `thumbnail_excerpt` null → falls back to stripped `profile` HTML | `try/catch` → `MOCK_PEOPLE`; description derived from `profile` field (220 char limit) |
| 20 | `GET /Api/people` | ~~People listing (old)~~ | ❌ **Returns 404** | Endpoint does not exist at this path | **Fixed** — `CLPeople.tsx` uses `/Api/person_list` instead |
| 21 | `GET /Api/explore_person` | People detail · `CLPeopleDetail.tsx` | ✅ Works | `status:false` when missing | `try/catch` → `LoadingShell` then error state |
| 22 | `GET /Api/related?people_id` | People detail related · service | ✅ Works | Param is `people_id`; legacy `person_id` also tried as fallback | Service tries `people_id` first, falls back to `person_id` |
| 23 | `GET /Api/film_list` | Films listing · `CLFilms.tsx`, SSG | ✅ Works | `try/catch` → `MOCK_REFLECTIONS` (intentional reuse) | Falls back to mock; total updated from `data.total` |
| 24 | `GET /Api/films` | Films listing (alt) · `CLFilms.tsx` | ✅ Works | Overlaps with `film_list` | Both exist; `film_list` preferred in new components |
| 25 | `GET /Api/explore_film` | Film detail · `CLFilmDetail.tsx` | ✅ Works | `status:false` when missing | `try/catch` → `LoadingShell` then error state |
| 26 | `GET /Api/home` | Home page · `CLHero.tsx` | ✅ Works | `person.thumbnail_url` may be null | Null thumbnail → local placeholder image used |
| 27 | `GET /Api/news` | Home news popup + `/ajab-news` · `CLNews.tsx` | ✅ Works (with issues) | `news_title`, `ajab_news_content` null on all real items; `published:"0"` drafts not filtered; `category:"video"` items silently skipped; real content only in `popup_items[]` | `try/catch`; auto-fires modal on mount (known UX bug #1); draft items appear to users; video items silently dropped |
| 28 | `GET /Api/news?news_id=N` | Single news item · `CLNews.tsx` | ✅ Works | Same null-field issues as list | Same handling |
| 29 | `GET /Api/nitesh` | Search · `lib/utils/search.ts` | ✅ Works | Endpoint name unconventional; debounced 300ms | `try/catch` → `emptySearchResponse`; spinner shown during load |
| 30 | `GET /Api/glossary` | Glossary · `hooks/use-glossary.ts` | ✅ Works | None observed | Hook caches result; error → empty terms |
| 31 | `GET /Api/about` | About page · `hooks/use-about.ts` | ✅ Works | None observed | Hook fetches on mount; error → empty content |
| 32 | `GET /Api/related` (multi) | All detail pages | ✅ Works | Param varies: `song_id` / `poem_id` / `reflection_id` / `people_id` | Each service has its own `getRelatedBy*` function; `status:false` → `MOCK_RELATED` |

---

### Error handling patterns used across all modules

| Pattern | Where used | What it does |
|---------|------------|--------------|
| `try/catch` + mock fallback | Every listing page | If fetch or JSON parse throws, the mock data constant (`MOCK_SONGS`, `MOCK_POEMS`, etc.) is used instead |
| `status === false` check | Detail pages (songs, poems, reflections, people, films) | Even on HTTP 200, if `data.status === false`, treats response as missing and falls back to mock detail |
| `res.ok` guard before `.json()` | `CLSongDetailsClient`, `readJson()` helper | Prevents crash when server returns HTML error page (e.g. `/Api/song_versions` HTTP 500) |
| `parseCatalogTotal()` | Songs nav count | Normalises `total` from string or number; returns `null` if unparseable |
| `cache: 'no-store'` | All client-side fetches | Prevents stale data from CDN/browser cache |
| `cancelled` ref flag | `CLSongDetailsClient` | Aborts in-flight fetch state updates when component unmounts or `id` changes |
| Fullscreen `<Loader />` | All 10 page-level loading states | Shows pure white + logo during API wait; hides header, footer, background |
| Lazy related fetch | Song detail | Related content fetched only after main song resolves — does not block first paint |

---

### Known open issues (not yet fixed)

| # | Endpoint | Issue | Impact | Fix needed |
|---|----------|-------|--------|-----------|
| 1 | `/Api/song_versions` | HTTP 500 — HTML database error on valid IDs | Versions strip falls back to single card | CMS backend fix required |
| 2 | `/Api/news` | `published:"0"` drafts not filtered | Test/draft news items appear to real users | Add `filter(item => item.published !== '0')` in `CLNews.tsx` |
| 3 | `/Api/news` | `category:"video"` silently skipped | Video news items never shown | Implement YouTube embed for `popup_items[].video_url` |
| 4 | `/Api/news` | Modal auto-fires on every home page load | Blocks home page on first visit | Trigger only on explicit user action (button click) |
| 5 | `/Api/reflection_filter` | `format` field incorrect | Format filter hardcoded, not from API | CMS to correct field values |
| 6 | `/Api/poems` | `note_text`, `glossary` all null on staging | NOTES/GLOSSARY buttons never appear | CMS to populate content |
| 7 | `/Api/poem_filters` | Only 1 theme ("Saudaagir asdasdasd" — test data) | Theme filter panel looks broken | CMS to add real themes |

---

## Backend Team Action Items

These are **server-side / CMS fixes required** — the frontend has already implemented client-side workarounds, but the underlying root cause must be resolved by the backend team for a production-grade release.

| # | Endpoint / Area | Problem | Frontend Workaround (current) | Backend Fix Required |
|---|-----------------|---------|-------------------------------|----------------------|
| B1 | `GET /Api/list` — `singer` & `poet` query params | Server-side filtering by singer or poet is **broken / unreliable**. Sending `?singer=Kabir&poet=` returns the same full dataset regardless of params. | `CLindex.tsx` ignores server-side filtering entirely. Sends `?limit=1000&singer=&poet=` (empty params) to fetch **all songs**, then filters singer/poet/theme **in-browser** using `useMemo`. | Fix `/Api/list` so `singer` and `poet` params actually filter server-side. Once fixed, remove the `limit=1000` workaround and use paginated results. |
| B2 | `GET /Api/song_filters` — poet names | `/Api/song_filters` does not return a reliable or complete list of poet names for the filter panel. | `CLindex.tsx` fetches poet names from **`/Api/poem_filters`** instead, which returns 178 poets. If that also fails, poets are derived by extracting unique values from `singer_display` / `singer` / `poet` fields in the full song dataset. | Fix `/Api/song_filters` to return accurate, complete poet and singer lists that can be used for the Songs filter panel without fallback logic. |
| B3 | `GET /Api/song_filters` — themes | Themes returned by `/Api/song_filters` are absent, incomplete, or test data. `/Api/poem_filters` returns only 1 real theme ("Saudaagir asdasdasd" — a test entry). | Themes for the Songs filter panel are derived from `meta_keywords` field on each individual song record (split by comma/ampersand). This is a derived/approximate list. | Populate the CMS with real theme/tag data for songs. Fix `/Api/song_filters` to return a clean, deduplicated theme list. |
| B4 | `GET /Api/song_versions` | Returns **HTTP 500** ("Database Error") for all valid song IDs on staging. | `readJson()` in `CLSongDetailsClient.tsx` checks `res.ok` before calling `.json()`. On failure, the versions carousel shows only the current song as a single card (no versions). | Fix the CMS database query behind `/Api/song_versions`. This completely breaks the "Other Versions of this Song" feature. |
| B5 | `GET /Api/news` — draft filtering | Items with `published: "0"` are draft/test entries and should not be visible to the public. | No frontend filtering — all news items including drafts are displayed. | Filter `published: "0"` items out of the `/Api/news` response server-side, **or** the frontend can add `filter(item => item.published !== '0')` as a short-term patch. |
| B6 | `GET /Api/news` — video category | News items with `category: "video"` are silently dropped because no video player is implemented. | Video items are skipped without any fallback. | Either exclude `category: "video"` from the `/Api/news` response until video is supported, or provide a YouTube embed URL in a consistent field so the frontend can render it. |
| B7 | `GET /Api/reflection_filter` — format field | The `format` field in the reflection filter response returns incorrect or inconsistent values (e.g. wrong casing, unexpected strings). | The filter panel hardcodes the expected format values as a fallback and does not trust the API value. | Standardise the `format` field values in the CMS/API response to match expected display strings (`INTERVIEW`, `ESSAY`, `VISUAL STORY`, etc.). |
| B8 | `GET /Api/poems` — null content fields | `note_text`, `glossary`, and `english_translation_text` are `null` for all poems on staging. | NOTES and GLOSSARY buttons are hidden when the corresponding field is null — this is correct behaviour per spec, but it means these features are never shown. | Populate `note_text` and `glossary` data for poems in the CMS. |
| B9 | `GET /Api/poem_filters` — test theme | Only 1 theme exists in poem filters: `"Saudaagir asdasdasd"` — clearly a test entry. | Theme filter is shown as-is; the panel looks broken with a single garbled entry. | Replace the test theme with real theme/category data in the CMS. |
| B10 | `GET /Api/news` — null content | `news_title` and `ajab_news_content` are `null` on all real news items. Real content only appears inside `popup_items[]`. | The frontend reads `popup_items[]` for display content. | Populate `news_title` and `ajab_news_content` fields in the CMS, or confirm that `popup_items[]` is the canonical data source so the schema can be locked. |

---

## Client Feedback Tracker

Consolidated list of all open client-facing issues. Pulled from `UI_AUDIT.md`, `COMPARISON_HOME_SONGS.html` priority list, code comments, and staging observations.

### Code / Frontend fixes (no backend required)

| # | Module | Issue | Priority | Status | Fix |
|---|--------|-------|----------|--------|-----|
| C1 | Home — News modal | Modal auto-fires on every home page load — blocks the page immediately on first visit | 🔴 High | ⚠️ Open | Trigger modal only on an explicit user action (e.g. "NEWS" button in footer or floating button). Remove `useEffect` auto-open from `CLNews.tsx`. |
| C2 | Home — News modal | `published: "0"` draft items appear in the news popup | 🔴 High | ⚠️ Open | Add `filter(item => item.published !== '0')` in `CLNews.tsx` (frontend short-term fix; backend fix is B5 above). |
| C3 | Reflections | One card ("Music takes the poem out of the mind") shows `"test"` as its description — a CMS placeholder | 🟡 Medium | ⚠️ Open (CMS data) | CMS admin to update the entry. Frontend code guard: apply `raw.length > 10 ? raw : ''` check to Reflections `thumbnail_excerpt` field in `CLReflections.tsx`. |
| C4 | Songs — Filter panel | Theme filter appears with garbled test data ("Saudaagir asdasdasd") | 🟡 Medium | ⚠️ Open (CMS data) | Backend fix B9. Frontend: add a minimum-length or allowlist guard to drop obvious test entries. |
| C5 | Poems — Filter panel | Theme filter appears nearly empty (1 test theme only) | 🟡 Medium | ⚠️ Open (CMS data) | Backend fix B9. |
| C6 | Poems | NOTES and GLOSSARY buttons never appear (all null on staging) | 🟡 Medium | ⚠️ Open (CMS data) | Backend fix B8. Frontend correctly hides buttons when null — no code change needed, just data. |
| C7 | Songs detail | Versions carousel never shows multiple versions (HTTP 500) | 🔴 High | ⚠️ Open (backend) | Backend fix B4. |
| C8 | Home — Hero/Loader | Loader overlay may not fully cover viewport edge on some mobile sizes | 🟢 Low | ⚠️ Observe | Add `min-height: 100svh` to `.loader-overlay` and test on iOS Safari. |

### Already fixed (for record)

| # | Module | Issue | Status | Fix Applied |
|---|--------|-------|--------|-------------|
| F1 | Loader | Background 95% opaque — page bled through | ✅ Fixed | `background: #ffffff`; logo 100px → 120px; drop-shadow removed (`Loader.css`) |
| F2 | Films | Stray `"t"` character in description slot | ✅ Fixed | Added `raw.length > 10` guard on `thumbnail_excerpt` (`CLFilms.tsx`) |
| F3 | Songs detail | Related section `ALL(0)` count | ✅ Fixed | ALL count derived from sum of individual category counts (`CLSongDetailsPage.tsx`) |
| F4 | People | All person descriptions blank | ✅ Fixed | Fallback to `profile` HTML field, stripped and truncated to 220 chars (`CLPeople.tsx`) |
| F5 | Reflections | `INTERVIEW`/`ESSAY` media-type tag invisible (gray-on-gray) | ✅ Fixed | Tag color changed from `var(--ajab-ink-100)` → `var(--ajab-pink-primary)` (`CLReflections.css`) |
| F6 | People | `/Api/people` 404 — wrong endpoint | ✅ Fixed | Migrated to `/Api/person_list` (`CLPeople.tsx`) |
| F7 | Songs — filter | Server-side singer/poet filter broken | ✅ Workaround | Client-side filter with `limit=1000` fetch (backend fix B1 still outstanding) |
| F8 | Songs — filter | `/Api/song_filters` poet data incomplete | ✅ Workaround | Poets sourced from `/Api/poem_filters` with derived fallback (backend fix B2 still outstanding) |

### PDF spec gaps (design fidelity — lower urgency)

These are visual differences between the PDF reference design and the live implementation, identified in `COMPARISON_HOME_SONGS.html`.

| # | Section | Gap | Priority |
|---|---------|-----|----------|
| D1 | Song cards | Card width ~230px rendered vs 280px in spec | 🟡 Medium |
| D2 | Song cards | Thumbnail corners — live is square, spec shows slight rounding | 🟢 Low |
| D3 | Song cards | Card title uses `var(--ajab-fs-h5)` — spec shows slightly larger for featured cards | 🟢 Low |
| D4 | Footer | Social media icons missing (Instagram, YouTube etc.) | 🟡 Medium |
| D5 | Footer | "Kabir Project" and "Ajab Shahar" footer columns missing some links vs spec | 🟢 Low |
| D6 | Home — Hero | Person thumbnail sometimes null → placeholder image; spec always shows photo | 🟡 Medium |
| D7 | Songs — A–Z bar | Active letter highlight styling differs from spec (color/border) | 🟢 Low |
| D8 | Songs — Filter bar | Filter chip/tag visual styling differs slightly from spec | 🟢 Low |

---

## Table of contents

1. [Configuration](#1-configuration)
2. [Cross-cutting patterns](#2-cross-cutting-patterns)
3. [Songs](#3-songs)
4. [Poems](#4-poems)
5. [Reflections](#5-reflections)
6. [People](#6-people)
7. [Films](#7-films)
8. [Home & news](#8-home--news)
9. [Search](#9-search)
10. [Glossary & about](#10-glossary--about)
11. [`/Api/related` — multi-entity](#11-apirelated--multi-entity)
12. [API health matrix (staging)](#12-api-health-matrix-staging)
13. [Staging observations (May 2026)](#13-staging-observations-may-2026)

---

## 1. Configuration

| Item | Detail |
|------|--------|
| **Base** | `AJAB_API_BASE` from `lib/ajabEnv.ts` — **no trailing slash**. Built URLs: `` `${AJAB_API_BASE}/Api/...` ``. |
| **Env override** | `NEXT_PUBLIC_AJAB_API_BASE` in `.env.local`. Example staging: `https://ajab.designanddevelopment.in/admin`. |
| **Method** | All documented routes are **GET** unless stated otherwise. |
| **Media** | Paths like `/images/...` or `uploads/...` are relative to the **same origin as the API**; the UI prefixes them with `AJAB_API_BASE`. |

---

## 2. Cross-cutting patterns

### 2.1 Typical success envelope

Many list/detail routes return JSON like:

```json
{
  "status": true,
  "data": { ... }
}
```

or for lists:

```json
{
  "status": true,
  "page": "1",
  "limit": "10",
  "total": 211,
  "total_pages": 22,
  "data": [ ... ]
}
```

**In the website:** components treat `status === true` and a present `data` as success; otherwise they fall back to mocks or empty UI depending on the page.

### 2.2 Logical errors (HTTP 200, JSON `status: false`)

The CMS often returns **HTTP 200** with a body such as:

```json
{ "status": false, "message": "Song not found." }
```

**In the website:** `CLSongDetailsClient`, `CLindex`, etc. branch on `status` and `data` before reading rows.

### 2.3 HTTP errors (4xx / 5xx)

- **4xx:** Not authenticated, wrong path, etc. — `fetch` / axios surface `!response.ok` or exceptions.
- **5xx:** Server or **database** failure. On staging, some routes return **HTML** (e.g. CodeIgniter “Database Error” page) instead of JSON. **`Response.json()`** then throws or must be guarded; our `readJson` helpers that check **`res.ok`** before parsing avoid crashes.

### 2.4 Duplicate JSON keys

Some song payloads have **both** `year` and `Year` (same semantic field). **Strict JSON parsers** (e.g. PowerShell `ConvertFrom-Json`) may fail; **browser `response.json()`** usually accepts one value. Prefer parsing in the **browser** for song list/detail, or normalise on the server.

---

## 3. Songs

### 3.1 `GET /Api/list`

**What it does on the website:** Powers **`/songs`** — `components/Songs/CLindex.tsx` (and legacy `components/Songs/index.tsx`). Paginated song grid, filter query (`search`, `singer`, `poet`), and total count for the “N Songs” heading.

| Query param | Role |
|-------------|------|
| `search` | Free text or letter filter; empty when “All”. |
| `page` | Page index (≥ 1). |
| `limit` | Page size (app historically used **10** per page). |
| `singer` | Comma-separated singer names (from filter panel). |
| `poet` | Comma-separated poet names. |
| `theme` | Optional; may appear in API but not always sent by app. |

**Success (`status: true`):** `data` is an array of song rows; `total`, `total_pages`, `page`, `limit` as strings or numbers depending on CMS version.

**Row fields (non-exhaustive):** `id`, `Songtitle_transliteration`, `songtitletraan`, `singer`, `poet`, `thumbnail_url` / `thumbnailUrl`, `youtube_video_id`, `about`, `umbrellaTitleText`, etc.

**Errors / edge:** Invalid params may yield empty `data`. `status: false` with a `message` if documented by CMS.

**Also used by:** `app/songs/details/[id]/page.tsx` → `generateStaticParams()` fetches a large `limit` (e.g. 1000) to prebuild `[id]` static params.

---

### 3.2 `GET /Api/song_filters`

**What it does on the website:** Loads singer/poet buckets for **`CLFilterPanel`** / **`FilterPanel`** on the songs listing.

**Success:** `status: true`, `data` (or nested structure) with filter options.

**Errors:** Network failure → panel may show empty or stale state depending on implementation.

---

### 3.3 `GET /Api/explore_songs`

**What it does on the website:** Primary payload for **`/songs/details/[id]`** — `CLSongDetailsClient` → `CLSongDetailsPage`. One **full song** record: titles, lyrics HTML, about, YouTube id, singer/poet, meta, etc.

| Query | Role |
|--------|------|
| `song_id` | CMS primary id (string/number). |
| `language` | `hindi` \| `english` — switches fields where the CMS provides both. |

**Success:** `{ "status": true, "data": { ... } }` — large object; often includes HTML strings for `about`, lyric fields, and media paths.

**Logical errors (observed):**

```json
{ "status": false, "message": "Song not found." }
```

when `song_id` does not exist on that CMS.

**Quirks:** Duplicate keys (`year` / `Year`) possible inside `data` (see §2.4).

---

### 3.4 `GET /Api/song_versions`

**What it does on the website:** Intended to populate the **“N Song Versions”** horizontal cards on **`/songs/details/[id]`** — alternative recordings under the same umbrella.

| Query | Role |
|--------|------|
| `song_id` | Same id as `explore_songs`. |

**Success (when CMS healthy):** `{ "status": true, "data": [ ... ] }` — array of version rows compatible with `CLSongDetailsPage`’s mapper (ids, titles, thumbnails, singer/poet).

**Logical errors (observed):**

```json
{ "status": false, "message": "Song not found or umbrellaTitle is empty." }
```

**Server errors (staging, observed):** **HTTP 500** with **HTML** “Database Error” for several valid `song_id` values — backend must be fixed. **In the website:** client treats non-OK as no JSON; app should **not** rely on this route until stable — use **`explore_songs` only** as a single-card fallback for the versions strip (see `CLSongDetailsClient`).

---

### 3.5 `GET /Api/related` (song context)

**What it does on the website:** **Related** tab block on **`/songs/details/[id]`** — songs/poems/reflections/people/films keyed off the current song.

| Query | Role |
|--------|------|
| `song_id` | Current song id. |

**Success (observed):** `{ "status": true, "song_id": "...", "counts": { "songs", "poems", ... }, "data": { "songs": [...], "poems": [...], ... } }` — large nested object.

**Logical errors (observed):**

```json
{ "status": false, "message": "Song not found." }
```

---

## 4. Poems

### 4.1 `GET /Api/poems`

**What it does on the website:** Primary poems listing — `components/Poems/CLPoems.tsx` and `lib/services/poemsService.ts`. Returns **10 poems per page** by default (default pagination). Supports optional query params: `poet`, `theme`.

#### Envelope

```json
{
  "status": true,
  "theme": "",
  "poet": "",
  "total": 245,
  "data": [ ... ]
}
```

| Top-level field | Type | Notes |
|----------------|------|-------|
| `status` | boolean | `true` on success |
| `total` | number | Total published poems (245 on staging May 2026) |
| `theme` | string | Echo of the `theme` query param (empty if not sent) |
| `poet` | string | Echo of the `poet` query param (empty if not sent) |
| `data` | array | Array of poem objects (10 per page by default) |

#### Poem object fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | CMS primary key (e.g. `"305"`) |
| `original_title` | string | Devanagari title (e.g. `"चाकी चाकी सब कहें"`) |
| `couplet_transliteration` | string | Romanised title / first line — **used as main display text** (e.g. `"Chaaki Chaaki Sab Kahein"`) |
| `couplet_translation` | string | English translation of the title (e.g. `"Everyone Talks Of Mill Stones"`) |
| `original_text` | string (HTML) | Full poem in Devanagari — HTML with `<p>` tags and inline styles |
| `english_transliteration_text` | string (HTML) | Full romanised transliteration — HTML |
| `english_translation_text` | string (HTML) \| null | English translation — `null` on most staging items |
| `note_text` | string \| null | Poem notes — `null` on all current staging items (field exists, content not yet populated) |
| `glossary` | string \| null | Glossary text — `null` on all current staging items |
| `attributed_poet` | string \| null | Poet name as plain string — `null` when not attributed; use `poet_id` to look up |
| `poet_id` | string \| null | FK to poets table (e.g. `"93"`) |
| `translator` | string \| null | Translator name — `null` on staging |
| `thumbnail_url` | string \| null | Relative path to thumbnail image (e.g. `"/images/TN-C-Chalti-chaaki-dekh-kar.png"`) — prefix with `AJAB_API_BASE` to resolve |
| `thumbnail_image_upload` | string \| null | Secondary thumbnail upload field — `null` on staging |
| `soundCloud_track_url` | string \| null | SoundCloud audio URL — `null` on staging |
| `soundCloud_iD` | string \| null | SoundCloud track ID — `null` on staging |
| `show_on_landing_page` | string (`"0"` / `"1"`) | Whether to feature on landing page |
| `is_published` | string (`"0"` / `"1"`) | Publish status — filter on `"1"` for public content |
| `meta_title` | string | SEO title |
| `meta_keywords` | string | Comma-separated SEO keywords |
| `meta_description` | string | SEO description (plain text excerpt) |
| `keywords` | string \| null | Secondary keywords field — `null` on staging |
| `thumbnail_excerpt` | string \| null | Short excerpt for thumbnails — `null` on staging |
| `created_at` | string | ISO datetime |
| `related_songs` | null | Related content — all `null` in listing response; use `/Api/related?poem_id=X` |
| `related_reflections` | null | (same) |
| `related_words` | null | (same) |
| `related_films` | null | (same) |
| `related_filmEpisode` | null | (same) |
| `related_couplets` | null | (same) |
| `related_people` | null | (same) |
| `related_stories` | null | (same) |
| `related_poems` | null | (same) |
| `related_film_episodes` | null | (same) |

#### How the website maps this to `PoemData`

| `PoemData` field | API field | Notes |
|-----------------|-----------|-------|
| `text` | `couplet_transliteration` | Romanised display text (default script) |
| `hindi` | `original_text` | Devanagari HTML |
| `english` | `english_translation_text` | English HTML (often null) |
| `poet` | `attributed_poet` | Fallback: look up via `poet_id` |
| `thumbnailUrl` | `thumbnail_url` | Prefix with `AJAB_API_BASE` |
| `noteText` | `note_text` | Notes sidebar content |
| `glossary` | `glossary` | Glossary sidebar content |

#### ✅ Fields received and handled

| Field | Used where |
|-------|-----------|
| `couplet_transliteration` | Default poem display text (transliteration script) |
| `original_text` | Devanagari script view |
| `english_translation_text` | English script view (shown when non-null) |
| `attributed_poet` | Poet credit below the poem |
| `thumbnail_url` | Poem card thumbnail |
| `note_text` | Notes sidebar (left panel) |
| `glossary` | Glossary sidebar (right panel) |
| `id` | Routing, React keys |

#### ❌ Fields received but NOT yet handled

| Field | Reason |
|-------|--------|
| `soundCloud_track_url` / `soundCloud_iD` | Audio player uses mock versions only — SoundCloud not wired |
| `couplet_translation` | English title translation present but not displayed |
| `translator` | Not shown in UI |
| `related_*` | All `null` in listing; use `/Api/related?poem_id=X` for related content |
| `is_published` | Not filtered in listing fetch — draft items could appear |

---

### 4.2 `GET /Api/poem_filters`

**What it does on the website:** Filter metadata for the poem listing filter panel.

#### Response shape

```json
{
  "status": true,
  "data": {
    "poets": [
      { "id": "94", "first_name": "Abdul", "middle_name": "Hussain Abdullah", "last_name": "Turk", "poet_name": "Abdul Hussain Abdullah Turk" }
    ],
    "themes": [
      { "id": "1", "word_transliteration": "Saudaagir asdasdasd" }
    ]
  }
}
```

| Field | Notes |
|-------|-------|
| `poets` | 178 poets on staging; each has `id`, `poet_name`, plus name parts |
| `themes` | 1 theme on staging (appears to be test data — `"Saudaagir asdasdasd"`) |

---

### 4.3 `GET /Api/poems/{id}`

**What it does on the website:** Single poem detail by id.

**Response:** Same shape as a single item from `/Api/poems` `data[]`, but with `related_*` fields populated.

---

### 4.4 `GET /Api/related` (poem context)

**What it does on the website:** `getRelatedByPoemId` — **`poem_id`** query param. Returns related songs, reflections, people, etc. for a poem detail page.

---

> **Note:** `/Api/poem_listing` (old endpoint) still works on staging but **`CLPoems.tsx` now uses `/Api/poems`** — the correct endpoint with full field coverage including `note_text`, `glossary`, and proper field names.

---

## 5. Reflections

### 5.1 `GET /Api/reflection_list`

**What it does on the website:** `reflectionsService.getPublishedReflections`, `app/reflections/details/[id]/page.tsx` for static params. Master list of reflections.

### 5.2 `GET /Api/reflection_filter`

**What it does on the website:** Filter metadata for reflections.

### 5.3 `GET /Api/explore_reflection`

**What it does on the website:** Single reflection by **`reflection_id`** — detail content.

### 5.4 `GET /Api/reflections`

**What it does on the website:** `components/Reflections/CLReflections.tsx` — alternate listing fetch (`cache: 'no-store'`). May overlap with `reflection_list` depending on CMS version; both exist in codebase.

### 5.5 `GET /Api/related` (reflection context)

**What it does on the website:** `getRelatedByReflectionId` — **`reflection_id`** query.

---

## 6. People

### 6.1 `GET /Api/people`

**What it does on the website:** `CLPeople.tsx` — people listing page.

### 6.2 `GET /Api/person_list`

**What it does on the website:** `peopleService.getPeople`, `app/people/[id]/page.tsx` for static params — canonical list of people ids for routing.

### 6.3 `GET /Api/explore_person`

**What it does on the website:** `getPersonById` — **`person_id`** — person detail.

### 6.4 `GET /Api/related` (people context)

**What it does on the website:** `getRelatedByPeopleId` — tries **`people_id`**, then fallback **`person_id`** (legacy param naming).

---

## 7. Films

### 7.1 `GET /Api/films`

**What it does on the website:** `CLFilms.tsx` — films listing.

### 7.2 `GET /Api/film_list`

**What it does on the website:** `filmsService.getPublishedFilms`, `app/films/details/[id]/page.tsx` for static params.

### 7.3 `GET /Api/explore_film`

**What it does on the website:** `getFilmById` — **`film_id`** — film detail.

---

## 8. Home & news

### 8.1 `GET /Api/home`

**What it does on the website:** `CLHero.tsx`, `Hero.tsx` — featured content, latest items, home layout data.

---

### 8.2 `GET /Api/news`

**What it does on the website:** `CLHero.tsx` (home popup slides), `CLNews.tsx` (`/ajab-news` page list), and `CLNews.tsx?news_id=N` (single news item).

| Query param | Role |
|-------------|------|
| `news_id` | Optional. Returns a single news item by id instead of the full list. |

#### Envelope

```json
{
  "status": true,
  "total": 13,
  "data": [ ... ]
}
```

#### News item fields

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | CMS primary key. |
| `popup_item` | string (`"0"` / `"1"`) | Whether this item has popup_items. |
| `thumbnail_image` | string \| null | Top-level thumbnail path — **never populated on staging; UI ignores it.** |
| `news_title` | string \| null | Top-level headline — **null on all real items**; real titles live inside `popup_items[].title`. |
| `news_second_title` | string \| null | Sub-headline — **null on all real items**. |
| `news_content` | JSON string \| null | Raw CMS rich-text blob stored as a JSON-encoded string. **Not used by the website** (code reads `ajab_news_content` instead). |
| `ajab_news_content` | string \| null | Processed body text. **Also null on all staging items** — body content lives in `popup_items[].content`. |
| `published` | string | `"0"` = draft/test, `"1"`–`"3"` = various publish states. **The website does not filter by this field** — draft items appear alongside published ones. |
| `publish_status` | string \| null | Secondary publish flag. |
| `created_at` | string | ISO datetime. |
| `updated_at` | string | ISO datetime. |
| `popup_items` | array | See below — contains the actual displayable content. |

#### `popup_items[]` fields

| Field | Type | Notes |
|-------|------|-------|
| `category` | `"single"` \| `"multiple"` \| `"video"` | Determines layout. `"video"` is present in API but **not handled by the website** (silently filtered out). |
| `title` | string | Card/slide headline — this is where real titles are. |
| `second_title` | string | Sub-headline / byline. |
| `content` | string | Body text. |
| `image` | string | Single image path (for `category: "single"`). Relative paths prefixed with `AJAB_API_BASE/`. |
| `images` | string[] | Image array (for `category: "multiple"`). |
| `video_url` | string | YouTube URL (for `category: "video"`). **Present in API, ignored by website.** |

#### ✅ Fields received and handled correctly

| Field name | Type | Component | How it's used |
|-----------|------|-----------|---------------|
| `data[].id` | string | `CLNews.tsx`, `CLContentSliderModal.tsx` | Unique key for React list rendering and `?news_id=` deep-link routing. |
| `data[].popup_items` | array | Both | Core content container — iterated to produce cards/slides. |
| `popup_items[].category` | `"single"` \| `"multiple"` | Both | `single` → one image; `multiple` → image slider. Anything else is filtered out. |
| `popup_items[].title` | string | Both | Rendered as the card/slide heading (`<h2>`/`<h3>`). |
| `popup_items[].second_title` | string | Both | Rendered as the sub-heading / byline. |
| `popup_items[].content` | string | Both | Body text; truncated at 160–220 chars with "See more" toggle. |
| `popup_items[].image` | string | `CLNews.tsx` | Single image URL; relative paths prefixed with `AJAB_API_BASE/`. |
| `popup_items[].images[]` | string[] | `CLNews.tsx` | Array of image URLs for the multi-image slider. |

#### ❌ Fields received from API but NOT handled / not working

| Field name | Type | API value (staging) | Problem | What to implement |
|-----------|------|---------------------|---------|------------------|
| `data[].news_title` | string \| null | **`null`** on all real items | Code tries to use it as a fallback heading but it's never populated. Real titles are only in `popup_items[].title`. | CMS team should populate this field, or remove the fallback code. |
| `data[].news_second_title` | string \| null | **`null`** on all real items | Same as above — unused in practice. | Same as above. |
| `data[].ajab_news_content` | string \| null | **`null`** on all items | Code calls `stripHtml(news.ajab_news_content)` but it's always null. Real body content is only in `popup_items[].content`. | CMS team should populate this if top-level body is needed; otherwise remove the fallback. |
| `data[].news_content` | JSON string \| null | Populated as raw JSON blob | **Code never reads this field at all** (reads `ajab_news_content` instead). Contains CMS rich-text that is completely invisible in the UI. | Either rename/map to `ajab_news_content` in the CMS, or update `CLNews.tsx` to read `news_content` (parse as JSON if needed). |
| `data[].thumbnail_image` | string \| null | **`null`** on staging | Code ignores it entirely; no top-level news thumbnail shown. | Implement thumbnail display at the news-item level once CMS populates this. |
| `data[].published` | string (`"0"`–`"3"`) | `"0"` on test/draft items, `"1"`–`"3"` on real items | **Not filtered** — draft items (`published: "0"`) appear alongside real published content. | Add filter in `CLNews.tsx`: `newsData.filter(item => item.published !== '0')` before rendering. |
| `data[].publish_status` | string \| null | `null` on unpublished, `"1"` on published | Secondary publish flag, also not filtered. | Use in conjunction with `published` once filtering is implemented. |
| `popup_items[].category: "video"` | string | Present in items 29, 9 | Filtered out — only `"single"` and `"multiple"` are accepted. Video items are silently skipped. | Add `"video"` handler: render an embedded YouTube player using `popup_items[].video_url`. |
| `popup_items[].video_url` | string | YouTube URL (e.g. `youtube.com/watch?v=eW-S1IcQYe0`) | **Never read** — no video playback support anywhere in the UI. | Wire up to an `<iframe>` or YouTube embed when `category === "video"`. |

#### Staging snapshot (May 2026) — 13 items in `data[]`

| `id` | `published` | `popup_items` | Status | Notes |
|------|-------------|---------------|--------|-------|
| 28 | `0` | 2 items: `single` + `multiple` (3 images) — "Ajab Gazab Bazaar in Kutch" | ✅ Best real content | Images resolve; both category types work. |
| 27 | `0` | 2 items: `single` + `multiple` (3 images) — same event | ✅ Duplicate of 28 | Likely a test duplicate. |
| 29 | `0` | 1 item: `video` — "Bhavsaagar Ke Paar" (YouTube) | ⚠️ Skipped | `category: "video"` not handled. |
| 30 | `0` | 1 item: `single` — title "test" | ⚠️ Draft/test | `published: "0"`, should be filtered. |
| 26 | `0` | 2 items: `single` + `multiple` — title "asd" / "qwee" | ⚠️ QA data | Should be filtered. |
| 9 | `3` | 1 item: `video` — "Bhavsaagar Ke Paar" (YouTube) | ⚠️ Skipped | Video, not handled. |
| 10–23 | `1`–`3` | Empty `[]` | ⚠️ No popup content | `news_title` present (test names like "rohit", "sdfasdfasdf") but empty popup_items render as blank cards. |

---

## 9. Search

### 9.1 `GET /Api/nitesh`

**What it does on the website:** `lib/utils/search.ts` — **`SEARCH_ENDPOINT`** — site-wide search results (query shape depends on caller; often a `q` or similar parameter — confirm in search UI when wiring).

---

## 10. Glossary & about

### 10.1 `GET /Api/glossary`

**What it does on the website:** `hooks/use-glossary.ts` — glossary terms and optional `poetic_images` paths.

### 10.2 `GET /Api/about`

**What it does on the website:** `hooks/use-about.ts` — about page copy / structured content.

---

## 11. `/Api/related` — multi-entity

One path, **different query parameters** depending on module:

| Context | Typical query param(s) | Used by |
|---------|-------------------------|---------|
| Song | `song_id` | Song detail |
| Poem | `poem_id` | Poem detail |
| Reflection | `reflection_id` | Reflection detail |
| Person | `people_id` / `person_id` | People detail (fallback in service) |
| Film | (per CMS; film module may use separate related contract) | Check CMS for `film_id` if added |

**Success:** Usually `status: true`, `data` (sometimes grouped), `counts` when the UI shows tab counts.

**Errors:** `status: false` with `message` when the parent entity is missing or has no relation graph.

---

## 12. API health matrix (staging)

_Last probed: **2026-05-15** against `https://ajab.designanddevelopment.in/admin` (default `AJAB_API_BASE`). “Works” = **HTTP 200** and JSON `status: true` when applicable, using **Node `fetch` + `response.json()`**._

| Endpoint | Used by (website) | Staging status | Notes |
|----------|-------------------|----------------|-------|
| `GET /Api/home` | `/` — `CLHero.tsx` | **Works** | `latest` includes song, poem, reflection, person, film. |
| `GET /Api/news` | Home popup, `/ajab-news` | **Works** | 13 items; `news_title`/`ajab_news_content` null on real items — real content is in `popup_items[]`. Draft items (published:0) not filtered. `category:"video"` items silently skipped. |
| `GET /Api/list` | `/songs` | **Works** | ~211 songs; ids non-sequential. |
| `GET /Api/song_filters` | Songs filter panel | **Works** | Singer/poet buckets. |
| `GET /Api/explore_songs` | Song detail | **Works** | `status: false` when id missing. |
| `GET /Api/song_versions` | Song detail versions strip | **Broken (500)** | HTML “Database Error” — app falls back to current song only. |
| `GET /Api/related` | Song/poem/reflection/people detail | **Works** | Query param varies by module (`song_id`, etc.). |
| `GET /Api/poems` | `/poems` CL + `poemsService` | **Works** | 245 total, 10/page. `note_text`/`glossary`/`english_translation_text` null on staging. |
| `GET /Api/poem_filters` | Poems filters | **Works** | 178 poets, 1 theme (test data). |
| `GET /Api/poems/{id}` | Poem detail | **Works** | |
| `GET /Api/poem_listing` | ~~`/poems` CL~~ (old) | **Works** | Superseded — `CLPoems.tsx` now uses `/Api/poems`. |
| `GET /Api/reflections` | Reflections CL listing | **Works** | |
| `GET /Api/reflection_list` | Reflection detail SSG | **Works** | |
| `GET /Api/reflection_filter` | Reflections filters | **Works** | |
| `GET /Api/explore_reflection` | Reflection detail | **Works** | |
| `GET /Api/people` | `/people` CL | **Works** | |
| `GET /Api/person_list` | People detail SSG | **Works** | |
| `GET /Api/explore_person` | People detail | **Works** | |
| `GET /Api/films` | `/films` CL | **Works** | |
| `GET /Api/film_list` | Film detail SSG | **Works** | |
| `GET /Api/explore_film` | Film detail | **Works** | |
| `GET /Api/glossary` | `/glossary` | **Works** | |
| `GET /Api/about` | `/about` | **Works** | |
| `GET /Api/nitesh` | Search (`/searche`) | **Works** | Site-wide search endpoint. |

Re-run probes after CMS deploys: `node scripts/probe-cms-apis.mjs` (if added) or manual `fetch` in DevTools → Network.

---

## 13. Staging observations (May 2026)

Tested against **`https://ajab.designanddevelopment.in/admin`**:

| Observation | Impact |
|-------------|--------|
| **`/Api/list`** | Returns **211** songs; `id` values observed roughly **5–230**, not sequential 1…211. |
| **`/Api/explore_songs`** | Works for valid ids (e.g. `5`, `230`). Returns `status: false` for missing ids. |
| **`/Api/song_versions`** | **HTTP 500** (HTML database error) for multiple valid ids — **do not depend** on this for production UX until CMS is fixed. |
| **`/Api/related`** with `song_id` | Returns **200** + large JSON with `counts` and nested `data` for valid songs. |
| **`/Api/home`** | `person.thumbnail_url` may be **null** — UI uses local placeholder art. |
| **Duplicate keys** | `year` / `Year` in some song JSON — watch strict parsers outside the browser. |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-05-18 | Full `/Api/poems` audit — complete field table, website mapping, handled vs not-handled fields. Moved `/poems` CL to use `/Api/poems` (was `/Api/poem_listing`). Added `/Api/poem_filters` response shape. |
| 2026-05-16 | Full `/Api/news` audit — added per-field implementation table (what's handled vs not), video support gap, published filter gap, and full 13-item staging snapshot. |
| 2026-05-15 | Added §12 API health matrix; expanded §8 home/news payloads and `homeApiMapper` notes. |
| 2026-05-14 | Initial intensive reference; song_versions staging failure documented; related + list + explore documented for songs flow. |

---

*For environment variables and legacy vs new base URLs, see **`docs/CMS_API.md`**. For songs-only step notes (deferred listing experiment), see **`docs/SONGS_API.md`**.*
