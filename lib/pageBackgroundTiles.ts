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

export const PEOPLE_LISTING_BG: PageBackgroundTile = {
  url: tileUrl('/people_mainpage.png'),
  tileWidth: 1921,
  tileHeight: 1899,
  fallbackColor: '#f7f6f4',
};

export const PEOPLE_DETAIL_BG: PageBackgroundTile = {
  url: '/people_detail.png',
  tileWidth: 1921,
  tileHeight: 3870,
  fallbackColor: '#ffffff',
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
