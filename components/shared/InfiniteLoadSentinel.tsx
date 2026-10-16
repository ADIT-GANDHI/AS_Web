'use client';

import { useEffect, useRef } from 'react';

type InfiniteLoadSentinelProps = {
  hasMore: boolean;
  onLoadMore: () => void;
  /** Re-bind observer when list length changes (new rows). */
  watchKey?: string | number;
  rootMargin?: string;
};

/**
 * Invisible sentinel for listing pages — loads the next page when scrolled near.
 * Related / Explore blocks keep explicit SEE MORE / Load More buttons instead.
 */
export default function InfiniteLoadSentinel({
  hasMore,
  onLoadMore,
  watchKey,
  rootMargin = '240px 0px',
}: InfiniteLoadSentinelProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = ref.current;
    if (!node) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { root: null, rootMargin, threshold: 0 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, onLoadMore, watchKey, rootMargin]);

  if (!hasMore) return null;

  return (
    <div
      ref={ref}
      className="cl-listing-autoload-sentinel"
      aria-hidden="true"
    />
  );
}
