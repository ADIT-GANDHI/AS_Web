'use client';

import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

/** Drives the SONGS nav suffix (e.g. "(211)") on `/songs` and `/songs/details/*` only. */
export type SongsNavCountContextValue = {
  total: number | null;
  /** Accepts number, numeric string, or null to clear (show static CSS fallback). */
  setSongsNavTotal: (n: number | string | null | undefined) => void;
};

export const SongsNavCountContext = createContext<SongsNavCountContextValue>({
  total: null,
  setSongsNavTotal: () => {},
});

export function SongsNavCountProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState<number | null>(null);
  const setSongsNavTotal = useCallback((n: number | string | null | undefined) => {
    setTotal(parseCatalogTotal(n));
  }, []);

  const value = useMemo(
    () => ({ total, setSongsNavTotal }),
    [total, setSongsNavTotal]
  );

  return <SongsNavCountContext.Provider value={value}>{children}</SongsNavCountContext.Provider>;
}
