'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';

const FOOTER_WAVE_MARBLE_PX = 165;

function measureContentHeight(shell: HTMLElement): number {
  const footer = shell.querySelector('footer.footer-bg');
  /* Stop at the footer wave — do not use shell.scrollHeight (flex-stretched shell
     leaves empty space below the footer that would paint marble past the black slab). */
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
 * Songs listing background — layered exports (AllSONGS_2june2026):
 * marble (mirrored repeat-y), triangles, tamburas. Proportional scaling only.
 */
export default function SongsListingBackground({ containerRef }: Props) {
  const [bgHeight, setBgHeight] = useState(0);
  /** Defer 7MB marble composite until after first paint so header/loader icons load first. */
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
      className="cl-songs-bg-layers"
      style={{ height: bgHeight }}
      aria-hidden
    >
      {showArt ? <div className="cl-songs-bg-sheet" /> : null}
    </div>
  );
}
