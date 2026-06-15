'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { dedupeOrderedStrings } from '@/lib/dedupeStrings';

type FilterCategory = 'Speaker' | 'Theme' | 'Format';
type PreviewItem = { title: string; excerpt: string };

// Fallback used when API is unreachable
const FALLBACK_FILTERS: Record<FilterCategory, string[]> = {
  Speaker: ['Abdullah Ismail Jat', 'Amolak Ram', 'Arun Goyal', 'Krishna Nath', 'Kapil Tiwari', 'Parvathy Baul', 'Vipul Rikhi'],
  Theme: ['Devotion', 'Death and Impermanence', 'Love', 'Wisdom', 'Unity', 'Inner Search', 'Oral Traditions'],
  // [Claude] Format is hardcoded — Api/reflection_filter returns incorrect data for format field
  Format: ['Interview', 'Visual Story', 'Essay', 'Audio Story'],
};

export default function CLReflectionFilterPanel({
  onSelectSpeaker,
  onSelectTheme,
  onSelectFormat,
  onClearAll,
  selectedSpeakers = [] as string[],
  selectedThemes = [] as string[],
  selectedFormats = [] as string[],
  previewList = [] as PreviewItem[],
}: any) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Speaker');
  // [Claude] Live filter options from Api/reflection_filter
  const [filters, setFilters] = useState(FALLBACK_FILTERS);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/reflection_filter`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data || {};
        // speaker field may only have first_name; combine safely
        const speakers = dedupeOrderedStrings(
          (data.speaker || []).map((s: any) =>
            [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(' ')
          )
        );
        const themes = dedupeOrderedStrings(
          (data.theme || []).map((t: any) => t.word_transliteration || '')
        );
        setFilters((prev) => ({
          ...prev,
          Speaker: speakers.length ? speakers : prev.Speaker,
          Theme: themes.length ? themes : prev.Theme,
        }));
      } catch {
        // FALLBACK_FILTERS already set
      }
    };
    fetchFilters();
  }, []);

  const list = filters[activeCategory];
  const selectedFilters = [
    ...selectedSpeakers.map((v: string) => ({ type: 'Speaker' as const, value: v })),
    ...selectedThemes.map((v: string) => ({ type: 'Theme' as const, value: v })),
    ...selectedFormats.map((v: string) => ({ type: 'Format' as const, value: v })),
  ];

  const handleItemClick = (value: string) => {
    if (activeCategory === 'Speaker') onSelectSpeaker?.(value);
    else if (activeCategory === 'Theme') onSelectTheme?.(value);
    else onSelectFormat?.(value);
  };

  const isSelected = (value: string) => {
    if (activeCategory === 'Speaker') return selectedSpeakers.includes(value);
    if (activeCategory === 'Theme') return selectedThemes.includes(value);
    return selectedFormats.includes(value);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          color: '#E31E79',
          fontFamily: "'Merriweather Sans', sans-serif",
          fontWeight: 400,
          fontSize: '21px',
          lineHeight: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Filter
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0"
              style={{ zIndex: 9998 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed"
              style={{
                top: 142,
                left: 0,
                width: '360px',
                height: 'calc(100vh - 142px)',
                background: '#FFFFFF',
                boxShadow: '4px 0 24px rgba(0,0,0,0.10)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Merriweather Sans', sans-serif",
                overflowY: 'auto',
                zIndex: 9999,
              }}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            >
              {/* Selected chips */}
              {selectedFilters.length > 0 && (
                <div style={{ padding: '24px 28px 12px', borderBottom: '1px solid #E0E0E0' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {selectedFilters.map((f) => (
                      <span
                        key={`${f.type}-${f.value}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '18px',
                          fontWeight: 300,
                          color: '#6F6F72',
                        }}
                      >
                        {f.value}
                        <button
                          onClick={() => handleItemClick(f.value)}
                          style={{
                            color: '#E31E79',
                            fontSize: '16px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 2px',
                            lineHeight: 1,
                          }}
                          aria-label={`Remove ${f.value}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={onClearAll}
                    style={{
                      color: '#E31E79',
                      fontWeight: 300,
                      fontSize: '14px',
                      letterSpacing: '0.6px',
                      textTransform: 'uppercase',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    CLEAR ALL
                  </button>
                </div>
              )}

              {/* Filter by Speaker | Theme | Format */}
              <div style={{ padding: '24px 28px 0' }}>
                <div style={{ height: '1px', background: '#B1B1B1', marginBottom: '14px' }} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontWeight: 300,
                        fontSize: '21px',
                        color: '#333333',
                      }}
                    >
                      Filter by
                    </span>
                    {(['Speaker', 'Theme', 'Format'] as FilterCategory[]).map((cat, idx, arr) => (
                      <span
                        key={cat}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        <button
                          onClick={() => setActiveCategory(cat)}
                          style={{
                            fontWeight: 300,
                            fontSize: '21px',
                            color: activeCategory === cat ? '#E31E79' : '#333333',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          {cat}
                        </button>
                        {idx < arr.length - 1 && (
                          <span style={{ color: '#333333', fontSize: '21px' }}>|</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Close filters"
                    style={{
                      color: '#E31E79',
                      fontSize: '22px',
                      lineHeight: 1,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 4px',
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ height: '1px', background: '#B1B1B1' }} />
              </div>

              {/* Filter list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px' }}>
                {selectedFilters.length > 0 ? (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {previewList.map((item: PreviewItem) => (
                      <li
                        key={item.title}
                        style={{ padding: '12px 0', cursor: 'pointer' }}
                      >
                        <div style={{ fontWeight: 400, fontSize: '18px', color: '#333333' }}>
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontFamily: "'Lora', serif",
                            fontStyle: 'italic',
                            fontWeight: 400,
                            fontSize: '15px',
                            color: '#8B8B8B',
                            marginTop: 4,
                          }}
                        >
                          {item.excerpt}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {list.map((item, index) => {
                      const sel = isSelected(item);
                      return (
                        <li
                          key={`${activeCategory}-${index}-${item}`}
                          onClick={() => handleItemClick(item)}
                          style={{
                            fontWeight: 300,
                            fontSize: '18px',
                            color: sel ? '#E31E79' : '#6F6F72',
                            cursor: 'pointer',
                            padding: '10px 0',
                            borderBottom: '1px solid #F2F2F2',
                          }}
                        >
                          {item}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
