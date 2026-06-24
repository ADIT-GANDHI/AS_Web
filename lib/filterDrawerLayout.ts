/** Shared layout tokens for Songs / Poems / Radio filter drawers (portaled to body). */

/** Wavy panel bg spans full viewport; header (z-index 10000) paints on top. */
export const FILTER_DRAWER_TOP = '0';
export const FILTER_DRAWER_HEIGHT = '100dvh';

/** Backdrop + interactive list chrome start below sticky header. */
export const FILTER_DRAWER_BACKDROP_TOP = 'var(--ajab-header-height, 191px)';
export const FILTER_DRAWER_CONTENT_INSET_TOP = 'var(--ajab-header-height, 191px)';

/** Below header (10000) / gradient-bg (10001), above page content. */
export const FILTER_DRAWER_Z_BACKDROP = 9998;
export const FILTER_DRAWER_Z_PANEL = 9999;

/** Wavy filter panel artwork — slight transparency so page texture shows through. */
export const FILTER_DRAWER_BG_OPACITY = 0.92;

/** Selected chip grid in drawer footer — max visible rows before older chips scroll up. */
export const FILTER_DRAWER_SELECTION_MAX_ROWS = 2;
/** Chip row height (17px type × 1.3 line-height + 10px vertical padding). */
export const FILTER_DRAWER_SELECTION_ROW_PX = 32;
