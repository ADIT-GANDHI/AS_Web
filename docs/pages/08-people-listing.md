# People Listing (`/people`)

**Route:** `/people`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/people` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\people\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\People\CLPeople.tsx` |

---

## 2. Component tree

```
app/people/page.tsx
└── CLPeople.tsx
    ├── RepeatingPageBackground (PEOPLE_LISTING_BG — city map watermark)
    ├── Header.tsx
    ├── main.clpe-page
    │   ├── PEOPLE_INTRO
    │   ├── Count ({filtered.length} People)
    │   ├── ListingFilterBar
    │   │   └── CLFilterPanel — Category column only (static categories)
    │   ├── A–Z letter row (All + A–Z)
    │   ├── Horizontal person rows (thumb left, text right)
    │   │   └── Link → /people/{id} + EXPLORE CTA
    │   └── LoadMoreButton
    └── Footer.tsx
```

**Mocks:** `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\People\CLPeopleMocks.ts`

**Filter categories (static):** Poets, Singers, Writers, Artists, Legendary Figures, Other — keyword-matched against `role` string.

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\People\CLPeople.css` | Horizontal cards, city bg |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Listing shell |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/person_list` | `page={n}&limit=50` | Mount + load more | `data[]`, `total` |

**No `/Api/person_filters` endpoint exists.**

### Card mapping (`mapPersonCard`)

| API field | UI |
|-----------|-----|
| `id` | link |
| `person_name_english` / `person_name` | name |
| `occupation_text` / `occupation` | role (uppercase) |
| `thumbnail_excerpt` / `about` / `profile` (HTML stripped, 220 chars) | description |
| `thumbnail_url` | `${AJAB_API_BASE}${thumbnail_url}` or static fallback image |

**Nav count:** `document.documentElement.style.setProperty('--clpe-nav-count', total)` — not Header badge.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Catalog | **183 people** live | `thumbnail_excerpt` or short `about` per person |
| Descriptions | `thumbnail_excerpt`/`about` often **null** — fallback to truncated `profile` HTML ✅ | Dedicated listing excerpt field |
| Categories | **Client-only** keyword map on `occupation_text` | Structured role/tags from CMS |
| Thumbnails | CMS paths when present | Consistent `/images/` or `uploads/` paths |
| Filter API | **Does not exist** | Optional `person_filters` with role taxonomy |

---

## 6. Filters

| Filter | Source | Logic | API vs client |
|--------|--------|-------|---------------|
| A–Z | Local `A_Z` array | Name starts with letter | Client |
| Category | `PEOPLE_CATEGORIES` + `CATEGORY_KEYWORDS` | Match keywords in `role` lowercase; "Other" = no keyword hit | **Client only** |
| Singer slot in filter panel | Repurposed for **Category** selection | `handleFilterSelect` only handles `type === 'Singer'` | Static lists |

`PEOPLE_PER_PAGE = 50` API fetch; `PEOPLE_VISIBLE_STEP = 20` UI slice before next fetch.

---

## 7. Keywords / glossary / meaning

| Field | Shown on listing? |
|-------|-------------------|
| `meta_keywords` | **No** |
| `profile` HTML | Used only as description fallback (stripped) |
| Glossary | **No** on listing |

---

## 8. Images

| Location | Source | Placeholder / onError |
|----------|--------|---------------------|
| Card thumb | `thumbnail_url` + API base | Fallback: `/TN-About-Basavalingaiah-Hiremath.jpg` (static public path) |
| Background | `PEOPLE_LISTING_BG` repeating tile | Static |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| `person_list` page 1 failure (15s timeout) | `MOCK_PEOPLE`, `TOTAL_PEOPLE` |
| Missing thumb | Static TN-About image |
| Missing description | Empty string (profile fallback in mapper) |

---

## 10. Known gaps / CMS action items

1. **Populate `thumbnail_excerpt`** for listing cards — reduces reliance on long `profile` truncation.
2. **Add `person_filters` API** or structured `occupation_tags[]` — replace keyword guessing.
3. **Header nav count** — `--clpe-nav-count` set but not shown in Header.
4. **Category accuracy** — keyword matching on free-text `occupation_text` is approximate.
5. **Legacy `components/People/index.tsx`** — verify deprecation.

---

*Verified against `CLPeople.tsx` — June 2026.*
