'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  className?: string;
  children: ReactNode;
  /**
   * When true, sizes the top rule (::before) from Filters → last A–Z letter (Z),
   * so the line does not run past Z. Does not change letter layout.
   */
  alignTopRuleToAz?: boolean;
};

/** Sentinel + spacer wrapper so listing filter bars pin near top on scroll. */
export default function PinnedFilterBarShell({
  className = 'cl-filter-bar',
  children,
  alignTopRuleToAz = false,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setPinned(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const syncHeight = () => setBarHeight(bar.offsetHeight);
    syncHeight();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncHeight) : null;
    ro?.observe(bar);
    window.addEventListener('resize', syncHeight);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', syncHeight);
    };
  }, []);

  /* Measure Filters…Z so the grey rule stops at Z (client mark). */
  useLayoutEffect(() => {
    if (!alignTopRuleToAz) return;
    const bar = barRef.current;
    if (!bar) return;

    const syncRule = () => {
      const start = bar.querySelector('.cl-filter-trigger-wrap');
      const end = bar.querySelector('.cl-az-row .cl-az-btn:last-child');
      if (!start || !end) return;
      const br = bar.getBoundingClientRect();
      const sr = start.getBoundingClientRect();
      const er = end.getBoundingClientRect();
      bar.style.setProperty('--cl-filter-rule-left', `${Math.max(0, sr.left - br.left)}px`);
      bar.style.setProperty('--cl-filter-rule-right', `${Math.max(0, br.right - er.right)}px`);
    };

    syncRule();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncRule) : null;
    ro?.observe(bar);
    window.addEventListener('resize', syncRule);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', syncRule);
    };
  }, [alignTopRuleToAz, children]);

  return (
    <>
      <div ref={sentinelRef} className="cl-filter-bar-sentinel" aria-hidden="true" />
      {pinned && barHeight > 0 && (
        <div className="cl-filter-bar-spacer" style={{ height: barHeight }} aria-hidden="true" />
      )}
      <div ref={barRef} className={`${className}${pinned ? ' cl-filter-bar--pinned' : ''}`}>
        {children}
      </div>
    </>
  );
}
