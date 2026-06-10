'use client';

import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

/** Drives the REFLECTIONS nav suffix on `/reflections` and `/reflections/details/*` only. */
export type ReflectionsNavCountContextValue = {
  total: number | null;
  setReflectionsNavTotal: (n: number | string | null | undefined) => void;
};

export const ReflectionsNavCountContext = createContext<ReflectionsNavCountContextValue>({
  total: null,
  setReflectionsNavTotal: () => {},
});

export function ReflectionsNavCountProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState<number | null>(null);
  const setReflectionsNavTotal = useCallback((n: number | string | null | undefined) => {
    setTotal(parseCatalogTotal(n));
  }, []);

  const value = useMemo(
    () => ({ total, setReflectionsNavTotal }),
    [total, setReflectionsNavTotal]
  );

  return (
    <ReflectionsNavCountContext.Provider value={value}>{children}</ReflectionsNavCountContext.Provider>
  );
}
