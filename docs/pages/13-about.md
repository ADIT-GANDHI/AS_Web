# About (`/about`)

**Route:** `/about` with query `?tab=ajab|kabir` and optional `?menu=`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/about`, `/about?tab=kabir`, `/about?menu={key}` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\about\page.tsx` |
| **Client router** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\about\AboutClient.tsx` |
| **Presentation** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\About\index.tsx` |
| **Data hook** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\hooks\use-about.ts` |

---

## 2. Component tree

```
app/about/page.tsx
├── Header.tsx
├── main.about-page
│   └── Suspense → AboutClient.tsx
│       └── About/index.tsx
│           ├── Logo (ajab or kabir SVG by activeTab)
│           ├── Brand switch button (Kabir Project ↔ Ajab Shahar)
│           ├── Menu tabs (intro, team, films, books, shabadshaala, …)
│           └── about-content-list
│               └── article per entry
│                   ├── type_label (optional)
│                   └── visual_content (dangerouslySetInnerHTML)
└── Footer.tsx
```

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\About\About.css` | Logo, tabs, content typography |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Page shell |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| `GET /Api/about` | — | `useAbout` mount | `data.ajab_shahar.menus`, `data.kabir_project.menus` |

### Menu structure

Each tab (`ajab` | `kabir`) has a **menu map**: `Record<menuKey, AboutEntry[]>`.

| Entry field | UI |
|-------------|-----|
| `id` | React key |
| `type_label` | Section heading above block |
| `visual_content` | HTML body (`dangerouslySetInnerHTML`) |
| `ajab_type` / `kabir_type` | Normalized metadata (mostly unused in render) |

**Quality gate:** `isMenuMapMeaningful` — every entry must have ≥20 chars plain text after HTML strip; else **full tab uses mock**.

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Ajab Shahar tab | API menus exist but **placeholder** (`copyrights` ~12 chars) → **MOCK_ABOUT_AJAB** | Real copy for all menu keys (intro, team, films, books, shabad shaala, copyrights) |
| Kabir Project tab | Several menus ~5 chars → **MOCK_ABOUT_KABIR** | Full content per menu; `team` is long but one bad entry fails whole tab |
| API offline | Mocks render Figma text | — |
| Brand switch | Client router `?tab=` | No extra API |
| Menu deep link | `?menu=` selects tab if key exists | Stable menu key slugs |

---

## 6. Filters

**None.** User selects brand tab and menu tab only — client state from API menu keys.

---

## 7. Keywords / glossary / meaning

| Field | Shown? |
|-------|--------|
| `meta_keywords` | **No** |
| `visual_content` HTML | **Yes** — full rich text |
| Glossary | **No** |

---

## 8. Images

| Location | Source |
|----------|--------|
| Brand logos | `public/logo.svg`, `public/k_logo.svg` — static |
| Inline images in HTML | Embedded in `visual_content` from CMS if present |

No dedicated thumb pipeline; relies on HTML `<img>` tags in CMS content.

---

## 9. Mock fallbacks

| Trigger | Fallback |
|---------|----------|
| API fetch error | `MOCK_ABOUT_AJAB`, `MOCK_ABOUT_KABIR` |
| `isMenuMapMeaningful` false for tab | Same mocks per tab |
| Empty menu map | "No content available" |

Mocks defined in `use-about.ts` with Figma-aligned HTML paragraphs.

---

## 10. Known gaps / CMS action items

1. **Replace placeholder strings** (`dgfdgfhgjhkj`, `asd`, `zxc`) in all menu entries — one bad entry fails entire tab.
2. **Per-entry quality gate** — consider falling back per-menu instead of whole-tab mock.
3. **Menu key normalization** — API uses keys like `translit guide`, `shabad shaala` — align with `?menu=` deep links.
4. **No images API** — long-term content may need asset management in CMS HTML.
5. **Suspense** — AboutClient requires `useSearchParams` wrapped in Suspense on page.

---

*Verified against `use-about.ts`, `About/index.tsx`, `AboutClient.tsx` — June 2026.*
