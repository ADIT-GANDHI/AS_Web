# Ajab Shahar — Per-page documentation index

**Generated:** 10 June 2026  
**CMS base:** `https://ajab.designanddevelopment.in/admin` (override via `NEXT_PUBLIC_AJAB_API_BASE`)  
**Frontend:** Next.js 15 App Router — active UI uses `CL*` components unless noted as legacy.

Each file below is a **standalone** reference for one route (or global chrome). Every doc includes:

- Route entry and component tree
- API calls (URL, params, when called)
- **Fields we consume today** vs **what CMS should provide**
- Filters, keywords/glossary, images
- Mock fallbacks and known gaps

---

## Global chrome

| Doc | Route / scope |
|-----|----------------|
| [00-global-header-footer.md](./00-global-header-footer.md) | Header, Footer, search overlay, nav counts |

---

## Content modules

| Doc | Route |
|-----|-------|
| [01-home.md](./01-home.md) | `/` |
| [02-songs-listing.md](./02-songs-listing.md) | `/songs` |
| [03-song-detail.md](./03-song-detail.md) | `/songs/details/[id]` |
| [04-poems-listing.md](./04-poems-listing.md) | `/poems` |
| [05-poem-detail.md](./05-poem-detail.md) | `/poems/[id]` |
| [06-reflections-listing.md](./06-reflections-listing.md) | `/reflections` |
| [07-reflection-detail.md](./07-reflection-detail.md) | `/reflections/details/[id]` |
| [08-people-listing.md](./08-people-listing.md) | `/people` |
| [09-people-detail.md](./09-people-detail.md) | `/people/[id]` |
| [10-films-listing.md](./10-films-listing.md) | `/films` |
| [11-film-detail.md](./11-film-detail.md) | `/films/details/[id]` |
| [12-ajab-news.md](./12-ajab-news.md) | `/ajab-news` |
| [13-about.md](./13-about.md) | `/about` |
| [14-glossary.md](./14-glossary.md) | `/glossary` |
| [15-search.md](./15-search.md) | `/searche` |
| [16-radio.md](./16-radio.md) | `/radio` |

---

## Cross-cutting references

| Doc | Purpose |
|-----|---------|
| [../API_REFERENCE.md](../API_REFERENCE.md) | Master endpoint table + error handling |
| [../BACKEND_API_ISSUES.md](../BACKEND_API_ISSUES.md) | CMS team handoff — open backend items |
| [../PAGE_API_AUDIT.md](../PAGE_API_AUDIT.md) | Earlier audit (some rows superseded by these per-page docs) |

---

## Keyword / SEO policy (all pages)

| Field | Purpose | Shown in UI? |
|-------|---------|--------------|
| `meta_keywords` | SEO only | **No** — removed from all visible UI |
| `related.data.keywords` | Glossary word links | **Yes** — KeywordCloud on song/people/reflection detail |
| `related_keywords` (reflection list) | Theme filter ids | **Yes** — filter matching only |
| `glossary` (poem) | Theme filter + popups | **Yes** |
| `song_filters.them[].word_transliteration` | Songs theme filter | **Yes** (when API populated) |

---

## Regenerate API probe

```bash
node scripts/probe-cms-apis.mjs
# writes scripts/probe-cms-apis-output.json
```
