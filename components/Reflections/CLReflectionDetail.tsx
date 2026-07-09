'use client';

// [Claude] Reflection detail page — fetches live data from Api/explore_reflection
// and renders the title/saysBy header, YouTube embed, description and related section.

import { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { usePathname } from 'next/navigation';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import Link from 'next/link';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import { CLGlossaryPopup } from '@/components/Poems/CLPoemPopups';
import GlossaryStrip, { type GlossaryStripTerm } from '@/components/shared/GlossaryStrip';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { REFLECTIONS_DETAIL_BG } from '@/lib/pageBackgroundTiles';
import {
  MOCK_REFLECTION_DETAIL,
  REFLECTIONS_RELATED,
} from './CLReflectionMocks';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { truncateAtWord } from '@/lib/truncateAtWord';
import { getSpeakerNameMap } from '@/lib/speakerNames';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { ReflectionsNavCountContext } from '@/components/Reflections/ReflectionsNavCountContext';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
import { getRelatedDetailHref } from '@/lib/relatedDetailHref';
import { resolveCmsAssetUrl, withAppBasePath } from '@/lib/resolveCmsAssetUrl';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Songs/CLSongDetails.css';
import './CLReflections.css';

const DESCRIPTION_TRUNCATE = 220; /* ~3 lines at PDF column width (matches song detail) */
const RELATED_INITIAL_COUNT = 3;

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

interface ReflectionDetail {
  id: string;
  title: string;
  saysBy: string;
  location: string;
  year: string;
  videoId: string;
  description: string;
  format: string;
}

// [Claude] these changes have been recommended by claude —
// Field order fixed: reflection_excerpt is the primary description field in the API
// (interview_about is usually empty). meta_description added as final fallback.
// saysBy resolves speaker_id via person_list (person_name_english on this payload
// is the attributed poet, not the speaker — PDF shows the real speaker name).
function mapApiItem(it: any, speakerNames: Record<string, string>): ReflectionDetail {
  return {
    id: String(it.id || ''),
    title: it.meta_title || it.title || '',
    saysBy: speakerNames[String(it.speaker_id || '').trim()] || '',
    location: it.interview_place || '',
    year: it.interview_year || '',
    videoId: it.youtube_video_id || it.interview_video || '',
    description: htmlToPlainText(
      it.reflection_excerpt || it.interview_about || it.visual_story_desc || it.essay_content || it.meta_description || ''
    ),
    format: (it.format || 'Interview'),
  };
}

function getRelatedItemDescription(item: any): string {
  return htmlToPlainText(
    String(item?.about || item?.description || item?.meta_description || item?.thumbnail_excerpt || '')
  );
}

type RelatedListEntry = { bucket: string; item: any };

function relatedEntryKey(bucket: string, item: any, index: number): string {
  const entryId = item?.id != null && item?.id !== '' ? String(item.id) : 'noid';
  return `${bucket}-${entryId}-${index}`;
}

function buildAllRelatedEntries(data: Record<string, any[]>): RelatedListEntry[] {
  const blocks: Array<[string, any[]]> = [
    ['songs', data.songs || []],
    ['poems', data.poems || []],
    ['reflections', data.reflections || []],
    ['other', [...(data.other || []), ...(data.films || [])]],
  ];
  return blocks.flatMap(([bucket, items]) => items.map((item) => ({ bucket, item })));
}

/** Related API `keywords` bucket → wavy pill terms (API only, no static fallback).
 *  Search href is applied by GlossaryStrip (same as song detail). */
function mapApiGlossaryTerms(keywords: any[]): GlossaryStripTerm[] {
  const terms = keywords
    .map((k) => {
      const term = htmlToPlainText(
        String(k.word_transliteration || k.title || k.term || k.word || '')
      );
      const meaning = htmlToPlainText(
        String(k.word_translation || k.subtitle || k.meaning || k.translation || '')
      );
      if (!term) return null;
      return { term, meaning };
    })
    .filter((t): t is GlossaryStripTerm => t != null);

  return terms;
}

function ReflectionDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESCRIPTION_TRUNCATE + 20;

  if (!text) return null;

  return (
    <div className="clrd-description">
      <p className={`clrd-description-body${expanded ? ' is-expanded' : ''}`}>
        {expanded || !isLong ? text : truncateAtWord(text, DESCRIPTION_TRUNCATE)}
        {isLong && !expanded && (
          <button type="button" className="clrd-description-more" onClick={() => setExpanded(true)}>
            ...more
          </button>
        )}
      </p>
    </div>
  );
}

// [Claude] these changes have been recommended by claude — fullscreen loader: pure white + logo only, no chrome
function LoadingShell() { return <Loader />; }

export default function CLReflectionDetail({ id: idProp }: { id?: string }) {
  const pathname = usePathname();
  const urlId = pathname?.split('/').filter(Boolean).pop();
  const id = (urlId && urlId !== '0') ? urlId : idProp;
  const shellRef = useRef<HTMLDivElement>(null);
  const { setReflectionsNavTotal } = useContext(ReflectionsNavCountContext);
  const [data, setData] = useState<ReflectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<RelatedContent>(EMPTY_RELATED);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'poems' | 'reflections' | 'other'>('songs');
  const [showGlossary, setShowGlossary] = useState(false);
  const [relatedExpanded, setRelatedExpanded] = useState<Record<string, boolean>>({});
  const [relatedListExpanded, setRelatedListExpanded] = useState(false);

  useEffect(() => {
    fetch(`${AJAB_API_BASE}/Api/reflection_list?page=1&limit=1`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const apiTotal = parseCatalogTotal(json?.total);
        if (apiTotal != null) setReflectionsNavTotal(apiTotal);
      })
      .catch(() => {});
  }, [setReflectionsNavTotal]);

  useEffect(() => {
    if (!id) {
      setData(MOCK_REFLECTION_DETAIL as any);
      setLoading(false);
      return;
    }
    const fetchReflection = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${AJAB_API_BASE}/Api/explore_reflection?reflection_id=${id}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        const item = json?.data;
        if (item) {
          /* [Claude] these changes have been recommended by claude — resolve speaker via cached map */
          const speakerNames = await getSpeakerNameMap();
          setData(mapApiItem(item, speakerNames));
        } else setData(MOCK_REFLECTION_DETAIL as any);
      } catch {
        setData(MOCK_REFLECTION_DETAIL as any);
      } finally {
        setLoading(false);
      }
    };
    fetchReflection();
  }, [id]);

  useEffect(() => {
    setRelatedExpanded({});
    setRelatedListExpanded(false);
  }, [activeTab]);

  useEffect(() => {
    if (!id) {
      setRelated(asRelatedContent(REFLECTIONS_RELATED));
      return;
    }
    let cancelled = false;
    fetchRelatedByParam('reflection_id', id).then((result) => {
      if (cancelled) return;
      setRelated(result || asRelatedContent(REFLECTIONS_RELATED));
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const counts = related.counts;
  const tabs = [
    { key: 'all' as const, label: 'ALL', count: counts.all },
    { key: 'songs' as const, label: 'SONGS', count: counts.songs },
    { key: 'poems' as const, label: 'POEMS', count: counts.poems },
    { key: 'reflections' as const, label: 'REFLECTIONS', count: counts.reflections },
    { key: 'other' as const, label: 'OTHER', count: counts.other },
  ];

  const visibleRelatedEntries = useMemo((): RelatedListEntry[] => {
    const d = related.data as Record<string, any[]>;
    if (activeTab === 'all') {
      return buildAllRelatedEntries(d);
    }
    if (activeTab === 'other') {
      return [...(d.other || []), ...(d.films || [])].map((item) => ({ bucket: 'other', item }));
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

  const glossaryTerms = useMemo(
    () => mapApiGlossaryTerms((related.data.keywords || []) as any[]),
    [related]
  );

  if (loading) return <LoadingShell />;

  if (!data) {
    return (
      <div className="cl-songs-page-root">
        <div className="min-h-screen">
          <Header />
          <main className="relative z-10">
            <div style={{ padding: '120px 24px', textAlign: 'center', fontFamily: 'var(--ajab-font-serif)', color: 'var(--ajab-ink-500)' }}>
              <p>Reflection not found.</p>
              <Link href="/reflections" style={{ color: 'var(--ajab-pink-primary)', display: 'inline-block', marginTop: 16 }}>
                ← Back to Reflections
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const description = data.description || '';

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={REFLECTIONS_DETAIL_BG} />
        <Header />
        <main className="relative z-10">
          <div className="clrd-page">
            <div className="clrd-content">
            {/* [Claude] these changes have been recommended by claude —
                Header: title+speaker LEFT, location+year RIGHT (justify-content: space-between).
                Matches PDF design where "Trivandrum, 2009" sits top-right of the same row.
                Verb inline styles replaced with clrd-header-verb class. */}
            <div className="clrd-header">
              <div className="clrd-header-top">
                <div className="clrd-header-left">
                  <span className="clrd-header-title-name">{data.title}</span>
                  {data.saysBy && (
                    <span className="clrd-header-credits">
                      <span className="clrd-header-verb">
                        {data.format === 'Essay' ? 'by' : 'says'}
                      </span>
                      <span className="clrd-header-speaker">{data.saysBy}</span>
                    </span>
                  )}
                </div>
                {(data.location || data.year) && (
                  <span className="clrd-header-meta">
                    {data.location}{data.location && data.year ? ', ' : ''}{data.year}
                  </span>
                )}
              </div>
            </div>

            {/* Video */}
            <div className="clrd-video-wrap">
              {data.videoId ? (
                <YouTubeEmbedFrame videoId={data.videoId} title={data.title} />
              ) : (
                <div className="clrd-video-placeholder">Video not available</div>
              )}
            </div>

            {/* Description */}
            {/* [Claude] these changes have been recommended by claude —
                Location/year moved here (after description) to match PDF layout. */}
            <ReflectionDescription text={description} />

            {/* Related section */}
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
                    const descPlain = getRelatedItemDescription(item);
                    const expanded = !!relatedExpanded[relKey];
                    const newlineCount = (descPlain.match(/\n/g) || []).length;
                    const needsClamp = descPlain.length > 140 || newlineCount >= 2;
                    const detailHref = getRelatedDetailHref(bucket, item);
                    const thumbSrc = resolveCmsAssetUrl(item.thumbnailUrl || item.thumbnail_url);
                    const itemInner = (
                      <>
                        <div className="cld-related-thumb">
                          {thumbSrc && <img src={thumbSrc} alt={item.title} />}
                        </div>
                        <div className="cld-related-body">
                          <div className="cld-related-titlerow">
                            <span className="cld-related-itemtitle">{item.title}</span>
                            {item.subtitle && (
                              <span className="cld-related-itemsubtitle">{item.subtitle}</span>
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
                  <div className="clrd-related-empty">No related items.</div>
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

            {glossaryTerms.length > 0 && (
              <GlossaryStrip terms={glossaryTerms} className="clrd-glossary-strip" />
            )}
            </div>
          </div>
        </main>
        <CLGlossaryPopup isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
      </div>
    </div>
  );
}
