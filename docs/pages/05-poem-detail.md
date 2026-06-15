# Poem Detail (`/poems/[id]`)

**Route:** `/poems/{id}`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/poems/[id]` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\poems\[id]\page.tsx` |
| **Client** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\poems\[id]\CLPoemDetailClient.tsx` |
| **SSG** | `generateStaticParams` from `/Api/poems?limit=400` |

**Note:** Home page `PoemCard` incorrectly links to `/poems/details/{id}` — detail route is `/poems/{id}` only.

---

## 2. Component tree

```
app/poems/[id]/page.tsx
└── CLPoemDetailClient.tsx
    ├── Loader (fullscreen) while loading
    ├── "Poem not found" shell
    └── clp-page--detail
        ├── Header.tsx
        ├── Back link → /poems
        ├── Title (couplet_transliteration / first line)
        ├── clp-halo-circle (same UX as listing carousel)
        │   ├── Audio → CLPlayerPopup
        │   ├── Poem text (script toggle)
        │   ├── Poet line
        │   └── NOTES | GLOSSARY | lang toggle
        ├── Related section (tabs + rows)
        ├── GlossaryStrip (POEMS_GLOSSARY mock terms)
        ├── Footer.tsx
        ├── WavyPaperPopup (notes)
        ├── CLGlossaryPopup
        └── CLPlayerPopup
```

Reuses poem listing popups and styles from `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoemPopups.tsx`.

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Poems\CLPoems.css` | Detail + halo layout |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Page root |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/poems` | `id={id}` | Mount | `data[]` — **find row where `id` matches** |
| `GET /Api/related` | `poem_id={id}` | After poem loaded | Related via `fetchRelatedByParam` |

### Poem detail field mapping (`mapApiItem`)

| API field | UI |
|-----------|-----|
| `id` | identity |
| `couplet_transliteration` / `original_title` | page title |
| `english_transliteration_text` | transliteration script |
| `original_text` | devanagari |
| `english_translation_text` / `couplet_translation` | english |
| `attributed_poet` / `poet` | poet line |
| `note_text` | NOTES popup |
| `glossary` | GLOSSARY popup |
| `soundCloud_track_url` | player (often empty) |
| `thumbnail_url` | optional |

**CMS quirk:** `?id=` returns a **paginated page** (e.g. 10 items), not an isolated record. Client uses `data.find(id)` — works when poem is in page; fails otherwise → mock or not found.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Single poem | Works when id appears in `data[]` | `GET /Api/poems?id=` returning **one** poem or reliable filter |
| Fallback | `findMockPoemById` from `CLPoemMocks` | — |
| Related | Live `/Api/related` | Complete cross-links |
| Audio | Usually empty SoundCloud url | Valid `soundCloud_track_url` / `soundCloud_iD` |
| Glossary strip | Static `POEMS_GLOSSARY` mock | API glossary linked to poem |

---

## 6. Filters

**None** on detail page (filters exist on `/poems` listing only).

Related tabs: ALL | SONGS | POEMS | REFLECTIONS | OTHER — client-side from one related fetch.

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `glossary` | GLOSSARY popup (HTML stripped) |
| `POEMS_GLOSSARY` mock | `GlossaryStrip` at bottom + popup fallback |
| `meta_keywords` | **Not shown** |
| Related keywords bucket | **Not wired** on poem detail (unlike song/reflection detail KeywordCloud) |

---

## 8. Images

| Location | Source | Placeholder |
|----------|--------|-------------|
| Related thumbs | `thumbnailUrl` on related items | Empty → no img |
| Halo background | CSS | Design asset |
| Poem `thumbnail_url` | Mapped but rarely displayed in detail halo UI | — |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| API error or id not in array | `findMockPoemById(id)` → `mapMockPoem` |
| Id not in mocks | "Poem not found" UI |
| Related failure | `POEMS_RELATED` mock structure |
| Glossary empty | `POEMS_GLOSSARY` joined text |
| Player | Mock singers in `CLPlayerPopup` |

---

## 10. Known gaps / CMS action items

1. **Fix `/Api/poems?id=` semantics** — return single record or guaranteed first-item match.
2. **Home poem link** — wrong path `/poems/details/` in `CLHero.tsx`.
3. **Add KeywordCloud** — parity with song/reflection detail for related keywords.
4. **SoundCloud** — wire real audio URLs.
5. **GlossaryStrip** — should use live `glossary` field terms, not static mock list.
6. **SSG** — builds paths from first 400 poems; ids beyond need on-demand client fetch.

---

*Verified against `CLPoemDetailClient.tsx`, `app/poems/[id]/page.tsx` — June 2026.*
