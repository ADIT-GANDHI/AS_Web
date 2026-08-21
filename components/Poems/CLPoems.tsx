'use client';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

import {
  POEMS_INTRO,
  MOCK_POEMS,
  POEMS_RELATED,
  TOTAL_POEMS,
  PoemData,
} from './CLPoemMocks';
import { PoemsNavCountContext } from './PoemsNavCountContext';
import { CLGlossaryPopup, CLPlayerPopup, CLSideSheet } from './CLPoemPopups';
import ExploreSection from '@/components/shared/ExploreSection';
import CLFilterPanel from '@/components/Fillter/CLFilterPanel';
import type {
  ListingFilterCategory,
  ListingFilterOption,
} from '@/components/shared/listingFilterTypes';
import Loader from '@/components/Loader';
import Link from 'next/link';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Songs/CLSongDetails.css';
import './CLPoems.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { mapPoemListItem } from '@/lib/mapPoemListItem';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { fetchPoemFilterOptions } from '@/lib/poemFilters';
import {
  fetchPoemListen,
  toAudioVersions,
} from '@/lib/poemAudio';
import type { AudioVersion } from './CLPoemPopups';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  relatedGlossaryTerms,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';

type Script = 'devanagari' | 'transliteration' | 'english';

const CATALOG_LIMIT = 300;
const NOTES_LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

export default function CLPoems() {
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('id') || '';
  const { setPoemsNavTotal } = useContext(PoemsNavCountContext);
  const [poems, setPoems] = useState<PoemData[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [script, setScript] = useState<Script>('transliteration');
  const [related, setRelated] = useState<RelatedContent>(EMPTY_RELATED);
  const [totalPoems, setTotalPoems] = useState(0);
  const [poemsLoading, setPoemsLoading] = useState(true);

  const [poetOptions, setPoetOptions] = useState<ListingFilterOption[]>([]);
  const [themeOptions, setThemeOptions] = useState<ListingFilterOption[]>([]);
  const [selectedPoetIds, setSelectedPoetIds] = useState<string[]>([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState<string[]>([]);
  const [filterOrder, setFilterOrder] = useState<Array<'Poet' | 'Theme'>>([]);
  const [poetFetchPoems, setPoetFetchPoems] = useState<PoemData[]>([]);

  const [sidePanel, setSidePanel] = useState<'listen' | 'notes' | 'glossary' | null>(null);
  const showPlayer = sidePanel === 'listen';
  const showNotes = sidePanel === 'notes';
  const showGlossary = sidePanel === 'glossary';
  const closeSidePanel = useCallback(() => setSidePanel(null), []);
  const toggleSidePanel = useCallback((panel: 'listen' | 'notes' | 'glossary') => {
    setSidePanel((prev) => (prev === panel ? null : panel));
  }, []);

  useEffect(() => {
    if (!sidePanel) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSidePanel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidePanel, closeSidePanel]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [listenVersions, setListenVersions] = useState<AudioVersion[]>([]);
  const skipFilterResetRef = useRef(false);

  const primaryFilter = filterOrder[0] ?? null;

  const poetNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of poetOptions) map.set(p.id, p.label);
    return map;
  }, [poetOptions]);

  const clearAllFilters = useCallback(() => {
    setSelectedPoetIds([]);
    setSelectedThemeIds([]);
    setFilterOrder([]);
    setPoetFetchPoems([]);
  }, []);

  const handleFilterSelect = (type: ListingFilterCategory, value: string) => {
    if (type === 'Poet') {
      const removing = selectedPoetIds.includes(value);
      if (removing) {
        const next = selectedPoetIds.filter((x) => x !== value);
        setSelectedPoetIds(next);
        if (!next.length) setFilterOrder((order) => order.filter((d) => d !== 'Poet'));
      } else {
        setSelectedPoetIds([...selectedPoetIds, value]);
        setFilterOrder((order) => (order.includes('Poet') ? order : [...order, 'Poet']));
      }
      return;
    }
    if (type === 'Theme') {
      const removing = selectedThemeIds.includes(value);
      if (removing) {
        const next = selectedThemeIds.filter((x) => x !== value);
        setSelectedThemeIds(next);
        if (!next.length) setFilterOrder((order) => order.filter((d) => d !== 'Theme'));
      } else {
        setSelectedThemeIds([...selectedThemeIds, value]);
        setFilterOrder((order) => (order.includes('Theme') ? order : [...order, 'Theme']));
      }
    }
  };

  const handleRemoveFilter = (type: ListingFilterCategory, value: string) => {
    if (type === 'Poet') {
      setSelectedPoetIds((prev) => {
        const next = prev.filter((x) => x !== value);
        if (!next.length) setFilterOrder((order) => order.filter((d) => d !== 'Poet'));
        return next;
      });
      return;
    }
    if (type === 'Theme') {
      setSelectedThemeIds((prev) => {
        const next = prev.filter((x) => x !== value);
        if (!next.length) setFilterOrder((order) => order.filter((d) => d !== 'Theme'));
        return next;
      });
    }
  };

  const fetchCatalog = useCallback(async () => {
    setPoemsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const [{ poets, themes }, poemsRes] = await Promise.all([
        fetchPoemFilterOptions(),
        fetch(`${AJAB_API_BASE}/Api/poems?page=1&limit=${CATALOG_LIMIT}`, {
          cache: 'no-store',
          signal: controller.signal,
        }),
      ]);
      clearTimeout(timeoutId);

      setPoetOptions(poets);
      setThemeOptions(themes);
      const nameMap = new Map(poets.map((p) => [p.id, p.label]));

      if (poemsRes.ok) {
        const data = await poemsRes.json();
        if (data?.data && Array.isArray(data.data) && data.data.length) {
          setPoems(
            data.data.map((it: Record<string, unknown>) => mapPoemListItem(it, nameMap))
          );
        }
        const apiTotal = parseCatalogTotal(data.total);
        if (apiTotal != null) setTotalPoems(apiTotal);
        else if (Array.isArray(data?.data)) setTotalPoems(data.data.length);
      }
    } catch {
      clearTimeout(timeoutId);
      setPoems(MOCK_POEMS);
      setTotalPoems(TOTAL_POEMS);
    } finally {
      setPoemsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (totalPoems > 0) setPoemsNavTotal(totalPoems);
  }, [totalPoems, setPoemsNavTotal]);

  useEffect(() => {
    if (!selectedPoetIds.length) {
      setPoetFetchPoems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const nameMap = poetNameById;
      const chunks = await Promise.all(
        selectedPoetIds.map(async (id) => {
          try {
            const res = await fetch(
              `${AJAB_API_BASE}/Api/poems?page=1&limit=${CATALOG_LIMIT}&poet=${encodeURIComponent(id)}`,
              { cache: 'no-store' }
            );
            if (!res.ok) return [] as PoemData[];
            const data = await res.json();
            if (!Array.isArray(data?.data)) return [] as PoemData[];
            return data.data.map((it: Record<string, unknown>) => mapPoemListItem(it, nameMap));
          } catch {
            return [] as PoemData[];
          }
        })
      );
      if (cancelled) return;
      const byId = new Map<string, PoemData>();
      for (const list of chunks) {
        for (const poem of list) {
          if (poem.id) byId.set(poem.id, poem);
        }
      }
      setPoetFetchPoems([...byId.values()]);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPoetIds, poetNameById]);

  const catalogForFilter = useMemo(() => {
    if (!selectedPoetIds.length) return poems;
    if (poetFetchPoems.length) return poetFetchPoems;
    return poems.filter(
      (poem) => poem.poetId && selectedPoetIds.includes(poem.poetId)
    );
  }, [poems, selectedPoetIds, poetFetchPoems]);

  const filteredPoems = useMemo(() => {
    if (!selectedPoetIds.length && !selectedThemeIds.length) return poems;
    if (!selectedThemeIds.length) return catalogForFilter;
    return catalogForFilter.filter((poem) =>
      (poem.keywordIds || []).some((kid) => selectedThemeIds.includes(kid))
    );
  }, [poems, catalogForFilter, selectedPoetIds, selectedThemeIds]);

  useEffect(() => {
    if (skipFilterResetRef.current) {
      skipFilterResetRef.current = false;
      return;
    }
    setActiveIdx(0);
  }, [selectedPoetIds, selectedThemeIds]);

  useEffect(() => {
    if (activeIdx >= filteredPoems.length && filteredPoems.length > 0) {
      setActiveIdx(0);
    }
  }, [activeIdx, filteredPoems.length]);

  useEffect(() => {
    if (!deepLinkId || poemsLoading || !poems.length) return;
    const idx = poems.findIndex((p) => p.id === deepLinkId);
    if (idx < 0) return;
    skipFilterResetRef.current = true;
    setSelectedPoetIds([]);
    setSelectedThemeIds([]);
    setFilterOrder([]);
    setPoetFetchPoems([]);
    setActiveIdx(idx);
  }, [deepLinkId, poemsLoading, poems]);

  const activePoem = filteredPoems[activeIdx] || filteredPoems[0];

  useEffect(() => {
    if (!activePoem?.id) {
      setListenVersions([]);
      return;
    }
    let cancelled = false;
    fetchPoemListen(activePoem.id).then((tracks) => {
      if (cancelled) return;
      setListenVersions(toAudioVersions(tracks));
    });
    return () => {
      cancelled = true;
    };
  }, [activePoem?.id]);

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

  const glossaryTerms = useMemo(() => relatedGlossaryTerms(related), [related]);

  const notesBody =
    (activePoem?.noteText && activePoem.noteText.trim()) || NOTES_LOREM;

  const displayCount =
    selectedPoetIds.length || selectedThemeIds.length
      ? filteredPoems.length
      : totalPoems || poems.length;

  const catalogEntries = useMemo(
    () =>
      filteredPoems.map((poem) => ({
        id: poem.id,
        label: poem.title || poem.text.split('\n')[0] || 'Untitled',
        sublabel: poem.translationTitle || undefined,
      })),
    [filteredPoems]
  );

  const selectPoemById = useCallback(
    (id: string) => {
      const idx = filteredPoems.findIndex((poem) => poem.id === id);
      if (idx < 0) return;
      skipFilterResetRef.current = true;
      setActiveIdx(idx);
      setFilterPanelOpen(false);
    },
    [filteredPoems]
  );

  if (poemsLoading) {
    return <Loader />;
  }

  return (
    <div className="cl-songs-page-root clp-page-root-wrap">
      <Header />
      <div className="clp-page-root">
        <main className="relative z-10">
          <div
            className="clp-page"
            style={{ '--clp-nav-count': String(totalPoems) } as React.CSSProperties}
          >
            <p className="clp-intro">{POEMS_INTRO}</p>

            <div className="clp-toolbar">
              <h1 className="clp-count">{displayCount} Poems</h1>
              <div className="clp-toolbar-right">
                <CLFilterPanel
                  hideTrigger
                  open={filterPanelOpen}
                  onOpenChange={setFilterPanelOpen}
                  onFilterSelect={handleFilterSelect}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={clearAllFilters}
                  selectedPoets={selectedPoetIds}
                  selectedThemes={selectedThemeIds}
                  availablePoets={poetOptions}
                  availableThemes={themeOptions}
                  categoryLabels={{ Poet: 'Poets', Theme: 'Themes' }}
                  categoryOrder={['Poet', 'Theme']}
                  filterTriggerAlwaysPink
                  drawerWidth={446}
                  showClearAllAlways
                  catalogList={{
                    items: catalogEntries,
                    onSelect: selectPoemById,
                    activeId: activePoem?.id,
                    emptyLabel: 'No poems match the active filters.',
                  }}
                  categoryFooter={{
                    Poet: (
                      <p className="clp-oral-note">
                        Most couplets cannot be attributed to a particular poet due to lack of
                        historic evidence. This authorial ambiguity is in a sense the beauty of
                        the{' '}
                        <Link href="/reflections" className="clp-oral-link">
                          ORAL TRADITIONS
                        </Link>
                        .
                      </p>
                    ),
                  }}
                />
                <button
                  type="button"
                  className="clp-see-all"
                  onClick={() => setFilterPanelOpen(true)}
                  aria-expanded={filterPanelOpen}
                >
                  See All
                </button>
              </div>
            </div>

            {(selectedPoetIds.length > 0 || selectedThemeIds.length > 0) && (
              <div className="clp-filtered-by" aria-live="polite">
                Filtered by{' '}
                <span className={primaryFilter === 'Poet' ? 'is-on' : ''}>Poets</span>
                {' | '}
                <span className={primaryFilter === 'Theme' ? 'is-on' : ''}>Themes</span>
              </div>
            )}

            <div className="clp-nav-row">
              <button type="button" className="clp-prevnext" onClick={goPrev}>
                <span className="clp-prevnext-arrow clp-prevnext-arrow--prev" aria-hidden />
                Previous
              </button>
              <button type="button" className="clp-prevnext clp-prevnext--next" onClick={goNext}>
                Next
                <span className="clp-prevnext-arrow clp-prevnext-arrow--next" aria-hidden />
              </button>
            </div>

            <div className="clp-poem-stage">
              {!activePoem ? (
                <div className="clp-poem-text">No poems match the active filters.</div>
              ) : (
                <>
                  <div className="clp-poem-text">{poemText}</div>
                  {activePoem.poet ? (
                    <div className="clp-poem-poet">{activePoem.poet.toUpperCase()}</div>
                  ) : (
                    <div className="clp-poem-poet clp-poem-poet--empty" aria-hidden="true">
                      &nbsp;
                    </div>
                  )}
                  <div className="clp-translator">
                    {activePoem.translator
                      ? `Translation by ${activePoem.translator.toUpperCase()}`
                      : '\u00a0'}
                  </div>
                </>
              )}

              <div className="clp-lang-toggle" role="tablist" aria-label="Script">
                <button
                  type="button"
                  className={`clp-lang-btn${script === 'devanagari' ? ' active' : ''}`}
                  onClick={() => setScript('devanagari')}
                  aria-label="Devanagari"
                >
                  अ
                </button>
                <button
                  type="button"
                  className={`clp-lang-btn${script === 'transliteration' ? ' active' : ''}`}
                  onClick={() => setScript('transliteration')}
                  aria-label="Transliteration"
                >
                  ā
                </button>
                <button
                  type="button"
                  className={`clp-lang-btn${script === 'english' ? ' active' : ''}`}
                  onClick={() => setScript('english')}
                  aria-label="English"
                >
                  a
                </button>
              </div>

              <div className="clp-actions">
                <button
                  type="button"
                  className={showPlayer ? 'is-active' : undefined}
                  onClick={() => toggleSidePanel('listen')}
                >
                  LISTEN
                </button>
                <span className="sep">|</span>
                <button
                  type="button"
                  className={showNotes ? 'is-active' : undefined}
                  onClick={() => toggleSidePanel('notes')}
                >
                  NOTES
                </button>
                <span className="sep">|</span>
                <button
                  type="button"
                  className={showGlossary ? 'is-active' : undefined}
                  onClick={() => toggleSidePanel('glossary')}
                >
                  GLOSSARY
                </button>
              </div>

              <div className="clp-side-slot">
                <CLPlayerPopup
                  isOpen={showPlayer}
                  onClose={closeSidePanel}
                  versions={listenVersions}
                />

                <CLSideSheet
                  isOpen={showNotes}
                  onClose={closeSidePanel}
                  title="Notes"
                  className="clp-notes-popup"
                >
                  {notesBody}
                </CLSideSheet>

                <CLGlossaryPopup
                  isOpen={showGlossary}
                  onClose={closeSidePanel}
                  terms={glossaryTerms}
                />
              </div>
            </div>

            <div className="clp-explore-divider" aria-hidden="true" />

            <ExploreSection
              data={related.data}
              className="clp-related"
              initialCount={3}
              seeMoreStep={3}
              descriptionLines={3}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
