'use client';

import { useRef } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import '@/styles/CustomStyle.css';
import CLSongsIndex from '@/components/Songs/CLindex';
import SongsListingBackground from '@/components/Songs/SongsListingBackground';

export default function SongsPage() {
  const pageShellRef = useRef<HTMLDivElement>(null);

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <SongsListingBackground containerRef={pageShellRef} />
      <div ref={pageShellRef} className="cl-songs-page-shell">
        <Header />
        <main className="relative z-10 min-h-[50vh]">
          <CLSongsIndex />
        </main>
        <Footer />
      </div>
    </div>
  );
}
