/** Shared layout tokens for Songs / Poems / Radio filter drawers (portaled to body). */

/** Wavy panel bg starts at viewport top; header (z-index 10000) paints on top. */
export const FILTER_DRAWER_TOP = '0';

/** Fallback when footer is not yet measurable — full viewport. */
export const FILTER_DRAWER_HEIGHT = '100dvh';

/** Backdrop + interactive list chrome start below sticky header. */
export const FILTER_DRAWER_BACKDROP_TOP = 'var(--ajab-header-height, 191px)';
export const FILTER_DRAWER_CONTENT_INSET_TOP = 'var(--ajab-header-height, 191px)';

/** Below header (10000) / gradient-bg (10001), above page content. */
export const FILTER_DRAWER_Z_BACKDROP = 9998;
export const FILTER_DRAWER_Z_PANEL = 9999;

/** Wavy filter panel artwork opacity (1 = fully opaque). Songs parda can override to 0.95. */
export const FILTER_DRAWER_BG_OPACITY = 1;
/** Songs listing parda — client 13 Oct: ~95% for readability over page. */
export const FILTER_DRAWER_SONGS_BG_OPACITY = 0.95;

/** Songs: scrollbar `right` inset. Live site is 18px, then +3, +5, +5, and +3 more (Theme still clears the ×). */
export const FILTER_DRAWER_SONGS_SCROLL_RIGHT_PX = 34;
/** Songs scrollbar track width — keep in sync with CLFilterPanel track. */
export const FILTER_DRAWER_SONGS_SCROLL_TRACK_PX = 6;

/**
 * Shared default for Reflections / People / Poems / Radio.
 * Songs listing overrides to 360 via `drawerWidth`. The white parda art is fitted into that width.
 */
export const FILTER_DRAWER_DEFAULT_WIDTH = 380;

/** Selected chip grid in drawer footer — max visible rows before older chips scroll up. */
export const FILTER_DRAWER_SELECTION_MAX_ROWS = 2;
/** Chip row height (17px type × 1.3 line-height + 10px vertical padding). */
export const FILTER_DRAWER_SELECTION_ROW_PX = 32;

/**
 * How many px of the viewport the site footer currently covers from the bottom.
 * Used to pad filter-list chrome so chips / CLEAR ALL stay above the wave,
 * while the parda artwork itself can still fill the full viewport height.
 */
export function measureFilterDrawerFooterOverlapPx(): number {
  if (typeof window === 'undefined') return 0;
  const footer = document.querySelector('footer.footer-bg, footer');
  const vh = window.innerHeight;
  if (!footer) return 0;
  const top = Math.round(footer.getBoundingClientRect().top);
  return Math.max(0, vh - Math.min(vh, top));
}

/**
 * @deprecated Prefer full-viewport parda + footer overlap padding.
 * Kept for any callers that still need the old “cut at footer top” height.
 */
export function measureFilterDrawerBottomPx(): number {
  if (typeof window === 'undefined') return 0;
  const vh = window.innerHeight;
  const overlap = measureFilterDrawerFooterOverlapPx();
  return Math.max(0, vh - overlap);
}
