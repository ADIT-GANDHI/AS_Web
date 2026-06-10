'use client';
import React, { Suspense } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Image from 'next/image';
import ajabNewsLogo from '@/public/ajab-news-logo.svg';
import FullBackground from '@/components/fullBackground';
import CLAjabnews from '@/components/ajab-news/CLNews';
import Loader from '@/components/Loader';

export default function NewsPage() {
  return (
    <FullBackground>
      <div className="cl-news-page">
        {/* Header stays outside at full viewport width */}
        <Header />
        {/* White panel uses negative margin-top to slide behind the header
            so the wavy panel visually starts from the top — matches Figma */}
        <div className="news-inner-container">
          <main className="relative z-10">
            <div className="news-logo-area">
              {/* [Claude] these changes have been recommended by claude — logo sized to correct
                  aspect ratio and scaled to 0.85× Figma value: SVG native 377×132 → 320×112.
                  Previous 240×100 was both too small and slightly wrong aspect ratio. */}
              <h1 className="flex justify-center">
                <Image src={ajabNewsLogo} alt="Ajab News" width={280} height={98} priority />
              </h1>
              <div className="news-border"></div>
            </div>
            <Suspense fallback={<Loader />}>
              <CLAjabnews />
            </Suspense>
          </main>
        </div>
        <Footer />
      </div>
    </FullBackground>
  );
}
