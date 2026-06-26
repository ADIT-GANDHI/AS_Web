'use client';
import React, { Suspense } from 'react';

import Header from '@/components/Header';
import Loader from '@/components/Loader';
import SearchResults from '@/components/searche/SearchResults';
import '@/components/searche/SearchResults.css';

export default function NewsPage() {
  return (
    <div className="cl-search-page-root">
      <div className="min-h-screen">
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
