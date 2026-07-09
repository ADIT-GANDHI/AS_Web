'use client';

import { useCallback, useState } from 'react';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import { extractYouTubeId, youtubeWatchUrl } from '@/lib/youtube';

type HomeCardVideoProps = {
  videoId: string;
  title: string;
};

function stopCardNavigation(event: React.MouseEvent) {
  event.stopPropagation();
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through */
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

/** Home card video — native iframe plus PDF-style Watch later / Share chrome. */
export default function HomeCardVideo({ videoId, title }: HomeCardVideoProps) {
  const id = extractYouTubeId(videoId);
  const [shareNote, setShareNote] = useState('');

  const handleWatchLater = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      stopCardNavigation(event);
    },
    []
  );

  const handleShare = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      stopCardNavigation(event);
      if (!id) return;

      const watchUrl = youtubeWatchUrl(id);

      try {
        if (navigator.share) {
          await navigator.share({ title, url: watchUrl });
          return;
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
      }

      const copied = await copyText(watchUrl);
      setShareNote(copied ? 'Link copied' : 'Copy failed');
      window.setTimeout(() => setShareNote(''), 1800);
    },
    [id, title]
  );

  if (!id) return null;

  const watchUrl = youtubeWatchUrl(id);

  return (
    <div className="clh-video-wrap">
      <YouTubeEmbedFrame videoId={id} title={title} className="clh-media-iframe" />
      <div className="clh-yt-chrome">
        <a
          href={watchUrl}
          className="clh-yt-chrome-btn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Watch later on YouTube"
          onClick={handleWatchLater}
        >
          <span className="clh-yt-chrome-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
            </svg>
          </span>
          <span className="clh-yt-chrome-label">Watch later</span>
        </a>
        <button
          type="button"
          className="clh-yt-chrome-btn"
          aria-label="Share video"
          onClick={handleShare}
        >
          <span className="clh-yt-chrome-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </svg>
          </span>
          <span className="clh-yt-chrome-label">Share</span>
        </button>
        {shareNote ? <span className="clh-yt-share-note">{shareNote}</span> : null}
      </div>
    </div>
  );
}
