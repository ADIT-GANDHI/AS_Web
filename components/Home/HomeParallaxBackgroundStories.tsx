// [Claude] these changes have been recommended by claude — one of 5 selectable
// home-page background systems (see lib/homeBackgrounds.ts). Ported 1:1 from
// the live site's Stories page (https://ajabshahar.com/stories/all, `#expressions`
// container), inspected via devtools CSSOM on 2026-09-01.
// TO REVERT: remove the 'stories' entry from lib/homeBackgrounds.ts — nothing
// else references this file.
'use client';

import './HomeParallaxBackgroundStories.css';

export default function HomeParallaxBackgroundStories() {
  return (
    <div className="ajab-stories-parallax">
      <div className="ajab-stories-base" />
      <div className="ajab-stories-ripple ajab-stories-ripple1" />
      <div className="ajab-stories-ripple ajab-stories-ripple2" />
      <div className="ajab-stories-ripple ajab-stories-ripple3" />
    </div>
  );
}
