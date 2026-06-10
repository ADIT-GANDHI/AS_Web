'use client';

// [Claude] People filter panel — category filter matching PDF design (Poets, Singers, etc.)

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const FONT = "'Merriweather Sans', sans-serif";

// Categories derived from PDF design (page 2 of 5.People_01.05.2025.pdf)
const CATEGORIES = ['Poets', 'Singers', 'Writers', 'Artists', 'Legendary Figures', 'Other'];

export default function CLPeopleFilterPanel({
  onSelectCategory,
  onClearAll,
  selectedCategories = [] as string[],
  previewList = [] as { name: string; role: string }[],
}: {
  onSelectCategory?: (v: string) => void;
  onClearAll?: () => void;
  selectedCategories?: string[];
  previewList?: { name: string; role: string }[];
}) {
  const [open, setOpen] = useState(false);

  const handleItemClick = (value: string) => {
    onSelectCategory?.(value);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          color: '#E31E79',
          fontFamily: FONT,
          fontWeight: 400,
          fontSize: '21px',
          lineHeight: '100%',
          letterSpacing: '0.04em',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Filters
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
              style={{
                position: 'fixed',
                top: 142,
                left: 0,
                width: '360px',
                height: 'calc(100vh - 142px)',
                background: '#FFFFFF',
                boxShadow: '4px 0 24px rgba(0,0,0,0.10)',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: FONT,
                overflowY: 'auto',
                zIndex: 9999,
              }}
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 140, damping: 22 }}
            >
              {/* Selected chips */}
              {selectedCategories.length > 0 && (
                <div style={{ padding: '24px 28px 12px', borderBottom: '1px solid #E0E0E0' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {selectedCategories.map((cat) => (
                      <span
                        key={cat}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '18px',
                          fontWeight: 300,
                          color: '#6F6F72',
                        }}
                      >
                        {cat}
                        <button
                          onClick={() => handleItemClick(cat)}
                          style={{
                            color: '#E31E79',
                            fontSize: '16px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 2px',
                            lineHeight: 1,
                          }}
                          aria-label={`Remove ${cat}`}
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

              {/* Header */}
              <div style={{ padding: '24px 28px 0' }}>
                <div style={{ height: '1px', background: '#B1B1B1', marginBottom: '14px' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span style={{ fontWeight: 300, fontSize: '21px', color: '#333333' }}>
                    Filter by
                  </span>
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

              {/* Category list / filtered people preview */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px' }}>
                {selectedCategories.length > 0 ? (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {previewList.map((item) => (
                      <li key={item.name} style={{ padding: '12px 0', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 400, fontSize: '18px', color: '#333333' }}>
                          {item.name}
                        </div>
                        <div style={{ fontWeight: 300, fontSize: '15px', color: '#8B8B8B', marginTop: 4 }}>
                          {item.role}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {CATEGORIES.map((cat) => {
                      const sel = selectedCategories.includes(cat);
                      return (
                        <li
                          key={cat}
                          onClick={() => handleItemClick(cat)}
                          style={{
                            fontWeight: 300,
                            fontSize: '18px',
                            color: sel ? '#E31E79' : '#6F6F72',
                            cursor: 'pointer',
                            padding: '10px 0',
                            borderBottom: '1px solid #F2F2F2',
                          }}
                        >
                          {cat}
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
