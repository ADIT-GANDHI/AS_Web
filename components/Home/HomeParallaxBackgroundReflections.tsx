// [Claude] these changes have been recommended by claude — one of 5 selectable
// home-page background systems (see lib/homeBackgrounds.ts). Ported 1:1 from
// the live site's Reflections page (https://ajabshahar.com/reflections/featured),
// inspected via devtools CSSOM on 2026-09-01. Assets extracted directly from
// Home_Page_2/Background 4 Assets/ALLreflections_Background01.05.2025.psd
// (named layers matched 1:1 to the live element classes).
// TO REVERT: remove the 'reflections' entry from lib/homeBackgrounds.ts —
// nothing else references this file.
'use client';

import './HomeParallaxBackgroundReflections.css';

export default function HomeParallaxBackgroundReflections() {
  return (
    <div className="ajab-refl-parallax">
      <div className="ajab-refl-bg" />
      <div className="ajab-refl-transparent-bg" />
      <div className="ajab-refl-tree" />
      <div className="ajab-refl-eyes" />
      <div className="ajab-refl-fish" />
      <div className="ajab-refl-chakra ajab-refl-chakra0" />
      <div className="ajab-refl-chakra ajab-refl-chakra1" />
      <div className="ajab-refl-chakra ajab-refl-chakra2" />
      <div className="ajab-refl-chakra ajab-refl-chakra3" />
      <div className="ajab-refl-edges" />
    </div>
  );
}
