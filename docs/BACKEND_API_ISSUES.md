# Backend API issues — handoff for CMS team

**Last updated:** 7 June 2026  
**CMS base:** `https://ajab.designanddevelopment.in/admin`  
**Frontend status:** Items marked *Frontend done* have workarounds or integration on our side; remaining rows need CMS/API changes before the site can show full real data.

---

## Issues requiring backend implementation

| Endpoint | Issue | Expected fix |
|----------|--------|--------------|
| `GET /Api/list` — `singer` & `poet` query params | Server-side filtering is inconsistent. `?poet=Kabir` works (~105 rows); `?singer=Kabir` returns 0; param semantics unclear. Frontend paginates with empty singer/poet params and filters client-side on loaded pages. | Document param behaviour; support reliable filter by singer name, poet name, and/or ID; return filtered `total`. |
| `GET /Api/song_filters` — poet names | Returns 245 entries but many are **Hindi poem lines**, not poet names (0 entries for “Kabir”). Unusable for filter UI. | Return `data.poet[].poet_name` as real attributed poets only (match `person_list` / song `poet` fields). |
| `GET /Api/song_filters` — themes | Key is `them` (typo). Only **1 test theme**: `Saudaagir asdasdasd`. `/Api/poem_filters` themes: same single test entry. | Rename `them` → `theme`; populate with curated glossary **words** (keywords), not SEO `meta_keywords`. |
| `GET /Api/song_versions` | Was HTTP 500; now **200 with `count: 0`** for tested song IDs. “Other versions of this song” has no data. | Return version rows per `song_id` / umbrella title (singer, year, thumbnail, id). |
| `GET /Api/news` — draft filtering | Rows and popups still include `published: "0"` test content. | Exclude unpublished rows/popups from public API **or** set `published: "1"` only on live content. |
| `GET /Api/news` — `video` category | Items with `category: "video"` and `video_url` exist; no video player in UI yet. | Either expose a stable `video_url` + poster fields for a future player, or omit video-only items from public feed. |
| `GET /Api/reflection_filter` — `format` field | `data.format[]` contains **person records** (`first_name: "Abdul"`), not format types. | Return format strings: `Interview`, `Essay`, `Visual Story`, `Audio Story`, etc. |
| `GET /Api/poems` — null content fields | `note_text`, `glossary`, `english_translation_text` are **null** on probed poems. NOTES/GLOSSARY UI stays hidden. | Populate these fields in CMS for published poems. |
| `GET /Api/poem_filters` — test theme | Only 1 theme: `Saudaagir asdasdasd`. | Populate real theme/word list (same glossary words as songs). |
| `GET /Api/news` — null top-level content | `news_title`, `ajab_news_content` null on live items; copy lives in `popup_items[]`. | Populate top-level fields **or** document that `popup_items` is the canonical public shape. |
| `GET /Api/nitesh` — endpoint naming | Search lives at `/Api/nitesh` (developer name). | Rename to `/Api/search` (keep alias during migration); frontend will update `SEARCH_ENDPOINT`. |
| **SONGS INTRO** | No API field for songs listing intro paragraph. | Add intro copy to CMS (e.g. `/Api/list` meta or `/Api/home` config). |
| **Singer / Poet / Theme filter API** | `/Api/song_filters` exists but data is wrong; frontend builds filters from loaded song rows + `meta_keywords`. | Fix `song_filters` (see above) so frontend can use one canonical filter source. |
| **Theme / Words filter list** | `meta_keywords` on songs is messy SEO text (“Woman Singer”, “Bhakti Singer”). | Populate `song_filters.theme` / `them` with glossary **words** from DB. |
| `GET /Api/about` | API 200 but sections contain placeholder text (`dgfdgfhgjhkj`, `asd`, `zxc`). App falls back to mock About. | Publish at least one complete tab (intro + team) with real HTML `visual_content`. |
| `GET /Api/glossary` | API 200 but only **1 junk term**; app shows mock glossary. | Add ≥10 real glossary entries (`glossary_term`, `glossary_meaning`, optional related ids). |
| `GET /Api/radio` | **404** — not implemented. | Implement radio + playlist endpoints or confirm out of scope. |
| `GET /Api/playlist` | **404** — not implemented. | Same as radio. |
| `GET /Api/poems?id={id}` | `?id=` returns a **paginated page**, not a single poem; fragile for detail URLs. | Return one poem by id or honour `id` as strict filter. |
| `GET /Api/nitesh` — search coverage | Queries like `kabir`, `ram` return **0 songs / 0 poems** despite 234 songs / 245 poems in catalog. | Index songs and poems in search. |
| `GET /Api/explore_songs` | Response time **~60s** for some ids; risks client timeout. | Optimize query / caching; target &lt;5s. |
| `GET /Api/reflection_list` | Many rows have `person_name_english: null`; speaker filters weak. | Populate speaker display name or join `speaker_id` on list payload. |
| `GET /Api/explore_person` | Detail often has `occupation: null` while `category_name` has role. | Expose consistent `occupation_text` / `category_name` on list + detail. |

---

## Resolved on frontend (no backend change required)

| Item | What we did |
|------|-------------|
| News duplicate IDs | Confirmed **unique** news ids; no CMS fix needed. |
| News null content (display) | Read **`popup_items[]`** for title/body/images on Home + Ajab News. |
| News drafts (partial) | Filter `published` on rows/popups; Home popup requires `show_on_home`. *Still need CMS to mark live content published.* |
| News page not using API | `/ajab-news` now loads **`GET /Api/news`** (falls back to layout reference data if empty). |
| Poems only 10 loaded | Paginated **`GET /Api/poems`** on load + near end of carousel. |
| Songs / Reflections / People bulk fetch | **Load More** calls next API page (same UI). |
| Search wrong titles | Map `original_title`, `person_name`, `couplet_transliteration`, `about`. |
| Song transliteration / notes | Map CMS field **`songLyricsNotes`**. |
| Related people missing | Merge **`data.people`** into related “OTHER” bucket. |
| Poem detail wrong row | Find poem by **`id`** in response array (not `data[0]`). |
| Reflection format filter | Hardcoded allowed formats until `reflection_filter.format` is fixed. |
| Video news | Skipped until player exists (intentional). |

---

## Suggested backend priority

1. **`song_filters`** — correct poets + curated theme/words  
2. **`poem_filters` themes** + poem **note/glossary/translation** fields  
3. **`reflection_filter.format`** + reflection **speaker names** on list  
4. **News `published`** flags on live content  
5. **Glossary** + **About** real content  
6. **`/Api/search`** rename + index songs/poems  
7. **`song_versions`**, **radio/playlist**, **`explore_songs`** performance  

---

*See also: `docs/PAGE_API_AUDIT.md` for page-by-page API mapping.*
