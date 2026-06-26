import React, { useMemo, useState, useRef, useCallback } from 'react';
import Loader from '@/components/Loader';
import { useGlossary } from '@/hooks/use-glossary';
import { parseGlossaryTermLine } from './glossaryTermUtils';
import './Glossary.css';

const GLOSSARY_INTRO =
  'Our glossary expands upon significant ideas and recurring motifs found in mystic poems. This is our attempt to open up these often dense symbols into the layers of meaning they might hold.';

function glossarySortLetter(rawTerm: string): string {
  const { word } = parseGlossaryTermLine(rawTerm);
  const ch = word.trim().charAt(0).toUpperCase();
  return ch >= 'A' && ch <= 'Z' ? ch : '';
}

export default function Glossary() {
  const { glossaryData, loading, error } = useGlossary();
  const [activeLetter, setActiveLetter] = useState<string>('ALL');
  const itemRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const normalizedData = useMemo(
    () =>
      [...glossaryData]
        .filter((item) => item.glossary_term && item.glossary_meaning)
        .sort((a, b) => a.glossary_term.localeCompare(b.glossary_term)),
    [glossaryData]
  );

  const letters = useMemo(
    () => Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),
    []
  );

  const lettersWithItems = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((item) => {
      const letter = glossarySortLetter(item.glossary_term);
      if (letter) set.add(letter);
    });
    return set;
  }, [normalizedData]);

  const filteredData = useMemo(() => {
    if (activeLetter === 'ALL') return normalizedData;
    return normalizedData.filter(
      (item) => glossarySortLetter(item.glossary_term) === activeLetter
    );
  }, [activeLetter, normalizedData]);

  const handleLetterClick = useCallback(
    (letter: string) => {
      setActiveLetter(letter);
      setTimeout(() => {
        if (letter === 'ALL') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const firstItemOfLetter = normalizedData.find(
          (item) => glossarySortLetter(item.glossary_term) === letter
        );
        if (firstItemOfLetter && itemRefs.current[firstItemOfLetter.id]) {
          itemRefs.current[firstItemOfLetter.id]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 0);
    },
    [normalizedData]
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="glossary-container">
        <div className="error-state">
          <p>Error loading glossary: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glossary-container">
      <div className="glossary-header">
        <p>{GLOSSARY_INTRO}</p>
      </div>

      {normalizedData.length === 0 ? (
        <div className="empty-state">
          <p>No glossary items available</p>
        </div>
      ) : (
        <>
          <div className="cl-songs-count-row">
            <h2 className="cl-songs-count">{normalizedData.length} Words</h2>
          </div>

          <div className="cl-filter-bar cl-filter-bar--letters-only">
            <button
              type="button"
              className={`cl-az-btn cl-az-btn--all${activeLetter === 'ALL' ? ' active' : ''}`}
              onClick={() => handleLetterClick('ALL')}
            >
              All
            </button>
            <div className="cl-az-row">
              {letters.map((letter) => {
                const hasItems = lettersWithItems.has(letter);
                return (
                  <button
                    key={letter}
                    type="button"
                    className={`cl-az-btn${activeLetter === letter ? ' active' : ''}${
                      !hasItems ? ' is-empty' : ''
                    }`}
                    onClick={() => hasItems && handleLetterClick(letter)}
                    disabled={!hasItems}
                    aria-disabled={!hasItems}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glossary-list">
            {filteredData.map((item) => {
              const { word, script } = parseGlossaryTermLine(item.glossary_term);
              return (
                <article
                  key={item.id}
                  className="glossary-item"
                  ref={(el) => {
                    if (el) itemRefs.current[item.id] = el;
                  }}
                >
                  <h3 className="glossary-item-title">
                    <span className="glossary-term-word">{word}</span>
                    <span className="glossary-term-script">{script}</span>
                  </h3>
                  <div
                    className="glossary-item-meaning"
                    dangerouslySetInnerHTML={{ __html: item.glossary_meaning }}
                  />
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
