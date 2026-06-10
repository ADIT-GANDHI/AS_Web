'use client';

import Loader from '@/components/Loader';
import usePeople from '@/hooks/use-people';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PEOPLE_FILTER, PEOPLE_INTRO } from './constants';
import './People.css';
import { PersonProfile } from './type';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

const CATEGORY_LIST = ['Poets', 'Singers', 'Writers', 'Artists', 'Legendary Figures', 'Other'];

const getPersonFullName = (item: PersonProfile) =>
  [item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ').trim();

const mapToCategory = (person: PersonProfile): string => {
  const raw = (
    person.primaryOccupation?.name ||
    person.primaryOccupation?.categoryType ||
    person.metaKeywords ||
    ''
  )
    .replace(/^_/, '')
    .trim()
    .toLowerCase();

  if (raw.includes('poet')) return 'Poets';
  if (raw.includes('singer')) return 'Singers';
  if (raw.includes('writer')) return 'Writers';
  if (raw.includes('artist')) return 'Artists';
  if (raw.includes('legendary')) return 'Legendary Figures';
  return 'Other';
};

const People = () => {
  const [activeFilter] = useState(PEOPLE_FILTER[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(90);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(4);

  const { people = [], isLoading } = usePeople({ activeFilter });

  useEffect(() => {
    const header = document.querySelector('header');
    if (header) setHeaderHeight(header.clientHeight);
  }, []);

  useEffect(() => {
    if (!isFilterOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, [isFilterOpen]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORY_LIST) counts[cat] = 0;
    for (const person of people) {
      const cat = mapToCategory(person);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [people]);

  const availableCategories = useMemo(
    () => CATEGORY_LIST.filter((cat) => categoryCounts[cat] > 0),
    [categoryCounts]
  );

  const filteredPeople = useMemo(() => {
    if (!selectedCategories.length) return people;
    return people.filter((person) => selectedCategories.includes(mapToCategory(person)));
  }, [people, selectedCategories]);

  const visiblePeople = filteredPeople.slice(0, visibleCount);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      return updated;
    });
    setVisibleCount(4);
  };

  const selectSingleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      return [...prev, cat];
    });
    setVisibleCount(4);
    setIsFilterOpen(false);
  };

  const clearAll = () => {
    setSelectedCategories([]);
    setVisibleCount(4);
    setIsFilterOpen(false);
  };

  const getRolesText = (item: PersonProfile) => {
    if (!item?.roles?.length) return '';
    const filtered = item.roles.filter((role) => typeof role === 'string' && !role.startsWith('_'));
    return filtered.join(', ').toUpperCase();
  };

  const truncateProfile = (html: string, maxLen = 500) => {
    const text = html.replace(/<[^>]*>/g, '');
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen).trim();
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-8">
          {/* Filter Sidebar Panel */}
          {isFilterOpen && (
            <>
              <div className="people-filter-overlay" onClick={() => setIsFilterOpen(false)} />
              <aside
                className="people-filter-panel"
                style={{ top: `${headerHeight}px`, height: `calc(100vh - ${headerHeight}px)` }}
              >
                <div className="people-filter-panel-header">
                  <span className="people-filter-by">FILTER BY CATEGORY</span>
                  <button className="people-filter-close" onClick={() => setIsFilterOpen(false)}>
                    ×
                  </button>
                </div>

                <div className="people-filter-list">
                  {availableCategories.map((cat) => {
                    const selected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        className={`people-filter-item ${selected ? 'selected' : ''}`}
                        onClick={() => selectSingleCategory(cat)}
                      >
                        {cat} ({categoryCounts[cat]})
                      </button>
                    );
                  })}
                </div>

                <div className="people-filter-bottom">
                  {selectedCategories.length > 0 && (
                    <div className="people-filter-selected-wrap">
                      {selectedCategories.map((cat) => (
                        <div key={cat} className="people-filter-selected-item">
                          <span>{cat}</span>
                          <button onClick={() => toggleCategory(cat)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="people-clear-btn" onClick={clearAll}>
                    CLEAR ALL
                  </button>
                </div>
              </aside>
            </>
          )}

          {/* Main Content */}
          <div className="max-w-[1180px] mx-auto pb-8" style={{ background: '#fff', padding: '50px 60px', marginBottom: '160px' }}>
            <div className="text-center people-about-intro">{PEOPLE_INTRO}</div>

            <div className="text-left mb-2">
              <h1 className="people-count-text">{filteredPeople.length} People</h1>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap justify-start gap-4 people-border-top pt-3 pb-4">
              <button className="people-filter-btn-text people-filters-btn" onClick={() => setIsFilterOpen(true)}>
                Filters
              </button>
              <span className={`people-all-text ${selectedCategories.length === 0 ? 'people-all-text-active' : ''}`} style={{ cursor: 'pointer' }} onClick={clearAll}>All</span>
            </div>

            {/* People Cards */}
            <div className="people-card-inner-container">
              {visiblePeople.length
                ? visiblePeople.map((item: PersonProfile) => {
                    const fullName = getPersonFullName(item);
                    const rolesText = getRolesText(item);
                    const profileText = item?.profile ? truncateProfile(item.profile) : '';
                    const isProfileTruncated = item?.profile && item.profile.replace(/<[^>]*>/g, '').length > 350;

                    return (
                      <div key={item.id} className="people-card-row">
                        <div className="people-card-img-wrap">
                          {item?.thumbnailURL ? (
                            <img
                              src={item.thumbnailURL.startsWith('http') ? item.thumbnailURL : `${AJAB_API_BASE}/uploads/thumbnails/${item.thumbnailURL}`}
                              alt={item?.metaTitle || item?.firstName}
                              className="people-card-img"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                        </div>
                        <div className="people-card-info">
                          <div className="people-card-name-line">
                            <span className="people-card-name">{fullName}</span>
                            {rolesText && <span className="people-card-roles">{rolesText}</span>}
                          </div>
                          {profileText && (
                            <div className="people-card-profile">
                              {profileText}
                              {isProfileTruncated && '... '}
                              <Link href={`/people/${item.id}`} className="people-card-explore">
                                EXPLORE
                              </Link>
                            </div>
                          )}
                          {!profileText && (
                            <Link href={`/people/${item.id}`} className="people-card-explore">
                              EXPLORE
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })
                : <p style={{ color: '#6d6e71', fontSize: '16px', padding: '20px 0' }}>No people found in this category.</p>}
            </div>

            {visibleCount < filteredPeople.length && (
              <div className="text-center mt-8">
                <button
                  className="people-load-more"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default People;
