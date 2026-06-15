'use client';

import './GlossaryStrip.css';

// ──────────────────────────────────────────────────────────────────────
// GlossaryStrip — single source of truth for the wavy bottom strip that
// lists glossary terms on every detail page (Songs, Poems, Reflections,
// Films). Pass either a flat `terms` array (auto-split into rows[]) or
// pre-split `rows` for explicit row control. The visual shell (wavy pill
// background, typography, highlight colour) is owned here, so a tweak to
// the strip lands in one place and propagates to every detail page.
// ──────────────────────────────────────────────────────────────────────

export interface GlossaryStripTerm {
  term: string;
  meaning: string;
  /** Reserved for future glossary deep-links when CMS exposes term URLs. */
  href?: string;
}

export interface GlossaryStripProps {
  /** Pre-split rows. Use this for the canonical 2+3 pattern: pass
   *  [terms.slice(0, 2), terms.slice(2)]. */
  rows?: GlossaryStripTerm[][];
  /** Flat list — gets auto-split into [first 2, rest] (the canonical
   *  Songs/Poems/Reflections layout). Use `rows` for any other split. */
  terms?: GlossaryStripTerm[];
  className?: string;
}

export default function GlossaryStrip({
  rows,
  terms,
  className = '',
}: GlossaryStripProps) {
  const finalRows: GlossaryStripTerm[][] = (
    rows
      ? rows
      : terms
        ? [terms.slice(0, 2), terms.slice(2)]
        : []
  ).filter((row) => row.length > 0);

  if (!finalRows.length) return null;

  return (
    <div className={`gs-strip ${className}`}>
      {finalRows.map((row, idx) => (
        <div key={idx} className="gs-row">
          {row.map((g) => {
            const inner = (
              <>
                <span className="gs-term-word">{g.term}</span>
                <span className="gs-term-meaning">{g.meaning}</span>
              </>
            );
            if (g.href) {
              return (
                <a key={g.term} href={g.href} className="gs-term">
                  {inner}
                </a>
              );
            }
            return (
              <button key={g.term} type="button" className="gs-term">
                {inner}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
