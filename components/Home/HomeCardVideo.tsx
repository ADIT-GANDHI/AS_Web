'use client';

import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';

type HomeCardVideoProps = {
  videoId: string;
  title: string;
};

export default function HomeCardVideo({ videoId, title }: HomeCardVideoProps) {
  return (
    <YouTubeEmbedFrame videoId={videoId} title={title} className="clh-media-iframe" />
  );
}
