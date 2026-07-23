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
import type { ListingFilterOption } from '@/components/shared/listingFilterTypes';
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
type FilterDim = 'speaker' | 'format' | 'theme';

const DIM_FROM_TYPE: Record<FilterType, FilterDim> = {
  Singer: 'speaker',
  Poet: 'format',
  Theme: 'theme',
};

function speakerFilterLabel(row: {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
}): string {
  return [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ').trim();
}

function normalizeFilterLabel(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function parseFilterOptions(
  rows: unknown,
  getLabel: (row: Record<string, unknown>) => string
): ListingFilterOption[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  const options: ListingFilterOption[] = [];
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const id = String(row.id ?? '').trim();
    const label = normalizeFilterLabel(getLabel(row));
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    options.push({ id, label });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}

function parseReflectionFilters(data: Record<string, unknown> | undefined) {
  const bucket = data || {};
  return {
    speakers: parseFilterOptions(bucket.speaker, (row) =>
      speakerFilterLabel(row as {
        first_name?: string;
        middle_name?: string;
        last_name?: string;
      })
    ),
    themes: parseFilterOptions(
      bucket.theme,
      (row) => String(row.word_transliteration ?? row.name ?? '')
    ),
    formats: parseFilterOptions(
      bucket.format,
      (row) => String(row.name ?? row.id ?? '')
    ),
  };
}

function buildFilterQuery(order: FilterDim[], ids: Record<FilterDim, string[]>): string {
  const params = new URLSearchParams();
  for (const dim of order) {
    if (ids[dim].length) params.set(dim, ids[dim].join(','));
  }
  return params.toString();
}

function reflectionListUrl(
  page: number,
  limit: number,
  order: FilterDim[] = [],
  ids: Record<FilterDim, string[]> = { speaker: [], format: [], theme: [] }
): string {
  const params = new URLSearchParams();
  for (const dim of order) {
    const values = ids[dim];
    if (!values.length) continue;
    params.set(dim === 'speaker' ? 'by_speaker' : dim, values.join(','));
  }
  params.set('page', String(page));
  params.set('limit', String(limit));
  return `${AJAB_API_BASE}/Api/reflection_list?${params.toString()}`;
}

function toggleId(prev: string[], id: string): string[] {
  return prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id];
}

function nextFilterOrder(
  order: FilterDim[],
  dim: FilterDim,
  nextIds: string[]
): FilterDim[] {
  if (nextIds.length) return order.includes(dim) ? order : [...order, dim];
  return order.filter((item) => item !== dim);
}

function optionsWithSelected(
  available: ListingFilterOption[],
  selectedIds: string[],
  labels: Map<string, string>
): ListingFilterOption[] {
  const byId = new Map(available.map((option) => [option.id, option]));
  for (const id of selectedIds) {
    if (!byId.has(id)) byId.set(id, { id, label: labels.get(id) || id });
  }
  return Array.from(byId.values());
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

  const [fullSpeakers, setFullSpeakers] = useState<ListingFilterOption[]>([]);
  const [fullThemes, setFullThemes] = useState<ListingFilterOption[]>([]);
  const [fullFormats, setFullFormats] = useState<ListingFilterOption[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<ListingFilterOption[]>([]);
  const [availableThemes, setAvailableThemes] = useState<ListingFilterOption[]>([]);
  const [availableFormats, setAvailableFormats] = useState<ListingFilterOption[]>([]);

  /** Selected API IDs. `filterOrder[0]` is the base list and remains complete. */
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [filterOrder, setFilterOrder] = useState<FilterDim[]>([]);

  const selectedIds = useMemo(
    () => ({
      speaker: selectedSpeakers,
      format: selectedFormats,
      theme: selectedThemes,
    }),
    [selectedSpeakers, selectedFormats, selectedThemes]
  );

  const speakerLabels = useMemo(
    () => new Map(fullSpeakers.map((option) => [option.id, option.label])),
    [fullSpeakers]
  );
  const themeLabels = useMemo(
    () => new Map(fullThemes.map((option) => [option.id, option.label])),
    [fullThemes]
  );
  const formatLabels = useMemo(
    () => new Map(fullFormats.map((option) => [option.id, option.label])),
    [fullFormats]
  );

  const filterLists = useMemo(
    () => ({
      speakers: optionsWithSelected(availableSpeakers, selectedSpeakers, speakerLabels),
      themes: optionsWithSelected(availableThemes, selectedThemes, themeLabels),
      formats: optionsWithSelected(availableFormats, selectedFormats, formatLabels),
    }),
    [
      availableSpeakers,
      availableThemes,
      availableFormats,
      selectedSpeakers,
      selectedThemes,
      selectedFormats,
      speakerLabels,
      themeLabels,
      formatLabels,
    ]
  );

  const hasActiveFilters =
    selectedSpeakers.length > 0 || selectedThemes.length > 0 || selectedFormats.length > 0;

  const applyCascadedLists = useCallback(
    (
      order: FilterDim[],
      parsed: ReturnType<typeof parseReflectionFilters>
    ) => {
      const locked = new Set(order);
      const base = order[0];

      if (base === 'speaker') setAvailableSpeakers(fullSpeakers);
      else if (!locked.has('speaker')) setAvailableSpeakers(parsed.speakers);

      if (base === 'theme') setAvailableThemes(fullThemes);
      else if (!locked.has('theme')) setAvailableThemes(parsed.themes);

      if (base === 'format') setAvailableFormats(fullFormats);
      else if (!locked.has('format')) setAvailableFormats(parsed.formats);
    },
    [fullSpeakers, fullThemes, fullFormats]
  );

  const filteredReflections = useMemo(() => {
    if (!hasActiveFilters) return browseReflections;
    return filterReflections;
  }, [hasActiveFilters, browseReflections, filterReflections]);

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
          reflectionListUrl(page, REFLECTIONS_PER_PAGE),
          { cache: 'no-store', signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) return;

        const data = await res.json();
        if (!Array.isArray(data?.data)) return;

        const speakerNames = await getSpeakerNameMap();
        const list: ReflectionCardData[] = data.data.map((it: Record<string, unknown>) =>
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
    async (
      order: FilterDim[],
      ids: Record<FilterDim, string[]>,
      signal: AbortSignal
    ) => {
      const speakerNames = await getSpeakerNameMap();
      const res = await fetch(
        reflectionListUrl(1, REFLECTIONS_FILTER_FETCH_LIMIT, order, ids),
        { cache: 'no-store', signal }
      );
      if (!res.ok) return [];
      const json = await res.json();
      const rows: Record<string, unknown>[] = Array.isArray(json?.data) ? json.data : [];
      return rows.map((item) => mapReflectionListItem(item, speakerNames));
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
      setAvailableSpeakers(fullSpeakers);
      setAvailableThemes(fullThemes);
      setAvailableFormats(fullFormats);
      return;
    }

    const query = buildFilterQuery(filterOrder, selectedIds);
    if (!query) return;

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const fetchCascadedFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/reflection_filter?${query}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled && json?.status) {
          applyCascadedLists(filterOrder, parseReflectionFilters(json.data));
        }
      } catch {
        /* Keep the current option lists when the cascade request fails. */
      } finally {
        clearTimeout(timeoutId);
      }
    };

    void fetchCascadedFilters();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    hasActiveFilters,
    filterOrder,
    selectedIds,
    fullSpeakers,
    fullThemes,
    fullFormats,
    applyCascadedLists,
  ]);

  useEffect(() => {
    if (!hasActiveFilters || filterOrder.length === 0) {
      setFilterReflections([]);
      setFilterLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    setFilterLoading(true);

    void fetchFilteredReflections(filterOrder, selectedIds, controller.signal)
      .then((rows) => {
        if (!cancelled) setFilterReflections(rows);
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
    filterOrder,
    selectedIds,
    fetchFilteredReflections,
  ]);

  const handleFilterSelect = (type: FilterType, value: string) => {
    const dim = DIM_FROM_TYPE[type];
    const update = (
      setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
      setter((prev) => {
        const next = toggleId(prev, value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    };

    if (dim === 'speaker') update(setSelectedSpeakers);
    else if (dim === 'format') update(setSelectedFormats);
    else update(setSelectedThemes);
  };

  const handleRemoveFilter = (type: FilterType, value: string) => {
    const dim = DIM_FROM_TYPE[type];
    const remove = (
      setter: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
      setter((prev) => {
        const next = prev.filter((id) => id !== value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    };

    if (dim === 'speaker') remove(setSelectedSpeakers);
    else if (dim === 'format') remove(setSelectedFormats);
    else remove(setSelectedThemes);
  };

  const clearAllFilters = () => {
    setSelectedSpeakers([]);
    setSelectedThemes([]);
    setSelectedFormats([]);
    setFilterOrder([]);
    setAvailableSpeakers(fullSpeakers);
    setAvailableThemes(fullThemes);
    setAvailableFormats(fullFormats);
  };

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/reflection_filter`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!json?.status) return;
        const parsed = parseReflectionFilters(json.data);
        setFullSpeakers(parsed.speakers);
        setFullThemes(parsed.themes);
        setFullFormats(parsed.formats);
        setAvailableSpeakers(parsed.speakers);
        setAvailableThemes(parsed.themes);
        setAvailableFormats(parsed.formats);
      } catch {
        /* API-only filter lists — leave empty when reflection_filter fails. */
      }
    };
    void fetchFilters();
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
                categoryOrder: ['Singer', 'Theme', 'Poet'],
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
