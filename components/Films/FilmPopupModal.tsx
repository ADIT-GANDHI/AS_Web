'use client';

import { useEffect } from 'react';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import './FilmPopupModal.css';

export type FilmPopupData = {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
};

type FilmPopupModalProps = {
  open: boolean;
  data: FilmPopupData | null;
  onClose: () => void;
};

/** Films listing trailer popup — PDF page 2: white frame, pink ✕, shared YT player. */
export default function FilmPopupModal({ open, data, onClose }: FilmPopupModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !data?.videoId) return null;

  return (
    <div
      className="cfp-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cfp-frame"
        role="dialog"
        aria-modal="true"
        aria-label={data.title || 'Film trailer'}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cfp-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path
              d="M5 5 L19 19 M19 5 L5 19"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="square"
            />
          </svg>
        </button>

        <div className="cfp-video">
          <YouTubeEmbedFrame
            videoId={data.videoId}
            title={data.title || 'Film trailer'}
            className="cfp-iframe"
          />
        </div>
      </div>
    </div>
  );
}
