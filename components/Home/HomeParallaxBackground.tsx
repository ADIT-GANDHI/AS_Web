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
// TO REVERT: delete this component's usage (and this import) from CLHero.tsx —
// both call sites carry this same "[Claude] recommended by claude" tag.

import './HomeParallaxBackground.css';

export default function HomeParallaxBackground() {
  return (
    <div className="ajab-home-parallax" aria-hidden="true">
      <div className="ajab-px-container">
        {/* Static layers — scroll with the page, no animation (verbatim from live) */}
        <div
          className="ajab-px-layer ajab-px-layer1"
          style={{ backgroundImage: "url('/parallax/body.png')" }}
        />
        <div
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

        {/* Static — decorative thread, scrolls with the page */}
        <div
          className="ajab-px-layer ajab-px-layer7"
          style={{ backgroundImage: "url('/parallax/whiteString.png')" }}
        />
      </div>
    </div>
  );
}
