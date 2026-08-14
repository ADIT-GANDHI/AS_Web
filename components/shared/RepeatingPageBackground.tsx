'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { PageBackgroundTile } from '@/lib/pageBackgroundTiles';
import {
  measurePageBackgroundHeight,
  resolvePageFooter,
} from '@/lib/measurePageBackgroundHeight';
import './RepeatingPageBackground.css';

const TILE_OVERLAP_PX = 4;
const SHEET_SHIFT_PX = 6;

export type RepeatingPageBackgroundOverlay = {
  tile: PageBackgroundTile;
  /** Overlay width as a fraction of shell width (e.g. 1483/1922). */
  widthRatio: number;
  /** Translucent overlays should use a single sheet (default true). */
  singleSheet?: boolean;
};

export type RepeatingPageBackgroundProps = {
  containerRef: RefObject<HTMLElement | null>;
  tile: PageBackgroundTile;
  /** Optional centered layer on top of the full-bleed tile (People middle white). */
  overlay?: RepeatingPageBackgroundOverlay;
  /** Defer heavy assets until window load (Songs composite ~7 MB). */
  deferUntilLoad?: boolean;
  /** Extra px added to scaled tile height (default 4). */
  tileOverlapPx?: number;
  /** Vertical offset for the second sheet (default 6). */
  sheetShiftPx?: number;
  /** When true, render one repeat-y sheet only (e.g. search mandala). */
  singleSheet?: boolean;
};

/**
 * Full-height repeat-y background (People / Reflections / Films / Songs listing).
 * Dual stacked sheets + slight tile overlap hide browser repeat gaps.
 */
export default function RepeatingPageBackground({
  containerRef,
  tile,
  overlay,
  deferUntilLoad = false,
  tileOverlapPx = TILE_OVERLAP_PX,
  sheetShiftPx = SHEET_SHIFT_PX,
  singleSheet = false,
}: RepeatingPageBackgroundProps) {
  const [bgHeight, setBgHeight] = useState(0);
  const [tileH, setTileH] = useState(0);
  const [overlayWidth, setOverlayWidth] = useState(0);
  const [overlayTileH, setOverlayTileH] = useState(0);
  const [showArt, setShowArt] = useState(!deferUntilLoad);

  const measure = useCallback(() => {
    const shell = containerRef.current;
    if (!shell) return;
    setBgHeight(measurePageBackgroundHeight(shell));
    const w = shell.clientWidth;
    const scaled = (Math.min(w, tile.tileWidth) * tile.tileHeight) / tile.tileWidth;
    setTileH(Math.max(1, Math.ceil(scaled) + tileOverlapPx));

    if (overlay && overlay.widthRatio > 0) {
      const ow = Math.max(1, Math.round(w * overlay.widthRatio));
      const oScaled =
        (Math.min(ow, overlay.tile.tileWidth) * overlay.tile.tileHeight) /
        overlay.tile.tileWidth;
      setOverlayWidth(ow);
      setOverlayTileH(Math.max(1, Math.ceil(oScaled) + tileOverlapPx));
    } else {
      setOverlayWidth(0);
      setOverlayTileH(0);
    }
  }, [
    containerRef,
    tile.tileWidth,
    tile.tileHeight,
    tileOverlapPx,
    overlay,
  ]);

  useEffect(() => {
    if (!deferUntilLoad) return;
    const reveal = () => setShowArt(true);
    if (document.readyState === 'complete') reveal();
    else window.addEventListener('load', reveal, { once: true });
    return () => window.removeEventListener('load', reveal);
  }, [deferUntilLoad]);

  useEffect(() => {
    const shell = containerRef.current;
    if (!shell) return;

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(shell);
    const main = shell.querySelector('main');
    if (main instanceof HTMLElement) ro.observe(main);

    const footer = resolvePageFooter(shell);
    if (footer) ro.observe(footer);

    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, measure]);

  if (bgHeight <= 0 || tileH <= 0) return null;

  const sheetStyle = {
    backgroundImage: `url(${tile.url})`,
    backgroundRepeat: 'repeat-y' as const,
    backgroundPosition: 'left top',
    backgroundSize: `100% ${tileH}px`,
  };

  const overlaySingle = overlay?.singleSheet !== false;
  const overlaySheetStyle =
    overlay && overlayWidth > 0 && overlayTileH > 0
      ? {
          backgroundImage: `url(${overlay.tile.url})`,
          backgroundRepeat: 'repeat-y' as const,
          backgroundPosition: 'left top',
          backgroundSize: `100% ${overlayTileH}px`,
        }
      : null;

  return (
    <div
      className="repeating-page-bg"
      style={
        {
          height: bgHeight,
          '--rp-fallback': tile.fallbackColor,
        } as React.CSSProperties
      }
      aria-hidden
    >
      {showArt ? (
        singleSheet ? (
          <div className="repeating-page-bg__sheet repeating-page-bg__sheet--a" style={sheetStyle} />
        ) : (
          <>
            <div className="repeating-page-bg__sheet repeating-page-bg__sheet--a" style={sheetStyle} />
            <div
              className="repeating-page-bg__sheet repeating-page-bg__sheet--b"
              style={{
                ...sheetStyle,
                top: -sheetShiftPx,
                backgroundPosition: `left -${sheetShiftPx}px`,
              }}
            />
          </>
        )
      ) : null}

      {showArt && overlaySheetStyle ? (
        <div
          className="repeating-page-bg__overlay"
          style={{ width: overlayWidth }}
        >
          {overlaySingle ? (
            <div className="repeating-page-bg__overlay-sheet" style={overlaySheetStyle} />
          ) : (
            <>
              <div className="repeating-page-bg__overlay-sheet" style={overlaySheetStyle} />
              <div
                className="repeating-page-bg__overlay-sheet"
                style={{
                  ...overlaySheetStyle,
                  top: -sheetShiftPx,
                  backgroundPosition: `left -${sheetShiftPx}px`,
                }}
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
