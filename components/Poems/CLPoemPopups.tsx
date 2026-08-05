'use client';

import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Repeat, Volume2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import WavyPaperPopup from '@/components/shared/WavyPaperPopup';

export interface GlossaryTerm {
  term: string;
  meaning: string;
  highlighted?: boolean;
}

const DEFAULT_GLOSSARY_BODY =
  "Here's a that gives you a lay of this land, Ajab Shahar — a wondrous city of songs, poems, images and conversations from Bhakti, Sufi & Baul oral traditions from India and around.";

export function CLGlossaryPopup({
  isOpen,
  onClose,
  body,
  terms: _terms,
  rightAnchor,
  style,
}: {
  isOpen: boolean;
  onClose: () => void;
  body?: string;
  terms?: GlossaryTerm[];
  rightAnchor?: string | number;
  style?: CSSProperties;
}) {
  return (
    <WavyPaperPopup
      variant="anchored"
      isOpen={isOpen}
      onClose={onClose}
      title="Glossary"
      rightAnchor={rightAnchor}
      style={style}
    >
      {body || DEFAULT_GLOSSARY_BODY}
    </WavyPaperPopup>
  );
}

export interface AudioVersion {
  id?: string;
  singer: string;
  duration: string;
  thumbnailUrl?: string;
  /** SoundCloud track id or full track URL */
  audioUrl?: string;
}

const MOCK_VERSIONS: AudioVersion[] = [
  { singer: 'Mukhtiya Ali', duration: '00:38', thumbnailUrl: '/poems-listen-1.png' },
  { singer: 'Abu Mohammed', duration: '00:45', thumbnailUrl: '/poems-listen-3.png' },
  { singer: 'Vidya Rao', duration: '00:52', thumbnailUrl: '/poems-listen-2.png' },
  { singer: 'Parvathy Baul', duration: '01:05', thumbnailUrl: '/poems-listen-1.png' },
  { singer: 'Prahlad Tipanya', duration: '01:12', thumbnailUrl: '/poems-listen-2.png' },
];

const CLIP_ROW_H = 52;
const MAX_VISIBLE_CLIPS = 4;

function soundcloudEmbedSrc(trackIdOrUrl: string, autoPlay: boolean): string {
  const raw = trackIdOrUrl.trim();
  const trackUrl = /^https?:\/\//i.test(raw)
    ? raw
    : `https://api.soundcloud.com/tracks/${encodeURIComponent(raw)}`;
  const params = new URLSearchParams({
    url: trackUrl,
    color: '#E31E79',
    auto_play: autoPlay ? 'true' : 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'false',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

export function CLPlayerPopup({
  isOpen,
  onClose,
  versions = MOCK_VERSIONS,
}: {
  isOpen: boolean;
  onClose: () => void;
  versions?: AudioVersion[];
}) {
  const clips = versions.length ? versions : MOCK_VERSIONS;
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      return;
    }
    setActiveIdx(0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    setActiveIdx(0);
  }, [clips]);

  const needsScroll = clips.length > MAX_VISIBLE_CLIPS;
  const listMaxHeight = useMemo(
    () => (needsScroll ? MAX_VISIBLE_CLIPS * CLIP_ROW_H : undefined),
    [needsScroll]
  );

  const active = clips[activeIdx] || clips[0];
  const hasSoundcloud = Boolean(active?.audioUrl);

  const togglePlay = () => setIsPlaying((p) => !p);
  const skipPrev = () => {
    setActiveIdx((i) => (i === 0 ? clips.length - 1 : i - 1));
    setIsPlaying(true);
  };
  const skipNext = () => {
    setActiveIdx((i) => (i + 1) % clips.length);
    setIsPlaying(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9990, background: 'rgba(0,0,0,0.05)' }}
            onClick={onClose}
          />
          <motion.div
            className="fixed clp-player-popup"
            style={{
              top: '42%',
              right: 'clamp(48px, 8vw, 160px)',
              transform: 'translateY(-50%)',
              width: '300px',
              background: '#FFFFFF',
              borderRadius: '6px',
              boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
              padding: '16px 16px 14px',
              zIndex: 9991,
            }}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            role="dialog"
            aria-label="Poem audio player"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close player"
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'none',
                border: 'none',
                color: '#E31E79',
                cursor: 'pointer',
                padding: 0,
                lineHeight: 1,
              }}
            >
              <X size={14} />
            </button>

            <ul
              style={{
                listStyle: 'none',
                margin: '0 0 14px',
                padding: 0,
                maxHeight: listMaxHeight,
                overflowY: needsScroll ? 'auto' : 'visible',
              }}
              className={needsScroll ? 'clp-player-clip-scroll' : undefined}
            >
              {clips.map((v, idx) => (
                <li
                  key={`${v.id || v.singer}-${idx}`}
                  onClick={() => {
                    setActiveIdx(idx);
                    setIsPlaying(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: CLIP_ROW_H,
                    padding: '6px 4px',
                    boxSizing: 'border-box',
                    borderRadius: 3,
                    cursor: 'pointer',
                    background: idx === activeIdx ? '#FAFAFA' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 3,
                      overflow: 'hidden',
                      background: '#f0f0f0',
                      flexShrink: 0,
                    }}
                  >
                    {v.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumbnailUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '14px',
                        color: idx === activeIdx ? '#E31E79' : '#4F4F4F',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {v.singer}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontWeight: 300,
                        fontSize: '12px',
                        color: '#828282',
                      }}
                    >
                      {v.duration || ' '}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {hasSoundcloud && isPlaying ? (
              <iframe
                key={`${active?.audioUrl}-${activeIdx}-play`}
                title={`SoundCloud — ${active?.singer || 'poem audio'}`}
                allow="autoplay"
                src={soundcloudEmbedSrc(active!.audioUrl!, true)}
                style={{
                  width: '100%',
                  height: 120,
                  border: 0,
                  marginBottom: 12,
                  borderRadius: 4,
                }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#828282',
                    fontFamily: "'Merriweather Sans', sans-serif",
                    minWidth: 28,
                  }}
                >
                  0:00
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    background: '#E0E0E0',
                    borderRadius: 2,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: isPlaying ? '18%' : '0%',
                      height: '100%',
                      background: '#E31E79',
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#828282',
                    fontFamily: "'Merriweather Sans', sans-serif",
                    minWidth: 28,
                    textAlign: 'right',
                  }}
                >
                  {active?.duration || '0:00'}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#828282',
                  padding: 0,
                }}
                aria-label="Repeat"
              >
                <Repeat size={16} />
              </button>
              <button
                type="button"
                onClick={skipPrev}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#828282',
                  padding: 0,
                }}
                aria-label="Previous"
              >
                <SkipBack size={18} />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#E31E79',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} fill="#fff" /> : <Play size={16} fill="#fff" />}
              </button>
              <button
                type="button"
                onClick={skipNext}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#828282',
                  padding: 0,
                }}
                aria-label="Next"
              >
                <SkipForward size={18} />
              </button>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#E31E79',
                  padding: 0,
                }}
                aria-label="Volume"
              >
                <Volume2 size={18} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
