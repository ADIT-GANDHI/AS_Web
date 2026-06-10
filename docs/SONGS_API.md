# Songs module — API notes (short)

**Full catalogue of endpoints, payloads, and errors:** see **`docs/API_REFERENCE.md`** (intensive reference for the whole app’s CMS usage).

## Songs-specific routes (summary)

| Endpoint | Role on the site |
|----------|------------------|
| `GET /Api/list` | `/songs` grid, pagination, filters; `generateStaticParams` for `/songs/details/[id]`. |
| `GET /Api/song_filters` | Filter drawer data on the songs listing page. |
| `GET /Api/explore_songs` | `/songs/details/[id]` main song payload. |
| `GET /Api/song_versions` | Intended for the “versions” carousel on song detail — **often HTTP 500 on staging**; the app falls back to **showing the current song only** in that strip when the API returns no rows. |
| `GET /Api/related?song_id=` | Related block on song detail. |

## Listing “step 1” (9 cards + inert SEE MORE)

**Deferred** — the songs listing was restored to the previous **infinite scroll + limit 10** behaviour to avoid regressions until you revisit that workstream.

---

*For env / bases, see **`docs/CMS_API.md`**. For every `/Api/...` route the repo calls, see **`docs/API_REFERENCE.md`**.*
