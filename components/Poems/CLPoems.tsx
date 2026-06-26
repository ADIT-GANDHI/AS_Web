'use client';

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Volume2,
} from 'lucide-react';

import {
  POEMS_INTRO,
  MOCK_POEMS,
  POEMS_RELATED,
  POEMS_GLOSSARY,
  TOTAL_POEMS,
  PoemData,
} from './CLPoemMocks';
import { PoemsNavCountContext } from './PoemsNavCountContext';
import CLPoemFilterPanel from './CLPoemFilterPanel';
import { CLGlossaryPopup, CLPlayerPopup } from './CLPoemPopups';
import GlossaryStrip from '@/components/shared/GlossaryStrip';
import WavyPaperPopup from '@/components/shared/WavyPaperPopup';
import Loader from '@/components/Loader';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css'; // for marble bg root + floating buttons
import '@/components/Songs/CLSongDetails.css'; // sidebar styles
import './CLPoems.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { mergeCatalogById } from '@/lib/catalogPagination';
import { mapPoemListItem } from '@/lib/mapPoemListItem';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';

const POEMS_PAGE_SIZE = 10;
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';

type Script = 'devanagari' | 'transliteration' | 'english';

function normalizeFilterToken(value: string): string {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function fieldMatchesFilters(field: string, names: string[]): boolean {
  if (!names.length) return true;
  const parts = String(field || '')
    .split(/[&,]/)
    .map((part) => normalizeFilterToken(part))
    .filter(Boolean);
  if (!parts.length) return false;
  return names.some((name) => {
    const needle = normalizeFilterToken(name);
    return parts.some((part) => part.includes(needle) || needle.includes(part));
  });
}

export default function CLPoems() {
  const { setPoemsNavTotal } = useContext(PoemsNavCountContext);
  const [poems, setPoems] = useState<PoemData[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [script, setScript] = useState<Script>('transliteration');
  const [activeRelatedTab, setActiveRelatedTab] = useState<
    'all' | 'songs' | 'poems' | 'reflections' | 'other'
  >('songs');
  const [related, setRelated] = useState<RelatedContent>(EMPTY_RELATED);
  const [totalPoems, setTotalPoems] = useState(0);
  const [poemsLoading, setPoemsLoading] = useState(true);
  const [loadingMorePoems, setLoadingMorePoems] = useState(false);
  const [apiPage, setApiPage] = useState(1);

  // Filter + sidebar state
  const [selectedPoets, setSelectedPoets] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const togglePoet = (v: string) =>
    setSelectedPoets((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  const toggleTheme = (v: string) =>
    setSelectedThemes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  const [showPoemList, setShowPoemList] = useState(false);
  const [filterPanelKey, setFilterPanelKey] = useState(0);

  const clearAllFilters = () => {
    setSelectedPoets([]);
    setSelectedThemes([]);
  };

  const handleSeeAll = () => {
    clearAllFilters();
    setShowPoemList(true);
    setActiveIdx(0);
    setShowNotes(false);
    setShowGlossary(false);
    setShowPlayer(false);
    setFilterPanelKey((k) => k + 1);
    void fetchPoemsPage(1, true);
  };

  const fetchPoemsPage = useCallback(async (page: number, reset: boolean) => {
    if (reset) setPoemsLoading(true);
    else setLoadingMorePoems(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(
        `${AJAB_API_BASE}/Api/poems?page=${page}&limit=${POEMS_PAGE_SIZE}`,
        { cache: 'no-store', signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) return;

      const data = await res.json();
      if (data?.data && Array.isArray(data.data) && data.data.length) {
        const list = data.data.map((it: Record<string, unknown>) => mapPoemListItem(it));
        setPoems((prev) => (reset ? list : mergeCatalogById(prev, list)));
        if (reset) setActiveIdx(0);
      }

      const apiTotal = parseCatalogTotal(data.total);
      if (apiTotal != null) setTotalPoems(apiTotal);
      setApiPage(page);
    } catch {
      clearTimeout(timeoutId);
      if (reset) {
        setPoems(MOCK_POEMS);
        setTotalPoems(TOTAL_POEMS);
      }
    } finally {
      setPoemsLoading(false);
      setLoadingMorePoems(false);
    }
  }, []);

  useEffect(() => {
    void fetchPoemsPage(1, true);
  }, [fetchPoemsPage]);

  // [Claude] these changes have been recommended by claude — push live count to nav via context
  useEffect(() => {
    if (totalPoems > 0) setPoemsNavTotal(totalPoems);
  }, [totalPoems, setPoemsNavTotal]);

  const filteredPoems = useMemo(() => {
    if (!selectedPoets.length && !selectedThemes.length) return poems;
    return poems.filter((poem) => {
      const poetOk = fieldMatchesFilters(poem.poet || '', selectedPoets);
      const themeOk = fieldMatchesFilters(poem.glossary || '', selectedThemes);
      return poetOk && themeOk;
    });
  }, [poems, selectedPoets, selectedThemes]);

  useEffect(() => {
    if (poemsLoading || loadingMorePoems) return;
    if (totalPoems > 0 && poems.length >= totalPoems) return;
    if (filteredPoems.length === 0) return;
    if (activeIdx < Math.max(0, filteredPoems.length - 2)) return;
    void fetchPoemsPage(apiPage + 1, false);
  }, [
    activeIdx,
    apiPage,
    fetchPoemsPage,
    filteredPoems.length,
    loadingMorePoems,
    poems.length,
    poemsLoading,
    totalPoems,
  ]);

  useEffect(() => {
    setActiveIdx(0);
  }, [selectedPoets, selectedThemes]);

  useEffect(() => {
    if (activeIdx >= filteredPoems.length && filteredPoems.length > 0) {
      setActiveIdx(0);
    }
  }, [activeIdx, filteredPoems.length]);

  const activePoem = filteredPoems[activeIdx] || filteredPoems[0];

  useEffect(() => {
    if (!activePoem?.id) {
      setRelated(EMPTY_RELATED);
      return;
    }
    let cancelled = false;
    fetchRelatedByParam('poem_id', activePoem.id).then((result) => {
      if (cancelled) return;
      setRelated(result || asRelatedContent(POEMS_RELATED));
    });
    return () => {
      cancelled = true;
    };
  }, [activePoem?.id]);

  const goPrev = () =>
    setActiveIdx((i) =>
      filteredPoems.length ? (i === 0 ? filteredPoems.length - 1 : i - 1) : 0
    );
  const goNext = () =>
    setActiveIdx((i) => (filteredPoems.length ? (i + 1) % filteredPoems.length : 0));

  const poemText = useMemo(() => {
    if (!activePoem) return '';
    if (script === 'devanagari' && activePoem.hindi) return activePoem.hindi;
    if (script === 'english' && activePoem.english) return activePoem.english;
    return activePoem.text;
  }, [script, activePoem]);

  // Tabs config
  const counts = related.counts;
  const tabs = [
    { key: 'all' as const, label: 'ALL', count: counts.all },
    { key: 'songs' as const, label: 'SONGS', count: counts.songs },
    { key: 'poems' as const, label: 'POEMS', count: counts.poems },
    { key: 'reflections' as const, label: 'REFLECTIONS', count: counts.reflections },
    { key: 'other' as const, label: 'OTHER', count: counts.other },
  ];

  const visibleItems = useMemo(() => {
    const data = related.data as any;
    if (activeRelatedTab === 'all') {
      return [
        ...(data.songs || []),
        ...(data.poems || []),
        ...(data.reflections || []),
        ...(data.other || []),
      ];
    }
    return data[activeRelatedTab] || [];
  }, [activeRelatedTab, related]);

  const glossaryBody =
    activePoem?.glossary ||
    POEMS_GLOSSARY.map((g) => `${g.term} — ${g.meaning}`).join('\n\n');

  if (poemsLoading) {
    return <Loader />;
  }

  return (
    <div className="cl-songs-page-root clp-page-root-wrap">
      {/* Header outside .clp-page-root (z-index: 1) so portaled filter (9999) stacks behind it — same as /songs */}
      <Header />
      <div className="clp-page-root">
        <main className="relative z-10">
          <div
            className="clp-page"
            style={{ '--clp-nav-count': String(totalPoems) } as React.CSSProperties}
          >
            {/* Intro paragraph */}
            <p className="clp-intro">{POEMS_INTRO}</p>

            {/* Count row */}
            <div className="clp-count-row">
              <h1 className="clp-count">
                {selectedPoets.length || selectedThemes.length
                  ? `${filteredPoems.length} Poems`
                  : `${totalPoems} Poems`}
              </h1>
            </div>

            {/* Filters trigger + See All row + filtered-by indicator */}
            <div className="clp-seeall-row">
              <CLPoemFilterPanel
                key={filterPanelKey}
                onSelectPoet={togglePoet}
                onSelectTheme={toggleTheme}
                onClearAll={clearAllFilters}
                selectedPoets={selectedPoets}
                selectedThemes={selectedThemes}
                matchingPoems={filteredPoems}
              />
              <span style={{ color: '#828282', margin: '0 14px' }}>|</span>
              <button type="button" className="clp-seeall" onClick={handleSeeAll}>
                See All
              </button>
              {(selectedPoets.length > 0 || selectedThemes.length > 0) && (
                <span
                  style={{
                    marginLeft: 24,
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontWeight: 300,
                    fontSize: '15px',
                    color: '#828282',
                  }}
                >
                  Filtered by{' '}
                  <span style={{ color: selectedPoets.length ? '#E31E79' : '#333' }}>Poet</span>
                  {' | '}
                  <span style={{ color: selectedThemes.length ? '#E31E79' : '#333' }}>Theme</span>
                </span>
              )}
            </div>

            {/* Centered poem slider */}
            <div className="clp-slider-wrap">
              <button
                className="clp-slider-nav left"
                aria-label="Previous poem"
                onClick={goPrev}
              >
                <ChevronLeft size={28} strokeWidth={1.6} />
              </button>

              <div className="clp-poem-center">
                <div className="clp-halo-circle">
                  <button
                    className="clp-audio-btn"
                    aria-label="Open audio player"
                    onClick={() => {
                      setShowPlayer(true);
                      setShowGlossary(false);
                      setShowNotes(false);
                    }}
                  >
                    <Volume2 size={24} />
                  </button>

                  { !activePoem ? (
                    <div className="clp-poem-text">No poems match the active filters.</div>
                  ) : (
                  <>
                  <Link
                    href={`/poems/${activePoem.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="clp-poem-text">{poemText}</div>
                  </Link>

                  {activePoem.poet && (
                    <div className="clp-poem-poet">
                      poet <span className="name">{activePoem.poet}</span>
                    </div>
                  )}
                  </>
                  )}

                  {/* Language toggle + notes — inside baked circle (Figma 362:3352 / 362:3350) */}
                  <div className="clp-halo-controls">
                    <div className="clp-lang-toggle" role="tablist">
                      <button
                        className={`clp-lang-btn${script === 'devanagari' ? ' active' : ''}`}
                        onClick={() => setScript('devanagari')}
                        aria-label="Devanagari"
                      >
                        अ
                      </button>
                      <button
                        className={`clp-lang-btn${script === 'transliteration' ? ' active' : ''}`}
                        onClick={() => setScript('transliteration')}
                        aria-label="Transliteration"
                      >
                        ā
                      </button>
                      <button
                        className={`clp-lang-btn${script === 'english' ? ' active' : ''}`}
                        onClick={() => setScript('english')}
                        aria-label="English"
                      >
                        a
                      </button>
                    </div>

                    {(activePoem?.noteText || activePoem?.glossary) && (
                      <div className="clp-notes-glossary">
                        {activePoem?.noteText && (
                          <button
                            className={showNotes ? 'is-active' : undefined}
                            onClick={() => {
                              setShowNotes((v) => !v);
                              setShowGlossary(false);
                              setShowPlayer(false);
                            }}
                          >
                            NOTES
                          </button>
                        )}
                        {activePoem?.noteText && activePoem?.glossary && (
                          <span className="sep">|</span>
                        )}
                        {activePoem?.glossary && (
                          <button
                            className={showGlossary ? 'is-active' : undefined}
                            onClick={() => {
                              setShowGlossary((v) => !v);
                              setShowNotes(false);
                              setShowPlayer(false);
                            }}
                          >
                            GLOSSARY
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                className="clp-slider-nav right"
                aria-label="Next poem"
                onClick={goNext}
              >
                <ChevronRight size={28} strokeWidth={1.6} />
              </button>
            </div>

            {showPoemList && poems.length > 0 && (
              <section className="clp-poem-catalog" aria-label="All poems">
                {poems.map((poem, idx) => (
                  <Link
                    key={poem.id || idx}
                    href={poem.id ? `/poems/${poem.id}` : '/poems'}
                    className="clp-poem-catalog-item"
                    onClick={() => setActiveIdx(idx)}
                  >
                    <span className="clp-poem-catalog-title">
                      {(poem.text || '').split('\n')[0]?.trim() || poem.english || `Poem ${idx + 1}`}
                    </span>
                    {poem.poet && <span className="clp-poem-catalog-poet">{poem.poet}</span>}
                  </Link>
                ))}
              </section>
            )}

            {/* Related section — [Claude] these changes have been recommended by claude:
                hidden entirely when the current poem has no related content
                (an all-zero tab row + "No related items" + SEE MORE reads as clutter) */}
            {counts.all > 0 && (
            <section className="clp-related">
              <h2 className="clp-related-title">Related</h2>
              <div className="clp-related-tabs">
                {tabs.map((t, i) => (
                  <span
                    key={t.key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 16,
                    }}
                  >
                    <button
                      className={`clp-related-tab${activeRelatedTab === t.key ? ' active' : ''}`}
                      onClick={() => setActiveRelatedTab(t.key)}
                    >
                      {t.label}
                      <span className="clp-related-tab-count">({t.count})</span>
                    </button>
                    {i < tabs.length - 1 && (
                      <span className="clp-related-tab-sep">|</span>
                    )}
                  </span>
                ))}
              </div>
              <div className="clp-related-list">
                {visibleItems.length ? (
                  visibleItems.map((item: any) => (
                    <div key={item.id || item.title} className="clp-related-item">
                      <div className="clp-related-thumb">
                        {item.thumbnailUrl && (
                          <img src={item.thumbnailUrl} alt={item.title} />
                        )}
                      </div>
                      <div className="clp-related-body">
                        <div className="clp-related-titlerow">
                          <span className="clp-related-itemtitle">
                            {item.title}
                          </span>
                          {item.subtitle && (
                            <span className="clp-related-itemsubtitle">
                              {item.subtitle}
                            </span>
                          )}
                        </div>
                        <div className="clp-related-itemdesc">{item.about}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 16, color: '#828282' }}>
                    No related items.
                  </div>
                )}
              </div>
              <a className="clp-related-seemore">SEE MORE</a>
            </section>
            )}

            {/* Glossary strip — shared GlossaryStrip primitive (2+3 split). */}
            <GlossaryStrip terms={POEMS_GLOSSARY} />
          </div>
        </main>
        {/* Notes — anchored wavy paper popup (left of poem) */}
        <WavyPaperPopup
          variant="anchored"
          isOpen={showNotes}
          onClose={() => setShowNotes(false)}
          title="Poem Notes"
          style={{
            right: 'auto',
            left: 'clamp(72px, 8vw, 120px)',
            top: '42%',
            transform: 'translateY(-50%)',
          }}
        >
          {activePoem?.noteText || 'No notes available.'}
        </WavyPaperPopup>

        {/* Glossary — anchored wavy paper popup (Figma 362:3975) */}
        <CLGlossaryPopup
          isOpen={showGlossary}
          onClose={() => setShowGlossary(false)}
          body={glossaryBody}
          rightAnchor="clamp(160px, 14vw, 300px)"
        />

        <CLPlayerPopup isOpen={showPlayer} onClose={() => setShowPlayer(false)} />
      </div>
    </div>
  );
}
