'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ListingFilterBar from '@/components/shared/ListingFilterBar';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { REFLECTIONS_LISTING_BG } from '@/lib/pageBackgroundTiles';
import WavyCard from '@/components/shared/WavyCard';
import {
  REFLECTIONS_INTRO,
  MOCK_REFLECTIONS,
  REFLECTIONS_FORMAT_OPTIONS,
  REFLECTIONS_FALLBACK_SPEAKERS,
  REFLECTIONS_FALLBACK_THEMES,
  ReflectionCard as ReflectionCardData,
} from './CLReflectionMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLReflections.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { catalogHasMore, mergeCatalogById } from '@/lib/catalogPagination';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { ReflectionsNavCountContext } from '@/components/Reflections/ReflectionsNavCountContext';

const REFLECTIONS_PER_PAGE = 6;

type FilterType = 'Singer' | 'Poet' | 'Theme';

/** Theme chips from reflection meta_keywords (CMS theme API can return unrelated glossary words). */
function themesFromReflectionKeywords(items: ReflectionCardData[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const raw = item.metaKeywords || '';
    for (const part of raw.split(',')) {
      const term = part.trim();
      const key = term.toLowerCase();
      if (term.length > 1 && !seen.has(key)) {
        seen.add(key);
        out.push(term);
      }
    }
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

// [Claude] these changes have been recommended by claude —
// Card uses as="a" + href so the whole card is a real <a> link (right-click, middle-click,
// keyboard nav all work). onClick/router.push removed — native anchor handles navigation.
function ReflectionCard({ data }: { data: ReflectionCardData }) {
  return (
    <WavyCard
      as="a"
      href={`/reflections/details/${data.id}`}
      imageSrc={data.thumbnailUrl}
      imageAlt={data.title}
      thumb={
        data.thumbnailUrl ? (
          <>
            {/* [Claude] these changes have been recommended by claude — onError replaces
                broken URLs with a cream placeholder (matching WavyCard's imageSrc fallback) */}
            <img
              src={data.thumbnailUrl}
              alt={data.title}
              onError={(e) => {
                const t = e.currentTarget;
                t.onerror = null;
                t.style.objectFit = 'contain';
                t.style.background = '#f0ece5';
                t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='141' viewBox='0 0 280 141'%3E%3Crect width='280' height='141' fill='%23f0ece5'/%3E%3Ccircle cx='140' cy='65' r='22' fill='none' stroke='%23E31E79' stroke-width='1.5' opacity='0.5'/%3E%3Cpath d='M132 65 L132 56 L150 65 L132 74 Z' fill='%23E31E79' opacity='0.5'/%3E%3C/svg%3E";
              }}
            />
            <span className="clr-card-thumb-play" aria-hidden>▶</span>
          </>
        ) : undefined
      }
      className="clr-card"
      bodyClassName="clr-card-body"
      thumbClassName="clr-card-thumb"
    >
      <div className="clr-card-title">{data.title}</div>
      {data.saysBy && (
        <div className="clr-card-says">
          <span className="clr-card-says-label">says </span>
          <span className="clr-card-says-name">{data.saysBy}</span>
        </div>
      )}
      <p className="clr-card-desc">{data.description}</p>
      <div className="clr-card-mediatype">{data.mediaType}</div>
    </WavyCard>
  );
}

export default function CLReflections() {
  const shellRef = useRef<HTMLDivElement>(null);
  const { setReflectionsNavTotal } = useContext(ReflectionsNavCountContext);
  const [reflections, setReflections] = useState<ReflectionCardData[]>([]);
  const [totalReflections, setTotalReflections] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(REFLECTIONS_PER_PAGE);
  const [availableSpeakers, setAvailableSpeakers] = useState<string[]>([]);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  const derivedThemes = useMemo(() => themesFromReflectionKeywords(reflections), [reflections]);

  const filterLists = useMemo(
    () => ({
      speakers: availableSpeakers.length ? availableSpeakers : REFLECTIONS_FALLBACK_SPEAKERS,
      themes: derivedThemes.length
        ? derivedThemes
        : availableThemes.length
          ? availableThemes
          : REFLECTIONS_FALLBACK_THEMES,
      formats: [...REFLECTIONS_FORMAT_OPTIONS],
    }),
    [availableSpeakers, availableThemes, derivedThemes]
  );

  const hasActiveFilters =
    selectedSpeakers.length > 0 || selectedThemes.length > 0 || selectedFormats.length > 0;

  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type === 'Singer') {
      setSelectedSpeakers((prev) =>
        prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
      );
    }
    if (type === 'Poet') {
      setSelectedFormats((prev) =>
        prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
      );
    }
    if (type === 'Theme') {
      setSelectedThemes((prev) =>
        prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
      );
    }
  };

  const handleRemoveFilter = (type: FilterType, value: string) => {
    if (type === 'Singer') setSelectedSpeakers((prev) => prev.filter((x) => x !== value));
    if (type === 'Poet') setSelectedFormats((prev) => prev.filter((x) => x !== value));
    if (type === 'Theme') setSelectedThemes((prev) => prev.filter((x) => x !== value));
  };

  const clearAllFilters = () => {
    setSelectedSpeakers([]);
    setSelectedThemes([]);
    setSelectedFormats([]);
  };

  const filteredReflections = useMemo(() => {
    return reflections.filter((r) => {
      if (
        selectedSpeakers.length &&
        !selectedSpeakers.some((s) => (r.saysBy || '').toUpperCase().includes(s.toUpperCase()))
      ) {
        return false;
      }
      if (
        selectedFormats.length &&
        !selectedFormats.some((f) => (r.mediaType || '').toUpperCase() === f.toUpperCase())
      ) {
        return false;
      }
      if (selectedThemes.length) {
        const haystack = (r.metaKeywords || '').toLowerCase();
        if (!selectedThemes.some((t) => haystack.includes(t.toLowerCase()))) {
          return false;
        }
      }
      return true;
    });
  }, [reflections, selectedSpeakers, selectedFormats, selectedThemes]);

  const displayedReflections = useMemo(
    () => filteredReflections.slice(0, visibleCount),
    [filteredReflections, visibleCount]
  );

  const hasMore = catalogHasMore(
    reflections.length,
    visibleCount,
    filteredReflections.length,
    totalReflections
  );

  const fetchReflectionsPage = useCallback(
    async (page: number, reset: boolean) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(
          `${AJAB_API_BASE}/Api/reflection_list?page=${page}&limit=${REFLECTIONS_PER_PAGE}`,
          { cache: 'no-store', signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return;

        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const list: ReflectionCardData[] = data.data.map((it: Record<string, unknown>) => ({
          id: String(it.id || ''),
          title: String(it.title || ''),
          saysBy: String(it.person_name_english || it.saysBy || '').toUpperCase(),
          description: String(it.reflection_excerpt || it.thumbnail_excerpt || ''),
          mediaType: String(it.format || 'INTERVIEW').toUpperCase() as ReflectionCardData['mediaType'],
          thumbnailUrl: it.thumbnail_url ? `${AJAB_API_BASE}${it.thumbnail_url}` : '',
          metaKeywords: String(it.meta_keywords || it.metaKeywords || ''),
        }));

        if (list.length) {
          setReflections((prev) => (reset ? list : mergeCatalogById(prev, list)));
        }

        const apiTotal = parseCatalogTotal(data.total);
        if (apiTotal != null) {
          setTotalReflections(apiTotal);
          setReflectionsNavTotal(apiTotal);
        }
        setApiPage(page);
      } catch {
        clearTimeout(timeoutId);
        if (reset) setReflections(MOCK_REFLECTIONS);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [setReflectionsNavTotal]
  );

  const handleLoadMore = () => {
    if (loadingMore) return;

    if (visibleCount < filteredReflections.length) {
      setVisibleCount((prev) => prev + REFLECTIONS_PER_PAGE);
      return;
    }

    if (totalReflections != null && reflections.length < totalReflections) {
      void fetchReflectionsPage(apiPage + 1, false).then(() => {
        setVisibleCount((prev) => prev + REFLECTIONS_PER_PAGE);
      });
    }
  };

  useEffect(() => {
    setVisibleCount(REFLECTIONS_PER_PAGE);
  }, [selectedSpeakers, selectedThemes, selectedFormats]);

  useEffect(() => {
    void fetchReflectionsPage(1, true);
  }, [fetchReflectionsPage]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/reflection_filter`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data || {};
        const speakers = (data.speaker || [])
          .map((s: any) => [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' '))
          .filter(Boolean);
        const themes = (data.theme || [])
          .map((t: any) => t.word_transliteration || '')
          .filter(Boolean);
        if (speakers.length) setAvailableSpeakers(speakers);
        if (themes.length) setAvailableThemes(themes);
      } catch {
        // FORMAT_OPTIONS used as Poet slot list
      }
    };
    fetchFilters();
  }, []);

  const catalogCount = totalReflections ?? 0;
  const headingCount = hasActiveFilters ? filteredReflections.length : catalogCount;

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={REFLECTIONS_LISTING_BG} />
        <Header />
        <main className="relative z-10">
          <div className="clr-page clr-listing-page">
            <p className="clr-intro">{REFLECTIONS_INTRO}</p>

            <div className="cl-songs-count-row">
              <h1 className="cl-songs-count">{headingCount} Reflections</h1>
            </div>

            <ListingFilterBar
              allActive={!hasActiveFilters}
              onAllClick={clearAllFilters}
              panel={{
                onFilterSelect: handleFilterSelect,
                onRemoveFilter: handleRemoveFilter,
                onClearAll: clearAllFilters,
                selectedSingers: selectedSpeakers,
                selectedPoets: selectedFormats,
                selectedThemes: selectedThemes,
                availableSingers: filterLists.speakers,
                availablePoets: filterLists.formats,
                availableThemes: filterLists.themes,
                categoryLabels: { Singer: 'Speaker', Poet: 'Format', Theme: 'Theme' },
                maxFilters: 5,
              }}
            />

            <div className="cl-song-grid">
              {loading ? (
                <div className="clr-grid-status">Loading reflections…</div>
              ) : displayedReflections.length > 0 ? (
                displayedReflections.map((r) => (
                  <div key={r.id} className="cl-song-grid-item">
                    <ReflectionCard data={r} />
                  </div>
                ))
              ) : (
                <div className="clr-grid-status">No reflections match the selected filters.</div>
              )}
            </div>

            {hasMore && (
              <LoadMoreButton
                onClick={handleLoadMore}
                ariaLabel="Load more reflections"
                disabled={loadingMore}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
