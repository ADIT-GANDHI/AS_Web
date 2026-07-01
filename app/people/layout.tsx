import type { ReactNode } from 'react';
import { PeopleNavCountProvider } from '@/components/People/PeopleNavCountContext';

export default function PeopleLayout({ children }: { children: ReactNode }) {
  return <PeopleNavCountProvider>{children}</PeopleNavCountProvider>;
}
