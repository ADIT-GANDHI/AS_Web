'use client';
// import Footer from '@/components/Footer';            // original — kept untouched
// import Header from '@/components/Header';            // original — kept untouched
// import Poems from '@/components/Poems';              // original — kept untouched
// import FullBackground from '@/components/fullBackground'; // original — kept untouched
import CLPoems from '@/components/Poems/CLPoems';

export default function PoemsPage() {
  // CLPoems includes Header + Footer; FloatingActions is mounted globally in app/layout.tsx
  return <CLPoems />;
}
