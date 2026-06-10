# Song detail — versions carousel revert baseline

**Pass date:** 2026-05-19 (PDF Page 3 alignment — compact carousel)

To revert the carousel / top-spacing pass, restore these values in `CLSongDetails.css`.

## Page + versions section (pre-pass)

```css
.cld-page {
  padding: 22px 50px 0;
  /* no --cld-version-nav-w / --cld-version-nav-gap */
}

.cld-detail-body-align {
  padding-left: calc(44px + 16px);
}

.cld-versions-section {
  margin: 22px auto 40px;
  max-width: 1100px;
}

.cld-versions-heading {
  margin-bottom: 20px;
}

.cld-versions-title {
  margin: 0 0 12px;
  padding: 5px 0 0;
}

.cld-versions-slider-wrap {
  gap: 16px;
}

.cld-slider-nav {
  width: 44px;
  height: 64px;
}

.cld-slider-nav svg {
  width: 36px;
  height: 36px;
}

.cld-versions-slider {
  gap: 66px;
  padding: 8px 0 48px;
}

.cld-version-card {
  --wc-width: var(--ajab-card-w);
  --wc-thumb-h: 156px;
  flex: 0 0 var(--ajab-card-w);
}

.cld-version-card-body {
  padding: 12px 14px 14px;
}

.cld-song-header {
  margin: 60px 0 24px;
}
```

## Related + glossary (pre-pass)

```css
.cld-related {
  margin: 64px 0 60px;
}

.cld-related-list {
  gap: 28px;
}

.cl-songs-page-root:has(.cld-page) .gs-strip {
  margin-bottom: 120px;
  /* no max-width */
}
```

## JS scroll step (pre-pass)

`CLSongDetailsPage.tsx` — `scrollVersions` used fixed `344` px.

---

## Mid-body structure pass (2026-05-19) — lyrics stanza spacing NOT changed

Only outer block margins + column alignment. **Do not change** `.cld-lyrics-stanza` or lyrics `line-height` / `font-size`.

```css
.cld-description { margin: 0 0 64px; }  /* now 40px */
.cld-lang-toggle { margin: 64px auto 72px; }  /* now 40px auto 44px */
.cld-song-title-block { margin: 0 auto 48px; }  /* now 36px bottom */
.cld-lyrics { margin: 0 auto 48px; }  /* now 36px bottom only — stanza rules unchanged */
.cld-notes-glossary-row { margin: 48px auto 56px; }  /* now 36px auto 40px */
.cld-related-title { margin-bottom: 14px; }  /* now 10px */
.cld-related-tabs { margin-bottom: 28px; }  /* now 20px */
.cld-related-item { gap: 32px; }  /* now 24px */
.cl-songs-page-root:has(.cld-page) .gs-strip {
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 120px;
  /* no cld-glossary-align wrapper */
}
```

`CLSongDetailsPage.tsx` — GlossaryStrip was direct child of `.cld-page`; revert by removing `.cld-detail-body-align.cld-glossary-align` wrapper.

