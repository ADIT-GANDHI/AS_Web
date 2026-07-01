'use client';

import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

/** Drives the PEOPLE nav suffix (e.g. "(183)") on `/people` and `/people/*`. */
export type PeopleNavCountContextValue = {
  total: number | null;
  setPeopleNavTotal: (n: number | string | null | undefined) => void;
};

export const PeopleNavCountContext = createContext<PeopleNavCountContextValue>({
  total: null,
  setPeopleNavTotal: () => {},
});

export function PeopleNavCountProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState<number | null>(null);
  const setPeopleNavTotal = useCallback((n: number | string | null | undefined) => {
    setTotal(parseCatalogTotal(n));
  }, []);

  const value = useMemo(() => ({ total, setPeopleNavTotal }), [total, setPeopleNavTotal]);

  return <PeopleNavCountContext.Provider value={value}>{children}</PeopleNavCountContext.Provider>;
}
