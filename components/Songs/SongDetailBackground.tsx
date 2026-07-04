'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import {
  measurePageBackgroundHeight,
  resolvePageFooter,
} from '@/lib/measurePageBackgroundHeight';

type Props = {
  containerRef: RefObject<HTMLElement | null>;
};

/**
 * Song detail marble — mirrored repeat-y tile from song_detail_3.png.
 */
export default function SongDetailBackground({ containerRef }: Props) {
  const [bgHeight, setBgHeight] = useState(0);
  const [showArt, setShowArt] = useState(false);

  const measure = useCallback(() => {
    const shell = containerRef.current;
    if (!shell) return;
    setBgHeight(measurePageBackgroundHeight(shell));
  }, [containerRef]);

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
    if (main instanceof HTMLElement) ro.observe(main);

    const footer = resolvePageFooter(shell);
    if (footer) ro.observe(footer);

    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [containerRef, measure]);

  if (bgHeight <= 0) return null;

  return (
    <div
      className="cld-bg-layers"
      style={{ height: bgHeight }}
      aria-hidden
    >
      {showArt ? <div className="cld-bg-marble" /> : null}
    </div>
  );
}
