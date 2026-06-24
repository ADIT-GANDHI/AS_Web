'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  ListingFilterCategory,
  ListingFilterPanelProps,
} from '@/components/shared/listingFilterTypes';
import {
  FILTER_DRAWER_BACKDROP_TOP,
  FILTER_DRAWER_BG_OPACITY,
  FILTER_DRAWER_CONTENT_INSET_TOP,
  FILTER_DRAWER_HEIGHT,
  FILTER_DRAWER_SELECTION_MAX_ROWS,
  FILTER_DRAWER_SELECTION_ROW_PX,
  FILTER_DRAWER_TOP,
  FILTER_DRAWER_Z_BACKDROP,
  FILTER_DRAWER_Z_PANEL,
} from '@/lib/filterDrawerLayout';
import { dedupeOrderedStrings } from '@/lib/dedupeStrings';
import { FILTER_PANEL_SHAPE } from '@/lib/resolveCmsAssetUrl';

export type { ListingFilterCategory, ListingFilterPanelProps };

type FilterType = ListingFilterCategory;

const DEFAULT_CATEGORY_LABELS: Record<FilterType, string> = {
  Singer: 'Singer',
  Poet: 'Poet',
  Theme: 'Theme',
};

function cleanList(list: any[]) {
  return dedupeOrderedStrings(list.map((value) => String(value ?? '')));
}

// Hardcoded filter data — API call bypassed for UI testing
const MOCK_FILTERS = {
  Singer: [
    'Abdullah Ismail Jat',
    'Amolak Ram',
    'Arun Goyal',
    'Asariya Khima Jagariya',
    'Babu Khan Bagadwa',
    'Babulal Ranaji',
    'Bhakshu Fakir',
    'Bharmal Vagha',
    'Bindhumalini & Vedanth',
    'Dayaram Saroliya',
    'Hans Raj Hans',
    'Parvati Baul',
    'Prahlad Singh Tipanya',
    'Shaukat Ali',
    'Wadali Brothers',
    'Zila Khan',
    'Abida Parveen',
    'Alam Lohar',
  ],
  Poet: [
    'Kabir',
    'Lalon Fakir',
    'Mirabai',
    'Bulleh Shah',
    'Rumi',
    'Tukaram',
    'Surdas',
    'Shah Hussain',
    'Farid ud-Din Attar',
    'Lal Ded',
    'Shams Tabrizi',
    'Waris Shah',
  ],
  Theme: [],
};

// Figma typography tokens for the Songs filter panel.
const FONT = "'Merriweather Sans', sans-serif";

export default function CLFilterPanel({
  onFilterSelect,
  onRemoveFilter,
  onClearAll,
  selectedSingers = [],
  selectedPoets = [],
  selectedThemes = [],
  availableSingers,
  availablePoets,
  availableThemes,
  categoryLabels = DEFAULT_CATEGORY_LABELS,
  maxFilters,
  useSongsMockFallback = false,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
  singleListMode = false,
  filterTriggerAlwaysPink = false,
  showClearAllAlways = false,
}: ListingFilterPanelProps) {
  // Derives whether any filter is currently active — used for trigger colour
  const hasActiveFilters = selectedSingers.length > 0 || selectedPoets.length > 0 || selectedThemes.length > 0;
  const triggerPink = filterTriggerAlwaysPink || hasActiveFilters;
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openProp ?? openUncontrolled;
  const setOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next = typeof value === 'function' ? value(open) : value;
      if (onOpenChange) onOpenChange(next);
      else setOpenUncontrolled(next);
    },
    [onOpenChange, open]
  );
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterType>('Singer');

  // Tracks the header's current bottom edge in the viewport so the filter content
  // starts exactly below the header at page-top and fills the full panel when scrolled.
  const [headerBottom, setHeaderBottom] = useState(191);
  useEffect(() => {
    if (!open) return;
    let rafId: number;
    let last = -1;
    const tick = () => {
      const header = document.querySelector('header');
      if (header) {
        const b = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
        if (b !== last) { last = b; setHeaderBottom(b); }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  // Issue 11: List of singers should continue till the end of the screen.
  // We use a dynamic calculation based on clientHeight instead of hardcoded LIST_MAX_H.
  const [listMaxHeight, setListMaxHeight] = useState(480);
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectionsScrollRef = useRef<HTMLDivElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(480);

  const filterLists = useMemo(() => {
    const pick = (available: string[] | undefined, mock: string[]) => {
      if (available !== undefined && available.length > 0) return available;
      return useSongsMockFallback ? mock : available ?? [];
    };
    return {
      Singer: pick(availableSingers, MOCK_FILTERS.Singer),
      Poet: pick(availablePoets, MOCK_FILTERS.Poet),
      Theme: pick(availableThemes, MOCK_FILTERS.Theme),
    };
  }, [availableSingers, availablePoets, availableThemes, useSongsMockFallback]);

  const selectedFilters = useMemo(
    () => [
      ...selectedSingers.map((value: string) => ({ type: 'Singer' as const, value })),
      ...selectedPoets.map((value: string) => ({ type: 'Poet' as const, value })),
      ...selectedThemes.map((value: string) => ({ type: 'Theme' as const, value })),
    ],
    [selectedSingers, selectedPoets, selectedThemes]
  );

  const maxFiltersLimit =
    maxFilters != null && Number.isFinite(maxFilters) ? maxFilters : Infinity;

  const handleFilterSelect = useCallback(
    (type: FilterType, value: string) => {
      const isSelected =
        type === 'Singer'
          ? selectedSingers.includes(value)
          : type === 'Poet'
            ? selectedPoets.includes(value)
            : selectedThemes.includes(value);
      if (!isSelected && selectedFilters.length >= maxFiltersLimit) return;
      onFilterSelect(type, value);
    },
    [
      maxFiltersLimit,
      onFilterSelect,
      selectedFilters.length,
      selectedPoets,
      selectedSingers,
      selectedThemes,
    ]
  );

  const recalcThumb = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setListMaxHeight(clientHeight);
    if (scrollHeight <= clientHeight) {
      setThumbHeight(clientHeight);
      setThumbTop(0);
      return;
    }
    const th = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
    const tp = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - th);
    setThumbHeight(th);
    setThumbTop(tp);
  }, []);

  // Recalculate when panel opens, list/footer layout changes, or window resizes.
  useEffect(() => {
    if (!open) return;

    const runRecalc = () => {
      recalcThumb();
      requestAnimationFrame(recalcThumb);
    };

    runRecalc();
    window.addEventListener('resize', recalcThumb);

    const el = scrollRef.current;
    const ro =
      el && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => recalcThumb())
        : null;
    if (el && ro) ro.observe(el);

    return () => {
      window.removeEventListener('resize', recalcThumb);
      ro?.disconnect();
    };
  }, [open, filterLists, activeCategory, selectedFilters.length, recalcThumb]);

  // Keep footer chip area at 2 rows — scroll up so newest selections stay visible.
  useEffect(() => {
    const el = selectionsScrollRef.current;
    if (!el) return;
    const scrollToEnd = () => {
      el.scrollTop = el.scrollHeight;
    };
    scrollToEnd();
    requestAnimationFrame(scrollToEnd);
  }, [selectedFilters.length]);

  // Only render overlay after hydration (fixed layers are client-only).
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const categories: FilterType[] = singleListMode ? ['Singer'] : ['Singer', 'Poet', 'Theme'];
  const labelFor = (cat: FilterType) => categoryLabels[cat] ?? cat;

  return (
    <div className="relative inline-block">
      {/* ── Trigger button ── */}
      {/* colour: grey (#828282) when no filters active, pink when any filter selected — matches PDF spec */}
      {!hideTrigger && (
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          color: triggerPink ? '#E31E79' : '#828282',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: '18px',   /* --ajab-fs-button = 21px per design tokens */
          lineHeight: '100%',
          letterSpacing: '0.04em',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          transition: 'color 0.2s ease',
        }}
      >
        Filters
      </button>
      )}

      {mounted &&
        createPortal(
          <>
            {/* Hide native scrollbar; we render our own custom one */}
            <style>{`
          .ajab-filter-list::-webkit-scrollbar { display: none; }
          .ajab-filter-list { -ms-overflow-style: none; scrollbar-width: none; }
          .ajab-filter-selections::-webkit-scrollbar { display: none; }
          .ajab-filter-selections { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
            <AnimatePresence>
              {open && (
                <>
                  {/* Backdrop — below header only (header stays visible + clickable). */}
                  <div
                    style={{
                      position: 'fixed',
                      top: FILTER_DRAWER_BACKDROP_TOP,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: FILTER_DRAWER_Z_BACKDROP,
                      background: 'transparent',
                    }}
                    onClick={() => setOpen(false)}
                  />

                  {/* Portaled drawer — wavy bg from top:0; header stacks above (z-index 10000). */}
                  <motion.div
                  style={{
                    position: 'fixed',
                    top: FILTER_DRAWER_TOP,
                    left: 0,
                    width: '422px',
                    height: FILTER_DRAWER_HEIGHT,
                    minHeight: FILTER_DRAWER_HEIGHT,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: FONT,
                    zIndex: FILTER_DRAWER_Z_PANEL,
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                  }}
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                >
                  {/* Wavy panel bg — 0.92 opacity so page texture shows through slightly */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: FILTER_DRAWER_BG_OPACITY,
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#FFFFFF',
                      }}
                    />
                    <img
                      src={FILTER_PANEL_SHAPE}
                      alt=""
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '422px',
                        height: '100%',
                        minHeight: '100%',
                        objectFit: 'fill',
                        userSelect: 'none',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      flex: '1 1 auto',
                      minHeight: 0,
                      paddingTop: `${headerBottom}px`,
                      boxSizing: 'border-box',
                    }}
                  >
                  <div style={{ padding: '24px 44px 0', flex: '0 0 auto' }}>
                    <div style={{ height: '1px', background: '#B1B1B1' }} />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '20px 0 18px',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'nowrap',
                          gap: 0,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: '18px',
                            fontWeight: 400,
                            color: '#333333',
                            marginRight: singleListMode ? 0 : '16px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          Filter by
                        </span>

                        {!singleListMode &&
                          categories.map((cat, idx) => (
                            <span key={cat} style={{ display: 'inline-flex', alignItems: 'center' }}>
                              <button
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                  fontFamily: FONT,
                                  fontSize: '18px',
                                  fontWeight: 300,
                                  color: activeCategory === cat ? '#E31E79' : '#333333',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {labelFor(cat)}
                              </button>
                              {idx < categories.length - 1 && (
                                <span
                                  style={{
                                    color: '#333333',
                                    fontSize: '18px',
                                    fontWeight: 300,
                                    margin: '0 6px',
                                  }}
                                >
                                  |
                                </span>
                              )}
                            </span>
                          ))}
                      </div>

                      {/* Close × */}
                      <button
                        onClick={() => setOpen(false)}
                        aria-label="Close filters"
                        style={{
                          color: '#E6257A',
                          fontSize: '22px',
                          lineHeight: 1,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 4px',
                          flexShrink: 0,
                          marginLeft: '12px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ height: '1px', background: '#B1B1B1' }} />
                  </div>

                  {/* ── Filter list ── */}
                  <div style={{ position: 'relative', paddingLeft: '44px', paddingRight: '72px', flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                    <div
                      ref={scrollRef}
                      className="ajab-filter-list"
                      onScroll={recalcThumb}
                      style={{
                        overflowY: 'scroll',
                        flex: '1 1 0%',
                        minHeight: 0,
                        paddingTop: '14px',
                        paddingBottom: '24px',
                        width: '258px',
                      }}
                    >
                      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {filterLists[activeCategory].map((item: any, index: number) => {
                          const isSelected =
                            activeCategory === 'Singer'
                              ? selectedSingers.includes(item)
                              : activeCategory === 'Poet'
                                ? selectedPoets.includes(item)
                                : selectedThemes.includes(item);
                          return (
                            <li
                              key={`${activeCategory}-${index}-${item}`}
                              onClick={() => handleFilterSelect(activeCategory, item)}
                              style={{
                                fontFamily: FONT,
                                fontWeight: isSelected ? 400 : 300,
                                fontSize: '17px',
                                lineHeight: '1.3',
                                color: isSelected ? '#E31E79' : '#6F6F72',
                                cursor: 'pointer',
                                padding: '13px 0',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <span>{item}</span>
                            </li>
                          );
                        })}
                        {filterLists[activeCategory].length === 0 && (
                          <li style={{ color: '#a7a7a7', padding: '12px 0', fontSize: '15px' }}>
                            No filters available
                          </li>
                        )}
                      </ul>
                    </div>

                    {/* Custom scrollbar — track height tracks live list clientHeight */}
                    {listMaxHeight > 0 &&
                      scrollRef.current &&
                      scrollRef.current.scrollHeight > scrollRef.current.clientHeight && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '24px',
                          right: '44px',
                          width: '6px',
                          height: `${listMaxHeight - 48}px`,
                          background: '#e0e0e0',
                          borderRadius: '3px',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: `${(thumbTop / listMaxHeight) * (listMaxHeight - 48)}px`,
                            width: '6px',
                            height: `${(thumbHeight / listMaxHeight) * (listMaxHeight - 48)}px`,
                            background: '#999999',
                            borderRadius: '3px',
                            transition: 'top 0.05s linear',
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {(showClearAllAlways || selectedFilters.length > 0) && onClearAll && (
                    <div
                      style={{
                        padding: '14px 44px 28px',
                        borderTop: '1px solid #B1B1B1',
                        flex: '0 0 auto',
                      }}
                    >
                      {/* Selected items — plain text + pink ×, 2 per row (PDF spec) */}
                      {selectedFilters.length > 0 && (
                        <div
                          ref={selectionsScrollRef}
                          className="ajab-filter-selections"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            rowGap: 0,
                            columnGap: '8px',
                            marginBottom: '6px',
                            maxHeight: `${
                              FILTER_DRAWER_SELECTION_MAX_ROWS * FILTER_DRAWER_SELECTION_ROW_PX
                            }px`,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                          }}
                        >
                          {selectedFilters.map(({ type, value }) => (
                            <button
                              key={`${type}-${value}`}
                              type="button"
                              onClick={() => onRemoveFilter(type, value)}
                              style={{
                                fontFamily: FONT,
                                fontSize: '17px',
                                fontWeight: 300,
                                color: '#6F6F72',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '5px 0',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  minWidth: 0,
                                }}
                              >
                                {value}
                              </span>
                              <span
                                style={{
                                  color: '#E31E79',
                                  fontWeight: 400,
                                  flexShrink: 0,
                                  lineHeight: 1,
                                }}
                              >
                                ×
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* CLEAR ALL */}
                      <button
                        type="button"
                        onClick={() => {
                          onClearAll();
                          setOpen(false);
                        }}
                        style={{
                          fontFamily: FONT,
                          fontSize: '14px',
                          fontWeight: 300,
                          letterSpacing: '0.08em',
                          color: '#E31E79',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          padding: '4px 0 0',
                          display: 'block',
                        }}
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                  </div>
                </motion.div>
              </>
              )}
            </AnimatePresence>
          </>,
          document.body
        )}
    </div>
  );
}
