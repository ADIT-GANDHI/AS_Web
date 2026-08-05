'use client';

import { Suspense } from 'react';
import CLPoems from '@/components/Poems/CLPoems';
import Loader from '@/components/Loader';

export default function PoemsPage() {
  return (
    <Suspense fallback={<Loader />}>
      <CLPoems />
    </Suspense>
  );
}
