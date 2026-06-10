'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Glossary from '@/components/Glossary';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';

export default function GlossaryPage() {
  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="glossary-page-root">
        <Header />
        <main className="relative z-10 cl-songs-page">
          <Glossary />
        </main>
        <Footer />
      </div>
    </div>
  );
}
