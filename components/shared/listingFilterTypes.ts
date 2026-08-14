/** Shared listing filter categories — internal keys used by CLFilterPanel. */
import type { ReactNode } from 'react';

export type ListingFilterCategory = 'Singer' | 'Poet' | 'Theme';

/** Songs listing uses `{ id, label }` (API IDs). Other modules may still pass plain name strings. */
export type ListingFilterOption = { id: string; label: string };

export type ListingFilterOptionInput = string | ListingFilterOption;

export type ListingFilterLabels = Partial<Record<ListingFilterCategory, string>>;

export type ListingFilterLists = Record<ListingFilterCategory, string[]>;

export type ListingFilterHandlers = {
  /** `value` is the option id when lists use `{ id, label }`, otherwise the display name. */
  onFilterSelect: (type: ListingFilterCategory, value: string) => void;
  onRemoveFilter: (type: ListingFilterCategory, value: string) => void;
  onClearAll: () => void;
};

export type ListingFilterSelection = {
  selectedSingers?: string[];
  selectedPoets?: string[];
  selectedThemes?: string[];
};

/** Opt-in catalog view shown inside the drawer before any category tab is picked (Poems). */
export type ListingCatalogEntry = {
  id: string;
  label: string;
  sublabel?: string;
};

export type ListingCatalogConfig = {
  items: ListingCatalogEntry[];
  onSelect: (id: string) => void;
  activeId?: string;
  emptyLabel?: string;
};

export type ListingFilterPanelProps = ListingFilterHandlers &
  ListingFilterSelection & {
    availableSingers?: ListingFilterOptionInput[];
    availablePoets?: ListingFilterOptionInput[];
    availableThemes?: ListingFilterOptionInput[];
    categoryLabels?: ListingFilterLabels;
    /**
     * Tab order for the drawer categories. Defaults to Singer → Poet → Theme.
     * Reflections uses Speaker → Theme → Format (`['Singer', 'Theme', 'Poet']`).
     * Poems uses Poet → Theme (`['Poet', 'Theme']`).
     */
    categoryOrder?: ListingFilterCategory[];
    /** Optional footer under the option list for a category (e.g. Poems Oral Traditions note). */
    categoryFooter?: Partial<Record<ListingFilterCategory, ReactNode>>;
    /**
     * Poems drawer opens on the full poem catalog; tapping Poet/Theme swaps to that
     * filter list. Omit for Songs/Reflections, which open straight to the filter list.
     */
    catalogList?: ListingCatalogConfig;
    /** Max combined chips — omit for unlimited (Songs listing). */
    maxFilters?: number;
    /** Single-column list (e.g. People occupation categories) — hides Singer/Poet/Theme tabs. */
    singleListMode?: boolean;
    /** Client spec: Filters trigger stays pink even when no chips are selected. */
    filterTriggerAlwaysPink?: boolean;
    /** Show Clear all in drawer footer even when nothing is selected. */
    showClearAllAlways?: boolean;
    /** @deprecated Songs listing uses API lists only; prop ignored if removed later. */
    useSongsMockFallback?: boolean;
    /** Hide the default "Filters" trigger (use a custom trigger elsewhere). */
    hideTrigger?: boolean;
    /** Controlled open state for the filter drawer. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Drawer width in px (default 422). Poems AI uses ~446. */
    drawerWidth?: number;
  };
