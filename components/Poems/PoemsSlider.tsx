'use client';

import NoteGlossaryPopup from '@/components/NoteGlossaryPopup';
import { type WheelEvent, useEffect, useRef, useState } from 'react';
import './PoemsSlider.css';

type PoemLanguage = 'original' | 'transliteration' | 'translation';

interface Poem {
  id: string;
  title?: string;
  original_title?: string;
  original_text?: string;
  note_text?: string;
  glossary?: string | null;
  englishTransliteration?: string;
  englishTranslation?: string;
  english_transliteration_text?: string;
  english_translation_text?: string;
  metaDescription?: string;
  meta_description?: string;
  poet?: {
    id: string;
    name: string;
  };
  poets?: Array<{ id: number; name: string }>;
  attributed_poet?: string;
}

interface PoemsSliderProps {
  poems?: Poem[];
  title?: string;
  onPoemChange?: (poemId: string) => void;
}

function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
}: {
  selectedLanguage: PoemLanguage;
  onLanguageChange: (value: PoemLanguage) => void;
}) {
  const languages: Array<{ id: number; label: string; value: PoemLanguage }> = [
    { id: 1, label: 'अ', value: 'original' },
    { id: 2, label: 'ā', value: 'transliteration' },
    { id: 3, label: 'a', value: 'translation' },
  ];

  return (
    <div className="flex items-center justify-center gap-4 language-button">
      {languages.map((lang) => (
        <div
          key={lang.id}
          onClick={() => onLanguageChange(lang.value)}
          className={`w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 cursor-pointer ${
            selectedLanguage === lang.value
              ? 'bg-white text-pink shadow-md border-pink-200'
              : 'bg-white text-gray-500 hover:text-pink-600 hover:border-pink-300'
          }`}
        >
          <span className="text-lg font-medium">{lang.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function PoemsSlider({ poems = [], onPoemChange }: PoemsSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Set default to 'transliteration' (ā)
  const [selectedLanguage, setSelectedLanguage] = useState<PoemLanguage>('transliteration');
  const [showNotes, setShowNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const musicPanelRef = useRef<HTMLDivElement | null>(null);
  const wheelCooldownRef = useRef(false);

  const updateSlide = (nextIndex: number) => {
    setCurrentIndex(nextIndex);
    const nextPoemId = poems[nextIndex]?.id;
    if (nextPoemId && onPoemChange) {
      onPoemChange(nextPoemId);
    }
  };

  const nextSlide = () => {
    const nextIndex = currentIndex === poems.length - 1 ? 0 : currentIndex + 1;
    updateSlide(nextIndex);
  };

  const prevSlide = () => {
    const nextIndex = currentIndex === 0 ? poems.length - 1 : currentIndex - 1;
    updateSlide(nextIndex);
  };

  useEffect(() => {
    if (currentIndex <= poems.length - 1) return;
    setCurrentIndex(0);
  }, [currentIndex, poems.length]);

  useEffect(() => {
    const poemId = poems[currentIndex]?.id;
    if (!poemId || !onPoemChange) return;
    onPoemChange(poemId);
  }, [currentIndex, onPoemChange, poems]);

  useEffect(() => {
    if (!showMusic) return;

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (!musicPanelRef.current?.contains(event.target as Node)) {
        setShowMusic(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showMusic]);

  const handleWheelSlide = (event: WheelEvent<HTMLDivElement>) => {
    if (poems.length < 2) return;
    if (wheelCooldownRef.current) return;

    if (event.deltaY > 0) {
      nextSlide();
    } else if (event.deltaY < 0) {
      prevSlide();
    }

    wheelCooldownRef.current = true;
    window.setTimeout(() => {
      wheelCooldownRef.current = false;
    }, 450);
  };

  if (!poems.length) return null;

  const currentPoem = poems[currentIndex];

  const poemCopy = (() => {
    if (selectedLanguage === 'transliteration') {
      return {
        title: currentPoem.english_transliteration_text || currentPoem.englishTransliteration || '',
        description: '',
      };
    }

    if (selectedLanguage === 'translation') {
      return {
        title: currentPoem.english_translation_text || currentPoem.englishTranslation || '',
        description: '',
      };
    }

    return {
      title: currentPoem.original_title || currentPoem.title || 'Untitled Poem',
      description: '',
    };
  })();

  const poetName =
    currentPoem.attributed_poet ||
    currentPoem.poet?.name ||
    currentPoem.poets?.[0]?.name ||
    'Unknown Poet';

  return (
    <div className="poems-slider" onWheel={handleWheelSlide}>
      {/* Music Icon Button at Top */}
      <div className="poem-volume-trigger" ref={musicPanelRef}>
        <button
          className="music-btn"
          style={{ background: 'white', border: 'none', borderRadius: '50%', width: 48, height: 48, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onClick={() => setShowMusic((current) => !current)}
          aria-label="Open music player"
        >
          <img src="speaker.png" alt="" />
          {/* <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E31E79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg> */}
        </button>
        {showMusic && (
          <div className="poem-music-popover">
            <div className="poem-music-progress">
              <span className="poem-music-elapsed">0:16</span>
              <div className="poem-music-bar">
                <div className="poem-music-bar-fill" />
              </div>
              <span className="poem-music-total">06:13</span>
            </div>

            <div className="poem-music-controls">
              <button type="button" aria-label="Previous track" className="poem-music-ctrl">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#bdbdbd"><polygon points="19,5 19,19 8,12" /><rect x="5" y="5" width="2" height="14" /></svg>
              </button>
              <button type="button" aria-label="Play track" className="poem-music-play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ed1e79"><polygon points="6,4 20,12 6,20" /></svg>
              </button>
              <button type="button" aria-label="Next track" className="poem-music-ctrl">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#bdbdbd"><polygon points="5,5 5,19 16,12" /><rect x="17" y="5" width="2" height="14" /></svg>
              </button>
            </div>

            <div className="poem-music-tracklist">
              {[
                { name: 'Mokhtiya Ali', time: '02:18' },
                { name: 'Abu Mohammed', time: '04:06' },
                { name: 'Vidya Rao', time: '03:42' },
                { name: 'Parvathy Baul', time: '05:01' },
              ].map((t, index) => (
                <div key={t.name} className="poem-music-track">
                  <img
                    src={`https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${index + 21}.jpg`}
                    alt={t.name}
                  />
                  <div className="poem-music-track-meta">
                    <div className="poem-music-track-name">{t.name}</div>
                    <div className="poem-music-track-time">{t.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="slider-header">
        <div className="slider-controls">
          <button onClick={prevSlide} className="slider-btn prev-btn" aria-label="Previous poem">
            <svg xmlns="http://www.w3.org/2000/svg" width="22.69" height="41.19" viewBox="0 0 26 51" fill="none">
              <path
                d="M22.8301 0.359375C22.1201 0.619375 21.6001 1.16939 21.0901 1.74939C14.6701 8.90939 8.2401 16.0694 1.8101 23.2294C0.910101 24.2294 0.720112 25.3994 1.29011 26.4794C1.42011 26.7294 1.6001 26.9494 1.7801 27.1594C8.3601 34.4894 14.9401 41.8194 21.5301 49.1494C22.7801 50.5394 24.6001 50.2894 25.3101 48.6194C25.6801 47.7394 25.6001 46.8894 25.1001 46.0994C24.9601 45.8794 24.7801 45.6794 24.6101 45.4894C18.6801 38.8794 12.7401 32.2694 6.80009 25.6594C6.68009 25.5294 6.5101 25.4393 6.3701 25.3293C6.3701 25.2593 6.3701 25.1794 6.3701 25.1094C6.5101 24.9994 6.68009 24.9094 6.80009 24.7794C12.7701 18.1394 18.7301 11.4994 24.7001 4.84937C25.6101 3.82937 25.7901 2.63945 25.1901 1.55945C24.8501 0.929448 24.3001 0.619385 23.7101 0.369385H22.8401L22.8301 0.359375Z"
                fill="#B3B3B3"
              />
            </svg>
          </button>
          <button onClick={nextSlide} className="slider-btn next-btn" aria-label="Next poem">
            <svg xmlns="http://www.w3.org/2000/svg" width="22.69" height="41.19" viewBox="0 0 26 51" fill="none">
              <path
                d="M3.21029 0.359375C3.92029 0.619375 4.44028 1.16939 4.95028 1.74939C11.3703 8.90939 17.8003 16.0694 24.2303 23.2294C25.1303 24.2294 25.3203 25.3994 24.7503 26.4794C24.6203 26.7294 24.4403 26.9494 24.2603 27.1594C17.6803 34.4894 11.1003 41.8194 4.51034 49.1494C3.26034 50.5394 1.44031 50.2894 0.73031 48.6194C0.36031 47.7394 0.440271 46.8894 0.940271 46.0994C1.08027 45.8794 1.26038 45.6794 1.43038 45.4894C7.36038 38.8794 13.3003 32.2694 19.2403 25.6594C19.3603 25.5294 19.5304 25.4393 19.6704 25.3293C19.6704 25.2593 19.6704 25.1794 19.6704 25.1094C19.5304 24.9994 19.3603 24.9094 19.2403 24.7794C13.2703 18.1394 7.3103 11.4994 1.3403 4.84937C0.430295 3.82937 0.250305 2.63945 0.850305 1.55945C1.19031 0.929448 1.74029 0.619385 2.33029 0.369385H3.20028L3.21029 0.359375Z"
                fill="#B3B3B3"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="slider-content">
        <div className="poem-card">
          <div className="poem-text-content">
            <p className="poem-transliteration">{poemCopy.title}</p>
            {poemCopy.description ? <p className="poem-translation">{poemCopy.description}</p> : null}
            <div className="poem-meta">
              <div className="poet-info">
                <span className="poet-label">poet</span>
                <span className="poet-name">{poetName}</span>
              </div>
            </div>
          </div>

          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />

          <div className="poem-actions">
            <button
              className="action-btn"
              onClick={() => {
                setShowNotes(true);
                setShowGlossary(false);
              }}
            >
              NOTES
            </button>
            <span className="action-divider">|</span>
            <button
              className="action-btn"
              onClick={() => {
                setShowGlossary(true);
                setShowNotes(false);
              }}
            >
              GLOSSARY
            </button>
          </div>

          {/* Notes Popup (left) */}
          {showNotes && (
            <NoteGlossaryPopup
              title="Poem Notes"
              content={currentPoem.note_text}
              fallbackText="No notes available."
              side="left"
              onClose={() => setShowNotes(false)}
            />
          )}

          {/* Glossary Popup (right) */}
          {showGlossary && (
            <NoteGlossaryPopup
              title="Glossary"
              content={currentPoem.glossary}
              fallbackText="No glossary available."
              side="right"
              onClose={() => setShowGlossary(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
