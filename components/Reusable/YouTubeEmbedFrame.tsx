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

/** Poster candidates — maxres often 404s as a tiny 120×90 placeholder (HTTP 200). */
function posterCandidates(id: string): string[] {
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  ];
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
  const [posterIdx, setPosterIdx] = useState(0);

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

  const posters = posterCandidates(id);
  const posterSrc = posters[Math.min(posterIdx, posters.length - 1)];

  return (
    <button
      type="button"
      className={['ajab-yt-facade', className].filter(Boolean).join(' ')}
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
    >
      {/* img (not CSS bg): detect YouTube’s tiny fake maxres and fall through */}
      <img
        className="ajab-yt-poster"
        src={posterSrc}
        alt=""
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          /* Missing maxres returns ~120×90 grey placeholder with HTTP 200 */
          if (img.naturalWidth > 0 && img.naturalWidth < 320 && posterIdx < posters.length - 1) {
            setPosterIdx((i) => i + 1);
          }
        }}
        onError={() => {
          if (posterIdx < posters.length - 1) setPosterIdx((i) => i + 1);
        }}
      />
      <span className="ajab-yt-play" aria-hidden="true">
        <span className="ajab-yt-play-tri" />
      </span>
    </button>
  );
}
