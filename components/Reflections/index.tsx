'use client';

import Loader from '@/components/Loader';
import useReflections from '@/hooks/use-reflections';
import { getReflectionFilters } from '@/lib/services/reflectionsService';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { REFLECTIONS_FILTER, REFLECTIONS_INTRO } from './constants';
import ReflectionsCard from './ReflectionsCard';
import './Reflections.css';

type ReflectionPanelTab = 'Speaker' | 'Poet' | 'Format';

const extractOptionLabel = (item: any) => {
  if (!item) return '';
  const raw =
    item?.first_name ||
    item?.poet_name ||
    item?.format_name ||
    item?.word_transliteration ||
    item?.name ||
    item?.label ||
    item;

  return String(raw || '').replace(/\s+/g, ' ').trim();
};

const uniqueCleanValues = (items: any[]) =>
  Array.from(
    new Set(
      (Array.isArray(items) ? items : [])
        .map(extractOptionLabel)
        .filter(Boolean)
    )
  );

const Reflections = () => {
  const [activeFilter] = useState(REFLECTIONS_FILTER[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<ReflectionPanelTab>('Speaker');
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedPoets, setSelectedPoets] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [headerHeight, setHeaderHeight] = useState(90);
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const PAGE_SIZE = 10;

  const {
    reflections = [],
    isLoading,
  } = useReflections({ activeFilter: activeFilter });

  const { data: reflectionFiltersData } = useSWR<any>('reflection-filters', getReflectionFilters, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFilterOpen]);

  const speakerOptions = useMemo(
    () => {
      const apiOptions = uniqueCleanValues(reflectionFiltersData?.data?.speaker);
      if (apiOptions.length > 0) {
        return apiOptions as string[];
      }

      return Array.from(
        new Set(
          reflections
            .map((reflection: any) =>
              typeof reflection.speaker === 'object' ? reflection.speaker?.name : reflection.speaker
            )
            .filter(Boolean)
        )
      ) as string[];
    },
    [reflections, reflectionFiltersData]
  );

  const poetOptions = useMemo(
    () => {
      const apiPoets = uniqueCleanValues(reflectionFiltersData?.data?.poet);
      const apiThemes = uniqueCleanValues(reflectionFiltersData?.data?.theme);
      const apiOptions = apiPoets.length > 0 ? apiPoets : apiThemes;

      if (apiOptions.length > 0) {
        return apiOptions as string[];
      }

      return Array.from(
        new Set(
          reflections
            .flatMap((reflection: any) =>
              Array.isArray(reflection.poets) ? reflection.poets.map((poet: any) => poet?.name) : []
            )
            .filter(Boolean)
        )
      ) as string[];
    },
    [reflections, reflectionFiltersData]
  );

  const formatOptions = useMemo(
    () => ['Interview', 'Essay', 'Visual Story', 'Audio Story'],
    []
  );

  const displayedReflections = useMemo(() => {
    return reflections.filter((item: any) => {
      const speakerValue =
        typeof item.speaker === 'object' ? String(item.speaker?.name || '') : String(item.speaker || '');
      const poetValues = Array.isArray(item.poets)
        ? item.poets.map((poet: any) => String(poet?.name || '')).filter(Boolean)
        : [];
      const formatValue = String(item.contentType || '').trim();

      const matchesSpeaker =
        selectedSpeakers.length === 0 || selectedSpeakers.includes(speakerValue);
      const matchesPoet =
        selectedPoets.length === 0 || poetValues.some((poet: string) => selectedPoets.includes(poet));
      const matchesFormat =
        selectedFormats.length === 0 || selectedFormats.includes(formatValue);

      return matchesSpeaker && matchesPoet && matchesFormat;
    });
  }, [reflections, selectedFormats, selectedPoets, selectedSpeakers]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedSpeakers, selectedPoets, selectedFormats]);

  const visibleReflections = displayedReflections.slice(0, visibleCount);
  const hasMore = visibleCount < displayedReflections.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleReflections.length]);

  const toggleValue = (tab: ReflectionPanelTab, value: string) => {
    if (tab === 'Speaker') {
      setSelectedSpeakers((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
      return;
    }

    if (tab === 'Poet') {
      setSelectedPoets((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
      return;
    }

    setSelectedFormats((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  const clearAllFilters = () => {
    setSelectedSpeakers([]);
    setSelectedPoets([]);
    setSelectedFormats([]);
  };

  const activeOptions =
    activePanelTab === 'Speaker' ? speakerOptions : activePanelTab === 'Poet' ? poetOptions : formatOptions;

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-8">
          {isFilterOpen && (
            <>
              <div className="reflections-filter-overlay" onClick={() => setIsFilterOpen(false)} />
              <aside
                className="reflections-filter-panel"
                style={{ top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)` }}
              >
                <div className="reflections-filter-panel-header">
                  <span className="reflections-filter-by">Filter by</span>
                  <div className="reflections-filter-tabs">
                    <button
                      className={activePanelTab === 'Speaker' ? 'active' : ''}
                      onClick={() => setActivePanelTab('Speaker')}
                    >
                      Speaker
                    </button>
                    <span>|</span>
                    <button
                      className={activePanelTab === 'Poet' ? 'active' : ''}
                      onClick={() => setActivePanelTab('Poet')}
                    >
                      Poet
                    </button>
                    <span>|</span>
                    <button
                      className={activePanelTab === 'Format' ? 'active' : ''}
                      onClick={() => setActivePanelTab('Format')}
                    >
                      Format
                    </button>
                  </div>
                  <button className="reflections-filter-close" onClick={() => setIsFilterOpen(false)}>
                    x
                  </button>
                </div>

                <div className="reflections-filter-list">
                  {activeOptions.map((item) => {
                    const selected =
                      activePanelTab === 'Speaker'
                        ? selectedSpeakers.includes(item)
                        : activePanelTab === 'Poet'
                        ? selectedPoets.includes(item)
                        : selectedFormats.includes(item);

                    return (
                      <button
                        key={item}
                        className={`reflections-filter-item ${selected ? 'selected' : ''}`}
                        onClick={() => toggleValue(activePanelTab, item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                <div className="reflections-filter-selected-wrap">
                  {[...selectedSpeakers, ...selectedPoets, ...selectedFormats].map((item) => (
                    <div key={item} className="reflections-filter-selected-item">
                      <span>{item}</span>
                      <button
                        onClick={() => {
                          setSelectedSpeakers((prev) => prev.filter((value) => value !== item));
                          setSelectedPoets((prev) => prev.filter((value) => value !== item));
                          setSelectedFormats((prev) => prev.filter((value) => value !== item));
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                  <button className="reflections-clear-btn" onClick={clearAllFilters}>
                    CLEAR ALL
                  </button>
                </div>
              </aside>
            </>
          )}

          {/* Main Content */}
          <div className="max-w-6xl mx-auto px-4 pb-8">
            {/* Search Header */}
            <div className="text-center reflections-about mb-8">{REFLECTIONS_INTRO}</div>

            {/* Results Header */}
            <div className="flex justify-between items-center mb-3">
              <h1 className="reflections-count-text">{displayedReflections.length} Reflections</h1>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-start items-end gap-4 mb-8 border-top-heading pt-3">
              <button className="fillter" onClick={() => setIsFilterOpen(true)}>
                Filters
              </button>
              <span className="all">All</span>
              {/* {REFLECTIONS_FILTER.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-pink-500 text-white border-pink-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-pink-300'
                  }`}
                >
                  {filter}
                </button>
              ))} */}
            </div>

            {/* Results Grid */}
            {displayedReflections.length > 0 ? (
              <>
                <div className="reflections-card-container">
                  {visibleReflections.map((reflection) => (
                    <ReflectionsCard
                      key={reflection.id}
                      {...reflection}
                      hideFormatTag={selectedSpeakers.length > 0 || selectedPoets.length > 0 || selectedFormats.length > 0}
                    />
                  ))}
                </div>
                {hasMore && (
                  <div ref={loaderRef} className="text-center mt-6 py-4">
                    <span>Loading...</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No reflections found</div>
                <p className="text-gray-400">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Reflections;
