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

/** Original Songs filter parda export (`song_filter_opaque.svg` viewBox). */
export const FILTER_PARDA_WIDTH_PX = 422;
export const FILTER_PARDA_HEIGHT_PX = 1424;

/**
 * PDF: chip footer sits above empty band before the parda artwork ends (~10% of parda).
 * The parda itself does not grow with page length or “load more”.
 */
export const FILTER_PARDA_BOTTOM_INSET_PX = 150;
