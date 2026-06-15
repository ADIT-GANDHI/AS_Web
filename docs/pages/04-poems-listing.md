# Poems Listing (`/poems`)

**Route:** `/poems` — combined carousel + filter experience (not a separate grid listing).

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/poems` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\poems\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoems.tsx` |
| **Layout** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\poems\layout.tsx` → `PoemsNavCountProvider` + imports `CLPoems.css` |

---

## 2. Component tree

```
app/poems/page.tsx
└── CLPoems.tsx (self-contained page shell)
    ├── Header.tsx
    ├── main
    │   ├── Intro (POEMS_INTRO)
    │   ├── Count row (totalPoems)
    │   ├── CLPoemFilterPanel (portal drawer: Poet | Theme)
    │   ├── Poem carousel (clp-halo-circle)
    │   │   ├── Audio button → CLPlayerPopup
    │   │   ├── Poem text (script toggle)
    │   │   ├── Poet attribution
    │   │   ├── Lang toggle (अ / ā / a)
    │   │   └── NOTES | GLOSSARY buttons
    │   ├── Prev/Next chevrons
    │   ├── Related section (tabs + list)
    │   ├── GlossaryStrip
    │   └── "See all poems" / list drawer (WavyPaperPopup)
    ├── Footer.tsx
    ├── WavyPaperPopup (notes)
    ├── CLGlossaryPopup
    └── CLPlayerPopup
```

**Supporting files:**

- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoemFilterPanel.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoemPopups.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\GlossaryStrip.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\shared\WavyPaperPopup.tsx`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\mapPoemListItem.ts`
- `d:\Mihir_Avni\Ajab_New\ajabshar-main\lib\mapRelatedResponse.ts`
- Mocks: `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoemMocks.ts`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoems.css` | Halo circle, carousel, related |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoemFilterPanel.css` | Filter drawer |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Marble root |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongDetails.css` | Sidebar-related styles |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

Background: Jung Egg / couplet artwork via `CLPoems.css` (not CMS image).

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/poems` | `page={n}&limit=10` | Mount + prefetch near end of carousel | `data[]`, `total` |
| `GET /Api/poem_filters` | — | `CLPoemFilterPanel` mount | `data.poets[].poet_name`, `data.themes[].word_transliteration` |
| `GET /Api/related` | `poem_id={activeId}` | When `activePoem.id` changes | Related buckets via `fetchRelatedByParam` |

### Per-poem fields (`mapPoemListItem`)

| API field | UI |
|-----------|-----|
| `id` | identity |
| `english_transliteration_text` / `couplet_transliteration` | default script text |
| `original_text` | devanagari script |
| `english_translation_text` / `couplet_translation` | english script |
| `attributed_poet` / `poet` | poet line + filter |
| `thumbnail_url` | optional thumb |
| `note_text` | NOTES popup |
| `glossary` | GLOSSARY popup + theme filter matching |

**Timeout:** 15s `AbortController` on poems fetch.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Poem catalog | **~245 poems** live | Stable pagination |
| Poet filters | **183 poets** from `poem_filters` | Accurate poet_name list |
| Theme filters | **1 test theme** in API; fallback mock themes in panel | Rich `themes[]` taxonomy |
| Theme matching | Client match on poem `glossary` field (comma-split) | Dedicated `meta_keywords` or theme ids on each poem |
| Audio | `soundCloud_track_url` often empty | Working SoundCloud URLs → real player |
| Related | Live per active poem | Complete related buckets |

---

## 6. Filters

| Filter | Source | Logic | API vs client |
|--------|--------|-------|---------------|
| Poet | `/Api/poem_filters` (+ `FALLBACK_FILTERS`) | `fieldMatchesFilters` on `poem.poet` | API labels; **client match** |
| Theme | `/Api/poem_filters` (+ fallback) | Match on `poem.glossary` string | API labels; **client match** |
| Carousel index | — | Resets to 0 when filters change | Client |
| Prefetch | — | Loads next API page when near end of filtered list | Client + API |

Filter UI: `CLPoemFilterPanel` — Poet | Theme columns, max selections via parent state.

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `glossary` (poem row) | GLOSSARY popup body; theme filter source |
| `POEMS_GLOSSARY` mock | `GlossaryStrip` + popup fallback when API glossary empty |
| `meta_keywords` | **Not shown** on listing |
| `poem_filters.themes[].word_transliteration` | Filter drawer labels |

Popup displays plain text: term — meaning lines from `glossary` HTML stripped.

---

## 8. Images

| Location | Source | Placeholder / onError |
|----------|--------|---------------------|
| Halo / background | CSS artwork in `CLPoems.css` | Static design asset |
| Poem thumb (if used) | `thumbnail_url` + `AJAB_API_BASE` | Often unused in carousel UI |
| Filter panel shape | `FILTER_PANEL_SHAPE` svg | Static |
| Player popup | Mock singer list in `CLPoemPopups` | No CMS audio artwork |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| `/Api/poems` page 1 failure | `MOCK_POEMS`, `TOTAL_POEMS` |
| `poem_filters` failure | `FALLBACK_FILTERS` in `CLPoemFilterPanel` |
| Related fetch failure | `POEMS_RELATED` via `asRelatedContent` |
| Glossary body empty | `POEMS_GLOSSARY` joined string |
| Audio player | `CLPlayerPopup` uses mock singer names (no API) |

---

## 10. Known gaps / CMS action items

1. **Populate `poem_filters.themes`** beyond single test entry.
2. **SoundCloud integration** — player opens but lacks live track URLs.
3. **Theme filter** relies on `glossary` text field — fragile vs structured theme ids.
4. **No dedicated poem grid** — `/poems` is immersive carousel; detail at `/poems/[id]`.
5. **Prefetch logic** — may fetch extra pages while user filters; watch API load.
6. **Legacy `components/Poems/index.tsx`** — non-CL path may still exist.

---

*Verified against `CLPoems.tsx`, `CLPoemFilterPanel.tsx`, `mapPoemListItem.ts` — June 2026.*
