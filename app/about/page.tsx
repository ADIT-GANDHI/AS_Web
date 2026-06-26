import Header from '@/components/Header';
import { Suspense } from 'react';
import Loader from '@/components/Loader';
import AboutClient from './AboutClient';
import '@/components/About/About.css';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';

export default function AboutPage() {
  return (
    <div className="cl-songs-page-root">
      <div className="about-page-root">
        <Header />
        <main className="about-page cl-songs-page">
          <Suspense fallback={<Loader />}>
            <AboutClient />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
