import type { ReactNode } from 'react';
import { FilmsNavCountProvider } from '@/components/Films/FilmsNavCountContext';

export default function FilmsLayout({ children }: { children: ReactNode }) {
  return <FilmsNavCountProvider>{children}</FilmsNavCountProvider>;
}
