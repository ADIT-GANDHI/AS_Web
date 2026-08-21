'use client';

import { useRef } from 'react';
import Header from '@/components/Header';
import Glossary from '@/components/Glossary';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import {
  GLOSSARY_BG_TEXTURE,
  PEOPLE_LISTING_MIDDLE_WHITE,
  PEOPLE_LISTING_MIDDLE_WIDTH_RATIO,
} from '@/lib/pageBackgroundTiles';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';

export default function GlossaryPage() {
  const shellRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell glossary-page-root" ref={shellRef}>
        <RepeatingPageBackground
          containerRef={shellRef}
          tile={GLOSSARY_BG_TEXTURE}
          overlay={{
            tile: PEOPLE_LISTING_MIDDLE_WHITE,
            widthRatio: PEOPLE_LISTING_MIDDLE_WIDTH_RATIO,
            singleSheet: true,
          }}
        />
        <Header />
        <main className="relative z-10 cl-songs-page">
          <Glossary />
        </main>
      </div>
    </div>
  );
}
