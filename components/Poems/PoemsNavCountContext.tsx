'use client';

import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

/* [Claude] these changes have been recommended by claude —
   Drives the POEMS nav suffix (e.g. "(245)") on /poems only.
   Same pattern as SongsNavCountContext / ReflectionsNavCountContext. */

export type PoemsNavCountContextValue = {
  total: number | null;
  setPoemsNavTotal: (n: number | string | null | undefined) => void;
};

export const PoemsNavCountContext = createContext<PoemsNavCountContextValue>({
  total: null,
  setPoemsNavTotal: () => {},
});

export function PoemsNavCountProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState<number | null>(null);
  const setPoemsNavTotal = useCallback((n: number | string | null | undefined) => {
    setTotal(parseCatalogTotal(n));
  }, []);

  const value = useMemo(() => ({ total, setPoemsNavTotal }), [total, setPoemsNavTotal]);

  return <PoemsNavCountContext.Provider value={value}>{children}</PoemsNavCountContext.Provider>;
}
