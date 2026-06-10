'use client';
// import Footer from '@/components/Footer';                  // original — kept untouched
// import Header from '@/components/Header';                  // original — kept untouched
// import People from '@/components/People';                  // original — kept untouched
// import FullBackground from '@/components/fullBackground';  // original — kept untouched
import CLPeople from '@/components/People/CLPeople';

export default function PeoplePage() {
  // CLPeople includes Header + Footer; FloatingActions is mounted globally in app/layout.tsx
  return <CLPeople />;
}
