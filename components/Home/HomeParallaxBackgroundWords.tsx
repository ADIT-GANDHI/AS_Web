// [Claude] these changes have been recommended by claude — one of 5 selectable
// home-page background systems (see lib/homeBackgrounds.ts). Ported from the
// live site's Words page (https://ajabshahar.com/words/all, `.words-wrapper`),
// inspected via devtools on 2026-09-01. IMPORTANT: the live page currently
// only renders 6 of the ~10 elements declared in the sitewide stylesheet —
// verified by querying the live DOM directly (getAnimations()/getBoundingClientRect
// on every selector), not just reading the static CSS. The orbiting-leaf
// elements (.smallLeaves/.largeLeaf/.twoLeaves + their *Rotation children)
// are dead CSS on this page — not in the DOM at all — so they're skipped here.
//
// movingPetals, leaves-two-t2b, and the leaf-word-anim/leaves-one assets had
// no usable source in Home_Page_2/Background 3 Assets (missing entirely, or
// far lower resolution than the live art — confirmed by reading the live
// PNGs' naturalWidth/naturalHeight). Per explicit approval, those 4 assets
// were sourced directly from the live site instead (public/parallax/words/
// white_petals.png, leaves-two.png, leaves-one.png, leaf-word-anim.png) —
// everything else in this background remains PSD-sourced.
// TO REVERT: remove the 'words' entry from lib/homeBackgrounds.ts — nothing
// else references this file.
'use client';

import './HomeParallaxBackgroundWords.css';

export default function HomeParallaxBackgroundWords() {
  return (
    <div className="ajab-words-parallax">
      <div className="ajab-words-base" />
      <div className="ajab-words-view" />
      <div className="ajab-words-petals" />
      <div className="ajab-words-leaves-one" />
      <div className="ajab-words-leaves-two" />
      <div className="ajab-words-med-leaf ajab-words-med-leaf-a" />
      <div className="ajab-words-med-leaf ajab-words-med-leaf-b" />
      <div className="ajab-words-edges" />
    </div>
  );
}
