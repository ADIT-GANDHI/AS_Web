# Home (`/`)

**Route:** `/`  
**CMS base:** `NEXT_PUBLIC_AJAB_API_BASE` → `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\ajabEnv.ts`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Home\CLHero.tsx` |
| **Mapper** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\homeApiMapper.ts` |
| **News helpers** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\cmsNews.ts` |

---

## 2. Component tree

```
app/page.tsx
└── CLHero.tsx
    ├── Header.tsx
    ├── main.clh-page
    │   └── clh-marble-stage
    │       └── clh-cards (5 card rows)
    │           ├── SongCard → HomeCardShell + HomeCardImage
    │           ├── PoemCard → HomeCardShell (text-only)
    │           ├── ReflectionCard → HomeCardShell + HomeCardImage
    │           ├── PeopleCard → HomeCardShell + HomeCardImage
    │           └── FilmCard → HomeCardShell + HomeCardImage
    ├── CLContentSliderModal.tsx (Ajab News popup)
    └── Footer.tsx (custom newsHeading / newsSubtext props)
```

**Inline card components** (defined in `CLHero.tsx`): `SongCard`, `PoemCard`, `ReflectionCard`, `PeopleCard`, `FilmCard`.

**Shared children:**

- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Home\HomeCardShell.tsx` — link wrapper, CTA
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Home\HomeCardImage.tsx` — CMS thumb + onError fallback
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\CLContentSliderModal.tsx` — news popup carousel

**Mock seed data:** `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Home\CLHomeMocks.ts`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Home\CLHome.css` | Marble stage, card layout, typography |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Shared page tokens / floating buttons |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Design tokens |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Header.css` | Via Header |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Footer.css` | Via Footer |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/home` | — | `CLHero` mount | `status`, `latest.song`, `latest.poem`, `latest.reflection`, `latest.person`, `latest.film` → `mapHomeLatest()` |
| `GET /Api/news` | — | `CLHero` mount (after home) | `data[].popup_items[]` filtered by `isCmsPublished`, `isPopupForHome`, `isRenderableNewsPopupCategory` |

### `/Api/home` field mapping (per card type)

| Card | CMS fields consumed | Mapped to |
|------|---------------------|-----------|
| Song | `id`, `Songtitle_transliteration`, `songtitletraan`, `singer`, `poet`, `meta_description`/`about`, `thumbnail_url` | title, subtitle, singer, poet, description, image |
| Poem | `original_text`, `couplet_transliteration`, `english_translation_text`, `attributed_poet`, `id` | text (original + translation), poet |
| Reflection | `id`, `title`, `reflection_excerpt`, `thumbnail_url`, `speaker_id` (via person map if wired) | title, description, image, saysBy |
| Person | `id`, `person_name_english`, `occupation_text`, `thumbnail_excerpt`/`about`, `thumbnail_url` | title, subtitle, description, image |
| Film | `id`, `english_transliteration`, `english_translation`, `director_name_english`, `thumbnail_excerpt`, `thumbnail_url` | title, subtitle, filmBy, description, image |

### `/Api/news` popup fields

| Field | Use |
|-------|-----|
| `popup_items[].category` | `single` \| `multiple` \| `video` |
| `popup_items[].title`, `second_title`, `content` | Slide copy |
| `popup_items[].image`, `images[]` | Slide imagery |
| `popup_items[].video_url` | YouTube id via `extractYouTubeId` |
| `popup_items[].published`, `show_on_home` | Filtering |
| `popup_items[].sequence_order` | Sort order |

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Featured cards | **Live** when `/Api/home` returns `status` + `latest` | Curated, published featured items per module |
| `latest.person` | Sometimes test/unpublished records | Published people with real thumb + excerpt |
| Ajab News popup | **Live** when valid `popup_items` with `show_on_home` | Clean news rows; remove duplicates (ids 27/28) |
| Card links | Song `/songs/details/{id}`, Reflection `/reflections/details/{id}`, People `/people/{id}`, Film `/films/details/{id}` | — |
| Poem card link | Points to `/poems/details/{id}` | **Bug:** route is `/poems/{id}` — CMS cannot fix; frontend must update href |
| Footer news CTA | Custom copy; `open-ajab-news` window event | Optional CMS-driven footer strings |

---

## 6. Filters

**None** on home. News popup filters:

| Filter | Source | Logic |
|--------|--------|-------|
| Published | `lib/cmsNews.ts` → `isCmsPublished` | Excludes `0`, `false`, `no` |
| Home flag | `isPopupForHome` | Requires `show_on_home` = 1/yes/true |
| Category | `isRenderableNewsPopupCategory` | `single`, `multiple`, `video` only |

---

## 7. Keywords / glossary / meaning

| Field | Shown on home? |
|-------|----------------|
| `meta_keywords` | **No** |
| Poem glossary on card | **No** — only transliteration/translation text |
| News popup content | **Yes** — HTML stripped for some paths; plain text in modal |

---

## 8. Images

| Location | Source | Placeholder / onError |
|----------|--------|---------------------|
| Card thumbnails | `thumbnail_url` → `resolveCmsAssetUrl` / `pickImage` | `HomeCardImage` falls back to mock image from `CLHomeMocks` on missing/broken |
| News popup slides | CMS paths → `resolveCmsAssetUrl` | `CMS_IMAGE_PLACEHOLDER` (`/placeholder.svg`) when no images |
| Video slides | YouTube embed via `react-lite-youtube-embed` | Placeholder image if no video id |
| Marble background | CSS in `CLHome.css` | N/A |

**URL building:** `AJAB_API_BASE` + relative paths (`/images/…`, `uploads/thumbnails/…`).

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| `/Api/home` fetch error | State keeps `MOCK_HOME_*` from initial `useState` |
| `/Api/home` empty `latest` | Mocks remain |
| `/Api/news` error or no home popups | `fallbackSlides` with Gulshan-e-Armaan placeholder |
| Initial render | All five cards show mocks until API succeeds |

Mock definitions: `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Home\CLHomeMocks.ts`

---

## 10. Known gaps / CMS action items

1. **Poem card href** — `PoemCard` uses `/poems/details/{id}` but App Router expects `/poems/{id}`.
2. **Featured person quality** — probe showed test person ("new singer", unpublished).
3. **News data hygiene** — duplicate news rows, junk `popup_items`, test titles; filter logic hides most junk.
4. **No home-specific filter API** — featured content entirely driven by `/Api/home` curation.
5. **Speaker on reflection card** — home mapper may not resolve `speaker_id` via `getSpeakerNameMap` (listing/detail do).
6. **Performance** — two sequential fetches on mount (home + news); no SSR data for featured cards.

---

*Verified against `CLHero.tsx`, `homeApiMapper.ts`, `cmsNews.ts` — June 2026.*
