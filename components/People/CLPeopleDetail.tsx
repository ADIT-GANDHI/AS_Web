'use client';

// [Claude] People detail page — fetches live data from Api/explore_person
// and renders the bio with gallery wrap, caption row and related section.

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
// Mock fallbacks retired — live API only (see CLPeopleMocks.ts for archived data).
// import { MOCK_PERSON_DETAIL, PERSON_RELATED } from './CLPeopleMocks';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { PEOPLE_DETAIL_BG } from '@/lib/pageBackgroundTiles';
import { getRelatedDetailHref } from '@/lib/relatedDetailHref';
import {
  getRelatedCardDescription,
  getRelatedCardSubtitle,
  getRelatedCardTitle,
  relatedDescriptionNeedsClamp,
} from '@/lib/relatedCardText';
import {
  buildPersonDisplayName,
  extractPersonGallery,
  mapPersonRole,
} from '@/lib/mapPersonDetail';
import { resolveCmsAssetUrl, withAppBasePath } from '@/lib/resolveCmsAssetUrl';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Songs/CLSongDetails.css';
import './CLPeople.css';
import { PeopleNavCountContext } from '@/components/People/PeopleNavCountContext';

// [Claude] Same HTML stripper used across all detail pages
function htmlToPlainText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const RELATED_INITIAL_COUNT = 3;

function PersonBioBody({ about }: { about: string }) {
  const paragraphs = about.split(/\n\n+/).filter(Boolean);

  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="clped-bio-paragraph">
          {p}
        </p>
      ))}
    </>
  );
}

type RelatedListEntry = { bucket: string; item: any };

function relatedEntryKey(bucket: string, item: any, index: number): string {
  const itemId = item?.id != null && item?.id !== '' ? String(item.id) : 'noid';
  return `${bucket}-${itemId}-${index}`;
}

interface PersonDetail {
  id: string;
  name: string;
  role: string;
  thumbnailUrl: string;
  gallery: string[];
  about: string;
  galleryCaption: string;
}

function mapApiItem(it: Record<string, unknown>): PersonDetail {
  const gallery = extractPersonGallery(it);
  return {
    id: String(it.id || ''),
    name: buildPersonDisplayName(it),
    role: mapPersonRole(it),
    thumbnailUrl: gallery[0] || '',
    gallery,
    about: htmlToPlainText(String(it.profile || it.about || '')),
    galleryCaption: String(it.thumbnail_excerpt || it.meta_description || '').trim(),
  };
}

// [Claude] these changes have been recommended by claude — fullscreen loader: pure white + logo only, no chrome
function LoadingShell() { return <Loader />; }

function PersonNotFound() {
  return (
    <div className="cl-songs-page-root">
      <div className="min-h-screen">
        <Header />
        <main className="relative z-10">
          <div
            style={{
              padding: '120px 24px',
              textAlign: 'center',
              fontFamily: 'var(--ajab-font-serif)',
              color: 'var(--ajab-ink-500)',
            }}
          >
            <p>Person not found.</p>
            <Link
              href="/people"
              style={{
                color: 'var(--ajab-pink-primary)',
                display: 'inline-block',
                marginTop: 16,
              }}
            >
              ← Back to People
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function CLPeopleDetail({ id: idProp }: { id?: string }) {
  const pathname = usePathname();
  const urlId = pathname?.split('/').filter(Boolean).pop();
  const id = (urlId && urlId !== '0') ? urlId : idProp;
  const shellRef = useRef<HTMLDivElement>(null);
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<RelatedContent>(EMPTY_RELATED);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'poems' | 'films'>('all');
  const [relatedExpanded, setRelatedExpanded] = useState<Record<string, boolean>>({});
  const [relatedListExpanded, setRelatedListExpanded] = useState(false);
  const { setPeopleNavTotal } = useContext(PeopleNavCountContext);

  useEffect(() => {
    setRelatedListExpanded(false);
  }, [activeTab]);

  useEffect(() => {
    fetch(`${AJAB_API_BASE}/Api/person_list?page=1&limit=1`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (typeof json?.total === 'number' && json.total > 0) {
          setPeopleNavTotal(json.total);
        }
      })
      .catch(() => {});
  }, [setPeopleNavTotal]);

  useEffect(() => {
    if (!id) {
      setPerson(null);
      setLoading(false);
      return;
    }

    const fetchPerson = async () => {
      setLoading(true);
      setPerson(null);
      try {
        const [detailRes, listRes] = await Promise.all([
          fetch(`${AJAB_API_BASE}/Api/explore_person?person_id=${id}`, {
            cache: 'no-store',
          }),
          fetch(`${AJAB_API_BASE}/Api/person_list?person_id=${id}&limit=1`, {
            cache: 'no-store',
          }),
        ]);
        const detailJson = detailRes.ok ? await detailRes.json() : null;
        const listJson = listRes.ok ? await listRes.json() : null;
        const detailItem =
          detailJson?.status !== false && detailJson?.data ? detailJson.data : null;
        const listRow = listJson?.data?.[0];
        const listMatchesId =
          listRow && String(listRow.id) === String(id);

        const merged = detailItem
          ? { ...(listMatchesId ? listRow : {}), ...detailItem }
          : listMatchesId
            ? listRow
            : null;

        if (merged) {
          setPerson(mapApiItem(merged as Record<string, unknown>));
        } else {
          setPerson(null);
        }
      } catch {
        setPerson(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();

    /* ── Retired mock fallbacks (CLPeopleMocks.ts) ──
    if (!id) {
      setPerson(mapApiItem({ id: MOCK_PERSON_DETAIL.id, ... }));
      setLoading(false);
      return;
    }
    if (!merged) {
      setPerson(mapApiItem({ id: MOCK_PERSON_DETAIL.id, ... }));
    }
    catch { setPerson(MOCK_PERSON_DETAIL as any); }
    */
  }, [id]);

  useEffect(() => {
    if (!person?.id) {
      setRelated(EMPTY_RELATED);
      return;
    }
    let cancelled = false;
    (async () => {
      let result = await fetchRelatedByParam('people_id', person.id);
      if (!result) result = await fetchRelatedByParam('person_id', person.id);
      if (cancelled) return;
      setRelated(result || EMPTY_RELATED);
    })();
    return () => {
      cancelled = true;
    };
  }, [person?.id]);

  /* ── Retired mock related fallback (CLPeopleMocks.ts) ──
  useEffect(() => {
    if (!id) setRelated(asRelatedContent(PERSON_RELATED));
    if (!result) setRelated(asRelatedContent(PERSON_RELATED));
  }, [id]);
  */

  const counts = related.counts;
  const tabCounts = useMemo(() => {
    const d = related.data as Record<string, any[]>;
    const songsLen = (d.songs || []).length;
    const poemsLen = (d.poems || []).length;
    const filmsLen = (d.films || []).length;
    return {
      all: songsLen + poemsLen + filmsLen,
      songs: counts.songs ?? songsLen,
      poems: counts.poems ?? poemsLen,
      films: counts.films ?? filmsLen,
    };
  }, [related.data, counts]);

  const tabs = [
    { key: 'all' as const, label: 'ALL', count: tabCounts.all },
    { key: 'songs' as const, label: 'SONGS', count: tabCounts.songs },
    { key: 'poems' as const, label: 'POEMS', count: tabCounts.poems },
    { key: 'films' as const, label: 'FILMS', count: tabCounts.films },
  ];

  const visibleRelatedEntries = useMemo((): RelatedListEntry[] => {
    const d = related.data as Record<string, any[]>;
    if (activeTab === 'all') {
      return (['songs', 'poems', 'films'] as const).flatMap((bucket) =>
        (d[bucket] || []).map((item) => ({ bucket, item }))
      );
    }
    return (d[activeTab] || []).map((item) => ({ bucket: activeTab, item }));
  }, [activeTab, related]);

  const displayedRelatedEntries = useMemo(() => {
    if (relatedListExpanded || visibleRelatedEntries.length <= RELATED_INITIAL_COUNT) {
      return visibleRelatedEntries;
    }
    return visibleRelatedEntries.slice(0, RELATED_INITIAL_COUNT);
  }, [visibleRelatedEntries, relatedListExpanded]);

  const hasMoreRelated = visibleRelatedEntries.length > RELATED_INITIAL_COUNT;

  if (loading) return <LoadingShell />;

  if (!person) return <PersonNotFound />;

  const aboutParagraphs = person.about
    ? person.about.split(/\n\n+/).filter(Boolean)
    : [];

  const galleryImages = person.gallery;

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={PEOPLE_DETAIL_BG} />
        <Header />
        <main className="relative z-10">
          <div
            className="clped-page"
          >
            <div className="clped-content">
            <div className="clped-titlebar">
              <h1 className="clped-titlebar-name">{person.name}</h1>
              {person.role && (
                <span className="clped-titlebar-role">{person.role}</span>
              )}
            </div>

            {/* Bio with gallery wrap */}
            <div className="clped-bio">
              {galleryImages.length > 0 && (
                <div className="clped-bio-gallery clped-bio-gallery--left">
                  {galleryImages.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`${person.name} ${i + 1}`}
                      className="clped-bio-photo"
                    />
                  ))}
                </div>
              )}
              {aboutParagraphs.length > 0 ? (
                <PersonBioBody about={person.about} />
              ) : (
                <p className="clped-bio-paragraph" style={{ color: 'var(--ajab-ink-300)' }}>
                  Biography coming soon.
                </p>
              )}
            </div>

            <div className="clped-detail-rail">
            <div className="cld-detail-body-align clped-related-align">
            <section className="cld-related">
              <h2 className="cld-related-title">Related</h2>
              <div className="cld-related-tabs">
                {tabs.map((t, i) => (
                  <span key={t.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}>
                    <button
                      className={`cld-related-tab${activeTab === t.key ? ' active' : ''}`}
                      onClick={() => setActiveTab(t.key)}
                    >
                      {t.label}
                      <span className="cld-related-tab-count">({t.count})</span>
                    </button>
                    {i < tabs.length - 1 && <span className="cld-related-tab-sep">|</span>}
                  </span>
                ))}
              </div>
              <div className="cld-related-list">
                {displayedRelatedEntries.length ? (
                  displayedRelatedEntries.map((entry, idx) => {
                    const { bucket, item } = entry;
                    const relKey = relatedEntryKey(bucket, item, idx);
                    const itemTitle = getRelatedCardTitle(item, bucket) || 'Untitled';
                    const itemSubtitle = getRelatedCardSubtitle(item);
                    const descPlain = getRelatedCardDescription(item, bucket);
                    const expanded = !!relatedExpanded[relKey];
                    const needsClamp = relatedDescriptionNeedsClamp(descPlain, bucket);
                    const detailHref = getRelatedDetailHref(bucket, item);
                    const titleClass = `cld-related-itemtitle${
                      item?.titleStyle === 'dark' || bucket === 'poems'
                        ? ' cld-related-itemtitle--dark'
                        : ''
                    }`;
                    const thumbClass = `cld-related-thumb${
                      item?.thumbStyle === 'handwritten' || bucket === 'poems'
                        ? ' cld-related-thumb--handwritten'
                        : ''
                    }`;
                    const itemInner = (
                      <>
                        <div className={thumbClass}>
                          {item.thumbnailUrl && (
                            <img
                              src={resolveCmsAssetUrl(item.thumbnailUrl)}
                              alt={itemTitle}
                            />
                          )}
                        </div>
                        <div className="cld-related-body">
                          <div className="cld-related-titlerow">
                            <span className={titleClass}>{itemTitle}</span>
                            {itemSubtitle && (
                              <span className="cld-related-itemsubtitle">{itemSubtitle}</span>
                            )}
                          </div>
                          {descPlain && (
                            <p
                              className={`cld-related-itemdesc${
                                needsClamp && !expanded ? ' cld-related-itemdesc--clamped' : ''
                              }`}
                            >
                              {descPlain}
                              {needsClamp && (
                                <button
                                  type="button"
                                  className="cld-related-readmore"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setRelatedExpanded((prev) => ({ ...prev, [relKey]: !expanded }));
                                  }}
                                >
                                  {expanded ? ' read less' : '...more'}
                                </button>
                              )}
                            </p>
                          )}
                        </div>
                      </>
                    );
                    return detailHref ? (
                      <Link
                        key={relKey}
                        href={withAppBasePath(detailHref)}
                        className="cld-related-item cld-related-item--link"
                      >
                        {itemInner}
                      </Link>
                    ) : (
                      <div key={relKey} className="cld-related-item">
                        {itemInner}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: 16, color: '#828282' }}>No related items.</div>
                )}
              </div>
              {hasMoreRelated && (
                <button
                  type="button"
                  className="cld-related-seemore"
                  onClick={() => setRelatedListExpanded((v) => !v)}
                >
                  {relatedListExpanded ? 'SEE LESS' : 'SEE MORE'}
                </button>
              )}
            </section>
            </div>
            </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
