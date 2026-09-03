// [Claude] these changes have been recommended by claude — registry of the
// home page's selectable parallax background systems. Each entry is a
// self-contained component in components/Home/ ported 1:1 from a different
// live "featured" page. `featured` is the original background already live
// on the home page — untouched, still the default everywhere it's used.
//
// TO REVERT: delete this file and remove `backgroundId` prop usage from
// CLHero.tsx (falls back to the untouched default background).
import dynamic from 'next/dynamic';

const HomeParallaxBackground = dynamic(() => import('@/components/Home/HomeParallaxBackground'));
const HomeParallaxBackgroundStories = dynamic(
  () => import('@/components/Home/HomeParallaxBackgroundStories')
);
const HomeParallaxBackgroundReflections = dynamic(
  () => import('@/components/Home/HomeParallaxBackgroundReflections')
);
const HomeParallaxBackgroundSongs = dynamic(
  () => import('@/components/Home/HomeParallaxBackgroundSongs')
);
const HomeParallaxBackgroundWords = dynamic(
  () => import('@/components/Home/HomeParallaxBackgroundWords')
);
// 'words' ships with 2 of its 6 live elements skipped (movingPetals,
// leaves-two-t2b) — no matching source layer found in Home_Page_2/Background
// 3 Assets for either. See HomeParallaxBackgroundWords.css header for details.

export const HOME_BACKGROUNDS = {
  featured: HomeParallaxBackground,
  stories: HomeParallaxBackgroundStories,
  reflections: HomeParallaxBackgroundReflections,
  songs: HomeParallaxBackgroundSongs,
  words: HomeParallaxBackgroundWords,
} as const;

export type HomeBackgroundId = keyof typeof HOME_BACKGROUNDS;

export const HOME_BACKGROUND_IDS = Object.keys(HOME_BACKGROUNDS) as HomeBackgroundId[];

export const DEFAULT_HOME_BACKGROUND: HomeBackgroundId = 'featured';
