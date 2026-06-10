'use client';

import type { ListingFilterCategory } from './listingFilterTypes';

type Chip = { type: ListingFilterCategory; value: string };

type Props = {
  chips: Chip[];
  categoryLabels?: Partial<Record<ListingFilterCategory, string>>;
  onRemove: (type: ListingFilterCategory, value: string) => void;
  onClearAll: () => void;
};

/** PDF: selected filter chips below the filter bar when the drawer is closed. */
export default function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: Props) {
  if (chips.length === 0) return null;

  return (
    <div className="cl-active-chips-bar">
      <div className="cl-active-chips-list">
        {chips.map(({ type, value }) => (
          <span key={`${type}-${value}`} className="cl-active-chip">
            <span className="cl-active-chip-label">{value}</span>
            <button
              type="button"
              className="cl-active-chip-remove"
              aria-label={`Remove ${value}`}
              onClick={() => onRemove(type, value)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {chips.length >= 1 && (
        <button type="button" className="cl-active-chips-clear" onClick={onClearAll}>
          Clear all
        </button>
      )}
    </div>
  );
}

export function buildFilterChips(
  selectedSingers: string[],
  selectedPoets: string[],
  selectedThemes: string[]
): Chip[] {
  return [
    ...selectedSingers.map((value) => ({ type: 'Singer' as const, value })),
    ...selectedPoets.map((value) => ({ type: 'Poet' as const, value })),
    ...selectedThemes.map((value) => ({ type: 'Theme' as const, value })),
  ];
}
