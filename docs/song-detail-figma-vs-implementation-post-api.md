# Song detail — Figma expectation vs implementation (post–API integration)

**Route:** `/songs/details/[id]` (e.g. live data: `/songs/details/229`)  
**UI:** `CLSongDetailsPage.tsx` + `CLSongDetails.css`  
**Figma reference:** node **`361:1406`** — [open in Figma](https://www.figma.com/design/IJwbCASYYrrKaOSRDScXYV/Ajab-Shahar-Designs--New-?node-id=361-1406)

**Companion:** raw bounding boxes and spacing from the same node are in **`song-detail-figma-layout-spec.md`**.

This table compares **what the design file specifies** with **what the Next.js page does after wiring `explore_songs` / related payloads**, including known gaps.

---

## 1. Layout & alignment

| Topic | Figma (`361:1406`) | Implemented (post-API) | Match? |
|-------|--------------------|-------------------------|--------|
| Left edge: **first version card** vs **video** vs **about** | Same column (~**457 px** in file space) | **`.cld-detail-body-align`** wraps header + video + description with **`padding-left: calc(44px + 16px)`** so those blocks line up with the **first card**; slider row stays **flex + in-flow chevrons** (card positions unchanged) | **Yes** (May 2026) |
| Video width | Outer **~1027 × 588**; inner clip **~1007 × 568** | **`max-width: 1027px`**, `width: 100%`, **16:9** aspect | **Close** (iframe vs static vector) |
| About text width | Group **1004 px** wide | **`max-width: 1004px`**, left-aligned in rail | **Yes** |
| Title row vs video (horizontal) | Title text ~**7 px** inset from video left | Title flush to rail left (optional **~7 px** inset not applied) | **Minor delta** |
| Title → video (vertical) | **~8 px** | **`margin-bottom: 8px`** on `.cld-song-header` | **Yes** |
| Video → about | **~43 px** | Video block **`margin-bottom: 43px`** | **Yes** |
| Version card **horizontal gap** | **~82 px** between columns | **`gap: 58px`** in `.cld-versions-slider` | **Delta** |

---

## 2. Typography (token mapping)

| Figma use (examples) | Figma size (metadata) | Code token / rule |
|----------------------|-------------------------|-------------------|
| “4 Song Versions” | 34 px tall title | `--ajab-fs-h3` (28px) + Inter on `.cld-versions-title` | **Delta** (family/size) |
| Version card title | ~24–31 px region | `--ajab-fs-h5` (24px) Lora | **Close** |
| Header “Aarshi Nogor…” | 370×36 box | `--ajab-fs-h3` Lora + sans meta | **Close** |
| About body | ~25 px line, 18 class | `--ajab-fs-body-lg` (20px), **140%** line-height | **Close** |
| Related title | 104×38 | `--ajab-fs-h2` (30px) | **Close** |
| Lyrics column | 26 px line height in list | **`line-height: 1.42`** on `.cld-lyrics` (tightened vs older 1.9) | **Intent** match to updated spec, not pixel-identical to every line in `361:1489`–`361:1508` |

---

## 3. API-driven content vs Figma static copy

| Region | Figma | Live API + UI behaviour |
|--------|-------|-------------------------|
| **Version cards** | Three fixed cards | **`songVersions`** from client; count drives **“N Song Versions”**; links to `/songs/details/{id}` |
| **Header line** | Fixed strings | **`Songtitle_transliteration`**, **`singer`**, **`location`**, **`year`** (multiple CMS keys normalised in `CLSongDetailsPage`) |
| **YouTube** | Static poster area | **`youtube_video_id` / `youtubeVideoId`** → `LiteYouTubeEmbed`; placeholder if missing |
| **About** | Three lines + “…more” | HTML from **`about` / `meta_description` / …`** flattened with **`htmlToPlainText`**, clamp **~220 chars** + pink **more** |
| **Lyrics** | Fixed Devanagari / translit column | **`firstLyricsField`** by **`language`** + **`script`** (`songLyrics`, `songLyricsTranslated`, `songLyricsOriginal`, `songLyricsNotes`, …). If CMS sends one field only, **all script buttons may show the same text** |
| **Song notes** | Rich “Song Notes” card (`361:1575`) | **Overlay** + `WavyPaperPopup` inline asset; text from **`songnotes` / `song_notes` / `songNotes` / …**; **placeholder** if empty |
| **Related** | Fixed rows + tabs | **`related.data`** + **`counts`**; tab labels **ALL / SONGS / …**; descriptions with **4-line clamp** + pink **read more** where long |
| **Glossary strip** | Two rows of terms (`361:1570`–`361:1571`) | Still **mock lines** `GLOSSARY_TERMS_LINE_*` in `CLdetailMocks.ts` — **not from API** |

---

## 4. Behavioural / UX differences

| Item | Figma | Implementation |
|------|-------|----------------|
| Script buttons **अ / ā / a** | Visual states in comp | Toggle **`script`** + **`onLanguageChange('hindi' \| 'english')`** for refetch; **active** ring on `.cld-lang-btn.active` |
| **NOTES** | Static card position in comp | **Modal-style overlay** (centred), toggle on button; differs from pinned offset in older comp notes |
| **Slider** | In-flow chevrons + horizontal scroll | **Flex row** unchanged; no absolute chevron positioning |

---

## 5. Outstanding / optional follow-ups

1. **Video → about** vertical gap: **`margin-bottom`** on `.cld-video-wrap` is **43px** to match `361:1462` spacing.  
2. **Version slider `gap`**: consider **~80px** card-to-card vs current **58px** if pixel parity matters.  
3. **Header title 7px inset** from video: add **`padding-left: 7px`** on `.cld-song-header-title` if design sign-off requires it.  
4. **Glossary row**: replace mocks with CMS when an API field exists.  
5. **Lyrics**: confirm CMS field map per environment (Hindi vs transliteration vs English) so script toggles always change visible copy.

---

## 6. References

- Layout numbers: **`docs/song-detail-figma-layout-spec.md`** (from `get_metadata` on `361:1406`).  
- API field naming: **`docs/songs-header-detail-api-comparison.html`**, **`docs/API_REFERENCE.md`**.  
- Figma file index: **`docs/FIGMA.md`**.

---

## 7. Change log

| Date | Notes |
|------|--------|
| 2026-05-14 | First version after API integration pass: rail alignment, video max-width vs Figma, API vs static comparison table. |
