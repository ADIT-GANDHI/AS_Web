// [Claude] these changes have been recommended by claude — dev/QA-only route
// for viewing one home-page background in isolation, e.g. /home-preview/stories
// Server component so `generateStaticParams` can run — required because
// next.config.mjs sets `output: 'export'` in production, and static export
// fails the ENTIRE build for any dynamic route without it (not just this one).
// TO REVERT: delete this app/home-preview/ directory — nothing else references it.
import { notFound } from 'next/navigation';
import { HOME_BACKGROUNDS, HOME_BACKGROUND_IDS, type HomeBackgroundId } from '@/lib/homeBackgrounds';
import HomeBackgroundPreviewClient from '@/components/Home/HomeBackgroundPreviewClient';

export function generateStaticParams() {
  return HOME_BACKGROUND_IDS.map((bg) => ({ bg }));
}

export default async function HomeBackgroundPreviewPage({
  params,
}: {
  params: Promise<{ bg: string }>;
}) {
  const { bg } = await params;
  if (!(bg in HOME_BACKGROUNDS)) {
    notFound();
  }
  return <HomeBackgroundPreviewClient backgroundId={bg as HomeBackgroundId} />;
}
