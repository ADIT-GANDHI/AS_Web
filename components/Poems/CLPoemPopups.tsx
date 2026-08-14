'use client';

import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Repeat, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import WavyPaperPopup from '@/components/shared/WavyPaperPopup';

export interface GlossaryTerm {
  term: string;
  meaning: string;
  highlighted?: boolean;
}

const DEFAULT_GLOSSARY_BODY =
  "Here's a that gives you a lay of this land, Ajab Shahar — a wondrous city of songs, poems, images and conversations from Bhakti, Sufi & Baul oral traditions from India and around.";

/** Side sheet for Notes / Glossary — absolute to poem stage (same pattern as Listen). */
export function CLSideSheet({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={`clp-side-sheet ${className}`.trim()}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-label={title}
        >
          <WavyPaperPopup variant="inline" isOpen onClose={onClose} title={title}>
            {children}
          </WavyPaperPopup>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function CLGlossaryPopup({
  isOpen,
  onClose,
  body,
  terms,
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  body?: string;
  terms?: GlossaryTerm[];
  rightAnchor?: string | number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <CLSideSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Glossary"
      className={`clp-glossary-popup ${className || ''}`.trim()}
    >
      {terms && terms.length > 0 ? (
        <div className="clp-glossary-list">
          {terms.map((item, index) => (
            <div key={`${item.term}-${index}`} className="clp-glossary-entry">
              <div className="clp-glossary-term">{item.term}</div>
              {item.meaning ? (
                <div className="clp-glossary-meaning">{item.meaning}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        body || DEFAULT_GLOSSARY_BODY
      )}
    </CLSideSheet>
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

/** Prefer API clips with audio; do not pad with mock rows when the caller passed a list. */
function resolveListenClips(versions: AudioVersion[]): AudioVersion[] {
  const withAudio = versions.filter((v) => String(v.audioUrl || '').trim());
  const source = withAudio.length ? withAudio : versions;
  const unique: AudioVersion[] = [];
  const seen = new Set<string>();
  for (const clip of source) {
    const key = String(clip.audioUrl || clip.id || clip.singer)
      .trim()
      .toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(clip);
  }
  return unique;
}

const CLIP_ROW_H = 52;
const MAX_VISIBLE_CLIPS = 4;

type ScWidget = {
  bind: (event: string, listener: (...args: any[]) => void) => void;
  unbind: (event: string) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (ms: number) => void;
  setVolume: (vol: number) => void;
  getDuration: (cb: (ms: number) => void) => void;
  getPosition: (cb: (ms: number) => void) => void;
  load: (url: string, options?: Record<string, unknown>) => void;
};

type ScApi = {
  Widget: {
    (el: HTMLIFrameElement | string): ScWidget;
    Events: {
      READY: string;
      PLAY: string;
      PAUSE: string;
      FINISH: string;
      PLAY_PROGRESS: string;
    };
  };
};

declare global {
  interface Window {
    SC?: ScApi;
  }
}

function soundcloudTrackUrl(trackIdOrUrl: string): string {
  const raw = trackIdOrUrl.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://api.soundcloud.com/tracks/${encodeURIComponent(raw)}`;
}

function soundcloudEmbedSrc(trackIdOrUrl: string, autoPlay: boolean): string {
  const params = new URLSearchParams({
    url: soundcloudTrackUrl(trackIdOrUrl),
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

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

let scApiPromise: Promise<ScApi> | null = null;
function loadSoundCloudApi(): Promise<ScApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.SC?.Widget) return Promise.resolve(window.SC);
  if (scApiPromise) return scApiPromise;
  scApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-sc-widget-api]');
    if (existing) {
      existing.addEventListener('load', () =>
        window.SC ? resolve(window.SC) : reject(new Error('SC missing'))
      );
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.dataset.scWidgetApi = '1';
    script.onload = () => (window.SC ? resolve(window.SC) : reject(new Error('SC missing')));
    script.onerror = () => reject(new Error('SC api load failed'));
    document.head.appendChild(script);
  });
  return scApiPromise;
}

export function CLPlayerPopup({
  isOpen,
  onClose,
  versions = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  versions?: AudioVersion[];
}) {
  const clips = useMemo(() => resolveListenClips(versions), [versions]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const widgetRef = useRef<ScWidget | null>(null);
  const wantPlayRef = useRef(false);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const active = clips[activeIdx] || clips[0];
  const hasSoundcloud = Boolean(active?.audioUrl);
  const progressPct =
    durationMs > 0 ? Math.min(100, Math.max(0, (positionMs / durationMs) * 100)) : 0;
  const endLabel =
    durationMs > 0
      ? formatMs(durationMs)
      : active?.duration?.replace(/^0(?=\d:)/, '') || '0:00';

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setShowVolume(false);
      setPositionMs(0);
      wantPlayRef.current = false;
      widgetRef.current?.pause();
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Reset to first clip when the panel opens or the poem's listen list changes
  const wasOpenRef = useRef(false);
  const clipsKey = clips.map((c) => c.id || c.audioUrl || c.singer).join('|');
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setActiveIdx(0);
      setPositionMs(0);
      setDurationMs(0);
      wantPlayRef.current = false;
      setIsPlaying(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    setActiveIdx(0);
    setPositionMs(0);
    setDurationMs(0);
    wantPlayRef.current = false;
    setIsPlaying(false);
  }, [clipsKey]);

  // Bind SoundCloud Widget when open + track has audio
  useEffect(() => {
    if (!isOpen || !hasSoundcloud || !active?.audioUrl) {
      widgetRef.current = null;
      return;
    }

    let cancelled = false;
    let poll = 0;
    let widget: ScWidget | null = null;

    const bind = async () => {
      try {
        const SC = await loadSoundCloudApi();
        if (cancelled || !iframeRef.current) return;
        widget = SC.Widget(iframeRef.current);
        widgetRef.current = widget;

        const onReady = () => {
          widget?.setVolume(Math.round(volumeRef.current * 100));
          widget?.getDuration((ms) => {
            if (!cancelled && ms > 0) setDurationMs(ms);
          });
          if (wantPlayRef.current) widget?.play();
        };
        const onPlay = () => {
          if (!cancelled) setIsPlaying(true);
        };
        const onPause = () => {
          if (!cancelled) setIsPlaying(false);
        };
        const onProgress = (data: { currentPosition?: number }) => {
          if (cancelled) return;
          if (typeof data?.currentPosition === 'number') setPositionMs(data.currentPosition);
          widget?.getDuration((ms) => {
            if (!cancelled && ms > 0) setDurationMs(ms);
          });
        };
        const onFinish = () => {
          if (cancelled) return;
          setIsPlaying(false);
          setPositionMs(0);
          wantPlayRef.current = true;
          setActiveIdx((i) => (i + 1) % Math.max(clips.length, 1));
        };

        widget.bind(SC.Widget.Events.READY, onReady);
        widget.bind(SC.Widget.Events.PLAY, onPlay);
        widget.bind(SC.Widget.Events.PAUSE, onPause);
        widget.bind(SC.Widget.Events.PLAY_PROGRESS, onProgress);
        widget.bind(SC.Widget.Events.FINISH, onFinish);

        widget.getDuration((ms) => {
          if (!cancelled && ms > 0) setDurationMs(ms);
          if (wantPlayRef.current) widget?.play();
        });

        poll = window.setInterval(() => {
          if (cancelled || !wantPlayRef.current) return;
          widget?.getPosition((ms) => {
            if (!cancelled && typeof ms === 'number') setPositionMs(ms);
          });
          widget?.getDuration((ms) => {
            if (!cancelled && ms > 0) setDurationMs(ms);
          });
        }, 400);
      } catch {
        /* widget unavailable — UI still works for browsing clips */
      }
    };

    const t = window.setTimeout(bind, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      if (poll) window.clearInterval(poll);
      widgetRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebind on track change
  }, [isOpen, active?.audioUrl, activeIdx, hasSoundcloud, clips.length]);

  useEffect(() => {
    widgetRef.current?.setVolume(Math.round(volume * 100));
  }, [volume]);

  const togglePlay = useCallback(() => {
    const w = widgetRef.current;
    if (!hasSoundcloud) {
      setIsPlaying((p) => !p);
      return;
    }
    if (isPlaying) {
      wantPlayRef.current = false;
      w?.pause();
      setIsPlaying(false);
    } else {
      wantPlayRef.current = true;
      if (w) w.play();
      setIsPlaying(true);
    }
  }, [hasSoundcloud, isPlaying]);

  const selectTrack = (idx: number) => {
    setActiveIdx(idx);
    setPositionMs(0);
    setDurationMs(0);
    wantPlayRef.current = true;
    setIsPlaying(true);
  };

  const skipPrev = () => {
    if (!clips.length) return;
    selectTrack(activeIdx === 0 ? clips.length - 1 : activeIdx - 1);
  };
  const skipNext = () => {
    if (!clips.length) return;
    selectTrack((activeIdx + 1) % clips.length);
  };

  const seekFromClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!durationMs || !widgetRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const ms = Math.floor(durationMs * ratio);
    widgetRef.current.seekTo(ms);
    setPositionMs(ms);
  };

  const needsScroll = clips.length > MAX_VISIBLE_CLIPS;
  const listMaxHeight = needsScroll ? MAX_VISIBLE_CLIPS * CLIP_ROW_H : undefined;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="clp-player-popup"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          role="dialog"
          aria-label="Poem audio player"
        >
          {hasSoundcloud ? (
            <iframe
              ref={iframeRef}
              key={`${active?.audioUrl}-${activeIdx}`}
              title={`SoundCloud — ${active?.singer || 'poem audio'}`}
              allow="autoplay; encrypted-media"
              src={soundcloudEmbedSrc(active!.audioUrl!, false)}
              className="clp-soundcloud-widget"
              tabIndex={-1}
              aria-hidden
            />
          ) : null}

          <button
            type="button"
            className="clp-player-popup__close"
            onClick={onClose}
            aria-label="Close player"
          >
            <X size={14} />
          </button>

          <ul
            className={needsScroll ? 'clp-player-clip-scroll' : undefined}
            style={{
              listStyle: 'none',
              margin: '0 0 14px',
              padding: 0,
              maxHeight: listMaxHeight,
              overflowY: needsScroll ? 'auto' : 'visible',
            }}
          >
            {clips.length ? (
              clips.map((v, idx) => (
              <li key={`${v.id || v.singer}-${idx}`}>
                <button
                  type="button"
                  className={`clp-player-clip${idx === activeIdx ? ' is-active' : ''}`}
                  onClick={() => selectTrack(idx)}
                >
                  <span className="clp-player-clip-thumb">
                    {v.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnailUrl} alt="" />
                    ) : null}
                  </span>
                  <span className="clp-player-clip-meta">
                    <span className="clp-player-clip-name">{v.singer}</span>
                    <span className="clp-player-clip-dur">
                      {idx === activeIdx && durationMs > 0
                        ? formatMs(durationMs)
                        : v.duration || ' '}
                    </span>
                  </span>
                </button>
              </li>
              ))
            ) : (
              <li className="clp-player-empty">No recordings for this poem.</li>
            )}
          </ul>

          <div className="clp-player-timeline">
            <span className="clp-player-time">{formatMs(positionMs)}</span>
            <div
              className="clp-player-progress"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPct)}
              tabIndex={0}
              onClick={seekFromClick}
            >
              <div className="clp-player-progress__fill" style={{ width: `${progressPct}%` }}>
                {progressPct > 0 ? <span className="clp-player-progress__knob" /> : null}
              </div>
            </div>
            <span className="clp-player-time">{endLabel}</span>
          </div>

          <div className="clp-player-controls">
            <button type="button" className="clp-player-icon-btn" aria-label="Repeat">
              <Repeat size={16} />
            </button>
            <button
              type="button"
              className="clp-player-icon-btn"
              onClick={skipPrev}
              aria-label="Previous"
            >
              <SkipBack size={18} />
            </button>
            <button
              type="button"
              className={`clp-player-play${isPlaying ? ' is-playing' : ''}`}
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              className="clp-player-icon-btn"
              onClick={skipNext}
              aria-label="Next"
            >
              <SkipForward size={18} />
            </button>
            <div className="clp-player-volume-wrap">
              <button
                type="button"
                className="clp-player-icon-btn clp-player-icon-btn--pink"
                onClick={() => setShowVolume((v) => !v)}
                aria-label="Volume"
                aria-expanded={showVolume}
              >
                <Volume2 size={18} />
              </button>
              {showVolume ? (
                <input
                  type="range"
                  className="clp-player-volume-slider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label="Volume level"
                />
              ) : null}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
