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
