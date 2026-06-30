'use client';

import { extractYouTubeId } from '@/lib/youtube';

type YouTubeEmbedFrameProps = {
  videoId: string;
  title: string;
  className?: string;
};

/** Native YouTube iframe — shows title bar, Watch later, Share, and play overlay (PDF). */
export default function YouTubeEmbedFrame({ videoId, title, className }: YouTubeEmbedFrameProps) {
  const id = extractYouTubeId(videoId);
  if (!id) return null;

  return (
    <iframe
      src={`https://www.youtube.com/embed/${id}`}
      title={title}
      className={className}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
