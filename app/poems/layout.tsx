import type { ReactNode } from 'react';
import { PoemsNavCountProvider } from '@/components/Poems/PoemsNavCountContext';
import '@/components/Poems/CLPoems.css';

/* Poems CSS is imported here (layout) so /poems routes always receive styles even if
   the dev CSS chunk cache is stale. Wraps all /poems routes with the live nav count. */
export default function PoemsLayout({ children }: { children: ReactNode }) {
  return <PoemsNavCountProvider>{children}</PoemsNavCountProvider>;
}
