'use client';

import Loader from '@/components/Loader';
import Header from '@/components/Header';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { SONGS_LISTING_BG } from '@/lib/pageBackgroundTiles';
import { MOCK_SONGS, SONGS_FILTER, SONGS_INTRO } from './CLconstants';
import ListingFilterBar from '@/components/shared/ListingFilterBar';
import CLSongCard from './CLSongCard';
import './CLSongs.css';
import { SongsNavCountContext } from '@/components/Songs/SongsNavCountContext';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { catalogHasMore, mergeCatalogById } from '@/lib/catalogPagination';
import { dedupeOrderedStrings } from '@/lib/dedupeStrings';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';

type FilterType = 'Singer' | 'Poet' | 'Theme';

const SONGS_PER_PAGE = 9;

function normalizeFilterToken(value: string): string {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function formatFilterLabel(value: string): string {
  const cleaned = String(value || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function splitFilterParts(value: string): string[] {
  return String(value || '')
    .split(/[&,]/)
    .map((part) => normalizeFilterToken(part))
    .filter(Boolean);
}

/** Match comma-separated CMS fields (singer / poet / keywords) against selected filter chips. */
function fieldMatchesFilters(field: string, filterNames: string[]): boolean {
  if (filterNames.length === 0) return true;
  const parts = splitFilterParts(field);
  if (parts.length === 0) return false;
  return filterNames.some((name) => {
    const needle = normalizeFilterToken(name);
    return parts.some((part) => part.includes(needle) || needle.includes(part));
  });
}

function collectFilterOptions(values: string[], set: Set<string>) {
  values.forEach((raw) => {
    const label = formatFilterLabel(raw);
    if (label) set.add(label);
  });
}

function addFilterPartsFromField(raw: string, set: Set<string>) {
  String(raw || '')
    .split(/[&,]/)
    .forEach((part) => {
      const label = formatFilterLabel(part);
      if (label) set.add(label);
    });
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

function buildFilterOptionsFromSongs(songs: ReturnType<typeof formatSongListItem>[]) {
  const singersSet = new Set<string>();
  const poetsSet = new Set<string>();

  songs.forEach((song) => {
    addFilterPartsFromField(song.singer, singersSet);
    addFilterPartsFromField(song.poet, poetsSet);
  });

  return {
    singers: Array.from(singersSet).sort(),
    poets: Array.from(poetsSet).sort(),
  };
}

function parseSongFiltersResponse(data: Record<string, unknown> | undefined) {
  const bucket = data || {};
  const singers = dedupeOrderedStrings(
    (Array.isArray(bucket.song) ? bucket.song : []).map((item) =>
      String((item as { singer_name?: string }).singer_name || '')
    )
  ).sort((a, b) => a.localeCompare(b));
  const poets = dedupeOrderedStrings(
    (Array.isArray(bucket.poet) ? bucket.poet : []).map((item) =>
      String((item as { poet_name?: string }).poet_name || '')
    )
  ).sort((a, b) => a.localeCompare(b));
  const themeBucket = Array.isArray(bucket.theme)
    ? bucket.theme
    : Array.isArray(bucket.them)
      ? bucket.them
      : [];
  const themes = dedupeOrderedStrings(
    themeBucket.map((item) =>
      String((item as { word_transliteration?: string }).word_transliteration || '')
    )
  ).sort((a, b) => a.localeCompare(b));
  return { singers, poets, themes };
}

export default function CLSongsIndex() {
  const pageShellRef = useRef<HTMLDivElement>(null);
  const { setSongsNavTotal } = useContext(SongsNavCountContext);
  const [activeFilter, setActiveFilter] = useState(SONGS_FILTER[0]);

  const [singerNames, setSingerNames] = useState<string[]>([]);
  const [poetNames, setPoetNames] = useState<string[]>([]);
  const [themeNames, setThemeNames] = useState<string[]>([]);

  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [availableSingers, setAvailableSingers] = useState<string[]>([]);
  const [availablePoets, setAvailablePoets] = useState<string[]>([]);
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(SONGS_PER_PAGE);

  // Server-side filtered results (A-Z letter + singer/poet/theme). When any filter is
  // active we query `/Api/list` with those params so results span the whole catalog,
  // not just the pages already loaded in browse mode.
  const [filterSongs, setFilterSongs] = useState<any[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);

  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type === 'Singer') {
      setSingerNames((prev) =>
        prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
      );
    }
    if (type === 'Poet') {
      setPoetNames((prev) =>
        prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
      );
    }
    if (type === 'Theme') {
      setThemeNames((prev) =>
        prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
      );
    }
  };

  const handleRemoveFilter = (type: FilterType, value: string) => {
    if (type === 'Singer') setSingerNames((prev) => prev.filter((i) => i !== value));
    if (type === 'Poet') setPoetNames((prev) => prev.filter((i) => i !== value));
    if (type === 'Theme') setThemeNames((prev) => prev.filter((i) => i !== value));
  };

  const handleClearAllFilters = () => {
    setSingerNames([]);
    setPoetNames([]);
    setThemeNames([]);
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

  useEffect(() => {
    const fetchSongFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/song_filters`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!json?.status) return;
        const { singers, poets, themes } = parseSongFiltersResponse(json.data);
        if (singers.length) setAvailableSingers(singers);
        if (poets.length) setAvailablePoets(poets);
        if (themes.length) setAvailableThemes(themes);
      } catch {
        /* Fallback to options derived from loaded song rows */
      }
    };
    void fetchSongFilters();
  }, []);

  useEffect(() => {
    const { singers, poets } = buildFilterOptionsFromSongs(allSongs);
    setAvailableSingers((prev) => (prev.length ? prev : singers));
    setAvailablePoets((prev) => (prev.length ? prev : poets));
  }, [allSongs]);

  const activeLetter =
    activeFilter && activeFilter.toLowerCase() !== 'all' ? activeFilter.toLowerCase().trim() : '';

  const hasActiveFilters =
    activeFilter !== SONGS_FILTER[0] ||
    singerNames.length > 0 ||
    poetNames.length > 0 ||
    themeNames.length > 0;

  // Fetch the server-filtered catalog whenever a filter (A-Z / singer / poet / theme) is active.
  // `/Api/list` filters server-side: search (contains, title), singer, poet, theme — combined with AND.
  useEffect(() => {
    if (!hasActiveFilters) {
      setFilterSongs([]);
      setFilterLoading(false);
      return;
    }

    let cancelled = false;

    const loadFiltered = async () => {
      setFilterLoading(true);

      const params = new URLSearchParams({
        // A-Z letter → `search` (server does a contains match; we refine to starts-with below).
        search: activeLetter,
        page: '1',
        limit: '1000',
        singer: singerNames.join(','),
        poet: poetNames.join(','),
        theme: themeNames.join(','),
      });

      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/list?${params.toString()}`, {
          cache: 'no-store',
        });
        const data = res.ok ? await res.json() : null;
        let rows: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];

        // Backend can't AND multiple comma values (and some names have irregular spacing),
        // so if a chip selection returns nothing, fall back to the full catalog and filter client-side.
        if (
          rows.length === 0 &&
          (singerNames.length > 0 || poetNames.length > 0 || themeNames.length > 0)
        ) {
          const fullRes = await fetch(
            `${AJAB_API_BASE}/Api/list?search=&page=1&limit=1000&singer=&poet=`,
            { cache: 'no-store' }
          );
          const fullData = fullRes.ok ? await fullRes.json() : null;
          rows = Array.isArray(fullData?.data) ? fullData.data : [];
        }

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
  }, [hasActiveFilters, activeLetter, singerNames, poetNames, themeNames]);

  // Filtered results come from the server query; browse mode uses the paginated `allSongs`.
  const filteredSongs = useMemo(() => {
    let result = hasActiveFilters ? [...filterSongs] : [...allSongs];

    // 1. A-Z Letter Filter (strict starts-with — server `search` is a contains match).
    if (activeLetter) {
      result = result.filter((song) =>
        (song.Songtitle_transliteration || '').toLowerCase().trim().startsWith(activeLetter)
      );
    }

    // 2. Singer Filter (safety refine — also covers the full-catalog fallback path).
    if (singerNames.length > 0) {
      result = result.filter((song) => fieldMatchesFilters(song.singer || '', singerNames));
    }

    // 3. Poet Filter
    if (poetNames.length > 0) {
      result = result.filter((song) => fieldMatchesFilters(song.poet || '', poetNames));
    }

    // Theme is filtered server-side via the `theme` param (song rows carry no theme field to refine).

    return result;
  }, [allSongs, filterSongs, hasActiveFilters, activeLetter, singerNames, poetNames, themeNames]);

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

    // Filter mode: the full filtered set is already loaded — paginate it client-side.
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

  // Reset page pagination count when active filters change
  useEffect(() => {
    setVisibleCount(SONGS_PER_PAGE);
  }, [activeFilter, singerNames, poetNames, themeNames]);

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
                singerNames.length === 0 &&
                poetNames.length === 0 &&
                themeNames.length === 0
              }
              onAllClick={() => {
                setActiveFilter(SONGS_FILTER[0]);
                handleClearAllFilters();
              }}
              panel={{
                onFilterSelect: handleFilterSelect,
                onRemoveFilter: handleRemoveFilter,
                onClearAll: handleClearAllFilters,
                selectedSingers: singerNames,
                selectedPoets: poetNames,
                selectedThemes: themeNames,
                availableSingers,
                availablePoets,
                availableThemes,
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
