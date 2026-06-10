'use client';

import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { FILTER_PANEL_SHAPE } from '@/lib/resolveCmsAssetUrl';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

type FilterType = 'Singer' | 'Poet' | 'Theme';

function cleanList(list: any[]) {
  return list
    .filter((value) => value && value !== null && value !== '')
    .filter((value, index, array) => array.indexOf(value) === index);
}

export default function FilterPanel({
  onFilterSelect,
  onRemoveFilter,
  onClearAll,
  selectedSingers = [],
  selectedPoets = [],
  selectedThemes = [],
  availableSingers = [],
  availablePoets = [],
  availableThemes = [],
}: any) {
  const [open, setOpen] = useState(false);
  const [panelTop, setPanelTop] = useState(128);
  const [panelLeftOffset, setPanelLeftOffset] = useState(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<FilterType>('Singer');
  const [filters, setFilters] = useState<{ Singer: string[]; Poet: string[] }>({
    Singer: [],
    Poet: [],
  });

  useEffect(() => {
    const updatePanelTop = () => {
      const header = document.querySelector('header');
      if (!header) {
        setPanelTop(128);
        return;
      }
      const { bottom } = header.getBoundingClientRect();
      setPanelTop(Math.max(Math.round(bottom) + 180, 280));
    };

    const updateLeftOffset = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPanelLeftOffset(-rect.left);
      }
    };

    if (open) {
      updatePanelTop();
      updateLeftOffset();
      window.addEventListener('resize', updatePanelTop);
      window.addEventListener('resize', updateLeftOffset);
    }
    return () => {
      window.removeEventListener('resize', updatePanelTop);
      window.removeEventListener('resize', updateLeftOffset);
    };
  }, [open]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(`${AJAB_API_BASE}/Api/song_filters`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const json = await response.json();

        setFilters({
          Singer: cleanList(json?.data?.song?.map((item: any) => item.singer_name) || []),
          Poet: cleanList(json?.data?.poet?.map((item: any) => item.poet_name) || []),
        });
      } catch (error) {
        console.error('Filter API error:', error);
      }
    };

    fetchFilters();
  }, []);

  const filterLists = useMemo(() => {
    return {
      Singer: availableSingers.length > 0 ? availableSingers : filters.Singer,
      Poet: availablePoets.length > 0 ? availablePoets : filters.Poet,
      Theme: availableThemes.length > 0 ? availableThemes : [],
    };
  }, [availableSingers, availablePoets, availableThemes, filters]);

  const selectedFilters = useMemo(
    () => [
      ...selectedSingers.map((value: string) => ({ type: 'Singer' as const, value })),
      ...selectedPoets.map((value: string) => ({ type: 'Poet' as const, value })),
      ...selectedThemes.map((value: string) => ({ type: 'Theme' as const, value })),
    ],
    [selectedSingers, selectedPoets, selectedThemes]
  );

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="transition-colors"
        style={{
          color: '#E31E79',
          fontFamily: "'Merriweather Sans', sans-serif",
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '21px',
          lineHeight: '100%',
          letterSpacing: '0.04em',
        }}
      >
        Filters
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="absolute"
              style={{
                top: '100%',
                left: `${panelLeftOffset}px`,
                marginTop: '-450px',
                width: '470px',
                height: '1430.07px',
                fontFamily: "'Merriweather Sans', sans-serif",
                background: 'transparent',
                backgroundColor: 'transparent',
                zIndex: 20001, /* Stack safely above sticky header navigation (z-index 10001) */
              }}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            >
              <img
                src={FILTER_PANEL_SHAPE}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '9.14px',
                  left: '8.21px',
                  width: '470px',
                  height: '1430.07px',
                  opacity: 0.95,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
              <div className="flex flex-col relative" style={{ zIndex: 1, width: '400px', padding: '235px 0 60px 30px' }}>
                <div style={{ width: '400px' }}>
                  <div style={{ height: '1px', background: '#B1B1B1', width: '100%' }} />
                  <div style={{ height: '12px' }} />
                  <div
                    className="flex items-center justify-between flex-nowrap whitespace-nowrap"
                    style={{ width: '400px', height: '25px' }}
                  >
                    <div className="flex items-center flex-nowrap gap-x-[6px]">
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontStyle: 'normal',
                          fontSize: '21px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          color: '#333333',
                        }}
                      >
                        Filter by
                      </span>
                      <button
                        onClick={() => setActiveCategory('Singer')}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontStyle: 'normal',
                          fontSize: '21px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          color: activeCategory === 'Singer' ? '#E31E79' : '#333333',
                        }}
                      >
                        Singer
                      </button>
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontStyle: 'normal',
                          fontSize: '21px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          color: '#333333',
                        }}
                      >
                        |
                      </span>
                      <button
                        onClick={() => setActiveCategory('Poet')}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontStyle: 'normal',
                          fontSize: '21px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          color: activeCategory === 'Poet' ? '#E31E79' : '#333333',
                        }}
                      >
                        Poet
                      </button>
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontStyle: 'normal',
                          fontSize: '21px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          color: '#333333',
                        }}
                      >
                        |
                      </span>
                      <button
                        onClick={() => setActiveCategory('Theme')}
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontStyle: 'normal',
                          fontSize: '21px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          color: activeCategory === 'Theme' ? '#E31E79' : '#333333',
                          cursor: 'pointer',
                        }}
                      >
                        Theme
                      </button>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      aria-label="Close filters"
                      style={{
                        width: '17px',
                        height: '17.01px',
                        color: '#E6257A',
                        lineHeight: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ height: '12px' }} />
                  <div style={{ height: '1px', background: '#B1B1B1', width: '100%' }} />
                </div>

                <div className="px-5 filter-scroll" style={{ width: '400px', paddingTop: '24px', paddingBottom: '12px', maxHeight: '900px', overflowY: 'auto', overflowX: 'hidden' }}>
                  <ul className="space-y-[18px]">
                    {filterLists[activeCategory].map((item: string) => {
                      const isSelected =
                        activeCategory === 'Singer'
                          ? selectedSingers.includes(item)
                          : activeCategory === 'Poet'
                            ? selectedPoets.includes(item)
                            : selectedThemes.includes(item);

                      return (
                        <li
                          key={item}
                          onClick={() => onFilterSelect(activeCategory, item)}
                          className="cursor-pointer transition-colors"
                          style={{
                            fontFamily: "'Merriweather Sans', sans-serif",
                            fontWeight: 300,
                            fontStyle: 'normal',
                            fontSize: '18.02px',
                            color: isSelected ? '#E31E79' : '#6F6F72',
                            height: '23px',
                            lineHeight: '100%',
                            letterSpacing: '0%',
                          }}
                        >
                          {item}
                        </li>
                      );
                    })}
                    {filterLists[activeCategory].length === 0 && (
                      <li className="text-[#a7a7a7]">No filters</li>
                    )}
                  </ul>
                </div>

                {selectedFilters.length > 0 && (
                  <div className="px-5 py-4" style={{ borderTop: '1px solid #B1B1B1', borderBottom: '1px solid #B1B1B1' }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        rowGap: '12px',
                        columnGap: '24px',
                      }}
                    >
                      {selectedFilters.map((filter) => (
                        <span
                          key={`${filter.type}-${filter.value}`}
                          className="inline-flex items-center"
                          style={{ fontSize: '15px', color: '#333333' }}
                        >
                          {filter.value}
                          <button
                            onClick={() => onRemoveFilter(filter.type, filter.value)}
                            className="ml-[8px] leading-none"
                            style={{ color: '#E31E79', fontSize: '16px' }}
                            aria-label={`Remove ${filter.type} filter`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-5 py-3">
                  <button
                    onClick={onClearAll}
                    className="text-[14px] uppercase tracking-[0.6px] font-semibold"
                    style={{ color: '#E31E79' }}
                  >
                    CLEAR ALL
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
