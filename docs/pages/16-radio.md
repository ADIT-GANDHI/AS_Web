# Radio (`/radio`)

**Route:** `/radio` with optional `?view=playlists`

---

## 1. Route & entry

| Item | Value |
|------|-------|
| **URL** | `/radio`, `/radio?view=playlists` |
| **page.tsx** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\app\radio\page.tsx` |
| **Main component** | `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Radio\CLRadio.tsx` |

**Header entry:** Radio icon links to `/radio` from all pages.

---

## 2. Component tree

```
app/radio/page.tsx
└── Suspense → CLRadio.tsx
    ├── Header.tsx (in radio-header-wrap)
    └── main.radio-page
        ├── radio-layout
        │   ├── radio-stage
        │   │   ├── [view=radio] Player UI
        │   │   │   ├── Now playing mock track
        │   │   │   ├── RADIO_PLAYER_CONTROLS svg
        │   │   │   └── Queue list (MOCK_QUEUE)
        │   │   └── [view=playlists] Playlist sidebar + grid
        │   │       ├── Count (MOCK_PLAYLISTS.length)
        │   │       ├── Filter trigger → CLFilterPanel
        │   │       └── Playlist cards (select → switches to radio view)
        │   └── View toggle (Radio | Playlists)
        └── CLFilterPanel (portal)
            ├── Singer column → FILTER_SINGERS mock
            └── Poet column → FILTER_CURATED ("Curated")
```

---

## 3. CSS files used

| File | Purpose |
|------|---------|
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Radio\CLRadio.css` | Player, playlists, layout |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\components\Songs\CLSongs.css` | Shared page classes |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\CustomStyle.css` | Tokens |
| `d:\Mihir_Avni\Ajab_New\ajabshar-main\styles\Header.css` | Chrome |

**Static assets:** `RADIO_PLAYER_CONTROLS`, `RADIO_THUMB_SAMPLE`, `FILTER_PANEL_SHAPE` from `lib/resolveCmsAssetUrl.ts`

---

## 4. API calls table

| Endpoint | Params | When | Response fields used |
|----------|--------|------|----------------------|
| *(none)* | — | — | **No CMS API integrated** |

Entire page uses in-file constants:

- `MOCK_PLAYLISTS` (20 playlists)
- `MOCK_QUEUE` (4 tracks)
- `FILTER_SINGERS` (5 names)
- `FILTER_CURATED` (`['Curated']`)

---

## 5. What we get today vs what CMS should provide

| Area | What we get today | What CMS should provide |
|------|-------------------|-------------------------|
| Playlists | **Static mock** titles/artists/track counts | `GET /Api/radio_playlists` or similar |
| Tracks / queue | **Static mock** | Stream URLs, SoundCloud/YouTube ids, duration |
| Now playing | UI shell only — **no audio playback** | Audio source + player state API |
| Filters | Mock singer names | Curated tags from CMS |
| Pagination | N/A | If playlist catalog is large |

---

## 6. Filters

| Filter | Source | Logic | API vs client |
|--------|--------|-------|---------------|
| Singer | `FILTER_SINGERS` hardcoded | Toggle selection in `CLFilterPanel` | **Mock only** — does not filter playlist grid |
| Curated | `FILTER_CURATED` | Same | **Mock only** |

`CLFilterPanel` reused from songs stack but **no `availableSingers` from API**.

View switch: `?view=playlists` query synced via `history.replaceState`.

---

## 7. Keywords / glossary / meaning

| Field | Shown? |
|-------|--------|
| Glossary | **No** |
| Track metadata | Mock title + artist strings only |
| `meta_keywords` | N/A |

---

## 8. Images

| Location | Source |
|----------|--------|
| Queue thumbs | `RADIO_THUMB_SAMPLE` — static `public/radio-thumb-sample.png` |
| Player controls | `radio-player-controls.svg` |
| Filter panel shape | `song_filter_opaque.svg` |
| Playlist cards | CSS / typography — no CMS artwork |

---

## 9. Mock fallbacks

| Feature | Behavior |
|---------|----------|
| Entire page | **Always mock** — there is no live data path |
| Playlists | `MOCK_PLAYLISTS` |
| Queue | `MOCK_QUEUE` |
| Audio | No fetch — player is non-functional prototype |

---

## 10. Known gaps / CMS action items

1. **Define CMS radio API** — playlists, tracks, stream URLs, metadata.
2. **Implement audio playback** — Web Audio / SoundCloud / HLS integration.
3. **Wire `CLFilterPanel` to API** — singer/curated filters should affect playlist list.
4. **Connect filters to songs catalog** — optional reuse of `/Api/song_filters` singer list.
5. **Nav highlight** — radio icon turns pink on `/radio` ✅; no count badge needed.
6. **Remove mock constants** once API available — replace `MOCK_PLAYLISTS`, `MOCK_QUEUE`, `FILTER_SINGERS`.

---

*Verified against `CLRadio.tsx` — June 2026.*
