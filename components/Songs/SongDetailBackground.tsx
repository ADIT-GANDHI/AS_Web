'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';

const FOOTER_WAVE_MARBLE_PX = 165;

function measureContentHeight(shell: HTMLElement): number {
  const footer = shell.querySelector('footer.footer-bg');
  if (footer instanceof HTMLElement) {
    return Math.max(footer.offsetTop + FOOTER_WAVE_MARBLE_PX, 600);
  }
  const main = shell.querySelector('main');
  if (main instanceof HTMLElement) {
    return Math.max(main.offsetTop + main.offsetHeight, 600);
  }
  return Math.max(shell.offsetHeight, 600);
}

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
    setBgHeight(measureContentHeight(shell));
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
