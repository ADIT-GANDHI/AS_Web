'use client';
// import Footer from '@/components/Footer';                  // original — kept untouched
// import Header from '@/components/Header';                  // original — kept untouched
// import Reflections from '@/components/Reflections';        // original — kept untouched
// import '@/components/Reflections/Reflections.css';         // original
import CLReflections from '@/components/Reflections/CLReflections';

export default function ReflectionsPage() {
  // CLReflections includes Header; Footer is mounted globally in app/layout.tsx
  return <CLReflections />;
}
