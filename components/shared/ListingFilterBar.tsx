'use client';

import type { ReactNode } from 'react';
import CLFilterPanel from '@/components/Fillter/CLFilterPanel';
import type { ListingFilterPanelProps } from './listingFilterTypes';
import { buildFilterChips } from './ActiveFilterChips';

type Props = {
  panel: ListingFilterPanelProps;
  onAllClick: () => void;
  allActive?: boolean;
  /** When true, "All" is pink only while filters are active (client Reflections/People spec). */
  allPinkWhenFiltered?: boolean;
  /** Optional A–Z row (Songs, People). Omit for modules with All only (Reflections). */
  azRow?: ReactNode;
};

/** Shared filter bar shell: Filters trigger + | + All + optional A–Z row (PDF: no chip strip on page). */
export default function ListingFilterBar({
  panel,
  onAllClick,
  allActive = false,
  allPinkWhenFiltered = false,
  azRow,
}: Props) {
  const chips = buildFilterChips(
    panel.selectedSingers ?? [],
    panel.selectedPoets ?? [],
    panel.selectedThemes ?? []
  );

  const hasChipFilters = chips.length > 0;
  const allButtonActive = allPinkWhenFiltered ? hasChipFilters || allActive : allActive;

  return (
    <>
      <div className="cl-filter-bar">
        <span className="cl-filter-trigger-wrap">
          <CLFilterPanel {...panel} />
        </span>
        <span className="cl-filter-sep">|</span>
        <button
          type="button"
          className={`cl-az-btn cl-az-btn--all${allButtonActive ? ' active' : ''}${
            allPinkWhenFiltered && !hasChipFilters ? ' cl-az-btn--all-idle' : ''
          }`}
          onClick={onAllClick}
        >
          All
        </button>
        {azRow}
      </div>
    </>
  );
}
