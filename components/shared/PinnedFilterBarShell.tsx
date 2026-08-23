'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  className?: string;
  children: ReactNode;
};

/** Sentinel + spacer wrapper so listing filter bars pin to top: 0 on scroll. */
export default function PinnedFilterBarShell({ className = 'cl-filter-bar', children }: Props) {
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
