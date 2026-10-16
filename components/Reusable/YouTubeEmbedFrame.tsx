'use client';

import { useState } from 'react';
import { extractYouTubeId } from '@/lib/youtube';
import './YouTubeEmbedFrame.css';

type YouTubeEmbedFrameProps = {
  videoId: string;
  title: string;
  className?: string;
  /** Start playback immediately (e.g. film trailer popup after a click). */
  autoplay?: boolean;
};

function embedSrc(id: string, autoplay: boolean): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    controls: '1',
    iv_load_policy: '3',
    playsinline: '1',
    fs: '1',
  });
  if (autoplay) params.set('autoplay', '1');
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

/**
 * Detail-page player: poster + red YouTube play only until the user clicks.
 * Avoids the native pre-play chrome (title, Watch later, Share).
 */
export default function YouTubeEmbedFrame({
  videoId,
  title,
  className,
  autoplay = false,
}: YouTubeEmbedFrameProps) {
  const id = extractYouTubeId(videoId);
  const [playing, setPlaying] = useState(autoplay);
  if (!id) return null;

  if (playing) {
    return (
      <iframe
        src={embedSrc(id, true)}
        title={title}
        className={className}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  /* Prefer 16:9 maxres; fall back to hq if missing. */
  const posterMax = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  const posterHq = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  return (
    <button
      type="button"
      className={['ajab-yt-facade', className].filter(Boolean).join(' ')}
      style={{ backgroundImage: `url(${posterMax}), url(${posterHq})` }}
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
    >
      <span className="ajab-yt-play" aria-hidden="true">
        <span className="ajab-yt-play-tri" />
      </span>
    </button>
  );
}
