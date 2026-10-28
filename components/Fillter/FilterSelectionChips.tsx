'use client';

/**
 * Selected filter chips for the shared filter parda.
 * 15 Oct — × inline after the label (not pinned to the far right); 17px type.
 */

import {
  FILTER_DRAWER_SELECTION_ROW_PX,
} from '@/lib/filterDrawerLayout';

const FONT = "'Merriweather Sans', sans-serif";
/** Visible rows before the selection list scrolls (was 2×2 grid). */
const MAX_VISIBLE_ROWS = 6;

export type FilterSelectionChip = {
  type: string;
  value: string;
  label: string;
  /** Theme translation — double space + italics (no parentheses). */
  translation?: string;
};

type Props = {
  items: FilterSelectionChip[];
  onRemove: (type: string, value: string) => void;
  /** Songs parda: theme translation on the next line, lighter than the word. */
  stackTranslation?: boolean;
};

export default function FilterSelectionChips({ items, onRemove, stackTranslation = false }: Props) {
  if (!items.length) return null;

  return (
    <div
      className="ajab-filter-selections"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 0,
        marginBottom: '6px',
        maxHeight: `${MAX_VISIBLE_ROWS * (stackTranslation ? 52 : FILTER_DRAWER_SELECTION_ROW_PX)}px`,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingTop: '3px',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {items.map((chip) => (
        <button
          key={`${chip.type}-${chip.value}`}
          type="button"
          onClick={() => onRemove(chip.type, chip.value)}
          title={
            chip.translation ? `${chip.label}  ${chip.translation}` : chip.label
          }
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
            display: 'inline-flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            gap: '5px',
            width: 'fit-content',
            maxWidth: '100%',
            whiteSpace: 'normal',
            overflowWrap: 'normal',
            wordBreak: 'normal',
            hyphens: 'none',
            lineHeight: 1.3,
          }}
        >
          <span style={{ minWidth: 0, display: stackTranslation ? 'block' : undefined }}>
            {chip.label}
            {chip.translation ? (
              stackTranslation ? (
                <em
                  style={{
                    display: 'block',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    color: '#9A9A9C',
                    marginTop: '2px',
                  }}
                >
                  {chip.translation}
                </em>
              ) : (
                <>
                  {'  '}
                  <em style={{ fontStyle: 'italic', fontWeight: 300, whiteSpace: 'nowrap' }}>
                    {chip.translation}
                  </em>
                </>
              )
            ) : null}
          </span>
          <span
            style={{
              color: '#E31E79',
              fontWeight: 400,
              flexShrink: 0,
              lineHeight: 1.3,
            }}
          >
            ×
          </span>
        </button>
      ))}
    </div>
  );
}
