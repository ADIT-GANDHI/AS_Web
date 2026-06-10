'use client';

import Loader from '@/components/Loader';
import usePoems from '@/hooks/use-poems';
import { useEffect, useState } from 'react';
import { POEMS_FILTER, POEMS_INTRO } from './constants';
import './Poem.css';
import PoemsSlider from './PoemsSlider';

import { withAppBasePath } from '@/lib/resolveCmsAssetUrl';
import PoemsRelatedItem from './PoemsRelatedItem';
import PoemsTags from './PoemsTags';

interface FilterOption {
  id: string;
  label: string;
}

export default function Poems() {
  const [activeFilter] = useState(POEMS_FILTER[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<'Poet' | 'Theme'>('Poet');
  const [selectedPoets, setSelectedPoets] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [headerHeight, setHeaderHeight] = useState(90);
  const [activePoemId, setActivePoemId] = useState<string>('');

  const { publishedPoems = [], isLoading, totalPoems, poetOptions = [], themeOptions = [] } = usePoems({
    activeFilter: activeFilter,
    selectedPoets,
    selectedThemes,
  });

  useEffect(() => {
    const header = document.querySelector('header');
    if (header) {
      setHeaderHeight(header.clientHeight);
    }
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFilterOpen]);

  useEffect(() => {
    if (!publishedPoems.length) {
      setActivePoemId('');
      return;
    }

    setActivePoemId((prev) => {
      if (prev && publishedPoems.some((poem) => poem.id === prev)) {
        return prev;
      }
      return publishedPoems[0].id;
    });
  }, [publishedPoems]);

  const toggleValue = (type: 'Poet' | 'Theme', value: string) => {
    if (type === 'Poet') {
      setSelectedPoets((prev) => (prev[0] === value ? [] : [value]));
      return;
    }

    setSelectedThemes((prev) => (prev[0] === value ? [] : [value]));
  };

  const selectedItems = [...selectedPoets, ...selectedThemes];
  const labelById = new Map<string, string>([...poetOptions, ...themeOptions].map((item) => [item.id, item.label]));

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div>
          {isFilterOpen && (
            <>
              <div className="poems-filter-overlay" onClick={() => setIsFilterOpen(false)} />
              <aside
                className="poems-filter-panel"
                style={{ top: 0, position: 'absolute' }}
              >
                <img
                  src={withAppBasePath('/Vector.png')}
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: -150,
                    left: 0,
                    width: '507.67px',
                    height: 'calc(100% + 150px)',
                    opacity: 0.95,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                />
                <div className="poems-filter-panel-header">
                  <span className="poems-filter-by">Filter by</span>
                  <div className="poems-filter-tabs">
                    <button
                      className={activePanelTab === 'Poet' ? 'active' : ''}
                      onClick={() => setActivePanelTab('Poet')}
                    >
                      Poet
                    </button>
                    <span style={{ color: '#6F6F72' }}>|</span>
                    <button
                      className={activePanelTab === 'Theme' ? 'active' : ''}
                      onClick={() => setActivePanelTab('Theme')}
                    >
                      Theme
                    </button>
                  </div>
                  <button className="poems-filter-close" onClick={() => setIsFilterOpen(false)}>
                    x
                  </button>
                </div>

                <div className="poems-filter-list">
                  {(activePanelTab === 'Poet' ? poetOptions : themeOptions).map((item: FilterOption) => {
                    const selected =
                      activePanelTab === 'Poet'
                        ? selectedPoets.includes(item.id)
                        : selectedThemes.includes(item.id);

                    return (
                      <button
                        key={item.id}
                        className={`poems-filter-item ${selected ? 'selected' : ''}`}
                        onClick={() => toggleValue(activePanelTab, item.id)}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {selectedItems.length > 0 && (
                  <div className="poems-filter-selected-wrap">
                    {selectedItems.map((item) => (
                      <div key={item} className="poems-filter-selected-item">
                        <span>{labelById.get(item) || item}</span>
                        <button
                          onClick={() => {
                            setSelectedPoets((prev) => prev.filter((value) => value !== item));
                            setSelectedThemes((prev) => prev.filter((value) => value !== item));
                          }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="poems-filter-clear-wrap">
                  <button
                    type="button"
                    className="poems-filter-clear"
                    onClick={() => {
                      setSelectedPoets([]);
                      setSelectedThemes([]);
                    }}
                  >
                    CLEAR ALL
                  </button>
                </div>
                <div className="poems-filter-footer">
                  Most couplets cannot be attributed to a particular poet due to lack of historic evidence. This authorial ambiguity is in a sense the beauty of the <span className="poems-filter-footer-link">Oral Traditions</span>.
                </div>
              </aside>
            </>
          )}

          <div className="poems-inner-container mx-auto px-4 pb-8">
            <div className="text-center poems-about">{POEMS_INTRO}</div>
            <div className="text-left mb-2 pr-2 pl-2" style={{ marginTop: '50px' }}>
              <h1
                className="mb-0 mt-0"
                style={{
                  color: '#3C3C3B',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '27.04px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                }}
              >
                {totalPoems} poems
              </h1>
            </div>

            <div className="flex flex-wrap justify-start gap-4 mb-10 heading-border pt-3 pb-4">
              <button
                className="see-all poems-filter-trigger"
                onClick={() => setIsFilterOpen(true)}
                style={{
                  color: '#E31E79',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 400,
                  fontStyle: 'normal',
                  fontSize: '21.72px',
                  lineHeight: '100%',
                  letterSpacing: '0%',
                }}
              >
                See All
              </button>
              {/* <span className="poems-filter-all">All</span> */}
            </div>
            <PoemsSlider poems={publishedPoems} onPoemChange={setActivePoemId} />
            <PoemsRelatedItem poemId={activePoemId} />
            <PoemsTags />
          </div>
        </div>
      )}
    </>
  );
}
