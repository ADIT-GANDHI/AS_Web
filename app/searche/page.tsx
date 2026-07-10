'use client';

import React, { Suspense, useRef } from 'react';

import Header from '@/components/Header';
import Loader from '@/components/Loader';
import SearchResults from '@/components/searche/SearchResults';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { SEARCH_RESULTS_BG } from '@/lib/pageBackgroundTiles';
import '@/components/Songs/CLSongs.css';
import '@/components/searche/SearchResults.css';

export default function SearchPage() {
  const shellRef = useRef<HTMLDivElement>(null);

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing cl-search-page-root">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground
          containerRef={shellRef}
          tile={SEARCH_RESULTS_BG}
          tileOverlapPx={8}
          singleSheet
        />
        <Header />
        <main className="relative z-10">
          <Suspense fallback={<Loader />}>
            <SearchResults />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
