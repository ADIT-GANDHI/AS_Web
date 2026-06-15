# Song Detail (`/songs/details/[id]`)

**Route:** `/songs/details/{id}`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/songs/details/[id]` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\songs\details\[id]\page.tsx` |
| **Client wrapper** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\songs\details\[id]\CLSongDetailsClient.tsx` |
| **Presentation** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongDetailsPage.tsx` |
| **SSG** | `generateStaticParams` fetches `/Api/list?limit=400` for ids |

**Legacy (unused by CL route):** `SongDetailsClient.tsx`, `SongDetailsPage.tsx` — still call `/Api/song_versions`.

---

## 2. Component tree

```
app/songs/details/[id]/page.tsx
└── CLSongDetailsClient.tsx
    ├── SongsLoadingShell (Header + Loader + Footer) while fetching
    ├── "Song not found" shell (API ok but no data)
    └── CLSongDetailsPage.tsx
        ├── Header.tsx
        ├── main.cld-page
        │   ├── cld-bg-marble (CSS background stack)
        │   ├── Back link → /songs
        │   ├── Title bar (script-aware title, singer, poet, year, location)
        │   ├── Version carousel (horizontal scroll, songVersions[])
        │   │   └── WavyCard per version
        │   ├── YouTube embed (LiteYouTubeEmbed)
        │   ├── Lyrics (script toggle: devanagari / transliteration / english)
        │   ├── SongAboutClamp (HTML about, ...more)
        │   ├── NOTES popup trigger → CLGlossaryPopup / notes panel
        │   ├── Related section (tabs: ALL, SONGS, POEMS, REFLECTIONS, OTHER)
        │   │   └── WavyCard rows per related item
        │   ├── KeywordCloud (from related keywords bucket)
        │   └── GlossaryStrip (static mock terms from CLdetailMocks)
        └── Footer.tsx
```

**Shared imports:**

- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\KeywordCloud.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\GlossaryStrip.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\WavyCard.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoemPopups.tsx` → `CLGlossaryPopup`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\parseKeywords.ts` → `keywordsFromRelatedBucket`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongDetails.css` | Detail layout, lyrics, related, marble |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Root + shared song styles |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |
| `react-lite-youtube-embed/dist/LiteYouTubeEmbed.css` | Video embed |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/list` | `page=1&limit=1` | Mount (nav count) | `total` → `SongsNavCountContext` |
| `GET /Api/explore_songs` | `song_id={id}&language=hindi` | Mount | Full `data` object — primary payload |
| `GET /Api/explore_songs` | `song_id={id}&language=english` | Background after hindi load | `songLyricsTranslated`, `songTitle`, `english_translation`, … merged into state |
| `GET /Api/related` | `song_id={id}` | After song load | `data.keywords`, `data.songs`, `data.poems`, `data.reflections`, `data.other`, `counts` |

**Not called (CL path):** `/Api/song_versions` — versions array is `[songDetails]` single item.

### Key `explore_songs` fields consumed

| Purpose | Fields |
|---------|--------|
| Titles | `Songtitle_transliteration`, `songTitle`, `songTitleOriginal`, `umbrellaTitleText`, … |
| Credits | `singer`, `singer_name`, `poet` |
| Meta | `year`, `location`, `about`, `meta_description` |
| Lyrics | `songLyricsOriginal`, `songLyricsTransliteration`, `songLyricsTranslated`, HTML variants |
| Notes | `songnotes`, `song_notes`, `songLyricsNotes`, … |
| Media | `youtube_video_id`, `thumbnail_url` |
| Versions carousel | Same object repeated in `songVersions` |

### Related item rendering

| Bucket | Title fields | Link targets |
|--------|--------------|--------------|
| songs | `Songtitle_transliteration`, … | `/songs/details/{id}` |
| poems | `original_title`, … | `/poems/{id}` |
| reflections | `title` | `/reflections/details/{id}` |
| keywords | `word_transliteration` | Search links via `KeywordCloud` |

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Song body | **Live** when `explore_songs` completes | Faster response (**~60s observed** in audits) |
| English merge | Background second fetch | Single payload with all languages |
| Versions | **One card** (current song only) | Multiple versions via `/Api/song_versions` (today often **0** rows) |
| Related | **Live** from `/Api/related` | Consistent `counts.all`; keyword objects with `word_transliteration` + `word_translation` |
| Not found | Dedicated UI (no mock song) | Clear 404 semantics from API (`status: false`) |
| Network error | Falls back to `MOCK_DETAIL` | — |

---

## 6. Filters

**None** on detail page. Related section uses **client tabs** only (no API refetch on tab change).

| Tab | Data source |
|-----|-------------|
| ALL | Sum of keywords + songs + poems + reflections + other |
| SONGS / POEMS / REFLECTIONS / OTHER | `related.data[bucket]` |

Related list shows 3 items initially; "see more" expands client-side.

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `related.data.keywords[]` | **KeywordCloud** — `word_transliteration` / `title` / `term`; links to `/searche?search=` |
| `meta_keywords` on song | **Not shown** |
| `GlossaryStrip` | Static `GLOSSARY_TERMS_LINE_1/2` from `CLdetailMocks.ts` — **not from API** |
| Notes popup | `songnotes` / HTML notes fields — plain text after strip |

`keywordsFromRelatedBucket` filters test/junk terms (`asdasd`, `test`, etc.).

---

## 8. Images

| Location | Source | Placeholder / onError |
|----------|--------|---------------------|
| Version cards | `thumbnail_url` → `resolveCmsAssetUrl` | Placeholder SVG |
| Related thumbs | `thumbnail_url` on related rows | Via `WavyCard` |
| YouTube poster | LiteYouTubeEmbed `maxresdefault` | YouTube CDN |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| `explore_songs` network/throw | `MOCK_DETAIL`, `MOCK_VERSIONS`, `MOCK_RELATED` from `CLdetailMocks.ts` |
| API returns no data / `status: false` | **No mock** — "Song not found" UI |
| `/Api/related` failure | `MOCK_RELATED` |
| Glossary strip | Always includes mock term lines from `CLdetailMocks` |

---

## 10. Known gaps / CMS action items

1. **`/Api/explore_songs` latency** — 8–60s; risk of timeout; users see loader extended period.
2. **`/Api/song_versions` unused** — populate versions for carousel UX.
3. **Glossary strip not API-driven** — should use related keywords or dedicated glossary ids on song.
4. **ALL tab count** — fixed to sum buckets when `counts.all` missing (UI audit item ✅).
5. **No ISR/proxy** — all fetches client-side from browser.
6. **Legacy `SongDetailsClient`** — still in repo; confirm deprecation.

---

*Verified against `CLSongDetailsClient.tsx`, `CLSongDetailsPage.tsx` — June 2026.*
