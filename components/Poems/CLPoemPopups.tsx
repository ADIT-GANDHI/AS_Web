'use client';

import type { CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, SkipBack, SkipForward } from 'lucide-react';
import { useState } from 'react';
import WavyPaperPopup from '@/components/shared/WavyPaperPopup';

// ──────────────────────────────────────────────────────────────
// Glossary Popup — anchored variant of the shared WavyPaperPopup.
// All wavy-paper artwork, sizing, close button and typography now
// live in components/shared/WavyPaperPopup so any tweak to the
// glossary card automatically flows to song-notes / future popups.
// ──────────────────────────────────────────────────────────────

export interface GlossaryTerm {
  term: string;
  meaning: string;
  highlighted?: boolean;
}

const DEFAULT_GLOSSARY_BODY =
  "Here's a that gives you a lay of this land, Ajab Shahar — a wondrous city of songs, poems, images and conversations from Bhakti, Sufi & Baul oral traditions from India and around. Here's a that gives you a lay of this land, Ajab Shahar — a wondrous city of songs, poems, images and conversations from Bhakti, Sufi & Baul oral traditions from India and around.";

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
  /** Passed through to `WavyPaperPopup` (anchored) — distance from viewport right. */
  rightAnchor?: string | number;
  /** Merged onto the anchored sheet (e.g. `zIndex` for stacking above other overlays). */
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

// ──────────────────────────────────────────────────────────────
// Player Popup — right-side audio player with versions list
// (matches Figma 362:3591)
// ──────────────────────────────────────────────────────────────

export interface AudioVersion {
  singer: string;
  duration: string;
  thumbnailUrl?: string;
  audioUrl?: string;
}

const MOCK_VERSIONS: AudioVersion[] = [
  { singer: 'Mukhtiyar Ali', duration: '04:36', thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg' },
  { singer: 'Abu Mohammed', duration: '03:47', thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg' },
  { singer: 'Vidya Rao', duration: '04:53', thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg' },
  { singer: 'Parvathy Baul', duration: '05:00', thumbnailUrl: '/TN-About-Basavalingaiah-Hiremath.jpg' },
];

export function CLPlayerPopup({
  isOpen,
  onClose,
  versions = MOCK_VERSIONS,
}: {
  isOpen: boolean;
  onClose: () => void;
  versions?: AudioVersion[];
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => setIsPlaying((p) => !p);
  const skipPrev = () =>
    setActiveIdx((i) => (i === 0 ? versions.length - 1 : i - 1));
  const skipNext = () => setActiveIdx((i) => (i + 1) % versions.length);

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
            className="fixed"
            style={{
              top: '50%',
              right: 'clamp(280px, 20vw, 380px)',
              transform: 'translateY(-50%)',
              width: '320px',
              background: '#FFFFFF',
              borderRadius: '4px',
              boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
              padding: '14px 16px 16px',
              zIndex: 9991,
            }}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            {/* Top: timeline + controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: '11px', color: '#828282', fontFamily: "'Merriweather Sans', sans-serif", minWidth: 28 }}>
                0:00
              </span>
              <div
                style={{
                  flex: 1,
                  height: 3,
                  background: '#E0E0E0',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div style={{ width: '0%', height: '100%', background: '#E31E79' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#828282', fontFamily: "'Merriweather Sans', sans-serif", minWidth: 28, textAlign: 'right' }}>
                {versions[activeIdx]?.duration || '0:00'}
              </span>
              <button
                onClick={onClose}
                aria-label="Close player"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#E31E79',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: 4,
                  lineHeight: 1,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Play controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                marginBottom: 14,
              }}
            >
              <button
                onClick={skipPrev}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#828282', padding: 0 }}
                aria-label="Previous"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlay}
                style={{
                  width: 36,
                  height: 36,
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
                <Play size={16} fill="#fff" />
              </button>
              <button
                onClick={skipNext}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#828282', padding: 0 }}
                aria-label="Next"
              >
                <SkipForward size={18} />
              </button>
            </div>

            {/* Versions list */}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {versions.map((v, idx) => (
                <li
                  key={v.singer}
                  onClick={() => setActiveIdx(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 4px',
                    borderRadius: 3,
                    cursor: 'pointer',
                    background: idx === activeIdx ? '#FAFAFA' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 3,
                      overflow: 'hidden',
                      background: '#f0f0f0',
                      flexShrink: 0,
                    }}
                  >
                    {v.thumbnailUrl && (
                      <img
                        src={v.thumbnailUrl}
                        alt={v.singer}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontWeight: 400,
                        fontSize: '13px',
                        color: idx === activeIdx ? '#E31E79' : '#4F4F4F',
                      }}
                    >
                      {v.singer}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontWeight: 300,
                        fontSize: '11px',
                        color: '#828282',
                      }}
                    >
                      {v.duration}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
