'use client';

import { useCallback, useEffect, useState, type CSSProperties, type RefObject } from 'react';
import './SeamlessPageBackground.css';

const FOOTER_WAVE_MARBLE_PX = 165;

/** Vertical overlap between repeat cycles (px) — hides join lines from scale/compression. */
const DEFAULT_OVERLAP_PX = 28;

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

function tileDisplaySize(
  containerWidth: number,
  tileWidth: number,
  tileHeight: number
): { displayW: number; displayH: number } {
  const displayW = Math.min(Math.round(containerWidth), tileWidth);
  const displayH = Math.round((displayW * tileHeight) / tileWidth);
  return { displayW: Math.max(1, displayW), displayH: Math.max(1, displayH) };
}

export type SeamlessPageBackgroundProps = {
  containerRef: RefObject<HTMLElement | null>;
  imageUrl: string;
  tileWidth: number;
  tileHeight: number;
  fallbackColor: string;
  overlapPx?: number;
};

/**
 * Height-synced mirror repeat-y with integer tile sizing + overlap pass.
 */
export default function SeamlessPageBackground({
  containerRef,
  imageUrl,
  tileWidth,
  tileHeight,
  fallbackColor,
  overlapPx = DEFAULT_OVERLAP_PX,
}: SeamlessPageBackgroundProps) {
  const [bgHeight, setBgHeight] = useState(0);
  const [tilePx, setTilePx] = useState({ displayW: tileWidth, displayH: tileHeight });
  const [showArt, setShowArt] = useState(false);

  const measure = useCallback(() => {
    const shell = containerRef.current;
    if (!shell) return;
    setBgHeight(measureContentHeight(shell));
    setTilePx(tileDisplaySize(shell.clientWidth, tileWidth, tileHeight));
  }, [containerRef, tileWidth, tileHeight]);

  useEffect(() => {
    const reveal = () => setShowArt(true);
    if (document.readyState === 'complete') reveal();
    else window.addEventListener('load', reveal, { once: true });
    return () => window.removeEventListener('load', reveal);
  }, []);

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

  if (bgHeight <= 0) return null;

  const sheetStyle = {
    '--seamless-image': `url(${imageUrl})`,
    '--seamless-fallback': fallbackColor,
    '--seamless-overlap': `${overlapPx}px`,
    backgroundSize: `${tilePx.displayW}px ${tilePx.displayH}px`,
  } as CSSProperties;

  return (
    <div
      className="seamless-bg-layers"
      style={{ height: bgHeight }}
      aria-hidden
    >
      {showArt ? (
        <>
          <div className="seamless-bg-sheet seamless-bg-sheet--base" style={sheetStyle} />
          <div className="seamless-bg-sheet seamless-bg-sheet--overlap" style={sheetStyle} />
        </>
      ) : null}
    </div>
  );
}
