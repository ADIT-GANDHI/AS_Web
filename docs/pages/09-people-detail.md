# People Detail (`/people/[id]`)

**Route:** `/people/{id}`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/people/[id]` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\people\[id]\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\People\CLPeopleDetail.tsx` |

---

## 2. Component tree

```
app/people/[id]/page.tsx
└── CLPeopleDetail.tsx
    ├── RepeatingPageBackground (PEOPLE_DETAIL_BG)
    ├── Loader (while loading)
    ├── Header.tsx
    ├── main.clped-page
    │   ├── Back → /people
    │   ├── Title bar (name + role)
    │   ├── Gallery strip (thumbnail array — often single image)
    │   ├── About paragraphs (from profile HTML stripped)
    │   ├── KeywordCloud (related keywords)
    │   ├── Related tabs (ALL, SONGS, POEMS, FILMS)
    │   └── Related link rows
    └── Footer.tsx
```

**Libs:** `mapRelatedResponse.ts`, `parseKeywords.ts`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\People\CLPeople.css` | Detail layout |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongDetails.css` | Related styles |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Root |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/person_list` | `page=1&limit=1` | Mount | `total` → local nav count + CSS var |
| `GET /Api/explore_person` | `person_id={id}` | Mount | Full `data` profile |
| `GET /Api/related` | `people_id={id}` then `person_id={id}` | After load | Related songs/poems/films + keywords |

### Detail mapping (`mapApiItem`)

| API field | UI |
|-----------|-----|
| `id` | identity |
| `person_name_english` / `person_name` | name |
| `occupation_text` / `occupation` | role |
| `thumbnail_url` | gallery[0] |
| `profile` / `about` | about text (HTML → plain paragraphs) |
| `galleryCaption` | empty (not from API today) |

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Profile body | **Live** `profile` HTML (rich) | Same; optional gallery array |
| Gallery | Single thumb only | Multiple `gallery_images[]` |
| Related | Live; tries both `people_id` and `person_id` param | Consistent related param name |
| Latency | `explore_person` 8–12s observed | Faster detail endpoint |
| Error | `MOCK_PERSON_DETAIL` | Explicit not-found like songs |

---

## 6. Filters

**None** on detail. Related tabs filter client-side:

| Tab | Buckets merged |
|-----|----------------|
| ALL | songs + poems + films |
| SONGS / POEMS / FILMS | `related.data[tab]` |

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `related.data.keywords[]` | **KeywordCloud** via `keywordsFromRelatedBucket` |
| `meta_keywords` | **Not shown** |
| Profile terms | Plain bio text only — no inline glossary |

---

## 8. Images

| Location | Source | Placeholder |
|----------|--------|-------------|
| Gallery | `thumbnail_url` only | Empty gallery if no thumb |
| Background | `PEOPLE_DETAIL_BG` tile | Static |

No `onError` handler on gallery img — broken URLs may show broken image icon.

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| No id | `MOCK_PERSON_DETAIL` |
| API error | `MOCK_PERSON_DETAIL` |
| Related failure | `PERSON_RELATED` mock |
| `person` null after load | "Person not found" UI |

---

## 10. Known gaps / CMS action items

1. **Gallery** — only one image from `thumbnail_url`; CMS should send multiple assets + captions.
2. **Related API param** — dual fetch `people_id` / `person_id` suggests CMS inconsistency.
3. **Mock on error** — can show wrong person; prefer not-found state.
4. **Performance** — `explore_person` slow; loader-only feedback.
5. **Speaker map overlap** — same `person_list` used for reflection speakers (183 rows).

---

*Verified against `CLPeopleDetail.tsx` — June 2026.*
