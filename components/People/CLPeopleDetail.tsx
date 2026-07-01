'use client';

// [Claude] People detail page — fetches live data from Api/explore_person
// and renders the bio with gallery wrap, caption row and related section.

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import { MOCK_PERSON_DETAIL, PERSON_RELATED } from './CLPeopleMocks';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
import KeywordCloud from '@/components/shared/KeywordCloud';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { keywordsFromRelatedBucket } from '@/lib/parseKeywords';
import { PEOPLE_DETAIL_BG } from '@/lib/pageBackgroundTiles';
import { getRelatedDetailHref } from '@/lib/relatedDetailHref';
import { truncateAtWord } from '@/lib/truncateAtWord';
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

function getRelatedItemTitle(item: any): string {
  const t =
    item?.title ||
    item?.Songtitle_transliteration ||
    item?.english_transliteration ||
    item?.original_title ||
    '';
  return typeof t === 'string' ? t.trim() : '';
}

function getRelatedItemSubtitle(item: any): string {
  const sub = item?.subtitle || item?.songtitletraan || item?.english_translation || '';
  return typeof sub === 'string' ? sub.trim() : '';
}

function getRelatedItemDescription(item: any): string {
  return htmlToPlainText(
    String(item?.about || item?.description || item?.meta_description || item?.thumbnail_excerpt || '')
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

function mapApiItem(it: any): PersonDetail {
  const thumb = it.thumbnail_url ? `${AJAB_API_BASE}${it.thumbnail_url}` : '';
  return {
    id: String(it.id || ''),
    name: it.person_name_english || it.person_name || '',
    role: (it.occupation_text || it.occupation || '').toUpperCase(),
    thumbnailUrl: thumb,
    gallery: thumb ? [thumb] : [],
    about: htmlToPlainText(it.profile || it.about || ''),
    galleryCaption: '',
  };
}

// [Claude] these changes have been recommended by claude — fullscreen loader: pure white + logo only, no chrome
function LoadingShell() { return <Loader />; }

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
      setPerson(MOCK_PERSON_DETAIL as any);
      setLoading(false);
      return;
    }
    const fetchPerson = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${AJAB_API_BASE}/Api/explore_person?person_id=${id}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        const item = json?.data;
        if (item) setPerson(mapApiItem(item));
        else setPerson(MOCK_PERSON_DETAIL as any);
      } catch {
        setPerson(MOCK_PERSON_DETAIL as any);
      } finally {
        setLoading(false);
      }
    };
    fetchPerson();
  }, [id]);

  useEffect(() => {
    if (!id) {
      setRelated(asRelatedContent(PERSON_RELATED));
      return;
    }
    let cancelled = false;
    (async () => {
      let result = await fetchRelatedByParam('people_id', id);
      if (!result) result = await fetchRelatedByParam('person_id', id);
      if (cancelled) return;
      setRelated(result || asRelatedContent(PERSON_RELATED));
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  const keywordTerms = useMemo(
    () => keywordsFromRelatedBucket((related.data.keywords || []) as unknown[]),
    [related.data.keywords]
  );

  if (loading) return <LoadingShell />;

  if (!person) {
    return (
      <div className="cl-songs-page-root">
        <div className="min-h-screen">
          <Header />
          <main className="relative z-10">
            <div style={{ padding: '120px 24px', textAlign: 'center', fontFamily: 'var(--ajab-font-serif)', color: 'var(--ajab-ink-500)' }}>
              <p>Person not found.</p>
              <Link href="/people" style={{ color: 'var(--ajab-pink-primary)', display: 'inline-block', marginTop: 16 }}>
                ← Back to People
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const aboutParagraphs = person.about
    ? person.about.split(/\n\n+/).filter(Boolean)
    : [];

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
            <Link href="/people" className="clped-back">
              <ChevronLeft size={16} strokeWidth={1.5} />
              All People
            </Link>

            <div className="clped-titlebar">
              <h1 className="clped-titlebar-name">{person.name}</h1>
              {person.role && (
                <span className="clped-titlebar-role">{person.role}</span>
              )}
            </div>

            {/* Bio with gallery wrap */}
            <div className="clped-bio">
              {person.gallery.length > 0 && (
                <div className="clped-bio-gallery clped-bio-gallery--left">
                  {person.gallery.slice(0, 2).map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${person.name} ${i + 1}`}
                      className="clped-bio-photo"
                    />
                  ))}
                </div>
              )}
              {aboutParagraphs.length > 0 ? (
                aboutParagraphs.map((p, i) => (
                  <p key={i} className="clped-bio-paragraph">{p}</p>
                ))
              ) : (
                <p className="clped-bio-paragraph" style={{ color: 'var(--ajab-ink-300)' }}>
                  Biography coming soon.
                </p>
              )}
            </div>

            <KeywordCloud terms={keywordTerms} className="clped-keyword-cloud cld-detail-body-align" />

            {/* Related */}
            <section className="cld-related clped-related">
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
                    const itemTitle = getRelatedItemTitle(item) || 'Untitled';
                    const itemSubtitle = getRelatedItemSubtitle(item);
                    const descPlain = getRelatedItemDescription(item);
                    const expanded = !!relatedExpanded[relKey];
                    const newlineCount = (descPlain.match(/\n/g) || []).length;
                    const needsClamp = descPlain.length > 140 || newlineCount >= 2;
                    const detailHref = getRelatedDetailHref(bucket, item);
                    const itemInner = (
                      <>
                        <div className="cld-related-thumb">
                          {item.thumbnailUrl && (
                            <img
                              src={resolveCmsAssetUrl(item.thumbnailUrl)}
                              alt={itemTitle}
                            />
                          )}
                        </div>
                        <div className="cld-related-body">
                          <div className="cld-related-titlerow">
                            <span className="cld-related-itemtitle">{itemTitle}</span>
                            {itemSubtitle && (
                              <span className="cld-related-itemsubtitle">{itemSubtitle}</span>
                            )}
                          </div>
                          {descPlain && (
                            <p className="cld-related-itemdesc">
                              {needsClamp && !expanded
                                ? truncateAtWord(descPlain, 140)
                                : descPlain}
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
        </main>
      </div>
    </div>
  );
}
