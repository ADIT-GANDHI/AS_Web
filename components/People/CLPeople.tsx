'use client';

import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import ListingFilterBar from '@/components/shared/ListingFilterBar';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
// OLD single-plate listing bg (revert: restore PEOPLE_LISTING_BG + commented usage below)
// import { PEOPLE_LISTING_BG } from '@/lib/pageBackgroundTiles';
import {
  PEOPLE_LISTING_BG_TEXTURE,
  PEOPLE_LISTING_MIDDLE_WHITE,
  PEOPLE_LISTING_MIDDLE_WIDTH_RATIO,
} from '@/lib/pageBackgroundTiles';
import {
  PEOPLE_INTRO,
  PersonCard,
} from './CLPeopleMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLPeople.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { catalogHasMore, mergeCatalogById } from '@/lib/catalogPagination';
import { selectSingleFilterId } from '@/lib/listingFilterSelection';
import { mapPersonProfileTags, mapPersonRole } from '@/lib/mapPersonDetail';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { PeopleNavCountContext } from '@/components/People/PeopleNavCountContext';

/** Full catalog is small (~144); load enough for A–Z / occupation filters. */
const PEOPLE_PER_PAGE = 200;
const PEOPLE_VISIBLE_STEP = 20;
const A_Z = ['All', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

type FilterType = 'Singer' | 'Poet' | 'Theme';

/**
 * Occupation filter matches CMS `occupation_text` (after mapPersonRole).
 * Legendary Figures must include "legendary" — CMS label is already that phrase,
 * not saint/mystic keywords.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Poets: ['poet', 'kavi'],
  Singers: ['singer', 'vocalist', 'baul', 'gayak'],
  Writers: ['writer', 'author', 'scholar', 'translator'],
  Artists: ['artist', 'painter', 'musician'],
  'Legendary Figures': ['legendary', 'saint', 'mystic', 'sufi', 'bhakti'],
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

const PEOPLE_DESC_MAX_LINES = 4;

function PersonListingExcerpt({
  description,
  href,
}: {
  description: string;
  href: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visibleText, setVisibleText] = useState(description);

  const remeasure = useCallback(() => {
    const host = hostRef.current;
    if (!host) return;

    const width = host.getBoundingClientRect().width;
    if (width <= 0) return;

    const plain = description.replace(/\s+/g, ' ').trim();
    if (!plain) {
      setVisibleText('');
      return;
    }

    const probe = document.createElement('p');
    probe.className = 'clpe-entry-desc';
    probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;width:${width}px;margin:0`;
    document.body.appendChild(probe);

    const lineHeight = parseFloat(getComputedStyle(probe).lineHeight) || 25.6;
    const maxHeight = lineHeight * PEOPLE_DESC_MAX_LINES;

    const fits = (text: string) => {
      probe.replaceChildren();
      probe.append(document.createTextNode(text));
      const ellipsis = document.createElement('span');
      ellipsis.className = 'clpe-entry-explore';
      ellipsis.textContent = '...';
      probe.append(ellipsis);
      return probe.scrollHeight <= maxHeight + 1;
    };

    if (fits(plain)) {
      document.body.removeChild(probe);
      setVisibleText(plain);
      return;
    }

    let lo = 0;
    let hi = plain.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const candidate = plain.slice(0, mid).replace(/\s+\S*$/, '').trimEnd();
      if (fits(candidate)) lo = mid;
      else hi = mid - 1;
    }

    const finalText = plain.slice(0, lo).replace(/\s+\S*$/, '').trimEnd();
    document.body.removeChild(probe);
    setVisibleText(finalText);
  }, [description]);

  useLayoutEffect(() => {
    remeasure();
  }, [remeasure]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(() => remeasure());
    observer.observe(host);
    return () => observer.disconnect();
  }, [remeasure]);

  return (
    <div ref={hostRef} className="clpe-entry-desc-host">
      <p className="clpe-entry-desc">
        {visibleText ? <>{visibleText}</> : null}
        <Link href={href} className="clpe-entry-explore" aria-label="View person">
          ...
        </Link>
      </p>
    </div>
  );
}

function roleMatchesCategory(roleLC: string, category: string): boolean {
  if (category === 'Other') {
    const allKeywords = Object.entries(CATEGORY_KEYWORDS)
      .filter(([k]) => k !== 'Other')
      .flatMap(([, v]) => v);
    return !allKeywords.some((kw) => roleLC.includes(kw));
  }
  const keywords = CATEGORY_KEYWORDS[category] || [];
  const catLC = category.toLowerCase();
  if (roleLC.includes(catLC) || roleLC.includes(catLC.replace(/s$/, ''))) {
    return true;
  }
  return keywords.some((kw) => roleLC.includes(kw));
}

export default function CLPeople() {
  const shellRef = useRef<HTMLDivElement>(null);
  const { setPeopleNavTotal } = useContext(PeopleNavCountContext);
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [totalPeople, setTotalPeople] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [apiPage, setApiPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PEOPLE_VISIBLE_STEP);
  const [activeLetter, setActiveLetter] = useState('All');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type !== 'Singer') return;
    setSelectedCategories((prev) => selectSingleFilterId(prev, value));
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
    role: mapPersonRole(it),
    profileTags: mapPersonProfileTags(it),
    description:
      String(it.thumbnail_excerpt || '') ||
      String(it.about || '') ||
      (() => {
        const raw = String(it.profile || '');
        return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
        setPeople([]);
        setTotalPeople(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchPeoplePage(1, true);
  }, [fetchPeoplePage]);

  useEffect(() => {
    if (totalPeople > 0) setPeopleNavTotal(totalPeople);
    else setPeopleNavTotal(null);
  }, [totalPeople, setPeopleNavTotal]);

  const filtered = useMemo(() => {
    return people.filter((p) => {
      if (activeLetter !== 'All' && !p.name.toUpperCase().startsWith(activeLetter)) {
        return false;
      }
      if (selectedCategories.length > 0) {
        const roleLC = (p.role || '').toLowerCase();
        const matches = selectedCategories.some((cat) => roleMatchesCategory(roleLC, cat));
        if (!matches) return false;
      }
      return true;
    });
  }, [people, activeLetter, selectedCategories]);

  const displayedPeople = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const peopleFiltersActive =
    activeLetter !== 'All' || selectedCategories.length > 0;

  const hasMore = catalogHasMore(people.length, visibleCount, filtered.length, totalPeople, {
    filtersActive: peopleFiltersActive,
  });

  const headingCount = peopleFiltersActive
    ? filtered.length
    : totalPeople > 0
      ? totalPeople
      : filtered.length;

  const handleLoadMore = () => {
    if (loadingMore) return;

    if (visibleCount < filtered.length) {
      setVisibleCount((prev) => prev + PEOPLE_VISIBLE_STEP);
      return;
    }

    if (totalPeople > 0 && people.length < totalPeople) {
      void fetchPeoplePage(apiPage + 1, false).then(() => {
        setVisibleCount((prev) => prev + PEOPLE_VISIBLE_STEP);
      });
    }
  };

  useEffect(() => {
    setVisibleCount(PEOPLE_VISIBLE_STEP);
  }, [activeLetter, selectedCategories]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        {/* OLD: single-plate people_mainpage.png
        <RepeatingPageBackground containerRef={shellRef} tile={PEOPLE_LISTING_BG} />
        */}
        <RepeatingPageBackground
          containerRef={shellRef}
          tile={PEOPLE_LISTING_BG_TEXTURE}
          overlay={{
            tile: PEOPLE_LISTING_MIDDLE_WHITE,
            widthRatio: PEOPLE_LISTING_MIDDLE_WIDTH_RATIO,
            singleSheet: true,
          }}
        />
        <Header />
        <main className="relative z-10">
          <div className="clpe-page cl-songs-page">
            <p className="clpe-intro">{PEOPLE_INTRO}</p>

            <div className="cl-songs-count-row">
              <h1 className="cl-songs-count">{headingCount} People</h1>
            </div>

            <ListingFilterBar
              allPinkWhenFiltered
              allActive={activeLetter !== 'All' || selectedCategories.length > 0}
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
                filterTriggerAlwaysPink: true,
                showClearAllAlways: true,
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
              {displayedPeople.length > 0 ? (
                displayedPeople.map((p) => {
                  const href = `/people/${p.id}`;
                  return (
                    <article key={p.id} className="clpe-entry">
                      <Link href={href} className="clpe-entry-thumb" aria-label={p.name}>
                        {p.thumbnailUrl && <img src={p.thumbnailUrl} alt="" />}
                      </Link>
                      <div className="clpe-entry-body">
                        <Link href={href} className="clpe-entry-name">
                          {p.name}
                        </Link>
                        {p.profileTags ? (
                          <span className="clpe-entry-tags">{p.profileTags}</span>
                        ) : null}
                        <PersonListingExcerpt description={p.description} href={href} />
                      </div>
                    </article>
                  );
                })
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
      </div>
    </div>
  );
}
