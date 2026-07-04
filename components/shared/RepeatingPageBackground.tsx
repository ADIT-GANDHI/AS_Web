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

export type RepeatingPageBackgroundProps = {
  containerRef: RefObject<HTMLElement | null>;
  tile: PageBackgroundTile;
  /** Defer heavy assets until window load (Songs composite ~7 MB). */
  deferUntilLoad?: boolean;
};

/**
 * Full-height repeat-y background (People / Reflections / Films / Songs listing).
 * Dual stacked sheets + slight tile overlap hide browser repeat gaps.
 */
export default function RepeatingPageBackground({
  containerRef,
  tile,
  deferUntilLoad = false,
}: RepeatingPageBackgroundProps) {
  const [bgHeight, setBgHeight] = useState(0);
  const [tileH, setTileH] = useState(0);
  const [showArt, setShowArt] = useState(!deferUntilLoad);

  const measure = useCallback(() => {
    const shell = containerRef.current;
    if (!shell) return;
    setBgHeight(measurePageBackgroundHeight(shell));
    const w = shell.clientWidth;
    const scaled = (Math.min(w, tile.tileWidth) * tile.tileHeight) / tile.tileWidth;
    setTileH(Math.max(1, Math.ceil(scaled) + TILE_OVERLAP_PX));
  }, [containerRef, tile.tileWidth, tile.tileHeight]);

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
        <>
          <div className="repeating-page-bg__sheet repeating-page-bg__sheet--a" style={sheetStyle} />
          <div
            className="repeating-page-bg__sheet repeating-page-bg__sheet--b"
            style={{
              ...sheetStyle,
              top: -SHEET_SHIFT_PX,
              backgroundPosition: `left -${SHEET_SHIFT_PX}px`,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
