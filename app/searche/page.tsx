'use client';
import React, { Suspense } from 'react';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SearchResults from '@/components/searche/SearchResults';
import '@/components/searche/SearchResults.css';

export default function NewsPage() {
  return (
    <div className="cl-search-page-root">
      <div className="min-h-screen">
        <Header />
        <main className="relative z-10">
          <Suspense fallback={<div className="px-4 py-8">Loading search...</div>}>
            <SearchResults />
          </Suspense>
        </main>
        <Footer />
      </div>
    </div>
  );
}
