'use client';

import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

/** Drives the FILMS nav suffix (e.g. "(24)") on `/films` and `/films/*`. */
export type FilmsNavCountContextValue = {
  total: number | null;
  setFilmsNavTotal: (n: number | string | null | undefined) => void;
};

export const FilmsNavCountContext = createContext<FilmsNavCountContextValue>({
  total: null,
  setFilmsNavTotal: () => {},
});

export function FilmsNavCountProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState<number | null>(null);
  const setFilmsNavTotal = useCallback((n: number | string | null | undefined) => {
    setTotal(parseCatalogTotal(n));
  }, []);

  const value = useMemo(() => ({ total, setFilmsNavTotal }), [total, setFilmsNavTotal]);

  return <FilmsNavCountContext.Provider value={value}>{children}</FilmsNavCountContext.Provider>;
}
