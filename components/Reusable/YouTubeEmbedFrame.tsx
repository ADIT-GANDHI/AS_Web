'use client';

import { extractYouTubeId } from '@/lib/youtube';

type YouTubeEmbedFrameProps = {
  videoId: string;
  title: string;
  className?: string;
  /** Start playback when the iframe loads (use after a user gesture). */
  autoplay?: boolean;
};

/** Native YouTube iframe — shows title bar, Watch later, Share, and play overlay (PDF). */
export default function YouTubeEmbedFrame({
  videoId,
  title,
  className,
  autoplay = false,
}: YouTubeEmbedFrameProps) {
  const id = extractYouTubeId(videoId);
  if (!id) return null;

  const src = autoplay
    ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
    : `https://www.youtube.com/embed/${id}`;

  return (
    <iframe
      src={src}
      title={title}
      className={className}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
