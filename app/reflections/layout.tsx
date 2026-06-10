import type { ReactNode } from 'react';
import { ReflectionsNavCountProvider } from '@/components/Reflections/ReflectionsNavCountContext';

export default function ReflectionsLayout({ children }: { children: ReactNode }) {
  return <ReflectionsNavCountProvider>{children}</ReflectionsNavCountProvider>;
}
