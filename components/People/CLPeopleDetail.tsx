'use client';

// [Claude] People detail page — fetches live data from Api/explore_person
// and renders the bio with gallery wrap, caption row and related section.

import { useEffect, useMemo, useRef, useState } from 'react';
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
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Songs/CLSongDetails.css';
import './CLPeople.css';

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
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'poems' | 'films'>('songs');
  const [navCount, setNavCount] = useState(0);

  useEffect(() => {
    fetch(`${AJAB_API_BASE}/Api/person_list?page=1&limit=1`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (typeof json?.total === 'number' && json.total > 0) setNavCount(json.total);
      })
      .catch(() => {});
  }, []);

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
  const tabs = [
    { key: 'all' as const, label: 'ALL', count: counts.all },
    { key: 'songs' as const, label: 'SONGS', count: counts.songs },
    { key: 'poems' as const, label: 'POEMS', count: counts.poems },
    { key: 'films' as const, label: 'FILMS', count: counts.films },
  ];

  const visibleItems = useMemo(() => {
    const d = related.data as any;
    if (activeTab === 'all') {
      return [...(d.songs || []), ...(d.poems || []), ...(d.films || [])];
    }
    return d[activeTab] || [];
  }, [activeTab, related]);

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
            style={{ '--clpe-nav-count': String(navCount) } as React.CSSProperties}
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
                {visibleItems.length ? (
                  visibleItems.map((item: any) => (
                    <div key={item.id || item.title} className="cld-related-item">
                      <div className="cld-related-thumb">
                        {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} />}
                      </div>
                      <div className="cld-related-body">
                        <div className="cld-related-titlerow">
                          <span className="cld-related-itemtitle">{item.title}</span>
                          {item.subtitle && <span className="cld-related-itemsubtitle">{item.subtitle}</span>}
                        </div>
                        <div className="cld-related-itemdesc">{item.about}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 16, color: '#828282' }}>No related items.</div>
                )}
              </div>
              <a className="cld-related-seemore">SEE MORE</a>
            </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
