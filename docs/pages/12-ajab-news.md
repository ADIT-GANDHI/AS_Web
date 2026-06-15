# Ajab News (`/ajab-news`)

**Route:** `/ajab-news`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/ajab-news` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\ajab-news\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\ajab-news\CLNews.tsx` (`CLAjabnews`) |
| **Page shell** | `FullBackground`, Header, Footer, `ajab-news-logo.svg` |
| **Home popup** | Same news API in `CLHero.tsx` + `CLContentSliderModal.tsx` |

**Legacy:** `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\ajab-news\News.tsx` (non-CL)

---

## 2. Component tree

```
app/ajab-news/page.tsx
├── FullBackground
├── Header.tsx
├── news-inner-container
│   ├── ajab-news logo (Image)
│   └── CLAjabnews (CLNews.tsx)
│       ├── buildSections() → Section[]
│       ├── visibleSections (first 3 unless "See more")
│       └── per-section renderer:
│           ├── VideoSection (category video)
│           ├── ThumbnailSection (idx >= 2)
│           └── FullWidthSection (idx 0–1; idx 1 may use ImageSlider)
│               ├── ToggleText (...more / See less)
│               └── ImageSlider (multiple images)
└── Footer.tsx
```

**Helpers in CLNews.tsx:** `stripHtml`, `toImageUrl`, `filterNewsForPublicSite` from `lib/cmsNews.ts`

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\ajab-news\CLNews.css` | Layout sections, slider, typography |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Header.css` / `Footer.css` | Chrome |
| `react-lite-youtube-embed/dist/LiteYouTubeEmbed.css` | Video sections |
| `fullBackground` component styles | Page backdrop |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/news` | — | `CLAjabnews` mount | `data[]` news rows |
| `GET /Api/news` | — | `CLHero` mount | `popup_items` for home carousel only |

### News row fields

| Field | Use |
|-------|-----|
| `id` | Section id prefix |
| `news_title`, `news_second_title` | Fallback titles |
| `ajab_news_content` | Fallback body (HTML stripped) |
| `published` | Row-level publish (popup filter uses item-level) |
| `popup_items[]` | Primary content driver |

### Popup item fields

| Field | Use |
|-------|-----|
| `category` | `single` \| `multiple` \| `video` |
| `title`, `second_title`, `content` | Headings + body |
| `image`, `images[]` | Imagery |
| `video_url` | YouTube id |
| `image_caption` | Caption under image |
| `published`, `show_on_home` | Filtering (home only for latter) |

**Initial state:** `FIGMA_NEWS` static data in component state; API replaces when `buildSections(raw)` returns length > 0.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| News page content | **Hybrid:** Figma/static seed → overwritten by API when valid | Clean published news only |
| Valid CMS rows | ids 28–29 with real `popup_items`; duplicates (27≈28) | Dedupe; remove test ids 9–30 junk |
| Images | Some CMS uploads; many missing | Complete image assets per popup |
| Layout indices | Section 0 full-width, 1 slider, 2+ thumbnail | Stable ordering via `sequence_order` |
| Home popup | Live filtered popups with `show_on_home` | Curated home slides only |
| Optional detail | `GET /Api/news?news_id=` documented for legacy `News.tsx` | Single-news endpoint if needed |

---

## 6. Filters

| Filter | Source | Logic |
|--------|--------|-------|
| Public site | `filterNewsForPublicSite` | Published popups; categories single/multiple/video only |
| Home popup | `filterHomeNewsPopups` | + `show_on_home` flag |
| Junk rows | Implicit — empty `popup_items` excluded | CMS should unpublish test entries |

No user-facing filter UI on news page.

---

## 7. Keywords / glossary / meaning

| Field | Shown? |
|-------|--------|
| `meta_keywords` | **No** |
| News HTML content | **Yes** — `ToggleText` plain body |
| Glossary | **No** |

---

## 8. Images

| Location | Source | Placeholder |
|----------|--------|-------------|
| API images | `toImageUrl` → `AJAB_API_BASE` or `withAppBasePath` | Empty array → text-only section |
| FIGMA_NEWS fallback | `public/news-assets/*.png` (local crops) | Used until API provides valid sections |
| Video | YouTube embed | No image when `videoId` set |
| Slider | Multiple `images[]` | Same image repeated in mock slider |

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| Initial render | `buildSections(FIGMA_NEWS)` — static Figma-aligned articles |
| API error or empty valid sections | Keeps FIGMA_NEWS-derived sections |
| Home popup API error | `CMS_IMAGE_PLACEHOLDER` slide in `CLHero` |

`FIGMA_NEWS` documented in file header as design reference until CMS images complete.

---

## 10. Known gaps / CMS action items

1. **Remove junk news rows** (test titles, empty popups) — they affect section ordering when API enabled.
2. **Upload images** for all `single`/`multiple` popups — page was temporarily FIGMA-locked for layout fidelity.
3. **Deduplicate** news id 27 vs 28.
4. **Video category** — ensure `video_url` YouTube links valid.
5. **Re-enable pure API layout** — once CMS data clean, remove dependence on `FIGMA_NEWS` seed.
6. **`news_id` detail endpoint** — not used by CLNews full page (list flatten only).

---

*Verified against `CLNews.tsx`, `cmsNews.ts`, `app/ajab-news/page.tsx` — June 2026.*
