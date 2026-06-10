'use client';

import Loader from '@/components/Loader';
import { useEffect, useState, useCallback, useRef } from 'react';
import { SONGS_FILTER, SONGS_INTRO } from './constants';
import SongCard from './SongCard';
import FilterPanel from '../Fillter/FilterPanel';
import './Songs.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

type FilterType = 'Singer' | 'Poet';

export default function SearchResults() {
  const [activeFilter, setActiveFilter] = useState(SONGS_FILTER[0]);

  const [singerNames, setSingerNames] = useState<string[]>([]);
  const [poetNames, setPoetNames] = useState<string[]>([]);

  const [publishedSongs, setPublishedSongs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalSongs, setTotalSongs] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // ⭐ All → empty string for API
  const getFilterValue = (filter: string) => {
    return filter.toLowerCase() === "all" ? "" : filter;
  };

  // ---------------------------------------------------
  // ⭐ FILTER CLICK (Singer / Poet)
  // ---------------------------------------------------
  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type === 'Singer') {
      setSingerNames((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      );
    }

    if (type === 'Poet') {
      setPoetNames((prev) =>
        prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
      );
    }

    setPage(1);
  };

  const handleRemoveFilter = (type: FilterType, value: string) => {
    if (type === 'Singer') {
      setSingerNames((prev) => prev.filter((item) => item !== value));
    }
    if (type === 'Poet') {
      setPoetNames((prev) => prev.filter((item) => item !== value));
    }

    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSingerNames([]);
    setPoetNames([]);
    setPage(1);
  };

  // ---------------------------------------------------
  // ⭐ MAIN API CALL - useCallback to prevent recreating
  // ---------------------------------------------------
  const fetchSongs = useCallback(async (reset = false, targetPage = page) => {
    setIsLoading(true);

    const searchValue = getFilterValue(activeFilter);
    const singerParam = singerNames.join(',');
    const poetParam = poetNames.join(',');

    const apiURL = `${AJAB_API_BASE}/Api/list?search=${encodeURIComponent(searchValue)}&page=${targetPage}&limit=${limit}&singer=${encodeURIComponent(singerParam)}&poet=${encodeURIComponent(poetParam)}`;

    try {
      const res = await fetch(apiURL, { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();
      const list = Array.isArray(data?.data) ? data.data : [];

      const formattedSongs = list.map((item: any) => ({
        id: item.id,
        Songtitle_transliteration: item.Songtitle_transliteration || item.song_title || item.umbrellaTitle || '',
        songtitletraan: item.songtitletraan || item.songTitle || '',
        singer: item.singer || '',
        poet: item.poet || '',
        thumbnailUrl: item.thumbnailUrl,
      }));

      setTotalSongs(data?.total || formattedSongs.length);

      if (reset) {
        const seen = new Set<any>();
        setPublishedSongs(formattedSongs.filter((s: any) => {
          if (seen.has(s.id)) return false;
          seen.add(s.id);
          return true;
        }));
      } else {
        setPublishedSongs((prev) => {
          const seen = new Set(prev.map((s: any) => s.id));
          const merged = [...prev];
          for (const s of formattedSongs) {
            if (!seen.has(s.id)) {
              seen.add(s.id);
              merged.push(s);
            }
          }
          return merged;
        });
      }

      setHasMore(formattedSongs.length >= limit);
    } catch (err) {
      console.error("API Error:", err);
      if (reset) {
        setPublishedSongs([]);
        setTotalSongs(0);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, page, limit, singerNames, poetNames]);

  // ---------------------------------------------------
  // ⭐ RUN when Singer / Poet / activeFilter changes
  // ---------------------------------------------------
  useEffect(() => {
    setPage(1);
    fetchSongs(true, 1);
  }, [singerNames, poetNames, activeFilter]);

  // ---------------------------------------------------
  // ⭐ Load More Pagination
  // ---------------------------------------------------
  useEffect(() => {
    if (page > 1) {
      fetchSongs(false, page);
    }
  }, [page, fetchSongs]);

  // ---------------------------------------------------
  // ⭐ Infinite scroll via IntersectionObserver
  // ---------------------------------------------------
  useEffect(() => {
    if (!hasMore || isLoading) return;
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, publishedSongs.length]);

  return (
    <>
      {isLoading && publishedSongs.length === 0 ? (
        <Loader />
      ) : (
        <div>
          <div className="max-w-[1100px] mx-auto pb-8" style={{ padding: '0 50px' }}>

            {/* Header */}
            <div className="text-center songs-about-intro">{SONGS_INTRO}</div>
            <div className="text-left mb-2" style={{ marginLeft: '-90px' }}>
              <h1 className="song-count-text">{totalSongs} Songs</h1>
            </div>

            {/* Filters */}
            <div className="border-t-costom pt-3 pb-4" style={{ marginLeft: '-90px', width: 'calc(100% + 180px)', maxWidth: 'none' }}>
              <span className="text-pink filters">
                <FilterPanel
                  onFilterSelect={handleFilterSelect}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={handleClearAllFilters}
                  selectedSingers={singerNames}
                  selectedPoets={poetNames}
                />
              </span>

              <div className="button-link-container">
                {SONGS_FILTER.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`border-0 button-font all-text cursor-pointer ${
                      activeFilter === filter
                        ? 'text-pink text-white'
                        : 'bg-white border fillter-btn'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            <div className="song-card-container">
              {publishedSongs.length > 0 ? (
                publishedSongs.map((song) => (
                  <div
                    key={song.id}
                    className="break-inside-avoid mb-6 song-card-landing-p"
                  >
                    <SongCard {...song} />
                  </div>
                ))
              ) : (
                !isLoading && <p className="text-center">No songs found!</p>
              )}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && publishedSongs.length > 0 && (
              <div ref={loaderRef} className="text-center mt-6 py-4">
                {isLoading && <span>Loading...</span>}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}