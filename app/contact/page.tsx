'use client';

import { useRef } from 'react';
import Header from '@/components/Header';
import Contact from '@/components/Contact';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import {
  CONTACT_BG_TEXTURE,
  PEOPLE_LISTING_MIDDLE_WHITE,
  PEOPLE_LISTING_MIDDLE_WIDTH_RATIO,
} from '@/lib/pageBackgroundTiles';
import '@/components/Contact/Contact.css';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';

export default function ContactPage() {
  const shellRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell contact-page-root" ref={shellRef}>
        <RepeatingPageBackground
          containerRef={shellRef}
          tile={CONTACT_BG_TEXTURE}
          overlay={{
            tile: PEOPLE_LISTING_MIDDLE_WHITE,
            widthRatio: PEOPLE_LISTING_MIDDLE_WIDTH_RATIO,
            singleSheet: true,
          }}
        />
        <Header />
        <main className="contact-page cl-songs-page relative z-10">
          <Contact />
        </main>
      </div>
    </div>
  );
}
