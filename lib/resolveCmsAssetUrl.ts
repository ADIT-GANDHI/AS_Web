import { AJAB_API_BASE } from '@/lib/ajabEnv';

const APP_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** Prefix root-relative app assets (public/) for production basePath e.g. /new. */
export function withAppBasePath(path: string): string {
  if (!APP_BASE || !path.startsWith('/') || path.startsWith(APP_BASE)) return path;
  return `${APP_BASE}${path}`;
}

/** Shown when CMS omits a thumb or offline mocks use empty strings. */
export const CMS_IMAGE_PLACEHOLDER = withAppBasePath('/placeholder.svg');

/**
 * Shared white filter parda (Songs / Poems / Reflections / People / Radio).
 *
 * PREV opaque vector (keep for revert): `/songs-assets/song_filter_opaque.svg`
 * PREV Songs white vector: `/songs-assets/song_filter_white_vector.svg`
 *
 * 16 Nov — updated AI (`White_parda_asset_480x1660_updated.ai`), designer soft fringe as-is:
 *   Master @300%: `song_filter_white_480x1660_updated.png`
 *     (white body opaque only; soft fringe NOT boosted; no CSS drop-shadow)
 *   Untouched soft export: `song_filter_white_480x1660_updated_semitransparent-backup.png`
 *   Drawer @2x used in UI: `song_filter_white_parda_drawer@2x.png`
 */
export const FILTER_PANEL_SHAPE = withAppBasePath(
  '/songs-assets/song_filter_white_parda_drawer@2x.png'
);

/** Alias — same asset as FILTER_PANEL_SHAPE (kept so Songs call sites stay readable). */
export const SONGS_FILTER_WHITE_PARDA = FILTER_PANEL_SHAPE;

/** Radio page static assets (module-level paths avoid /new + /asset concat in JS bundles). */
export const RADIO_PLAYER_CONTROLS = withAppBasePath('/radio-player-controls.svg');
export const RADIO_THUMB_SAMPLE = withAppBasePath('/radio-thumb-sample.png');

/** Fullscreen route loader — animated GIF in `public/spinner.gif`. */
export const LOADER_SPINNER = withAppBasePath('/spinner.gif');

/** Paths that live on the CMS host (not on the Next `public/` origin). */
const CMS_RELATIVE_PREFIXES = [/^\/images\//i, /^\/uploads\//i, /^\/media\//i, /^\/files\//i];

/**
 * Build a browser-usable image URL for list cards, detail cards, and related thumbs.
 * - Absolute `http(s)` URLs are left as-is.
 * - `/images/…`, `/uploads/…`, etc. are prefixed with `AJAB_API_BASE` (CMS-served).
 * - Other root-relative paths stay on the app origin (e.g. `/placeholder.svg`).
 * - Bare filenames are treated as CMS-relative and joined to `AJAB_API_BASE`.
 */
export function resolveCmsAssetUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return CMS_IMAGE_PLACEHOLDER;
  const t = path.trim();
  if (!t) return CMS_IMAGE_PLACEHOLDER;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/')) {
    if (CMS_RELATIVE_PREFIXES.some((re) => re.test(t))) {
      return `${AJAB_API_BASE}${t}`;
    }
    return withAppBasePath(t);
  }
  return `${AJAB_API_BASE}/${t.replace(/^\/+/, '')}`;
}
