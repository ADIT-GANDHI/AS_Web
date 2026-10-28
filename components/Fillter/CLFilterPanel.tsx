'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  ListingFilterCategory,
  ListingFilterOption,
  ListingFilterOptionInput,
  ListingFilterPanelProps,
} from '@/components/shared/listingFilterTypes';
import {
  FILTER_DRAWER_BACKDROP_TOP,
  FILTER_DRAWER_BG_OPACITY,
  FILTER_DRAWER_DEFAULT_WIDTH,
  FILTER_DRAWER_SONGS_BG_OPACITY,
  FILTER_DRAWER_SONGS_SCROLL_RIGHT_PX,
  FILTER_DRAWER_SONGS_SCROLL_TRACK_PX,
  FILTER_DRAWER_TOP,
  FILTER_DRAWER_Z_BACKDROP,
  FILTER_DRAWER_Z_PANEL,
  measureFilterDrawerFooterOverlapPx,
} from '@/lib/filterDrawerLayout';
import { dedupeOrderedStrings } from '@/lib/dedupeStrings';
import { FILTER_PANEL_SHAPE, SONGS_FILTER_WHITE_PARDA } from '@/lib/resolveCmsAssetUrl';
import FilterSelectionChips from '@/components/Fillter/FilterSelectionChips';

export type { ListingFilterCategory, ListingFilterPanelProps };

type FilterType = ListingFilterCategory;

const DEFAULT_CATEGORY_LABELS: Record<FilterType, string> = {
  Singer: 'Singer',
  Poet: 'Poet',
  Theme: 'Theme',
};

function normalizeFilterOptions(list: ListingFilterOptionInput[] | undefined): ListingFilterOption[] {
  if (!list?.length) return [];
  const seen = new Set<string>();
  const out: ListingFilterOption[] = [];
  for (const item of list) {
    const id =
      typeof item === 'string' ? String(item ?? '').trim() : String(item?.id ?? '').trim();
    const label =
      typeof item === 'string'
        ? String(item ?? '').replace(/\s+/g, ' ').trim()
        : String(item?.label ?? '').replace(/\s+/g, ' ').trim();
    const translation =
      typeof item === 'string'
        ? undefined
        : item?.translation
          ? String(item.translation).replace(/\s+/g, ' ').trim()
          : undefined;
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label, ...(translation ? { translation } : {}) });
  }
  return out;
}

function FilterOptionLabel({
  label,
  translation,
  stacked = false,
}: {
  label: string;
  translation?: string;
  stacked?: boolean;
}) {
  if (!translation) return <span>{label}</span>;
  /* Songs parda: translation on the next line, lighter than the word. */
  if (stacked) {
    return (
      <span style={{ display: 'block' }}>
        <span style={{ display: 'block' }}>{label}</span>
        <em
          style={{
            display: 'block',
            fontStyle: 'italic',
            fontWeight: 300,
            color: '#9A9A9C',
            marginTop: '2px',
          }}
        >
          {translation}
        </em>
      </span>
    );
  }
  return (
    <span style={{ display: 'inline' }}>
      <span>{label}</span>
      <span>{'  '}</span>
      <em
        style={{
          fontStyle: 'italic',
          fontWeight: 300,
          whiteSpace: 'nowrap',
        }}
      >
        {translation}
      </em>
    </span>
  );
}

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
  categoryOrder,
  maxFilters,
  useSongsMockFallback = false,
  hideTrigger = false,
  open: openProp,
  onOpenChange,
  singleListMode = false,
  filterTriggerAlwaysPink = false,
  showClearAllAlways = false,
  categoryFooter,
  catalogList,
  drawerWidth = FILTER_DRAWER_DEFAULT_WIDTH,
  songsPardaLayout = false,
}: ListingFilterPanelProps) {
  const panelWidthPx = `${drawerWidth}px`;
  /* Songs: left 25 (PREV 28 — shift the list 3px left so Filter by / × balance). */
  const pardaPadL = songsPardaLayout ? 25 : 20;
  const pardaPadR = songsPardaLayout ? 20 : 20;
  const pardaTopPad = songsPardaLayout ? 20 : 24;
  const scrollRight = songsPardaLayout ? FILTER_DRAWER_SONGS_SCROLL_RIGHT_PX : 20;
  const scrollTrackW = songsPardaLayout ? FILTER_DRAWER_SONGS_SCROLL_TRACK_PX : 6;
  /* Center line of scrollbar (= × center). */
  const scrollCenter = scrollRight + scrollTrackW / 2;
  /* List clears the track only — no extra “× padding” stealing Theme width. */
  const listPadR = songsPardaLayout ? scrollRight + scrollTrackW + 4 : 40;
  /* Filter-by row: clear the × glyph only (absolute); tighter than listPadR. */
  const filterByPadR = songsPardaLayout ? Math.ceil(scrollCenter + 10) : 36;
  const sepColor = songsPardaLayout ? '#c0c0c0' : '#B1B1B1';
  /* 15 Oct — all filter words 17px (Songs + others in this panel). */
  const listFontPx = '17px';
  const listPadY = songsPardaLayout ? '12px' : undefined;
  /* Keep increased Singer | Poet | Theme gaps (do not lose). */
  const catBtnPadX = songsPardaLayout ? 3 : 0;
  const ruleInset = songsPardaLayout ? 4 : 0;
  /* All 3 grey rules share this width — end at × column (15 Oct). */
  const songsRuleWidth = songsPardaLayout
    ? `calc(100% - ${scrollCenter}px - ${ruleInset}px)`
    : '100%';
  /* Clear-all sits in a box that also has right padding, so add that padding back
     or this rule ends short of the two rules above it. */
  const songsFooterRuleWidth = songsPardaLayout
    ? `calc(100% + ${pardaPadR}px - ${scrollCenter}px - ${ruleInset}px)`
    : '100%';
  const songsRuleMarginLeft = songsPardaLayout ? `${ruleInset}px` : 0;
  /* List top clear so first word isn’t clipped (client: 6–8px). */
  const listTopClearPx = songsPardaLayout ? 7 : 3;
  const scrollTrack = songsPardaLayout ? '#dedede' : '#e0e0e0';
  const scrollThumb = songsPardaLayout ? '#818181' : '#999999';
  const panelBgOpacity = songsPardaLayout
    ? FILTER_DRAWER_SONGS_BG_OPACITY
    : FILTER_DRAWER_BG_OPACITY;
  // Derives whether any filter is currently active — used for trigger colour
  const hasActiveFilters = selectedSingers.length > 0 || selectedPoets.length > 0 || selectedThemes.length > 0;
  /* Idle = black; pink only while one or more filters are selected. */
  const triggerPink = hasActiveFilters;
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = openProp ?? openUncontrolled;
  const openRef = useRef(open);
  openRef.current = open;
  /* Songs: after the slide finishes, drop its transform so the 1px rules
     stay on the pixel grid while the list or page scrolls. */
  const [rulesCrisp, setRulesCrisp] = useState(false);
  useLayoutEffect(() => {
    if (!open) setRulesCrisp(false);
  }, [open]);
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
  // Poems: drawer opens on the poem catalog until a category tab is tapped.
  const hasCatalog = Boolean(catalogList);
  const [catalogMode, setCatalogMode] = useState(hasCatalog);

  useEffect(() => {
    if (open) setCatalogMode(hasCatalog);
  }, [open, hasCatalog]);

  // Tracks the header's current bottom edge in the viewport so the filter content
  // starts exactly below the header at page-top and fills the full panel when scrolled.
  const [headerBottom, setHeaderBottom] = useState(191);
  /** Footer overlap into the viewport — pad list chrome; parda stays full-height. */
  const [footerOverlapPx, setFooterOverlapPx] = useState(0);
  useEffect(() => {
    if (!open) return;
    let rafId: number;
    let lastHeader = -1;
    let lastOverlap = -1;
    const tick = () => {
      const header = document.querySelector('header');
      if (header) {
        const b = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
        if (b !== lastHeader) {
          lastHeader = b;
          setHeaderBottom(b);
        }
      }
      const overlap = measureFilterDrawerFooterOverlapPx();
      if (overlap !== lastOverlap) {
        lastOverlap = overlap;
        setFooterOverlapPx(overlap);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  /** Mark body so the site footer can paint above the parda (wave covers the curtain). */
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('ajab-filter-drawer-open');
    return () => document.body.classList.remove('ajab-filter-drawer-open');
  }, [open]);

  // Full viewport curtain — never hard-cut above the footer (that looked broken).
  const panelHeightCss = '100dvh';

  // Issue 11: List of singers should continue till the end of the screen.
  // We use a dynamic calculation based on clientHeight instead of hardcoded LIST_MAX_H.
  const [listMaxHeight, setListMaxHeight] = useState(480);
  const [showScrollbar, setShowScrollbar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(480);
  // LOCKED_SCROLL: uncomment panelRef + ref on motion.div below when re-enabling scroll lock.
  // const panelRef = useRef<HTMLDivElement>(null);

  const filterLists = useMemo(() => {
    const pick = (
      available: ListingFilterOptionInput[] | undefined,
      mock: string[]
    ): ListingFilterOption[] => {
      const normalized = normalizeFilterOptions(available);
      if (normalized.length > 0) return normalized;
      return useSongsMockFallback
        ? normalizeFilterOptions(mock)
        : normalizeFilterOptions(available ?? []);
    };
    return {
      Singer: pick(availableSingers, MOCK_FILTERS.Singer),
      Poet: pick(availablePoets, MOCK_FILTERS.Poet),
      Theme: pick(availableThemes, MOCK_FILTERS.Theme),
    };
  }, [availableSingers, availablePoets, availableThemes, useSongsMockFallback]);

  const optionById = useMemo(() => {
    const map = new Map<string, ListingFilterOption>();
    (['Singer', 'Poet', 'Theme'] as FilterType[]).forEach((cat) => {
      filterLists[cat].forEach((opt) => map.set(`${cat}:${opt.id}`, opt));
    });
    return map;
  }, [filterLists]);

  const selectedFilters = useMemo(
    () => [
      ...selectedSingers.map((value: string) => {
        const opt = optionById.get(`Singer:${value}`);
        return {
          type: 'Singer' as const,
          value,
          label: opt?.label || value,
          translation: opt?.translation,
        };
      }),
      ...selectedPoets.map((value: string) => {
        const opt = optionById.get(`Poet:${value}`);
        return {
          type: 'Poet' as const,
          value,
          label: opt?.label || value,
          translation: opt?.translation,
        };
      }),
      ...selectedThemes.map((value: string) => {
        const opt = optionById.get(`Theme:${value}`);
        return {
          type: 'Theme' as const,
          value,
          label: opt?.label || value,
          translation: opt?.translation,
        };
      }),
    ],
    [selectedSingers, selectedPoets, selectedThemes, optionById]
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
      if (hasCatalog) setCatalogMode(true);
    },
    [
      hasCatalog,
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
    const overflow = scrollHeight > clientHeight + 1;
    setShowScrollbar(overflow);
    if (!overflow) {
      setThumbHeight(clientHeight);
      setThumbTop(0);
      return;
    }
    const th = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
    const tp = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - th);
    setThumbHeight(th);
    setThumbTop(tp);
  }, []);

  // On open: reset list scroll + schedule thumb recalc after layout/animation settle.
  useEffect(() => {
    if (!open) {
      setShowScrollbar(false);
      return;
    }

    const el = scrollRef.current;
    if (el) el.scrollTop = 0;

    recalcThumb();
    requestAnimationFrame(() => {
      const list = scrollRef.current;
      if (list) list.scrollTop = 0;
      recalcThumb();
      requestAnimationFrame(recalcThumb);
    });
    const t0 = window.setTimeout(recalcThumb, 0);
    const t1 = window.setTimeout(recalcThumb, 100);

    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [open, recalcThumb]);

  // Recalculate when list/footer layout changes while open.
  useEffect(() => {
    if (!open) return;

    recalcThumb();
    window.addEventListener('resize', recalcThumb);

    const el = scrollRef.current;
    const ro =
      el && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => recalcThumb())
        : null;
    if (el && ro) {
      ro.observe(el);
      const ul = el.querySelector('ul');
      if (ul) ro.observe(ul);
    }

    return () => {
      window.removeEventListener('resize', recalcThumb);
      ro?.disconnect();
    };
  }, [open, filterLists, activeCategory, catalogMode, selectedFilters.length, recalcThumb]);

  // Only render overlay after hydration (fixed layers are client-only).
  useEffect(() => setMounted(true), []);

  // ── Filter scroll mode ──
  // Active: dual scroll — page and filter list both scroll while the parda is open.
  // To revert to locked scroll (page frozen behind filter): uncomment LOCKED_SCROLL block below
  // and restore panelRef + ref={panelRef} on the motion.div drawer.
  //
  // LOCKED_SCROLL — body/html overflow lock
  // useEffect(() => {
  //   if (!open) return;
  //   const prevBody = document.body.style.overflow;
  //   const prevHtml = document.documentElement.style.overflow;
  //   document.body.style.overflow = 'hidden';
  //   document.documentElement.style.overflow = 'hidden';
  //   return () => {
  //     document.body.style.overflow = prevBody;
  //     document.documentElement.style.overflow = prevHtml;
  //   };
  // }, [open]);
  //
  // LOCKED_SCROLL — non-passive wheel lock (list scrolls inside drawer; page behind never moves)
  // useEffect(() => {
  //   if (!open) return;
  //
  //   const onWheel = (event: WheelEvent) => {
  //     const panel = panelRef.current;
  //     const list = scrollRef.current;
  //     const target = event.target as Node | null;
  //     if (!panel || !target) return;
  //
  //     if (!panel.contains(target)) {
  //       event.preventDefault();
  //       return;
  //     }
  //
  //     if (list?.contains(target)) {
  //       const { scrollTop, scrollHeight, clientHeight } = list;
  //       const atTop = scrollTop <= 0;
  //       const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
  //       if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
  //         event.preventDefault();
  //       }
  //       return;
  //     }
  //
  //     event.preventDefault();
  //   };
  //
  //   document.addEventListener('wheel', onWheel, { passive: false, capture: true });
  //   return () => document.removeEventListener('wheel', onWheel, true);
  // }, [open]);

  const categories: FilterType[] = singleListMode
    ? ['Singer']
    : categoryOrder?.length
      ? categoryOrder
      : ['Singer', 'Poet', 'Theme'];
  const labelFor = (cat: FilterType) => categoryLabels[cat] ?? cat;
  /* Songs rules: 1px border on white, same #c0c0c0 and same width.
     PREV: height 1px; background sepColor — that fill darkened and lightened while scrolling. */
  const hairlineRule = (width: string, extra?: Record<string, string | number>) =>
    songsPardaLayout
      ? {
          height: 0,
          borderTop: `1px solid ${sepColor}`,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 -1px 0 #FFFFFF, 0 1px 0 #FFFFFF',
          width,
          marginLeft: songsRuleMarginLeft,
          flexShrink: 0,
          ...extra,
        }
      : {
          height: '1px',
          background: sepColor,
          width,
          marginLeft: songsRuleMarginLeft,
          flexShrink: 0,
          ...extra,
        };

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0] ?? 'Singer');
    }
  }, [categories, activeCategory]);

  return (
    <div className="relative inline-block">
      {/* ── Trigger button ── */}
      {/* Idle black; pink (#E31E79) only when filters are selected. */}
      {!hideTrigger && (
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          color: triggerPink ? '#E31E79' : '#1a1a1a',
          fontFamily: FONT,
          fontWeight: 400,
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
          .ajab-filter-drawer--rest { transform: none !important; }
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

                  {/* Portaled drawer — full-height curtain; footer wave paints on top when in view. */}
                  <motion.div
                  // LOCKED_SCROLL: ref={panelRef}
                  className={
                    songsPardaLayout && rulesCrisp
                      ? 'ajab-filter-drawer ajab-filter-drawer--rest'
                      : 'ajab-filter-drawer'
                  }
                  style={{
                    position: 'fixed',
                    top: FILTER_DRAWER_TOP,
                    left: 0,
                    width: panelWidthPx,
                    height: panelHeightCss,
                    maxHeight: panelHeightCss,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: FONT,
                    zIndex: FILTER_DRAWER_Z_PANEL,
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                    overscrollBehavior: 'contain',
                    /* Songs white parda is a transparent PNG. A white box here squares off the wave.
                       PREV (opaque svg): backgroundColor '#FFFFFF'. */
                    backgroundColor: songsPardaLayout ? 'transparent' : '#FFFFFF',
                  }}
                  initial={{ x: '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 22 }}
                  onAnimationComplete={() => {
                    recalcThumb();
                    if (songsPardaLayout && openRef.current) setRulesCrisp(true);
                  }}
                >
                  {/* Wavy panel bg — opaque so page text (counts / Filters | All) does not bleed through */}
                  <div
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      /* PREV songs: FILTER_DRAWER_SONGS_BG_OPACITY (0.95) over the opaque svg.
                         The new PNG already carries its own white alpha. */
                      opacity: songsPardaLayout ? 1 : panelBgOpacity,
                      pointerEvents: 'none',
                    }}
                  >
                    {/* PREV songs underlay + curtain (revert with src={FILTER_PANEL_SHAPE}):
                    <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF' }} />
                    <img src={FILTER_PANEL_SHAPE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'right center' }} />
                    */}
                    {!songsPardaLayout && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: '#FFFFFF',
                        }}
                      />
                    )}
                    {/* PREV objectFit:'fill' stretched X/Y independently → flatter/longer waves.
                        cover + right anchor = uniform scale, keep wavy right edge.
                        Songs src PREV raster (pixelated): /songs-assets/song_filter_white_480x1660.png
                        Songs src PREV curtain: FILTER_PANEL_SHAPE (/songs-assets/song_filter_opaque.svg). */}
                    <img
                      src={songsPardaLayout ? SONGS_FILTER_WHITE_PARDA : FILTER_PANEL_SHAPE}
                      alt=""
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'right center',
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
                      /* Keep list / chips above the footer wave while artwork fills the screen */
                      paddingBottom: footerOverlapPx > 0 ? `${footerOverlapPx}px` : undefined,
                      boxSizing: 'border-box',
                    }}
                  >
                  <div
                    style={{
                      position: 'relative',
                      /* Songs: left inset 30; right gutter for × / scrollbar column. */
                      padding: songsPardaLayout
                        ? `${pardaTopPad}px 0 0 ${pardaPadL}px`
                        : `${pardaTopPad}px ${pardaPadR}px 0 ${pardaPadL}px`,
                      flex: '0 0 auto',
                      width: '100%',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                    }}
                  >
                    {/* Rules: ~4px left inset, same width for all — end at × (15 Oct) */}
                    <div aria-hidden="true" style={hairlineRule(songsRuleWidth)} />
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        /* Songs: pad only for × — not the full list gutter (keeps “Theme” visible). */
                        padding: songsPardaLayout
                          ? `20px ${filterByPadR}px 18px 0`
                          : '20px 36px 18px 0',
                        gap: '8px',
                        minWidth: 0,
                        width: '100%',
                        boxSizing: 'border-box',
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
                          /* visible so “Theme” is never mid-word clipped */
                          overflow: 'visible',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONT,
                            fontSize: '18px',
                            fontWeight: 400,
                            color: '#333333',
                            marginRight: singleListMode ? 0 : songsPardaLayout ? '6px' : '10px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          Filter by
                        </span>

                        {!singleListMode &&
                          categories.map((cat, idx) => (
                            <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                              <button
                                onClick={() => {
                                  setCatalogMode(false);
                                  setActiveCategory(cat);
                                }}
                                style={{
                                  fontFamily: FONT,
                                  fontSize: '18px',
                                  fontWeight: 300,
                                  color:
                                    !catalogMode && activeCategory === cat
                                      ? '#E31E79'
                                      : '#828282',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: `0 ${catBtnPadX}px`,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {labelFor(cat)}
                              </button>
                              {idx < categories.length - 1 && (
                                <span
                                  style={{
                                    color: songsPardaLayout ? '#c0c0c0' : '#333333',
                                    fontSize: '18px',
                                    fontWeight: 300,
                                    margin: songsPardaLayout ? '0 3px' : '0 5px',
                                  }}
                                >
                                  |
                                </span>
                              )}
                            </span>
                          ))}
                      </div>

                      {!songsPardaLayout && (
                        <button
                          onClick={() => setOpen(false)}
                          aria-label="Close filters"
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#E6257A',
                            fontSize: '22px',
                            lineHeight: 1,
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 2px',
                            flexShrink: 0,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div aria-hidden="true" style={hairlineRule(songsRuleWidth)} />

                    {/* Songs: × with no side padding; center aligned to scrollbar track */}
                    {songsPardaLayout && (
                      <button
                        onClick={() => setOpen(false)}
                        aria-label="Close filters"
                        style={{
                          position: 'absolute',
                          right: scrollCenter,
                          /* Center on Filter-by row: topPad + rule + half of row */
                          top: `calc(${pardaTopPad}px + 1px + 20px + 14px)`,
                          transform: 'translate(50%, -50%)',
                          color: '#E6257A',
                          fontSize: '28px',
                          lineHeight: 1,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          zIndex: 2,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* 6–8px clear below grey rule so first list word isn’t clipped (15 Oct) */}
                  <div
                    aria-hidden="true"
                    style={{
                      height: `${listTopClearPx}px`,
                      flexShrink: 0,
                      background: 'transparent',
                    }}
                  />

                  {/* ── Filter list ── */}
                  <div
                    style={{
                      position: 'relative',
                      paddingLeft: `${pardaPadL}px`,
                      paddingRight: `${listPadR}px`,
                      flex: '1 1 0%',
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      ref={scrollRef}
                      className="ajab-filter-list"
                      onScroll={recalcThumb}
                      style={{
                        overflowY: 'scroll',
                        flex: '1 1 0%',
                        minHeight: 0,
                        paddingTop: '11px',
                        paddingBottom: '24px',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        overflowWrap: 'normal',
                        wordBreak: 'normal',
                        overscrollBehavior: 'contain',
                        touchAction: 'pan-y',
                      }}
                    >
                      {catalogMode && catalogList ? (
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                          {catalogList.items.map((entry, index) => {
                            const isActive = catalogList.activeId === entry.id;
                            return (
                              <li
                                key={`catalog-${index}-${entry.id}`}
                                onClick={() => catalogList.onSelect(entry.id)}
                                style={{
                                  fontFamily: FONT,
                                  fontWeight: isActive ? 400 : 300,
                                  fontSize: listFontPx,
                                  lineHeight: '1.3',
                                  color: isActive ? '#E31E79' : '#6F6F72',
                                  cursor: 'pointer',
                                  padding: listPadY ? `${listPadY} 0` : '11px 0',
                                  /* Wrap long titles onto next line at word boundaries — never mid-word */
                                  whiteSpace: 'normal',
                                  overflowWrap: 'normal',
                                  wordBreak: 'normal',
                                  hyphens: 'none',
                                }}
                              >
                                <span style={{ display: 'block' }}>{entry.label}</span>
                                {entry.sublabel ? (
                                  <span
                                    style={{
                                      display: 'block',
                                      fontStyle: 'italic',
                                      fontSize: '14px',
                                      color: '#9A9A9C',
                                      marginTop: '2px',
                                      whiteSpace: 'normal',
                                      overflowWrap: 'normal',
                                      wordBreak: 'normal',
                                      hyphens: 'none',
                                    }}
                                  >
                                    {entry.sublabel}
                                  </span>
                                ) : null}
                              </li>
                            );
                          })}
                          {catalogList.items.length === 0 && (
                            <li style={{ color: '#a7a7a7', padding: '12px 0', fontSize: '15px' }}>
                              {catalogList.emptyLabel || 'Nothing to show'}
                            </li>
                          )}
                        </ul>
                      ) : (
                      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                        {filterLists[activeCategory].map((item, index) => {
                          const isSelected =
                            activeCategory === 'Singer'
                              ? selectedSingers.includes(item.id)
                              : activeCategory === 'Poet'
                                ? selectedPoets.includes(item.id)
                                : selectedThemes.includes(item.id);
                          return (
                            <li
                              key={`${activeCategory}-${index}-${item.id}`}
                              onClick={() => handleFilterSelect(activeCategory, item.id)}
                              style={{
                                fontFamily: FONT,
                                fontWeight: isSelected ? 400 : 300,
                                fontSize: listFontPx,
                                lineHeight: '1.3',
                                color: isSelected ? '#E31E79' : '#6F6F72',
                                cursor: 'pointer',
                                padding: listPadY ? `${listPadY} 0` : '13px 0',
                                display: 'flex',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                                /* Word-boundary wrap — never mid-word; Theme translation nowrap unit */
                                whiteSpace: 'normal',
                                overflowWrap: 'normal',
                                wordBreak: 'normal',
                                hyphens: 'none',
                              }}
                            >
                              <FilterOptionLabel
                                label={item.label}
                                translation={item.translation}
                                stacked={songsPardaLayout}
                              />
                            </li>
                          );
                        })}
                        {filterLists[activeCategory].length === 0 && (
                          <li style={{ color: '#a7a7a7', padding: '12px 0', fontSize: '15px' }}>
                            No filters available
                          </li>
                        )}
                      </ul>
                      )}
                      {!catalogMode && categoryFooter?.[activeCategory] ? (
                        <div style={{ paddingTop: 8, paddingBottom: 8 }}>
                          {categoryFooter[activeCategory]}
                        </div>
                      ) : null}
                    </div>

                    {/* Custom scrollbar — track height tracks live list clientHeight */}
                    {listMaxHeight > 0 && showScrollbar && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '24px',
                          right: `${scrollRight}px`,
                          width: `${scrollTrackW}px`,
                          height: `${listMaxHeight - 48}px`,
                          background: scrollTrack,
                          borderRadius: '3px',
                          pointerEvents: 'none',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: `${(thumbTop / listMaxHeight) * (listMaxHeight - 48)}px`,
                            width: `${scrollTrackW}px`,
                            height: `${(thumbHeight / listMaxHeight) * (listMaxHeight - 48)}px`,
                            background: scrollThumb,
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
                        /* 15 Oct — no extra bottom pad; top rule same width as header rules (till ×) */
                        padding: songsPardaLayout
                          ? `10px ${pardaPadR}px 4px ${pardaPadL}px`
                          : `14px ${pardaPadR}px 28px ${pardaPadL}px`,
                        borderTop: 'none',
                        flex: '0 0 auto',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      {songsPardaLayout && (
                        <div
                          aria-hidden="true"
                          style={hairlineRule(songsFooterRuleWidth, { marginBottom: '10px' })}
                        />
                      )}
                      {!songsPardaLayout && (
                        <div
                          aria-hidden="true"
                          style={{
                            height: '1px',
                            background: sepColor,
                            width: '100%',
                            marginBottom: '14px',
                          }}
                        />
                      )}
                      {/* Selected items — one per row (14 Oct) */}
                      {selectedFilters.length > 0 && (
                        <FilterSelectionChips
                          items={selectedFilters}
                          onRemove={onRemoveFilter}
                          stackTranslation={songsPardaLayout}
                        />
                      )}

                      {/* CLEAR ALL */}
                      <button
                        type="button"
                        onClick={() => {
                          onClearAll();
                          /* Songs: clear tags only. PREV: setOpen(false) closed the parda. */
                          if (!songsPardaLayout) setOpen(false);
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
