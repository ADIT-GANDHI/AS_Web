import type { ReactNode } from 'react';
import { SongsNavCountProvider } from '@/components/Songs/SongsNavCountContext';

export default function SongsLayout({ children }: { children: ReactNode }) {
  return <SongsNavCountProvider>{children}</SongsNavCountProvider>;
}
