'use client';

import About from '@/components/About';
import { useSearchParams } from 'next/navigation';

export default function AboutClient() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') === 'kabir' ? 'kabir' : 'ajab';
  const menu = searchParams?.get('menu') || undefined;

  return <About forcedTab={tab} forcedMenu={menu} />;
}
