'use client';

import type { ReactNode } from 'react';
import CLFilterPanel from '@/components/Fillter/CLFilterPanel';
import type { ListingFilterPanelProps } from './listingFilterTypes';
import ActiveFilterChips, { buildFilterChips } from './ActiveFilterChips';

type Props = {
  panel: ListingFilterPanelProps;
  onAllClick: () => void;
  allActive?: boolean;
  /** Optional A–Z row (Songs, People). Omit for modules with All only (Reflections). */
  azRow?: ReactNode;
};

/** Shared filter bar shell: Filters trigger + | + All + optional A–Z row + active chips. */
export default function ListingFilterBar({ panel, onAllClick, allActive = true, azRow }: Props) {
  const chips = buildFilterChips(
    panel.selectedSingers ?? [],
    panel.selectedPoets ?? [],
    panel.selectedThemes ?? []
  );

  return (
    <>
      <div className="cl-filter-bar">
        <span className="cl-filter-trigger-wrap">
          <CLFilterPanel {...panel} />
        </span>
        <span className="cl-filter-sep">|</span>
        <button
          type="button"
          className={`cl-az-btn cl-az-btn--all${allActive ? ' active' : ''}`}
          onClick={onAllClick}
        >
          All
        </button>
        {azRow}
      </div>
      <ActiveFilterChips
        chips={chips}
        onRemove={panel.onRemoveFilter}
        onClearAll={panel.onClearAll}
      />
    </>
  );
}
