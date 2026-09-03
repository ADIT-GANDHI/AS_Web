'use client';

import Loader from '@/components/Loader';
import Header from '@/components/Header';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { SONGS_LISTING_BG } from '@/lib/pageBackgroundTiles';
import { MOCK_SONGS, SONGS_FILTER, SONGS_INTRO } from './CLconstants';
import ListingFilterBar from '@/components/shared/ListingFilterBar';
import type { ListingFilterOption } from '@/components/shared/listingFilterTypes';
import CLSongCard from './CLSongCard';
import './CLSongs.css';
import { SongsNavCountContext } from '@/components/Songs/SongsNavCountContext';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { catalogHasMore, mergeCatalogById } from '@/lib/catalogPagination';
import { selectSingleFilterId } from '@/lib/listingFilterSelection';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';

type FilterType = 'Singer' | 'Poet' | 'Theme';
/** API query keys — order in `filterOrder` = hierarchy (first = base / frozen list). */
type FilterDim = 'singer' | 'poet' | 'theme';

const SONGS_PER_PAGE = 9;

const DIM_FROM_TYPE: Record<FilterType, FilterDim> = {
  Singer: 'singer',
  Poet: 'poet',
  Theme: 'theme',
};

function formatFilterLabel(value: string): string {
  const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatSongListItem(item: Record<string, unknown>) {
  const rawSinger =
    item.singer_display ||
    item.singer ||
    (Array.isArray(item.singer_names) ? item.singer_names[0] : item.singer_names) ||
    '';
  const rawPoet = item.poet || item.poet_display || '';
  return {
    id: String(item.id || ''),
    Songtitle_transliteration: String(
      item.Songtitle_transliteration || item.song_title || item.umbrellaTitleText || ''
    ),
    songtitletraan: String(item.songtitletraan || item.songTitle || ''),
    singer: String(rawSinger).replace(/\s+/g, ' ').trim(),
    poet: String(rawPoet).replace(/\s+/g, ' ').trim(),
    thumbnailUrl: String(item.thumbnailUrl || item.thumbnail_url || ''),
  };
}

function sortSongsByTitle<T extends { Songtitle_transliteration?: string }>(songs: T[]): T[] {
  return [...songs].sort((a, b) => {
    const titleA = (a.Songtitle_transliteration || '').toLowerCase().trim();
    const titleB = (b.Songtitle_transliteration || '').toLowerCase().trim();
    return titleA.localeCompare(titleB);
  });
}

function parseFilterOptions(
  rows: unknown[] | undefined,
  nameKeys: string[]
): ListingFilterOption[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  const out: ListingFilterOption[] = [];
  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const id = String(row.id ?? '').trim();
    if (!id || seen.has(id)) continue;
    let label = '';
    for (const key of nameKeys) {
      const candidate = formatFilterLabel(String(row[key] ?? ''));
      if (candidate) {
        label = candidate;
        break;
      }
    }
    if (!label) continue;
    seen.add(id);
    out.push({ id, label });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

function parseSongFiltersResponse(data: Record<string, unknown> | undefined) {
  const bucket = data || {};
  const singers = parseFilterOptions(
    Array.isArray(bucket.song) ? bucket.song : undefined,
    ['singer_name', 'name']
  );
  const poets = parseFilterOptions(
    Array.isArray(bucket.poet) ? bucket.poet : undefined,
    ['poet_name', 'name']
  );
  const themeBucket = Array.isArray(bucket.theme)
    ? bucket.theme
    : Array.isArray(bucket.them)
      ? bucket.them
      : [];
  const themes = parseFilterOptions(themeBucket, [
    'word_transliteration',
    'theme_name',
    'name',
  ]);
  return { singers, poets, themes };
}

/** Build query string with dims in hierarchy order (first key = base layer). */
function buildFilterQuery(order: FilterDim[], ids: Record<FilterDim, string[]>): string {
  const params = new URLSearchParams();
  for (const dim of order) {
    const values = ids[dim];
    if (values.length > 0) params.set(dim, values.join(','));
  }
  return params.toString();
}

function nextFilterOrder(
  prevOrder: FilterDim[],
  dim: FilterDim,
  nextIds: string[]
): FilterDim[] {
  if (nextIds.length > 0) {
    return prevOrder.includes(dim) ? prevOrder : [...prevOrder, dim];
  }
  return prevOrder.filter((d) => d !== dim);
}

export default function CLSongsIndex() {
  const pageShellRef = useRef<HTMLDivElement>(null);
  const { setSongsNavTotal } = useContext(SongsNavCountContext);
  const [activeFilter, setActiveFilter] = useState(SONGS_FILTER[0]);

  /** Selected filter IDs (not names). */
  const [singerIds, setSingerIds] = useState<string[]>([]);
  const [poetIds, setPoetIds] = useState<string[]>([]);
  const [themeIds, setThemeIds] = useState<string[]>([]);

  /**
   * Hierarchy of active filter dims — first entry is the base layer whose option
   * list stays frozen at the initial full catalog list.
   */
  const [filterOrder, setFilterOrder] = useState<FilterDim[]>([]);

  /** Initial full lists from `/Api/song_filters` (no params). */
  const [fullSingers, setFullSingers] = useState<ListingFilterOption[]>([]);
  const [fullPoets, setFullPoets] = useState<ListingFilterOption[]>([]);
  const [fullThemes, setFullThemes] = useState<ListingFilterOption[]>([]);

  /** Lists currently shown in the drawer (cascaded for non-locked dims). */
  const [availableSingers, setAvailableSingers] = useState<ListingFilterOption[]>([]);
  const [availablePoets, setAvailablePoets] = useState<ListingFilterOption[]>([]);
  const [availableThemes, setAvailableThemes] = useState<ListingFilterOption[]>([]);

  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(SONGS_PER_PAGE);

  const [filterSongs, setFilterSongs] = useState<any[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);

  const selectedIds = useMemo(
    () => ({ singer: singerIds, poet: poetIds, theme: themeIds }),
    [singerIds, poetIds, themeIds]
  );

  const labelLookup = useMemo(() => {
    const map = new Map<string, string>();
    const ingest = (dim: FilterDim, list: ListingFilterOption[]) => {
      list.forEach((opt) => map.set(`${dim}:${opt.id}`, opt.label));
    };
    ingest('singer', fullSingers);
    ingest('poet', fullPoets);
    ingest('theme', fullThemes);
    ingest('singer', availableSingers);
    ingest('poet', availablePoets);
    ingest('theme', availableThemes);
    return map;
  }, [
    fullSingers,
    fullPoets,
    fullThemes,
    availableSingers,
    availablePoets,
    availableThemes,
  ]);

  /** Ensure chips always have labels even if an option dropped out of a cascaded list. */
  const panelSingers = useMemo(() => {
    const byId = new Map(availableSingers.map((o) => [o.id, o]));
    singerIds.forEach((id) => {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          label: labelLookup.get(`singer:${id}`) || id,
        });
      }
    });
    return Array.from(byId.values());
  }, [availableSingers, singerIds, labelLookup]);

  const panelPoets = useMemo(() => {
    const byId = new Map(availablePoets.map((o) => [o.id, o]));
    poetIds.forEach((id) => {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          label: labelLookup.get(`poet:${id}`) || id,
        });
      }
    });
    return Array.from(byId.values());
  }, [availablePoets, poetIds, labelLookup]);

  const panelThemes = useMemo(() => {
    const byId = new Map(availableThemes.map((o) => [o.id, o]));
    themeIds.forEach((id) => {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          label: labelLookup.get(`theme:${id}`) || id,
        });
      }
    });
    return Array.from(byId.values());
  }, [availableThemes, themeIds, labelLookup]);

  const applyCascadedFilterLists = useCallback(
    (
      order: FilterDim[],
      parsed: {
        singers: ListingFilterOption[];
        poets: ListingFilterOption[];
        themes: ListingFilterOption[];
      },
      full: {
        singers: ListingFilterOption[];
        poets: ListingFilterOption[];
        themes: ListingFilterOption[];
      }
    ) => {
      const locked = new Set(order);
      const base = order[0];

      const nextSingers =
        base === 'singer'
          ? full.singers
          : locked.has('singer')
            ? null
            : parsed.singers;
      const nextPoets =
        base === 'poet' ? full.poets : locked.has('poet') ? null : parsed.poets;
      const nextThemes =
        base === 'theme'
          ? full.themes
          : locked.has('theme')
            ? null
            : parsed.themes;

      if (nextSingers) setAvailableSingers(nextSingers);
      if (nextPoets) setAvailablePoets(nextPoets);
      if (nextThemes) setAvailableThemes(nextThemes);
    },
    []
  );

  const handleFilterSelect = (type: FilterType, value: string) => {
    const dim = DIM_FROM_TYPE[type];
    if (dim === 'singer') {
      setSingerIds((prev) => {
        const next = selectSingleFilterId(prev, value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    } else if (dim === 'poet') {
      setPoetIds((prev) => {
        const next = selectSingleFilterId(prev, value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    } else {
      setThemeIds((prev) => {
        const next = selectSingleFilterId(prev, value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    }
  };

  const handleRemoveFilter = (type: FilterType, value: string) => {
    const dim = DIM_FROM_TYPE[type];
    if (dim === 'singer') {
      setSingerIds((prev) => {
        const next = prev.filter((i) => i !== value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    } else if (dim === 'poet') {
      setPoetIds((prev) => {
        const next = prev.filter((i) => i !== value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    } else {
      setThemeIds((prev) => {
        const next = prev.filter((i) => i !== value);
        setFilterOrder((order) => nextFilterOrder(order, dim, next));
        return next;
      });
    }
  };

  const handleClearAllFilters = () => {
    setSingerIds([]);
    setPoetIds([]);
    setThemeIds([]);
    setFilterOrder([]);
    setAvailableSingers(fullSingers);
    setAvailablePoets(fullPoets);
    setAvailableThemes(fullThemes);
  };

  const fetchSongsPage = useCallback(
    async (page: number, reset: boolean) => {
      if (reset) setIsLoading(true);
      else setLoadingMore(true);

      const apiURL = `${AJAB_API_BASE}/Api/list?search=&page=${page}&limit=${SONGS_PER_PAGE}&singer=&poet=`;

      try {
        const res = await fetch(apiURL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Status ${res.status}`);

        const data = await res.json();
        if (!data?.data || !Array.isArray(data.data)) throw new Error('Invalid response');

        const formattedSongs = sortSongsByTitle(
          data.data.map((item: Record<string, unknown>) => formatSongListItem(item))
        );

        setAllSongs((prev) => {
          const merged = reset
            ? formattedSongs
            : mergeCatalogById(prev, formattedSongs);
          return merged;
        });

        const apiTotal = parseCatalogTotal(data.total);
        if (apiTotal != null) {
          setCatalogTotal(apiTotal);
          setSongsNavTotal(apiTotal);
        }
        setApiPage(page);
      } catch {
        if (!reset) return;

        const formattedMocks = sortSongsByTitle(
          MOCK_SONGS.map((item) =>
            formatSongListItem(item as unknown as Record<string, unknown>)
          )
        );

        setAllSongs(formattedMocks);
        setCatalogTotal(formattedMocks.length);
        setSongsNavTotal(formattedMocks.length);
        setApiPage(1);
      } finally {
        setIsLoading(false);
        setLoadingMore(false);
      }
    },
    [setSongsNavTotal]
  );

  useEffect(() => {
    void fetchSongsPage(1, true);
  }, [fetchSongsPage]);

  // Initial full filter catalogs (no cascade params).
  useEffect(() => {
    const fetchSongFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/song_filters`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!json?.status) return;
        const { singers, poets, themes } = parseSongFiltersResponse(json.data);
        setFullSingers(singers);
        setFullPoets(poets);
        setFullThemes(themes);
        setAvailableSingers(singers);
        setAvailablePoets(poets);
        setAvailableThemes(themes);
      } catch {
        /* Lists stay empty until API recovers */
      }
    };
    void fetchSongFilters();
  }, []);

  const activeLetter =
    activeFilter && activeFilter.toLowerCase() !== 'all' ? activeFilter.toLowerCase().trim() : '';

  const hasChipFilters =
    singerIds.length > 0 || poetIds.length > 0 || themeIds.length > 0;
  const hasActiveFilters =
    activeFilter !== SONGS_FILTER[0] || hasChipFilters;

  // Cascade option lists whenever chip selection / hierarchy changes.
  useEffect(() => {
    if (!hasChipFilters) {
      if (fullSingers.length || fullPoets.length || fullThemes.length) {
        setAvailableSingers(fullSingers);
        setAvailablePoets(fullPoets);
        setAvailableThemes(fullThemes);
      }
      return;
    }

    let cancelled = false;
    const query = buildFilterQuery(filterOrder, selectedIds);
    if (!query) return;

    const loadFilterOptions = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/song_filters?${query}`, {
          cache: 'no-store',
        });
        if (!res.ok || cancelled) return;
        const json = await res.json();
        if (!json?.status || cancelled) return;
        const parsed = parseSongFiltersResponse(json.data);
        applyCascadedFilterLists(filterOrder, parsed, {
          singers: fullSingers,
          poets: fullPoets,
          themes: fullThemes,
        });
      } catch {
        /* Keep current lists on network errors */
      }
    };

    void loadFilterOptions();
    return () => {
      cancelled = true;
    };
  }, [
    hasChipFilters,
    filterOrder,
    selectedIds,
    fullSingers,
    fullPoets,
    fullThemes,
    applyCascadedFilterLists,
  ]);

  // Fetch filtered song rows via `/Api/list` with the same ID params (same key order).
  useEffect(() => {
    if (!hasActiveFilters) {
      setFilterSongs([]);
      setFilterLoading(false);
      return;
    }

    let cancelled = false;

    const loadFiltered = async () => {
      setFilterLoading(true);

      const params = new URLSearchParams();
      if (activeLetter) params.set('search', activeLetter);
      params.set('page', '1');
      params.set('limit', '1000');

      // Append hierarchy dims in order so the first key is the base layer.
      for (const dim of filterOrder) {
        const values = selectedIds[dim];
        if (values.length > 0) params.set(dim, values.join(','));
      }

      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/list?${params.toString()}`, {
          cache: 'no-store',
        });
        const data = res.ok ? await res.json() : null;
        const rows: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];
        if (cancelled) return;
        setFilterSongs(sortSongsByTitle(rows.map((item) => formatSongListItem(item))));
      } catch {
        if (!cancelled) setFilterSongs([]);
      } finally {
        if (!cancelled) setFilterLoading(false);
      }
    };

    void loadFiltered();
    return () => {
      cancelled = true;
    };
  }, [hasActiveFilters, activeLetter, filterOrder, selectedIds]);

  const filteredSongs = useMemo(() => {
    let result = hasActiveFilters ? [...filterSongs] : [...allSongs];

    // A-Z letter: server `search` is contains — refine to starts-with for the letter bar.
    if (activeLetter) {
      result = result.filter((song) =>
        (song.Songtitle_transliteration || '').toLowerCase().trim().startsWith(activeLetter)
      );
    }

    return result;
  }, [allSongs, filterSongs, hasActiveFilters, activeLetter]);

  const displayedSongs = useMemo(() => {
    return filteredSongs.slice(0, visibleCount);
  }, [filteredSongs, visibleCount]);

  const hasMore = hasActiveFilters
    ? visibleCount < filteredSongs.length
    : catalogHasMore(allSongs.length, visibleCount, filteredSongs.length, catalogTotal, {
        filtersActive: false,
      });

  const headingCount = hasActiveFilters
    ? filteredSongs.length
    : catalogTotal ?? filteredSongs.length;

  const handleLoadMore = () => {
    if (loadingMore) return;

    if (hasActiveFilters) {
      if (visibleCount < filteredSongs.length) {
        setVisibleCount((prev) => prev + SONGS_PER_PAGE);
      }
      return;
    }

    if (visibleCount < filteredSongs.length) {
      setVisibleCount((prev) => prev + SONGS_PER_PAGE);
      return;
    }

    if (catalogTotal != null && allSongs.length < catalogTotal) {
      void fetchSongsPage(apiPage + 1, false).then(() => {
        setVisibleCount((prev) => prev + SONGS_PER_PAGE);
      });
    }
  };

  useEffect(() => {
    setVisibleCount(SONGS_PER_PAGE);
  }, [activeFilter, singerIds, poetIds, themeIds]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div ref={pageShellRef} className="cl-songs-page-shell">
        <RepeatingPageBackground
          containerRef={pageShellRef}
          tile={SONGS_LISTING_BG}
          deferUntilLoad
        />
        <Header />
        <main className="relative z-10">
          <div className="cl-songs-page cl-songs-listing-page">
            <p className="cl-songs-intro">{SONGS_INTRO}</p>

            <div className="cl-songs-count-row">
              <h1 className="cl-songs-count">{headingCount} Songs</h1>
            </div>

            <ListingFilterBar
              allActive={
                activeFilter === SONGS_FILTER[0] &&
                singerIds.length === 0 &&
                poetIds.length === 0 &&
                themeIds.length === 0
              }
              onAllClick={() => {
                setActiveFilter(SONGS_FILTER[0]);
                handleClearAllFilters();
              }}
              panel={{
                onFilterSelect: handleFilterSelect,
                onRemoveFilter: handleRemoveFilter,
                onClearAll: handleClearAllFilters,
                selectedSingers: singerIds,
                selectedPoets: poetIds,
                selectedThemes: themeIds,
                availableSingers: panelSingers,
                availablePoets: panelPoets,
                availableThemes: panelThemes,
              }}
              azRow={
                <div className="cl-az-row">
                  {SONGS_FILTER.slice(1).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`cl-az-btn${activeFilter === filter ? ' active' : ''}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              }
            />

            <div className="cl-song-grid">
              {displayedSongs.length > 0 ? (
                displayedSongs.map((song) => (
                  <div key={song.id} className="cl-song-grid-item">
                    <CLSongCard {...song} />
                  </div>
                ))
              ) : filterLoading ? (
                <p className="cl-no-results">Loading songs…</p>
              ) : (
                <p className="cl-no-results">No songs found matching active filters.</p>
              )}
            </div>

            {hasMore && (
              <LoadMoreButton
                onClick={handleLoadMore}
                ariaLabel="Load more songs"
                disabled={loadingMore}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
