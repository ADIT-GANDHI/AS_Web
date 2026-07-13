'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useContext } from 'react';

/** Strip surrounding quotes/whitespace so we can wrap consistently. */
function normalizeCardDesc(text: string): string {
  if (!text) return '';
  return text.replace(/^[\s"'“”]+/, '').replace(/[\s"'“”]+$/, '').trim();
}

/** Card excerpt — always opens with “; closing ” only when text fits without clamping. */
function CardDesc({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [clamped, setClamped] = useState(true);
  const cleaned = useMemo(() => normalizeCardDesc(text), [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setClamped(el.scrollHeight > el.clientHeight + 2);
  }, [cleaned]);

  const display = cleaned
    ? clamped
      ? `\u201C${cleaned}`
      : `\u201C${cleaned}\u201D`
    : '';

  return (
    <p ref={ref} className="clr-card-desc">
      {display}
    </p>
  );
}
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import ListingFilterBar from '@/components/shared/ListingFilterBar';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { REFLECTIONS_LISTING_BG } from '@/lib/pageBackgroundTiles';
import WavyCard from '@/components/shared/WavyCard';
import {
  REFLECTIONS_INTRO,
  MOCK_REFLECTIONS,
  ReflectionCard as ReflectionCardData,
} from './CLReflectionMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLReflections.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { getSpeakerNameMap } from '@/lib/speakerNames';
import { catalogHasMore, mergeCatalogById } from '@/lib/catalogPagination';
import { dedupeOrderedStrings } from '@/lib/dedupeStrings';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { ReflectionsNavCountContext } from '@/components/Reflections/ReflectionsNavCountContext';

const REFLECTIONS_PER_PAGE = 9;

const REFLECTION_CARD_EXCERPT_PLACEHOLDER =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

function pickReflectionExcerpt(raw: unknown): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (text.length > 10) return text;
  return REFLECTION_CARD_EXCERPT_PLACEHOLDER;
}

type FilterType = 'Singer' | 'Poet' | 'Theme';

/** Set true when CMS theme tags align with reflection_filter (see reflection_list?theme=). */
const REFLECTION_LIST_USE_THEME_API = false;
// When enabling: buildReflectionListQuery already appends theme={id}; client-side theme
// filtering is skipped once usesServerThemeFilter is true.

type ReflectionListQuery = {
  bySpeaker?: string;
  format?: string;
  theme?: string;
};

function speakerFilterLabel(row: {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
}): string {
  return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim();
}

/** CMS accepts one by_speaker / format / theme per request — fan out when multiple chips selected. */
function buildReflectionListQueries(
  selectedSpeakers: string[],
  selectedFormats: string[],
  selectedThemes: string[],
  speakerIdByLabel: Record<string, string>,
  themeIdByLabel: Record<string, string>
): ReflectionListQuery[] {
  const speakerIds = selectedSpeakers
    .map((label) => speakerIdByLabel[label])
    .filter((id): id is string => !!id);
  const formatLabels = selectedFormats.length ? selectedFormats : [undefined];
  const speakerKeys = speakerIds.length ? speakerIds : [undefined];

  const queries: ReflectionListQuery[] = [];
  for (const bySpeaker of speakerKeys) {
    for (const format of formatLabels) {
      const query: ReflectionListQuery = {};
      if (bySpeaker) query.bySpeaker = bySpeaker;
      if (format) query.format = format;
      if (REFLECTION_LIST_USE_THEME_API && selectedThemes.length === 1) {
        const themeId = themeIdByLabel[selectedThemes[0]];
        if (themeId) query.theme = themeId;
      }
      queries.push(query);
    }
  }

  return queries.length ? queries : [{}];
}

function queriesNeedServerFetch(queries: ReflectionListQuery[]): boolean {
  return queries.some((q) => !!(q.bySpeaker || q.format || q.theme));
}

function reflectionListUrl(page: number, limit: number, query: ReflectionListQuery): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (query.bySpeaker) params.set('by_speaker', query.bySpeaker);
  if (query.format) params.set('format', query.format);
  if (query.theme) params.set('theme', query.theme);
  return `${AJAB_API_BASE}/Api/reflection_list?${params.toString()}`;
}

function parseRelatedKeywordIds(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

/* [Claude] these changes have been recommended by claude —
   saysBy now resolves speaker_id via the person_list map. The list API's
   person_name_english is the attributed poet ("Kabir"), NOT the speaker —
   the PDF cards show the actual speaker ("says KRISHNA NATH"). */
function mapReflectionListItem(
  it: Record<string, unknown>,
  speakerNames: Record<string, string>
): ReflectionCardData {
  return {
    id: String(it.id || ''),
    title: String(it.title || ''),
    verb: String(it.verb || '').trim(),
    saysBy: String(speakerNames[String(it.speaker_id || '').trim()] || '').toUpperCase(),
    description: pickReflectionExcerpt(it.reflection_excerpt),
    format: String(it.format || '').trim(),
    thumbnailUrl: it.thumbnail_url ? `${AJAB_API_BASE}${it.thumbnail_url}` : '',
    relatedKeywordIds: parseRelatedKeywordIds(it.related_keywords),
  };
}

function ReflectionCard({ data }: { data: ReflectionCardData }) {
  return (
    <WavyCard
      as="a"
      href={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/reflections/details/${data.id}`}
      imageSrc={data.thumbnailUrl}
      imageAlt={data.title}
      insetThumb
      thumb={
        data.thumbnailUrl ? (
          <>
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
            <span className="clr-card-thumb-play" aria-hidden style={{ display: 'none' }}>
              ▶
            </span>
          </>
        ) : undefined
      }
      className="clr-card"
      bodyClassName="clr-card-body"
      thumbClassName="clr-card-thumb"
    >
      <div className="clr-card-title">{data.title}</div>
      {(data.verb || data.saysBy) && (
        <div className="clr-card-says" title={data.saysBy}>
          {data.verb && <span className="clr-card-says-label">{data.verb} </span>}
          {data.saysBy && <span className="clr-card-says-name">{data.saysBy}</span>}
        </div>
      )}
      <CardDesc text={data.description} />
      {data.format && <div className="clr-card-mediatype">{data.format.toUpperCase()}</div>}
    </WavyCard>
  );
}

const REFLECTIONS_FILTER_FETCH_LIMIT = 200;

export default function CLReflections() {
  const shellRef = useRef<HTMLDivElement>(null);
  const { setReflectionsNavTotal } = useContext(ReflectionsNavCountContext);
  const [browseReflections, setBrowseReflections] = useState<ReflectionCardData[]>([]);
  const [filterReflections, setFilterReflections] = useState<ReflectionCardData[]>([]);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [browsePage, setBrowsePage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(REFLECTIONS_PER_PAGE);
  const [availableSpeakers, setAvailableSpeakers] = useState<string[]>([]);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  const [themeIdByLabel, setThemeIdByLabel] = useState<Record<string, string>>({});
  const [speakerIdByLabel, setSpeakerIdByLabel] = useState<Record<string, string>>({});

  const speakerIdsReady =
    selectedSpeakers.length === 0 ||
    selectedSpeakers.every((label) => !!speakerIdByLabel[label]);

  const listQueries = useMemo(
    () =>
      buildReflectionListQueries(
        selectedSpeakers,
        selectedFormats,
        selectedThemes,
        speakerIdByLabel,
        themeIdByLabel
      ),
    [selectedSpeakers, selectedFormats, selectedThemes, speakerIdByLabel, themeIdByLabel]
  );

  const usesServerThemeFilter =
    REFLECTION_LIST_USE_THEME_API && selectedThemes.length === 1 && !!listQueries[0]?.theme;
  const usesServerListFilters = queriesNeedServerFetch(listQueries);

  const filterLists = useMemo(
    () => ({
      speakers: availableSpeakers,
      themes: availableThemes,
      formats: availableFormats,
    }),
    [availableSpeakers, availableThemes, availableFormats]
  );

  const hasActiveFilters =
    selectedSpeakers.length > 0 || selectedThemes.length > 0 || selectedFormats.length > 0;

  const applyThemeClientFilter = useCallback(
    (items: ReflectionCardData[]) => {
      if (!selectedThemes.length || usesServerThemeFilter) return items;
      return items.filter((r) => {
        const ids = r.relatedKeywordIds || [];
        return selectedThemes.some((label) => {
          const themeId = themeIdByLabel[label];
          return themeId ? ids.includes(themeId) : false;
        });
      });
    },
    [selectedThemes, themeIdByLabel, usesServerThemeFilter]
  );

  const filteredReflections = useMemo(() => {
    if (!hasActiveFilters) return browseReflections;
    return applyThemeClientFilter(filterReflections);
  }, [hasActiveFilters, browseReflections, filterReflections, applyThemeClientFilter]);

  const displayedReflections = useMemo(
    () => filteredReflections.slice(0, visibleCount),
    [filteredReflections, visibleCount]
  );

  const hasMore = useMemo(() => {
    if (visibleCount < filteredReflections.length) return true;
    if (hasActiveFilters) return false;
    return catalogHasMore(
      browseReflections.length,
      visibleCount,
      browseReflections.length,
      catalogTotal,
      { filtersActive: false }
    );
  }, [
    visibleCount,
    filteredReflections.length,
    hasActiveFilters,
    browseReflections.length,
    catalogTotal,
  ]);

  const fetchBrowsePage = useCallback(
    async (page: number, reset: boolean) => {
      if (reset) setInitialLoading(true);
      else setLoadingMore(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(
          reflectionListUrl(page, REFLECTIONS_PER_PAGE, {}),
          { cache: 'no-store', signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return;

        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const speakerNames = await getSpeakerNameMap();
        const list: ReflectionCardData[] = data.data.map((it) =>
          mapReflectionListItem(it, speakerNames)
        );

        setBrowseReflections((prev) => {
          if (reset) return list;
          return list.length ? mergeCatalogById(prev, list) : prev;
        });

        const apiTotal = parseCatalogTotal(data.total);
        if (apiTotal != null) {
          setCatalogTotal(apiTotal);
          setReflectionsNavTotal(apiTotal);
        }
        setBrowsePage(page);
      } catch {
        clearTimeout(timeoutId);
        if (reset) setBrowseReflections(MOCK_REFLECTIONS);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [setReflectionsNavTotal]
  );

  const fetchFilteredReflections = useCallback(
    async (queries: ReflectionListQuery[], signal: AbortSignal) => {
      const speakerNames = await getSpeakerNameMap();
      const responses = await Promise.all(
        queries.map(async (query) => {
          const res = await fetch(
            reflectionListUrl(1, REFLECTIONS_FILTER_FETCH_LIMIT, query),
            { cache: 'no-store', signal }
          );
          if (!res.ok) return [] as Record<string, unknown>[];
          const json = await res.json();
          return Array.isArray(json?.data) ? json.data : [];
        })
      );

      let merged: ReflectionCardData[] = [];
      for (const rows of responses) {
        const list = rows.map((it) => mapReflectionListItem(it, speakerNames));
        merged = mergeCatalogById(merged, list);
      }
      return merged;
    },
    []
  );

  const handleLoadMore = () => {
    if (loadingMore || filterLoading) return;

    if (visibleCount < filteredReflections.length) {
      setVisibleCount((prev) => prev + REFLECTIONS_PER_PAGE);
      return;
    }

    if (!hasActiveFilters && catalogTotal != null && browseReflections.length < catalogTotal) {
      void fetchBrowsePage(browsePage + 1, false).then(() => {
        setVisibleCount((prev) => prev + REFLECTIONS_PER_PAGE);
      });
    }
  };

  useEffect(() => {
    setVisibleCount(REFLECTIONS_PER_PAGE);
  }, [selectedSpeakers, selectedThemes, selectedFormats]);

  useEffect(() => {
    void fetchBrowsePage(1, true);
  }, [fetchBrowsePage]);

  useEffect(() => {
    if (!hasActiveFilters) {
      setFilterReflections([]);
      setFilterLoading(false);
      return;
    }

    if (!usesServerListFilters && selectedThemes.length > 0) {
      setFilterLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      void fetchFilteredReflections([{}], controller.signal)
        .then((merged) => {
          if (!controller.signal.aborted) setFilterReflections(merged);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFilterReflections([]);
        })
        .finally(() => {
          clearTimeout(timeoutId);
          if (!controller.signal.aborted) setFilterLoading(false);
        });
      return () => {
        clearTimeout(timeoutId);
        controller.abort();
      };
    }

    if (!usesServerListFilters) {
      setFilterReflections([]);
      setFilterLoading(false);
      return;
    }

    if (selectedSpeakers.length > 0 && !speakerIdsReady) {
      setFilterLoading(true);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    setFilterLoading(true);

    void fetchFilteredReflections(listQueries, controller.signal)
      .then((merged) => {
        if (!cancelled) setFilterReflections(merged);
      })
      .catch(() => {
        if (!cancelled) setFilterReflections([]);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (!cancelled) setFilterLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    hasActiveFilters,
    usesServerListFilters,
    listQueries,
    selectedThemes.length,
    speakerIdsReady,
    fetchFilteredReflections,
  ]);

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

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/reflection_filter`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data || {};
        const speakerRows = (data.speaker || []) as Array<{
          id?: string;
          first_name?: string;
          middle_name?: string;
          last_name?: string;
        }>;
        const speakers = dedupeOrderedStrings(
          speakerRows.map((s) => speakerFilterLabel(s))
        );
        const themeRows = (data.theme || []) as Array<{ id?: string; word_transliteration?: string }>;
        const themes = dedupeOrderedStrings(themeRows.map((t) => t.word_transliteration || ''));
        const formatRows = (data.format || []) as Array<{ id?: string; name?: string }>;
        const formats = dedupeOrderedStrings(
          formatRows.map((f) => String(f.name || f.id || '').trim())
        );
        const themeMap: Record<string, string> = {};
        themeRows.forEach((t) => {
          const label = (t.word_transliteration || '').trim();
          const themeId = String(t.id || '').trim();
          if (label && themeId) themeMap[label] = themeId;
        });
        const speakerMap: Record<string, string> = {};
        speakerRows.forEach((s) => {
          const label = speakerFilterLabel(s);
          const speakerId = String(s.id || '').trim();
          if (label && speakerId) speakerMap[label] = speakerId;
        });
        setAvailableSpeakers(speakers);
        setAvailableThemes(themes);
        setAvailableFormats(formats);
        setThemeIdByLabel(themeMap);
        setSpeakerIdByLabel(speakerMap);
      } catch {
        /* API-only filter lists — leave empty when reflection_filter fails */
      }
    };
    fetchFilters();
  }, []);

  const headingCount = hasActiveFilters ? filteredReflections.length : (catalogTotal ?? 0);

  if (initialLoading) {
    return <Loader />;
  }

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
              allPinkWhenFiltered
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
                filterTriggerAlwaysPink: true,
              }}
            />

            <div className="cl-song-grid">
              {filterLoading ? (
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
                disabled={loadingMore || filterLoading}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
