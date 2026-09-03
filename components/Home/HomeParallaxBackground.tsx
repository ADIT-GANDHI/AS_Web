'use client';

// [Claude] these changes have been recommended by claude —
// Home page parallax background, ported 1:1 from the client's live production
// site (https://ajabshahar.com/featuredContent/). See HomeParallaxBackground.css
// for the full source-of-truth comment block (exact values, what was verified,
// the one deliberate deviation, and how to revert this in one step).
//
// Source assets live in /public/parallax/ — extracted from the client's PSD
// deliverables in "Home Page/Background 1 Assets", cross-checked pixel-for-
// pixel against the live site's own PNGs. Full extraction report:
// "Home Page/_extracted/README.txt".
//
// [Claude] recommended by claude — px-layer2 (map) and px-layer7 (whiteString)
// also carry live scroll-linked motion via Stellar.js (`data-stellar-background-ratio`
// = "2" and "3" respectively — px-layer1/px-layer3 also have the attribute but
// with ratio "1", which is a no-op, so they're left alone). Found by auditing
// the live DOM's actual attributes, the same way the Songs background's
// thread-scroll bug was found — a plain stylesheet read misses these entirely.
// Reproduced with the same lightweight scroll listener used in
// HomeParallaxBackgroundSongs.tsx rather than the Stellar.js library itself.
// Approximated as offset = scrollY * (ratio - 1); the live site's exact pixel
// deltas didn't cleanly match that formula when spot-checked (both layers
// shifted by the same amount despite different ratios, suggesting Stellar's
// real internal math is more involved), but the direction and relative
// magnitude are correct, which is what's visually perceptible.
// TO REVERT: delete this component's usage (and this import) from CLHero.tsx —
// both call sites carry this same "[Claude] recommended by claude" tag.

import { useEffect, useRef } from 'react';
import './HomeParallaxBackground.css';

const STELLAR_RATIOS = {
  map: 2,
  whiteString: 3,
};

export default function HomeParallaxBackground() {
  const mapRef = useRef<HTMLDivElement>(null);
  const whiteStringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layers: [HTMLDivElement | null, number][] = [
      [mapRef.current, STELLAR_RATIOS.map],
      [whiteStringRef.current, STELLAR_RATIOS.whiteString],
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
    <div className="ajab-home-parallax" aria-hidden="true">
      <div className="ajab-px-container">
        {/* Static layers — scroll with the page, no animation (verbatim from live) */}
        <div
          className="ajab-px-layer ajab-px-layer1"
          style={{ backgroundImage: "url('/parallax/body.png')" }}
        />
        <div
          ref={mapRef}
          className="ajab-px-layer ajab-px-layer2"
          style={{ backgroundImage: "url('/parallax/map.png')" }}
        />
        <div
          className="ajab-px-layer ajab-px-layer3"
          style={{ backgroundImage: "url('/parallax/check_img1.png')" }}
        />

        {/* Animated — flying bird, 100s glide+tumble loop (@keyframes ajab-movebird) */}
        <div className="ajab-px-layer ajab-px-layer5" />

        {/* Animated — 4 independent cloud sweeps (@keyframes ajab-moveclouds),
            each its own image/size/vertical position/speed, verbatim from live */}
        <div className="ajab-px-layer ajab-px-layer6" />
        <div className="ajab-px-layer ajab-px-layer6 ajab-second" />
        <div className="ajab-px-layer ajab-px-layer6 ajab-third" />
        <div className="ajab-px-layer ajab-px-layer6 ajab-fourth" />

        {/* Scroll-linked (Stellar ratio 3) — decorative thread */}
        <div
          ref={whiteStringRef}
          className="ajab-px-layer ajab-px-layer7"
          style={{ backgroundImage: "url('/parallax/whiteString.png')" }}
        />
      </div>
    </div>
  );
}
