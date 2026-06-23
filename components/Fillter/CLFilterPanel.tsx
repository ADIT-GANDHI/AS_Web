'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type {
  ListingFilterCategory,
  ListingFilterPanelProps,
} from '@/components/shared/listingFilterTypes';
import {
  FILTER_DRAWER_BACKDROP_TOP,
  FILTER_PARDA_BOTTOM_INSET_PX,
  FILTER_PARDA_HEIGHT_PX,
  FILTER_PARDA_WIDTH_PX,
} from '@/lib/filterDrawerLayout';
import { FILTER_PANEL_SHAPE } from '@/lib/resolveCmsAssetUrl';
import './CLFilterPanel.css';

export type { ListingFilterCategory, ListingFilterPanelProps };

type FilterType = ListingFilterCategory;

const DEFAULT_CATEGORY_LABELS: Record<FilterType, string> = {
  Singer: 'Singer',
  Poet: 'Poet',
  Theme: 'Theme',
};

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
  hideTrigger = false,
  open: openProp,
  onOpenChange,
  singleListMode = false,
  filterTriggerAlwaysPink = false,
  showClearAllAlways = false,
}: ListingFilterPanelProps) {
  const hasActiveFilters =
    selectedSingers.length > 0 || selectedPoets.length > 0 || selectedThemes.length > 0;
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
  const [headerBottom, setHeaderBottom] = useState(191);
  const [listMaxHeight, setListMaxHeight] = useState(480);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(480);

  useEffect(() => {
    if (!open) return;
    let rafId: number;
    let last = -1;
    const tick = () => {
      const header = document.querySelector('header');
      if (header) {
        const b = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
        if (b !== last) {
          last = b;
          setHeaderBottom(b);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  const filterLists = useMemo(
    () => ({
      Singer: availableSingers ?? [],
      Poet: availablePoets ?? [],
      Theme: availableThemes ?? [],
    }),
    [availableSingers, availablePoets, availableThemes]
  );

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

  useEffect(() => {
    if (!open) return;
    recalcThumb();
    window.addEventListener('resize', recalcThumb);
    return () => window.removeEventListener('resize', recalcThumb);
  }, [open, filterLists, activeCategory, recalcThumb, selectedFilters.length]);

  useEffect(() => setMounted(true), []);

  const categories: FilterType[] = singleListMode ? ['Singer'] : ['Singer', 'Poet', 'Theme'];
  const labelFor = (cat: FilterType) => categoryLabels[cat] ?? cat;
  const showScrollbar =
    open && scrollRef.current
      ? scrollRef.current.scrollHeight > scrollRef.current.clientHeight
      : thumbHeight < listMaxHeight;

  const pardaStyle = {
    '--cl-filter-parda-w': `${FILTER_PARDA_WIDTH_PX}px`,
    '--cl-filter-parda-h': `${FILTER_PARDA_HEIGHT_PX}px`,
    '--cl-filter-parda-bottom-inset': `${FILTER_PARDA_BOTTOM_INSET_PX}px`,
    '--cl-filter-parda-bg-url': `url(${FILTER_PANEL_SHAPE})`,
  } as CSSProperties;

  return (
    <div className="relative inline-block">
      {!hideTrigger && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`cl-filter-trigger${triggerPink ? ' is-pink' : ''}`}
        >
          Filters
        </button>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <div
                  className="cl-filter-parda-backdrop"
                  style={{ top: FILTER_DRAWER_BACKDROP_TOP }}
                  onClick={() => setOpen(false)}
                  aria-hidden
                />

                {/* Document-anchored: one parda strip from y=0; scroll page → parda ends */}
                <div className="cl-filter-parda-root" style={pardaStyle}>
                  <motion.div
                    className="cl-filter-parda-panel"
                    style={pardaStyle}
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '-100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                  >
                    <div className="cl-filter-parda-bg" aria-hidden />

                    <div
                      className="cl-filter-parda-content"
                      style={{ paddingTop: `${headerBottom}px` }}
                    >
                    <div className="cl-filter-parda-header">
                      <div className="cl-filter-parda-header-rule" />
                      <div className="cl-filter-parda-header-row">
                        <div className="cl-filter-parda-tabs">
                          <span className="cl-filter-parda-label">Filter by</span>
                          {!singleListMode &&
                            categories.map((cat, idx) => (
                              <span key={cat} style={{ display: 'inline-flex', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => setActiveCategory(cat)}
                                  className={`cl-filter-parda-tab${activeCategory === cat ? ' is-active' : ''}`}
                                >
                                  {labelFor(cat)}
                                </button>
                                {idx < categories.length - 1 && (
                                  <span className="cl-filter-parda-tab-sep">|</span>
                                )}
                              </span>
                            ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpen(false)}
                          className="cl-filter-parda-close"
                          aria-label="Close filters"
                        >
                          ×
                        </button>
                      </div>
                      <div className="cl-filter-parda-header-rule" />
                    </div>

                    <div className="cl-filter-parda-list-wrap">
                      <div
                        ref={scrollRef}
                        className="cl-filter-parda-list ajab-filter-list"
                        onScroll={recalcThumb}
                      >
                        <ul>
                          {filterLists[activeCategory].map((item: string, index: number) => {
                            const isSelected =
                              activeCategory === 'Singer'
                                ? selectedSingers.includes(item)
                                : activeCategory === 'Poet'
                                  ? selectedPoets.includes(item)
                                  : selectedThemes.includes(item);
                            return (
                              <li
                                key={`${activeCategory}-${index}-${item}`}
                                className={isSelected ? 'is-selected' : undefined}
                                onClick={() => handleFilterSelect(activeCategory, item)}
                              >
                                <span>{item}</span>
                              </li>
                            );
                          })}
                          {filterLists[activeCategory].length === 0 && (
                            <li className="is-empty">No filters available</li>
                          )}
                        </ul>
                      </div>

                      {(thumbHeight < listMaxHeight || showScrollbar) && listMaxHeight > 0 && (
                        <div
                          className="cl-filter-parda-scrollbar"
                          style={{ height: `${Math.max(0, listMaxHeight - 48)}px` }}
                        >
                          <div
                            className="cl-filter-parda-scrollbar-thumb"
                            style={{
                              top: `${(thumbTop / listMaxHeight) * Math.max(0, listMaxHeight - 48)}px`,
                              height: `${(thumbHeight / listMaxHeight) * Math.max(0, listMaxHeight - 48)}px`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {(showClearAllAlways || selectedFilters.length > 0) && onClearAll && (
                      <div className="cl-filter-parda-footer">
                        <div className="cl-filter-parda-footer-rule cl-filter-parda-footer-rule--top" aria-hidden />
                        {selectedFilters.length > 0 && (
                          <div className="cl-filter-parda-chips">
                            {selectedFilters.map(({ type, value }) => (
                              <button
                                key={`${type}-${value}`}
                                type="button"
                                className="cl-filter-parda-chip"
                                onClick={() => onRemoveFilter(type, value)}
                              >
                                <span className="cl-filter-parda-chip-label">{value}</span>
                                <span className="cl-filter-parda-chip-x">×</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          className="cl-filter-parda-clear"
                          onClick={() => {
                            onClearAll();
                            setOpen(false);
                          }}
                        >
                          Clear all
                        </button>
                        <div className="cl-filter-parda-footer-rule cl-filter-parda-footer-rule--bottom" aria-hidden />
                      </div>
                    )}
                  </div>
                </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
