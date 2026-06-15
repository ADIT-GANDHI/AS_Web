# Glossary (`/glossary`)

**Route:** `/glossary`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/glossary` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\glossary\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Glossary\index.tsx` |
| **Data hook** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\hooks\use-glossary.ts` |
| **Term parser** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Glossary\glossaryTermUtils.ts` |

---

## 2. Component tree

```
app/glossary/page.tsx
├── Header.tsx
├── main
│   └── Glossary/index.tsx
│       ├── Intro paragraph (static GLOSSARY_INTRO)
│       ├── Word count heading
│       ├── A–Z filter bar (All + A–Z, disabled letters empty)
│       └── glossary-list
│           └── article per term
│               ├── glossary-item-title (word + script line)
│               └── glossary-item-meaning (HTML allowed)
└── Footer.tsx
```

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Glossary\Glossary.css` | List, A–Z bar, typography |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Shared count row / filter bar classes |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/glossary` | — | `useGlossary` mount | `status`, `total`, `data[]` |

### Fields consumed in UI

| API field | UI |
|-----------|-----|
| `id` | React key, scroll target |
| `glossary_term` | Title — parsed into `word` + `script` via `parseGlossaryTermLine` |
| `glossary_meaning` | Body (may contain HTML) |

### Fields in API type but not rendered on page

`poetic_images`, `poetic_image_description`, `related_songs`, `related_poems`, `song_names`, `poem_names`, `etymology`, `cultural_context`, `examples`, `meta_*` — available for future rich glossary UX.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Live API | **1 term** (`total: 1`) | **50+** quality terms minimum |
| Page display | **`MOCK_GLOSSARY` (5 terms)** — Figma reference | Real entries passing quality gate |
| Quality gate | term ≤60 chars; meaning ≥30 chars plain | No placeholder junk (`cxvcghkjN`, repeated text) |
| Related links | Not shown | `related_songs`, `related_poems` for cross-navigation |
| Poetic images | Not shown | `poetic_images` URLs for illustrated glossary |

---

## 6. Filters

| Filter | Source | Logic | API vs client |
|--------|--------|-------|---------------|
| A–Z letters | Client | `glossarySortLetter(term)` — first letter of parsed word | **Client only** on loaded dataset |
| All | Button | Shows full `normalizedData` | Client |

Empty letters rendered disabled (`is-empty`).

---

## 7. Keywords / glossary / meaning

| Field | Where shown |
|-------|-------------|
| `glossary_term` | Page title — format `"Agam Nigam (अगम-निगम, agām nigām)"` split by parser |
| `glossary_meaning` | Definition body |
| `meta_keywords` | **Not shown** (SEO only) |
| Cross-page glossary | Poem `glossary` field, song related keywords — separate from this page |

This page is the **canonical glossary listing**; detail pages use related keywords / poem glossary snippets.

---

## 8. Images

| Location | Source |
|----------|--------|
| Glossary page | **No images** in current UI |
| `poetic_images` from API | Unused |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| API error | `MOCK_GLOSSARY` (5 terms: Agam Nigam, Alakh, Amrit, Heli, Sahaj) |
| `< 3` entries pass `isReal` quality check | `MOCK_GLOSSARY` |
| Invalid response format | `MOCK_GLOSSARY` |

`isReal` rejects terms >60 chars or meanings <30 chars after HTML strip.

---

## 10. Known gaps / CMS action items

1. **Populate glossary** — CMS has 1 entry; app shows mocks.
2. **Wire related content** — `related_songs` / `related_poems` not linked in UI.
3. **Poetic images** — API field exists; design may expect illustrations.
4. **Search integration** — glossary terms not indexed in `/Api/nitesh`.
5. **Shared quality rules** — align CMS validation with `isReal` gate to avoid surprise mock fallback.

---

*Verified against `use-glossary.ts`, `Glossary/index.tsx` — June 2026.*
