// [Claude] these changes have been recommended by claude — one of 5 selectable
// home-page background systems (see lib/homeBackgrounds.ts). Ported 1:1 from
// the live site's Songs page (https://ajabshahar.com/songs/featured,
// `.featured-songs .song-parallax-container`), inspected via devtools CSSOM
// on 2026-09-01. Assets extracted from Home_Page_2/Background 5 Assets —
// INGLA_9feb.psd / PINGLA_9feb.psd / SUSHAMNA_9feb.psd / snake.psd /
// tambura_22jan_white.psd (each a single flattened layer, already
// production-ready), background_song_new.jpg (already flat), and
// triangles_new.png / viberations_new.png (composited from the relevant
// named layers inside the large reference file Song.psd).
//
// [Claude] recommended by claude — the 3 nadi threads (ingla/pingla/sushamna)
// looked static at first because they aren't CSS-animated at all: the live
// site drives them with Stellar.js, a scroll-linked parallax library
// (`data-stellar-background-ratio="2.5"` on ingla/pingla, "1.4" on sushamna —
// confirmed by reading the live DOM's actual attributes, not just its
// stylesheet). They only move while the page scrolls, faster/slower than the
// scroll itself depending on ratio. Reproduced below with a plain scroll
// listener instead of pulling in the whole Stellar.js dependency for 3
// elements — same visual effect (background-position shifts by
// scrollY * (ratio - 1) per layer), no time-based idle motion either way,
// exactly matching the live site's behavior.
// TO REVERT: remove the 'songs' entry from lib/homeBackgrounds.ts — nothing
// else references this file.
'use client';

import { useEffect, useRef } from 'react';
import './HomeParallaxBackgroundSongs.css';

const STELLAR_RATIOS: Record<string, number> = {
  ingla: 2.5,
  pingla: 2.5,
  sushamna: 1.4,
};

export default function HomeParallaxBackgroundSongs() {
  const inglaRef = useRef<HTMLDivElement>(null);
  const pinglaRef = useRef<HTMLDivElement>(null);
  const sushamnaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layers: [HTMLDivElement | null, number][] = [
      [inglaRef.current, STELLAR_RATIOS.ingla],
      [pinglaRef.current, STELLAR_RATIOS.pingla],
      [sushamnaRef.current, STELLAR_RATIOS.sushamna],
    ];

    let ticking = false;
    const applyOffsets = () => {
      ticking = false;
      const scrollY = window.scrollY;
      for (const [el, ratio] of layers) {
        if (!el) continue;
        const offset = scrollY * (ratio - 1);
        el.style.backgroundPositionY = `${-offset}px`;
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(applyOffsets);
      }
    };

    applyOffsets();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="ajab-songs-parallax">
      <div className="ajab-songs-container">
        <div className="ajab-songs-layer ajab-songs-layer1" />
        <div className="ajab-songs-layer ajab-songs-layer5" />
        <div className="ajab-songs-layer ajab-songs-layer5 ajab-songs-top-to-bottom" />
        <div className="ajab-songs-layer ajab-songs-layer4" />
        <div ref={inglaRef} className="ajab-songs-layer ajab-songs-layer6" />
        <div ref={pinglaRef} className="ajab-songs-layer ajab-songs-layer7" />
        <div ref={sushamnaRef} className="ajab-songs-layer ajab-songs-layer8" />
        <div className="ajab-songs-layer ajab-songs-layer9" />
        <div className="ajab-songs-layer ajab-songs-layer3" />
        <div className="ajab-songs-layer ajab-songs-layer3 ajab-songs-small1" />
        <div className="ajab-songs-layer ajab-songs-layer2" />
        <div className="ajab-songs-layer ajab-songs-layer2 ajab-songs-small1" />
        <div className="ajab-songs-layer ajab-songs-layer11" />
      </div>
    </div>
  );
}
