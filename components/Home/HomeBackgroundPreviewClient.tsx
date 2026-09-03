// [Claude] these changes have been recommended by claude — client boundary for
// the /home-preview/[bg] route (CLHero uses hooks, so it needs 'use client';
// split out from app/home-preview/[bg]/page.tsx so that file can stay a
// server component and export generateStaticParams). Lives here rather than
// inside the [bg] route folder because the dev server's module resolver
// couldn't reliably resolve a relative import from inside a bracket-named
// route directory on this Windows/webpack setup.
'use client';

import CLHero from '@/components/Home/CLHero';
import type { HomeBackgroundId } from '@/lib/homeBackgrounds';

export default function HomeBackgroundPreviewClient({
  backgroundId,
}: {
  backgroundId: HomeBackgroundId;
}) {
  return <CLHero backgroundId={backgroundId} />;
}
