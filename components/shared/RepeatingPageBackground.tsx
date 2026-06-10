'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { PageBackgroundTile } from '@/lib/pageBackgroundTiles';
import './RepeatingPageBackground.css';

const FOOTER_WAVE_MARBLE_PX = 165;
const TILE_OVERLAP_PX = 4;
const SHEET_SHIFT_PX = 6;

function measureContentHeight(shell: HTMLElement): number {
  const footer = shell.querySelector('footer.footer-bg');
  let h = 0;
  if (footer instanceof HTMLElement) {
    h = footer.offsetTop + FOOTER_WAVE_MARBLE_PX;
  }
  const main = shell.querySelector('main');
  if (main instanceof HTMLElement) {
    h = Math.max(h, main.offsetTop + main.offsetHeight);
  }
  return Math.max(h, shell.scrollHeight, 600);
}

export type RepeatingPageBackgroundProps = {
  containerRef: RefObject<HTMLElement | null>;
  tile: PageBackgroundTile;
};

/**
 * Full-height repeat-y background (People listing pattern).
 * Uses dual stacked sheets + slight tile overlap to hide browser repeat gaps.
 */
export default function RepeatingPageBackground({
  containerRef,
  tile,
}: RepeatingPageBackgroundProps) {
  const [bgHeight, setBgHeight] = useState(0);
  const [tileH, setTileH] = useState(0);

  const measure = useCallback(() => {
    const shell = containerRef.current;
    if (!shell) return;
    setBgHeight(measureContentHeight(shell));
    const w = shell.clientWidth;
    const scaled = (Math.min(w, tile.tileWidth) * tile.tileHeight) / tile.tileWidth;
    setTileH(Math.max(1, Math.ceil(scaled) + TILE_OVERLAP_PX));
  }, [containerRef, tile.tileWidth, tile.tileHeight]);

  useEffect(() => {
    const shell = containerRef.current;
    if (!shell) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(shell);
    const main = shell.querySelector('main');
    const footer = shell.querySelector('footer.footer-bg');
    if (main instanceof HTMLElement) ro.observe(main);
    if (footer instanceof HTMLElement) ro.observe(footer);
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
      <div className="repeating-page-bg__sheet repeating-page-bg__sheet--a" style={sheetStyle} />
      <div
        className="repeating-page-bg__sheet repeating-page-bg__sheet--b"
        style={{
          ...sheetStyle,
          top: -SHEET_SHIFT_PX,
          backgroundPosition: `left -${SHEET_SHIFT_PX}px`,
        }}
      />
    </div>
  );
}
