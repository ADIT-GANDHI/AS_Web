import { Suspense } from 'react';
import CLRadio from '@/components/Radio/CLRadio';

export default function RadioPage() {
  return (
    <Suspense fallback={null}>
      <CLRadio />
    </Suspense>
  );
}
