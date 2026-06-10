'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ListingFilterBar from '@/components/shared/ListingFilterBar';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { PEOPLE_LISTING_BG } from '@/lib/pageBackgroundTiles';
import {
  PEOPLE_INTRO,
  MOCK_PEOPLE,
  TOTAL_PEOPLE,
  PersonCard,
} from './CLPeopleMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLPeople.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { catalogHasMore, mergeCatalogById } from '@/lib/catalogPagination';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';

const PEOPLE_PER_PAGE = 2;
const A_Z = ['All', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

type FilterType = 'Singer' | 'Poet' | 'Theme';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Poets: ['poet', 'kavi'],
  Singers: ['singer', 'vocalist', 'baul', 'gayak'],
  Writers: ['writer', 'author', 'scholar', 'translator'],
  Artists: ['artist', 'painter', 'musician'],
  'Legendary Figures': ['saint', 'mystic', 'sufi', 'bhakti'],
  Other: [],
};

const PEOPLE_CATEGORIES = [
  'Poets',
  'Singers',
  'Writers',
  'Artists',
  'Legendary Figures',
  'Other',
];

export default function CLPeople() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [totalPeople, setTotalPeople] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PEOPLE_PER_PAGE);
  const [activeLetter, setActiveLetter] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const router = useRouter();

  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type !== 'Singer') return;
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
    );
  };

  const handleRemoveFilter = (type: FilterType, value: string) => {
    if (type !== 'Singer') return;
    setSelectedCategories((prev) => prev.filter((x) => x !== value));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setActiveLetter('All');
  };

  const mapPersonCard = (it: Record<string, unknown>): PersonCard => ({
    id: String(it.id || ''),
    name: String(it.person_name_english || it.person_name || ''),
    role: String(it.occupation_text || it.occupation || '').toUpperCase(),
    description:
      String(it.thumbnail_excerpt || '') ||
      String(it.about || '') ||
      (() => {
        const raw = String(it.profile || '');
        const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return plain.length > 220 ? plain.slice(0, 220).trimEnd() + '...' : plain;
      })(),
    thumbnailUrl: it.thumbnail_url
      ? `${AJAB_API_BASE}${it.thumbnail_url}`
      : '/TN-About-Basavalingaiah-Hiremath.jpg',
  });

  const fetchPeoplePage = useCallback(async (page: number, reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(
        `${AJAB_API_BASE}/Api/person_list?page=${page}&limit=${PEOPLE_PER_PAGE}`,
        { cache: 'no-store', signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) return;

      const data = await res.json();
      if (Array.isArray(data?.data) && data.data.length) {
        const list = data.data.map((it: Record<string, unknown>) => mapPersonCard(it));
        setPeople((prev) => (reset ? list : mergeCatalogById(prev, list)));
      }

      const apiTotal = parseCatalogTotal(data.total);
      if (apiTotal != null) setTotalPeople(apiTotal);
      setApiPage(page);
    } catch {
      clearTimeout(timeoutId);
      if (reset) {
        setPeople(MOCK_PEOPLE);
        setTotalPeople(TOTAL_PEOPLE);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchPeoplePage(1, true);
  }, [fetchPeoplePage]);

  // [Claude] these changes have been recommended by claude — hoist count to :root so Header can see it
  useEffect(() => {
    if (totalPeople > 0) document.documentElement.style.setProperty('--clpe-nav-count', String(totalPeople));
    return () => { document.documentElement.style.removeProperty('--clpe-nav-count'); };
  }, [totalPeople]);

  const filtered = useMemo(() => {
    return people.filter((p) => {
      if (activeLetter !== 'All' && !p.name.toUpperCase().startsWith(activeLetter)) return false;
      if (selectedCategories.length > 0) {
        const roleLC = (p.role || '').toLowerCase();
        const matches = selectedCategories.some((cat) => {
          const keywords = CATEGORY_KEYWORDS[cat] || [];
          if (cat === 'Other') {
            const allKeywords = Object.entries(CATEGORY_KEYWORDS)
              .filter(([k]) => k !== 'Other')
              .flatMap(([, v]) => v);
            return !allKeywords.some((kw) => roleLC.includes(kw));
          }
          return keywords.some((kw) => roleLC.includes(kw));
        });
        if (!matches) return false;
      }
      return true;
    });
  }, [people, activeLetter, selectedCategories]);

  const displayedPeople = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const hasMore = catalogHasMore(people.length, visibleCount, filtered.length, totalPeople);

  const handleLoadMore = () => {
    if (loadingMore) return;

    if (visibleCount < filtered.length) {
      setVisibleCount((prev) => prev + PEOPLE_PER_PAGE);
      return;
    }

    if (totalPeople > 0 && people.length < totalPeople) {
      void fetchPeoplePage(apiPage + 1, false).then(() => {
        setVisibleCount((prev) => prev + PEOPLE_PER_PAGE);
      });
    }
  };

  useEffect(() => {
    setVisibleCount(PEOPLE_PER_PAGE);
  }, [activeLetter, selectedCategories]);

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={PEOPLE_LISTING_BG} />
        <Header />
        <main className="relative z-10">
          <div
            className="clpe-page cl-songs-page"
            style={{ '--clpe-nav-count': String(totalPeople) } as React.CSSProperties}
          >
            <p className="clpe-intro">{PEOPLE_INTRO}</p>

            <div className="cl-songs-count-row">
              <h1 className="cl-songs-count">{filtered.length} People</h1>
            </div>

            <ListingFilterBar
              allActive={activeLetter === 'All' && selectedCategories.length === 0}
              onAllClick={() => {
                setActiveLetter('All');
                clearAllFilters();
              }}
              panel={{
                onFilterSelect: handleFilterSelect,
                onRemoveFilter: handleRemoveFilter,
                onClearAll: clearAllFilters,
                selectedSingers: selectedCategories,
                selectedPoets: [],
                selectedThemes: [],
                availableSingers: PEOPLE_CATEGORIES,
                availablePoets: [],
                availableThemes: [],
                singleListMode: true,
                maxFilters: 5,
              }}
              azRow={
                <div className="cl-az-row">
                  {A_Z.slice(1).map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setActiveLetter(letter)}
                      className={`cl-az-btn${activeLetter === letter ? ' active' : ''}`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              }
            />

            <div className="clpe-list">
              {loading ? (
                <div className="clpe-list-status">Loading people…</div>
              ) : displayedPeople.length > 0 ? (
                displayedPeople.map((p) => (
                  <div
                    key={p.id}
                    className="clpe-entry"
                    onClick={() => router.push(`/people/${p.id}`)}
                  >
                    <div className="clpe-entry-thumb">
                      {p.thumbnailUrl && <img src={p.thumbnailUrl} alt={p.name} />}
                    </div>
                    {/* [Claude] these changes have been recommended by claude —
                        EXPLORE moved outside <p> so line-clamp on desc doesn't hide it */}
                    <div className="clpe-entry-body">
                      <span className="clpe-entry-name">{p.name}</span>
                      <span className="clpe-entry-role">{p.role}</span>
                      <p className="clpe-entry-desc">{p.description}</p>
                      <span className="clpe-entry-explore">EXPLORE</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="clpe-list-status">No people match the filter.</div>
              )}
            </div>

            {hasMore && (
              <LoadMoreButton
                onClick={handleLoadMore}
                ariaLabel="Load more people"
                disabled={loadingMore}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
