# Reflection Detail (`/reflections/details/[id]`)

**Route:** `/reflections/details/{id}`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/reflections/details/[id]` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\reflections\details\[id]\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Reflections\CLReflectionDetail.tsx` |
| **Layout** | Reflections layout provides nav count context |

---

## 2. Component tree

```
app/reflections/details/[id]/page.tsx
└── CLReflectionDetail.tsx
    ├── RepeatingPageBackground (REFLECTIONS_DETAIL_BG)
    ├── Loader (while loading)
    ├── Header.tsx
    ├── main.clrd-page
    │   ├── Back → /reflections
    │   ├── Title + saysBy + location + year
    │   ├── LiteYouTubeEmbed (interview/video)
    │   ├── ReflectionDescription (truncated + more)
    │   ├── Related tabs (ALL, SONGS, POEMS, REFLECTIONS, OTHER)
    │   ├── Related WavyCard list (expandable)
    │   ├── GlossaryStrip (from related keywords bucket)
    │   └── KeywordCloud
    ├── Footer.tsx
    └── CLGlossaryPopup (optional glossary expand)
```

**Libs:** `mapRelatedResponse.ts`, `parseKeywords.ts`, `speakerNames.ts`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Reflections\CLReflections.css` | Detail + listing shared |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongDetails.css` | Related row styles |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Page root |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |
| `react-lite-youtube-embed/dist/LiteYouTubeEmbed.css` | Video |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/reflection_list` | `page=1&limit=1` | Mount | `total` → nav count |
| `GET /Api/explore_reflection` | `reflection_id={id}` | Mount | Full `data` object |
| `GET /Api/person_list` | `limit=500` | Cached speaker map | Resolve `speaker_id` |
| `GET /Api/related` | `reflection_id={id}` | After load | Related buckets + keywords |

### Detail mapping (`mapApiItem`)

| API field | UI |
|-----------|-----|
| `meta_title` / `title` | title |
| `speaker_id` | `saysBy` via speaker map |
| `interview_place` | location |
| `interview_year` | year |
| `youtube_video_id` / `interview_video` | YouTube embed |
| `reflection_excerpt` / `interview_about` / `visual_story_desc` / `essay_content` / `meta_description` | description (HTML stripped) |
| `format` | format label |

### Glossary from related

`mapApiGlossaryTerms(related.data.keywords)` → `GlossaryStrip` with `word_transliteration`, `word_translation`, `highlighted`.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Detail payload | **Live** from `explore_reflection` (~100ms–12s) | Faster stable detail endpoint |
| Video | YouTube id when present | Valid ids for all interview reflections |
| Speaker | Resolved via person_list | Inline speaker name on detail payload optional |
| Essay / visual formats | Fields exist (`essay_content`, `visual_story_desc`) | Content for non-interview formats |
| Related | Live keywords + cross-links | Rich keyword meanings |
| Missing id | `MOCK_REFLECTION_DETAIL` | Proper 404 semantics |

---

## 6. Filters

**None** (detail page). Related section uses client tabs only; initial 3 items + expand.

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `related.data.keywords[]` | **GlossaryStrip** + **KeywordCloud** |
| `word_transliteration` / `word_translation` | Term + meaning in strip |
| `meta_keywords` on reflection | **Not shown** |
| `keywordsFromRelatedBucket` | Search links in KeywordCloud |

Test/junk keywords filtered by `parseKeywords.ts` (`isLikelyTestKeyword`).

---

## 8. Images

| Location | Source | Placeholder |
|----------|--------|-------------|
| YouTube poster | LiteYouTubeEmbed | YouTube CDN |
| Related thumbs | `thumbnail_url` on related rows | WavyCard fallback |
| Background tile | `REFLECTIONS_DETAIL_BG` | Static |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| No `id` prop | `MOCK_REFLECTION_DETAIL` |
| API error / empty data | `MOCK_REFLECTION_DETAIL` |
| Related failure | `REFLECTIONS_RELATED` mock via `asRelatedContent` |
| Speaker map miss | Empty `saysBy` |

---

## 10. Known gaps / CMS action items

1. **API latency** — `explore_*` slower than list endpoints; loader visible 8–12s+.
2. **Non-interview formats** — UI centered on YouTube; essay/visual may need alternate layouts.
3. **`person_name_english` on payload is poet**, not speaker — same speaker_id resolution required.
4. **Mock still used on API error** — unlike songs detail not-found path; consider explicit not-found.
5. **Related SEE MORE** — expand client-side; no pagination API.

---

*Verified against `CLReflectionDetail.tsx` — June 2026.*
