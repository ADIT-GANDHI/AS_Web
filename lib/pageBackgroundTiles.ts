/** Repeat-y tile configs — dimensions must match `scripts/build-page-backgrounds.mjs`. */

import { withAppBasePath } from '@/lib/resolveCmsAssetUrl';

function tileUrl(path: string): string {
  return withAppBasePath(path);
}

export type PageBackgroundTile = {
  url: string;
  tileWidth: number;
  tileHeight: number;
  fallbackColor: string;
};

/** Mirrored 3900px module × 2 — built by `scripts/build-songs-listing-bg.mjs`. */
export const SONGS_LISTING_BG: PageBackgroundTile = {
  url: tileUrl('/songs-assets/songs-bg-composite-mirror.png'),
  tileWidth: 1440,
  tileHeight: 7800,
  fallbackColor: '#ede8df',
};

/** @deprecated Single-plate listing bg — kept for revert. Prefer dual-layer tiles below. */
export const PEOPLE_LISTING_BG: PageBackgroundTile = {
  url: tileUrl('/people_mainpage.png'),
  tileWidth: 1921,
  tileHeight: 1899,
  fallbackColor: '#f7f6f4',
};

/**
 * People listing dual-layer (built by `scripts/build-people-listing-dual-bg.mjs`).
 * Texture is full-bleed; middle white is centered at art ratio 1483/1922.
 */
export const PEOPLE_LISTING_BG_TEXTURE: PageBackgroundTile = {
  url: tileUrl('/people_newbg-tile.png'),
  tileWidth: 1922,
  tileHeight: 1898,
  fallbackColor: '#f7f6f4',
};

export const PEOPLE_LISTING_MIDDLE_WHITE: PageBackgroundTile = {
  url: tileUrl('/people_new_middle_white_layer-tile.png'),
  tileWidth: 1483,
  tileHeight: 3358,
  fallbackColor: 'transparent',
};

/** Design artboard ratio: middle white width ÷ texture width. */
export const PEOPLE_LISTING_MIDDLE_WIDTH_RATIO = 1483 / 1922;

/** @deprecated Single-plate detail bg — kept for revert. Prefer dual-layer tiles below. */
export const PEOPLE_DETAIL_BG: PageBackgroundTile = {
  url: '/people_detail.png',
  tileWidth: 1921,
  tileHeight: 3870,
  fallbackColor: '#ffffff',
};

/**
 * People detail dual-layer (same middle white as listing; texture from people_detailbg.png).
 * Built by `scripts/build-people-listing-dual-bg.mjs`.
 */
export const PEOPLE_DETAIL_BG_TEXTURE: PageBackgroundTile = {
  url: tileUrl('/people_detailbg-tile.png'),
  tileWidth: 1922,
  tileHeight: 1898,
  fallbackColor: '#f7f6f4',
};

export const REFLECTIONS_LISTING_BG: PageBackgroundTile = {
  url: tileUrl('/reflections_mainpage.png'),
  tileWidth: 1920,
  tileHeight: 4170,
  fallbackColor: '#dedede',
};

export const REFLECTIONS_DETAIL_BG: PageBackgroundTile = {
  url: tileUrl('/reflections_detail.png'),
  tileWidth: 1920,
  tileHeight: 4822,
  fallbackColor: '#dedede',
};

/** Search results — mandala plate cropped to matched edges (9px top / 2px bottom, no blend band). */
export const SEARCH_RESULTS_BG: PageBackgroundTile = {
  url: tileUrl('/news-assets/ajab-news-bg-tile.png'),
  tileWidth: 1230,
  tileHeight: 1843,
  fallbackColor: '#f5f5f5',
};

export const FILMS_LISTING_BG: PageBackgroundTile = {
  url: tileUrl('/film-page-bg.png'),
  tileWidth: 1920,
  tileHeight: 3230,
  fallbackColor: '#ffffff',
};

export const FILMS_DETAIL_BG: PageBackgroundTile = {
  url: tileUrl('/film_detail.png'),
  tileWidth: 1926,
  tileHeight: 3942,
  fallbackColor: '#ffffff',
};

/** Left sidebar strip only — safe to repeat-y (no baked-in bubbles/cards). */
export const RADIO_PLAYLIST_SIDEBAR_BG: PageBackgroundTile = {
  url: tileUrl('/radio-playlist-sidebar-tile.png'),
  tileWidth: 508,
  tileHeight: 1081,
  fallbackColor: '#f8f6f2',
};

/** Glossary listing dual-layer texture + shared middle-white parda. */
export const GLOSSARY_BG_TEXTURE: PageBackgroundTile = {
  url: tileUrl('/glossary_bg.svg'),
  tileWidth: 1920,
  tileHeight: 1917,
  fallbackColor: '#f8f6f2',
};
