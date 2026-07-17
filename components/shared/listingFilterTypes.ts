/** Shared listing filter categories — internal keys used by CLFilterPanel. */
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

export type ListingFilterPanelProps = ListingFilterHandlers &
  ListingFilterSelection & {
    availableSingers?: ListingFilterOptionInput[];
    availablePoets?: ListingFilterOptionInput[];
    availableThemes?: ListingFilterOptionInput[];
    categoryLabels?: ListingFilterLabels;
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
  };
