'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import {
  FILTER_DRAWER_HEIGHT,
  FILTER_DRAWER_TOP,
  FILTER_DRAWER_Z_BACKDROP,
  FILTER_DRAWER_Z_PANEL,
} from '@/lib/filterDrawerLayout';
import { FILTER_PANEL_SHAPE } from '@/lib/resolveCmsAssetUrl';
import './CLPoemFilterPanel.css';

type FilterCategory = 'Poet' | 'Theme';

const FALLBACK_FILTERS = {
  Poet: ['Kabir', 'Bulleh Shah', 'Mira Bai', 'Lalon Fakir', 'Rumi', 'Tukaram', 'Surdas', 'Hans'],
  Theme: ['Devotion', 'Death and Impermanence', 'Love', 'Wisdom', 'Unity', 'Inner Search'],
};

const POEMS_PREVIEW_LIST = [
  { title: 'Aa Panchhi Jal Piyein', translation: 'Says Kabir, Come Bird – Drink!' },
  { title: 'Aa Piya More Nainan Mein', translation: 'Come Into My Eyes, My Love' },
  { title: 'Aachhe Din PeechheGaya', translation: 'The Good Times Are Over, Friend' },
  { title: 'Aag Lagi IsVriksh Ko', translation: "The Tree's On Fire" },
  { title: 'Aagam Kyo Achan', translation: 'My Beloved Came Thundering' },
  { title: 'Aaya Hai Sab Jaayega', translation: 'All Who Have Come Will Go' },
  { title: 'Aaye Ek Hi Des Se', translation: 'We Came From One Country' },
];

function poemPreviewTitle(poem: { text?: string; english?: string; id?: string }) {
  const firstLine = (poem.text || '').split('\n')[0]?.trim();
  return firstLine || poem.english?.split('\n')[0]?.trim() || `Poem ${poem.id || ''}`;
}

function poemPreviewTranslation(poem: { english?: string }) {
  const firstLine = (poem.english || '').split('\n')[0]?.trim();
  return firstLine || '';
}

const FONT = "'Merriweather Sans', sans-serif";
const FILTER_W = 'var(--clp-filter-w, 508px)';

export default function CLPoemFilterPanel({
  onSelectPoet,
  onSelectTheme,
  onClearAll,
  selectedPoets = [] as string[],
  selectedThemes = [] as string[],
  matchingPoems = [] as Array<{ id?: string; text?: string; english?: string }>,
}: any) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Poet');
  const [filters, setFilters] = useState(FALLBACK_FILTERS);
  const [listMaxHeight, setListMaxHeight] = useState(480);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(480);

  useEffect(() => {
    setMounted(true);
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/poem_filters`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data || {};
        const poets = (data.poets || []).map((p: any) => p.poet_name || '').filter(Boolean);
        const themes = (data.themes || [])
          .map((t: any) => t.word_transliteration || '')
          .filter(Boolean);
        if (poets.length || themes.length) {
          setFilters({
            Poet: poets.length ? poets : FALLBACK_FILTERS.Poet,
            Theme: themes.length ? themes : FALLBACK_FILTERS.Theme,
          });
        }
      } catch {
        // FALLBACK_FILTERS already set
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const list = filters[activeCategory];
  const selectedFilters = useMemo(
    () => [
      ...selectedPoets.map((value: string) => ({ type: 'Poet' as const, value })),
      ...selectedThemes.map((value: string) => ({ type: 'Theme' as const, value })),
    ],
    [selectedPoets, selectedThemes]
  );

  const handleItemClick = (value: string) => {
    if (activeCategory === 'Poet') onSelectPoet?.(value);
    else onSelectTheme?.(value);
  };

  const recalcThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setListMaxHeight(clientHeight);
    if (scrollHeight <= clientHeight) {
      setThumbHeight(clientHeight);
      setThumbTop(0);
      return;
    }
    const th = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
    const tp = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - th);
    setThumbHeight(th);
    setThumbTop(tp);
  }, []);

  useEffect(() => {
    if (!open) return;
    recalcThumb();
    window.addEventListener('resize', recalcThumb);
    return () => window.removeEventListener('resize', recalcThumb);
  }, [open, list, activeCategory, selectedFilters.length, matchingPoems.length, recalcThumb]);

  const previewRows =
    selectedFilters.length > 0
      ? matchingPoems.length
        ? matchingPoems
        : POEMS_PREVIEW_LIST.map((p) => ({ text: p.title, english: p.translation }))
      : [];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          color: selectedFilters.length ? '#E31E79' : '#828282',
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: '21px',
          lineHeight: '100%',
          letterSpacing: '0.04em',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Filters
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: FILTER_DRAWER_TOP,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: FILTER_DRAWER_Z_BACKDROP,
                    background: 'transparent',
                  }}
                  onClick={() => setOpen(false)}
                />

                <motion.div
                  className="clp-filter-panel"
                  style={{
                    position: 'fixed',
                    top: FILTER_DRAWER_TOP,
                    left: 0,
                    width: FILTER_W,
                    height: FILTER_DRAWER_HEIGHT,
                    minHeight: FILTER_DRAWER_HEIGHT,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: FONT,
                    overflow: 'hidden',
                    zIndex: FILTER_DRAWER_Z_PANEL,
                    pointerEvents: 'auto',
                  }}
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: '#FFFFFF',
                      pointerEvents: 'none',
                    }}
                  />
                  <img
                    src={FILTER_PANEL_SHAPE}
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: FILTER_W,
                      height: '100%',
                      minHeight: '100%',
                      objectFit: 'fill',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  />

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      flex: '1 1 auto',
                      minHeight: 0,
                    }}
                  >
                    <div
                      style={{
                        padding:
                          'var(--clp-filter-pad-top, 68px) var(--clp-filter-pad-x, 45px) 0',
                        flex: '0 0 auto',
                      }}
                    >
                      <div style={{ height: '1px', background: '#B1B1B1' }} />
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '20px 0 18px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                          <span
                            style={{
                              fontFamily: FONT,
                              fontWeight: 300,
                              fontSize: '21px',
                              color: '#333333',
                              marginRight: '24px',
                            }}
                          >
                            Filter by
                          </span>
                          {(['Poet', 'Theme'] as FilterCategory[]).map((cat, idx, arr) => (
                            <span
                              key={cat}
                              style={{ display: 'inline-flex', alignItems: 'center' }}
                            >
                              <button
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                  fontFamily: FONT,
                                  fontWeight: 300,
                                  fontSize: '21px',
                                  color: activeCategory === cat ? '#E31E79' : '#333333',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                }}
                              >
                                {cat}
                              </button>
                              {idx < arr.length - 1 && (
                                <span
                                  style={{
                                    color: '#333333',
                                    fontSize: '21px',
                                    fontWeight: 300,
                                    margin: '0 8px',
                                  }}
                                >
                                  |
                                </span>
                              )}
                            </span>
                          ))}
                        </div>

                        <button
                          onClick={() => setOpen(false)}
                          aria-label="Close filters"
                          style={{
                            color: '#E31E79',
                            fontSize: '22px',
                            lineHeight: 1,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 2px',
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ height: '1px', background: '#B1B1B1' }} />
                    </div>

                    <div
                      style={{
                        position: 'relative',
                        paddingLeft: 'var(--clp-filter-pad-x, 45px)',
                        paddingRight: 'var(--clp-filter-scroll-gutter, 72px)',
                        flex: '1 1 0%',
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div
                        ref={scrollRef}
                        className="clp-filter-list"
                        onScroll={recalcThumb}
                        style={{
                          overflowY: 'scroll',
                          flex: '1 1 0%',
                          minHeight: 0,
                          paddingTop: '16px',
                          paddingBottom: '8px',
                        }}
                      >
                        {selectedFilters.length > 0 ? (
                          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {previewRows.map((poem: any) => {
                              const title = poemPreviewTitle(poem);
                              const translation =
                                poemPreviewTranslation(poem) || poem.translation || '';
                              return (
                                <li
                                  key={poem.id || title}
                                  style={{ padding: '10px 0 14px', cursor: 'default' }}
                                >
                                  <div
                                    style={{
                                      fontFamily: FONT,
                                      fontWeight: 400,
                                      fontSize: '18px',
                                      lineHeight: '24px',
                                      color: '#333333',
                                    }}
                                  >
                                    {title}
                                  </div>
                                  {translation && (
                                    <div
                                      style={{
                                        fontFamily: "'Lora', serif",
                                        fontStyle: 'italic',
                                        fontWeight: 400,
                                        fontSize: '15px',
                                        lineHeight: '20px',
                                        color: '#8B8B8B',
                                        marginTop: 4,
                                      }}
                                    >
                                      {translation}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {list.map((item) => (
                              <li
                                key={item}
                                onClick={() => handleItemClick(item)}
                                style={{
                                  fontFamily: FONT,
                                  fontWeight: 300,
                                  fontSize: '18px',
                                  lineHeight: '24px',
                                  color: '#6F6F72',
                                  cursor: 'pointer',
                                  padding: '16px 0',
                                }}
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                        <p
                          style={{
                            margin: 0,
                            paddingBottom: 24,
                            fontFamily: FONT,
                            fontWeight: 300,
                            fontSize: '14px',
                            color: '#6D6E71',
                            lineHeight: 1.6,
                          }}
                        >
                          Most couplets cannot be attributed to a particular poet due to lack of
                          historic evidence. This authorial ambiguity is in a sense the beauty of the{' '}
                          <span style={{ color: '#E31E79' }}>Oral Traditions</span>.
                        </p>
                      </div>

                      {thumbHeight < listMaxHeight && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '24px',
                            right: 'var(--clp-filter-pad-x, 45px)',
                            width: '9px',
                            height: `${Math.max(listMaxHeight - 48, 0)}px`,
                            background: '#e0e0e0',
                            borderRadius: '3px',
                            pointerEvents: 'none',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: `${listMaxHeight > 48 ? (thumbTop / listMaxHeight) * (listMaxHeight - 48) : 0}px`,
                              width: '9px',
                              height: `${listMaxHeight > 0 ? (thumbHeight / listMaxHeight) * Math.max(listMaxHeight - 48, 0) : 0}px`,
                              background: '#999999',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
