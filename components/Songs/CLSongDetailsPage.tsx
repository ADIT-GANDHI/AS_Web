'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { GLOSSARY_TERMS_LINE_1, GLOSSARY_TERMS_LINE_2 } from './CLdetailMocks';
import { CLGlossaryPopup } from '../Poems/CLPoemPopups';
import GlossaryStrip from '@/components/shared/GlossaryStrip';
import WavyCard from '@/components/shared/WavyCard';
import KeywordCloud from '@/components/shared/KeywordCloud';
import './CLSongs.css'; // for the root marble bg + floating button overrides
import './CLSongDetails.css';
import { keywordsFromRelatedBucket } from '@/lib/parseKeywords';
import { resolveCmsAssetUrl, withAppBasePath } from '@/lib/resolveCmsAssetUrl';

type Script = 'devanagari' | 'transliteration' | 'english';

function extractYouTubeId(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
  if (m) return m[1];
  if (/^[A-Za-z0-9_-]+$/.test(url.trim())) return url.trim();
  return '';
}

function getText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.englishTranslation || value.englishTransliteration || value.hindi || '';
  }
  return '';
}

/** CMS often returns HTML in `about` / lyrics fields — flatten for plain `<p>` / stanza splits. */
function htmlToPlainText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Preserve CMS HTML for the about field when present. */
function getAboutHtml(data: any): string {
  for (const field of [
    data?.about,
    data?.meta_description,
    data?.metaDescription,
    data?.song_description,
  ]) {
    if (typeof field === 'string' && field.trim()) return field.trim();
  }
  return getText(data?.about) || getText(data?.meta_description) || '';
}

/** PDF/Figma: ~3 lines of about text, then pink "...more" to expand — no inner scroll box. */
function SongAboutClamp({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!html.trim()) return null;

  return (
    <div className="cld-description">
      <div
        className={`cld-description-body${expanded ? '' : ' cld-description-body--clamped'}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {!expanded && (
        <button
          type="button"
          className="cld-description-more"
          onClick={() => setExpanded(true)}
        >
          ...more
        </button>
      )}
    </div>
  );
}

/** First non-empty string from CMS fields (string or nested getText object). */
function firstLyricsField(...vals: any[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v;
    const t = getText(v);
    if (t.trim()) return t;
  }
  return '';
}

function relatedBucket(data: Record<string, unknown>, key: string): any[] {
  const arr = data[key];
  return Array.isArray(arr) ? arr : [];
}

/** Display title for a related row — used for A→Z sort and rendering. */
function getRelatedItemTitle(item: any): string {
  if (!item || typeof item !== 'object') return 'Untitled';
  for (const field of [
    item.Songtitle_transliteration,
    item.song_title_transliteration,
    item.title,
    item.word_transliteration,
    item.original_title,
    item.person_name,
    item.english_transliteration,
    item.english_translation,
  ]) {
    const t = typeof field === 'string' ? field.trim() : getText(field).trim();
    if (t) return t;
  }
  return 'Untitled';
}

function getRelatedItemSubtitle(item: any): string {
  if (item?.word_translation && typeof item.word_translation === 'string') {
    return item.word_translation.trim();
  }
  const sub = item?.songtitletraan || item?.subtitle;
  return typeof sub === 'string' ? sub.trim() : getText(sub).trim();
}

function getRelatedItemDescription(item: any): string {
  return htmlToPlainText(
    String(item?.about || item?.description || item?.meta_description || '')
  );
}

function sortRelatedByTitle(items: any[]): any[] {
  return [...items].sort((a, b) =>
    getRelatedItemTitle(a).localeCompare(getRelatedItemTitle(b), undefined, {
      sensitivity: 'base',
    })
  );
}

type RelatedListEntry = { bucket: string; item: any };

/** Stable React key — CMS ids overlap across buckets (e.g. song id 5 vs poem id 5). */
function relatedEntryKey(bucket: string, item: any, index: number): string {
  const id = item?.id != null && item?.id !== '' ? String(item.id) : 'noid';
  return `${bucket}-${id}-${index}`;
}

function buildAllRelatedEntries(buckets: {
  keywords: any[];
  songs: any[];
  poems: any[];
  reflections: any[];
  other: any[];
}): RelatedListEntry[] {
  const { keywords, songs, poems, reflections, other } = buckets;
  const blocks: Array<[string, any[]]> =
    keywords.length > 0
      ? [
        ['keywords', keywords],
        ['songs', songs],
        ['poems', poems],
        ['reflections', reflections],
        ['other', other],
      ]
      : [
        ['songs', songs],
        ['poems', poems],
        ['reflections', reflections],
        ['other', other],
      ];
  return blocks.flatMap(([bucket, items]) => items.map((item) => ({ bucket, item })));
}

export default function CLSongDetailsPage({
  data,
  songVersions = [],
  related = null,
}: {
  data: any;
  songVersions?: any[];
  related?: any;
}) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [script, setScript] = useState<Script>('transliteration');
  const [showNotes, setShowNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'poems' | 'reflections' | 'other'>('songs');
  const [showGlossary, setShowGlossary] = useState(false);
  const [relatedExpanded, setRelatedExpanded] = useState<Record<string, boolean>>({});
  const [relatedListExpanded, setRelatedListExpanded] = useState(false);

  useEffect(() => {
    setRelatedListExpanded(false);
  }, [activeTab]);

  const scrollVersions = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const card = sliderRef.current.querySelector('.cld-version-card') as HTMLElement | null;
    const gap = parseFloat(getComputedStyle(sliderRef.current).columnGap || getComputedStyle(sliderRef.current).gap) || 61;
    const step = (card?.offsetWidth ?? 215) + gap;
    sliderRef.current.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  const title = useMemo(() => {
    if (script === 'devanagari') {
      return (
        getText(data?.songTitleOriginal) ||
        getText(data?.song_title) ||
        getText(data?.umbrellaTitle) ||
        'Untitled'
      );
    }
    if (script === 'english') {
      return (
        getText(data?.songTitle) ||
        getText(data?.songtitletraan) ||
        getText(data?.english_translation) ||
        'Untitled'
      );
    }
    return (
    getText(data?.Songtitle_transliteration) ||
    getText(data?.songTitleTransliteration) ||
      getText(data?.song_title_transliteration) ||
      getText(data?.umbrellaTitleText) ||
    getText(data?.umbrellaTitle) ||
      'Untitled'
    );
  }, [data, script]);

  const singer = (getText(data?.singer_name) || getText(data?.singer) || '').toUpperCase();
  const poet = (getText(data?.poet) || '').toUpperCase();
  const year =
    getText(data?.year) ||
    getText(data?.Year) ||
    getText(data?.song_year) ||
    '';
  const location = getText(data?.location) || getText(data?.song_location) || '';
  const aboutHtml = useMemo(() => getAboutHtml(data), [data]);

  const lyricsSource = useMemo(() => {
    const original = firstLyricsField(
      data?.songLyricsOriginal,
      data?.songLyrics,
      data?.songLyricsHindi,
      data?.song_lyrics_hindi,
      data?.songLyricsDevanagari
    );
    const translated = firstLyricsField(
      data?.songLyricsTranslated,
      data?.song_lyrics_translated
    );
    const translit = firstLyricsField(
      data?.songLyricsTransliteration,
      data?.song_lyrics_transliteration,
      data?.songLyricsNotes
    );

    if (script === 'english') {
      return translated;
    }
    if (script === 'devanagari') {
      return original;
    }
    return translit || original;
  }, [data, script]);

  const lyricsHtml =
    typeof lyricsSource === 'string' && /<[a-z][\s\S]*>/i.test(lyricsSource)
      ? lyricsSource
      : '';
  const lyrics: string = lyricsHtml ? '' : htmlToPlainText(lyricsSource);
  const notesRaw =
    data?.songnotes ||
    data?.song_notes ||
    data?.songNotes ||
    data?.SongNotes ||
    data?.song_notes_text ||
    data?.meta_notes ||
    data?.songNotesText ||
    data?.songLyricsNotes ||
    '';
  const notesText = htmlToPlainText(typeof notesRaw === 'string' ? notesRaw : getText(notesRaw));
  const videoId = extractYouTubeId(data?.youtube_video_id || data?.youtubeVideoId || '');

  // Split lyrics into stanzas (separated by blank lines)
  const stanzas = useMemo(
    () =>
      typeof lyrics === 'string'
        ? lyrics.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
        : [],
    [lyrics]
  );

  const versionCards = (songVersions || []).map((item) => ({
    id: item?.id,
    title:
      getText(item?.umbrellaTitleText) ||
      getText(item?.Songtitle_transliteration) ||
      getText(item?.song_title_transliteration) ||
      getText(item?.umbrellaTitle) ||
      getText(item?.song_title) ||
      'Untitled',
    subtitle: getText(item?.songTitle) || getText(item?.songtitletraan) || '',
    singer: (getText(item?.singer) || getText(item?.singer_display) || '').toUpperCase(),
    poet: (getText(item?.poet) || '').toUpperCase(),
    image: resolveCmsAssetUrl(item?.thumbnailUrl || item?.thumbnail_url),
    year: getText(item?.year) || getText(item?.Year) || getText(item?.song_year) || '',
  }));

  // Figma 361:1456 vs 361:1437 / 361:1444 — the card representing the
  // CURRENT version (the song being viewed) renders the title in dark grey
  // (var(--ajab-ink-700)). All other cards (alternative versions the user
  // can navigate to) render the title in pink. Match by id when possible;
  // when nothing matches (mock data, fresh API), fall back to the first
  // card so the row still reads as "1 current + N alternatives".
  const currentVersionIdx = (() => {
    if (data?.id != null) {
      const match = versionCards.findIndex((c) => String(c.id) === String(data.id));
      if (match >= 0) return match;
    }
    return 0;
  })();

  const relatedData = related?.data || {};
  const relatedCounts = related?.counts || {};

  const relatedBuckets = useMemo(() => {
    const keywords = sortRelatedByTitle(relatedBucket(relatedData, 'keywords'));
    const songs = sortRelatedByTitle(relatedBucket(relatedData, 'songs'));
    const poems = sortRelatedByTitle(relatedBucket(relatedData, 'poems'));
    const reflections = sortRelatedByTitle(relatedBucket(relatedData, 'reflections'));
    const other = sortRelatedByTitle(relatedBucket(relatedData, 'other'));
    return { keywords, songs, poems, reflections, other };
  }, [relatedData]);

  const keywords = useMemo(
    () => keywordsFromRelatedBucket(relatedBuckets.keywords as unknown[]),
    [relatedBuckets.keywords]
  );

  // Build the tab list dynamically by counts
  // [Claude] these changes have been recommended by claude — ALL count falls back to sum of arrays when relatedCounts.all is absent/0
  const keywordsCount = relatedBuckets.keywords.length;
  const songsCount = relatedCounts.songs || relatedBuckets.songs.length;
  const poemsCount = relatedCounts.poems || relatedBuckets.poems.length;
  const reflectionsCount = relatedCounts.reflections || relatedBuckets.reflections.length;
  const otherCount = relatedCounts.other || relatedBuckets.other.length;
  const tabs: Array<{ key: typeof activeTab; label: string; count: number }> = [
    {
      key: 'all',
      label: 'ALL',
      count:
        relatedCounts.all ||
        keywordsCount + songsCount + poemsCount + reflectionsCount + otherCount,
    },
    { key: 'songs', label: 'SONGS', count: songsCount },
    { key: 'poems', label: 'POEMS', count: poemsCount },
    { key: 'reflections', label: 'REFLECTIONS', count: reflectionsCount },
    { key: 'other', label: 'OTHER', count: otherCount },
  ];

  const visibleRelatedEntries = useMemo((): RelatedListEntry[] => {
    if (activeTab === 'all') {
      return buildAllRelatedEntries(relatedBuckets);
    }
    const items = relatedBuckets[activeTab] || [];
    return items.map((item) => ({ bucket: activeTab, item }));
  }, [activeTab, relatedBuckets]);

  const RELATED_INITIAL_COUNT = 3;
  const displayedRelatedEntries = useMemo(() => {
    if (relatedListExpanded || visibleRelatedEntries.length <= RELATED_INITIAL_COUNT) {
      return visibleRelatedEntries;
    }
    return visibleRelatedEntries.slice(0, RELATED_INITIAL_COUNT);
  }, [visibleRelatedEntries, relatedListExpanded]);

  const hasMoreRelated =
    visibleRelatedEntries.length > RELATED_INITIAL_COUNT;

  return (
    <div className="cl-songs-page-root">
      {/* ── Single marble plate (see CLSongDetails.css). ── */}
      <div className="cld-bg-stack" aria-hidden="true">
        <div className="cld-bg-marble" />
      </div>
      <div className="min-h-screen">
        <Header />
        <main className="relative z-10">
          <div className="cld-page">
            {/* ===== Versions section ===== */}
            <section className="cld-versions-section">
              <div className="cld-versions-heading">
              <h2 className="cld-versions-title">{versionCards.length} Song Versions</h2>
                {/* Dedicated rule element (replaces ::after) so the divider cannot paint
                    across the slider/cards due to stacking or overflow quirks. */}
                <div className="cld-versions-title-rule" aria-hidden="true" />
              </div>
              <div className="cld-versions-slider-wrap">
                {versionCards.length > 1 && (
                  <button
                    type="button"
                    className="cld-slider-nav"
                    onClick={() => scrollVersions('left')}
                    aria-label="Previous song version"
                  >
                  <ChevronLeft size={26} strokeWidth={2.4} />
                </button>
                )}
                <div className="cld-versions-slider" ref={sliderRef}>
                  {versionCards.map((card, idx) => (
                    // Figma 361:1437 / 361:1444 / 361:1456 — current version
                    // = dark grey title; alternative versions = pink title.
                    <WavyCard
                      key={`${card.id ?? 'v'}-${idx}`}
                      as="a"
                      href={withAppBasePath(`/songs/details/${card.id}`)}
                      imageSrc={card.image}
                      imageAlt={card.title}
                      className={`cld-version-card${idx === currentVersionIdx ? '' : ' is-active'}`}
                      bodyClassName="cld-version-card-body"
                      thumbClassName="cld-version-card-thumb"
                    >
                        <div className="cld-version-card-title">
                          {card.title}
                          {card.year && <span className="cld-version-card-year">({card.year})</span>}
                        </div>
                        {card.subtitle && (
                          <div className="cld-version-card-subtitle">{card.subtitle}</div>
                        )}
                        {card.singer && (
                          <div className="cld-version-card-meta">sings {card.singer}</div>
                        )}
                        {card.poet && (
                          <div className="cld-version-card-meta">poet {card.poet}</div>
                        )}
                    </WavyCard>
                  ))}
                </div>
                {versionCards.length > 1 && (
                  <button
                    type="button"
                    className="cld-slider-nav"
                    onClick={() => scrollVersions('right')}
                    aria-label="Next song version"
                  >
                  <ChevronRight size={26} strokeWidth={2.4} />
                </button>
                )}
              </div>
            </section>

            {/* Header / video / about — inset to match first version card (after in-flow chevron + gap). */}
            <div className="cld-detail-body-align">
              {/* ===== Song header row ─── Figma 361:1463 splits sizes ===== */}
            <div className="cld-song-header">
                <div className="cld-song-header-top">
                  <div className="cld-song-header-left">
                    <span className="cld-song-header-title-name">{title}</span>
                    {singer && (
                      <span className="cld-song-header-credits">
                        <span className="cld-song-header-sings">sings</span>
                        <span className="cld-song-header-singer">
                          <Link
                            href={`/people/${data?.singer_ids?.[0] || data?.singer_raw || ''}`}
                            className="cld-singer-link"
                          >
                            {singer}
                          </Link>
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                {(location || year) && (
                  <div className="cld-song-header-meta-row">
                    <span className="cld-song-header-meta">
                      {location}
                      {location && year ? ', ' : ''}
                      {year}
                    </span>
              </div>
                )}
            </div>

            {/* ===== Video ===== */}
            <div className="cld-video-wrap">
              {videoId ? (
                <LiteYouTubeEmbed id={videoId} title={title} poster="maxresdefault" noCookie />
              ) : (
                <div className="cld-video-placeholder">Video unavailable (API offline)</div>
              )}
            </div>

              {/* ===== Description — Figma 361:1473 ===== */}
              {aboutHtml && <SongAboutClamp html={aboutHtml} />}
            </div>

            {/* ===== Language toggle — Figma 361:1480.
                 Three 44 x 44 white glyph buttons: pink Devanagari (अ),
                 grey transliteration (ā), pink Latin (a). ===== */}
            <div className="cld-lang-toggle" role="tablist" aria-label="Script">
              <button
                className={`cld-lang-btn cld-lang-btn--script${script === 'devanagari' ? ' active' : ''}`}
                onClick={() => setScript('devanagari')}
                aria-label="Devanagari"
              >
                अ
              </button>
              <button
                className={`cld-lang-btn cld-lang-btn--muted${script === 'transliteration' ? ' active' : ''}`}
                onClick={() => setScript('transliteration')}
                aria-label="Transliteration"
              >
                ā
              </button>
              <button
                className={`cld-lang-btn cld-lang-btn--script${script === 'english' ? ' active' : ''}`}
                onClick={() => setScript('english')}
                aria-label="Latin / English"
              >
                a
              </button>
            </div>

            {/* ===== Big song title + poet ===== */}
            <div className="cld-song-title-block">
              <h1 className="cld-song-title">{title}</h1>
              {poet && (
                <div>
                  <span className="cld-song-poet-label cld-song-poet">poet </span>
                  <span className="cld-song-poet">{poet}</span>
                </div>
              )}
            </div>

            {/* ===== Lyrics ===== */}
            {lyricsHtml ? (
              <div
                className="cld-lyrics cld-lyrics--html"
                dangerouslySetInnerHTML={{ __html: lyricsHtml }}
              />
            ) : (
            <div className="cld-lyrics">
              {stanzas.length > 0 ? (
                stanzas.map((stanza, i) => (
                  <div key={i} className="cld-lyrics-stanza">
                    {stanza.split('\n').map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="cld-lyrics-stanza">Lyrics unavailable</div>
              )}
            </div>
            )}


            {/* ===== NOTES | GLOSSARY links ===== */}
            <div className="cld-notes-glossary-row">
              <button
                type="button"
                className="cld-notes-link"
                onClick={() => setShowNotes((v) => !v)}
              >
                NOTES
              </button>
              <span className="cld-notes-glossary-sep">|</span>
              <button
                type="button"
                className={`cld-glossary-link${showGlossary ? ' is-active' : ''}`}
                onClick={() => {
                  setShowNotes(false);
                  setShowGlossary((v) => !v);
                }}
              >
                GLOSSARY
              </button>
            </div>

            {/* ===== Song Notes overlay — fixed to left side, does NOT move lyrics ===== */}
            <aside
              className={`cld-notes-sidebar${showNotes ? ' is-open' : ''}`}
              aria-label="Song Notes"
            >
              <div className="cld-notes-sidebar-inner">
                <div className="cld-notes-sidebar-header">
                  <span className="cld-notes-sidebar-title">Song Notes</span>
                  <button
                    type="button"
                    className="cld-notes-sidebar-close"
                    aria-label="Close notes"
                    onClick={() => setShowNotes(false)}
                  >
                    ×
                  </button>
                </div>
                <p className="cld-notes-body">
                  {notesText || 'No song notes are available for this song yet.'}
                </p>
              </div>
            </aside>

            {/* ===== Glossary overlay — fixed to right side, same card style as Notes ===== */}
            <aside
              className={`cld-glossary-sidebar${showGlossary ? ' is-open' : ''}`}
              aria-label="Glossary"
            >
              <div className="cld-notes-sidebar-inner">
                <div className="cld-notes-sidebar-header">
                  <span className="cld-notes-sidebar-title">Glossary</span>
                  <button
                    type="button"
                    className="cld-notes-sidebar-close"
                    aria-label="Close glossary"
                    onClick={() => setShowGlossary(false)}
                  >
                    ×
                  </button>
                </div>
                <p className="cld-notes-body">
                  {data?.glossary || "Here's a lay of this land — Ajab Shahar, a wondrous city of songs, poems, images and conversations from Bhakti, Sufi & Baul oral traditions from India and around."}
                </p>
              </div>
            </aside>

            {/* ===== Related section — aligned with video column ===== */}
            <div className="cld-detail-body-align">
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
                  {visibleRelatedEntries.length > 0 ? (
                    displayedRelatedEntries.map((entry, idx) => {
                      const { bucket, item } = entry;
                      // Figma 361:1514: certain related items (poems / written
                      // works) use a DARK title and a calligraphic handwritten
                      // thumb instead of the default pink title + photo.
                      const titleClass =
                        `cld-related-itemtitle${item?.titleStyle === 'dark' ? ' cld-related-itemtitle--dark' : ''}`;
                      const thumbClass =
                        `cld-related-thumb${item?.thumbStyle === 'handwritten' ? ' cld-related-thumb--handwritten' : ''}`;
                      const relKey = relatedEntryKey(bucket, item, idx);
                      const itemTitle = getRelatedItemTitle(item);
                      const itemSubtitle = getRelatedItemSubtitle(item);
                      const descPlain = getRelatedItemDescription(item);
                      const expanded = !!relatedExpanded[relKey];
                      const newlineCount = (descPlain.match(/\n/g) || []).length;
                      const needsClamp = descPlain.length > 140 || newlineCount >= 2;
                      return (
                        <div key={relKey} className="cld-related-item">
                          <div className={thumbClass}>
                            <img
                              src={resolveCmsAssetUrl(item.thumbnailUrl || item.thumbnail_url)}
                              alt={itemTitle}
                            />
                      </div>
                      <div className="cld-related-body">
                        <div className="cld-related-titlerow">
                              <span className={titleClass}>{itemTitle}</span>
                              {itemSubtitle && (
                                <span className="cld-related-itemsubtitle">{itemSubtitle}</span>
                          )}
                        </div>
                            <div
                              className={`cld-related-itemdesc${needsClamp && !expanded ? ' cld-related-itemdesc--clamped' : ''}`}
                            >
                              {descPlain}
                            </div>
                            {needsClamp && (
                              <button
                                type="button"
                                className="cld-related-readmore"
                                onClick={() =>
                                  setRelatedExpanded((prev) => ({ ...prev, [relKey]: !prev[relKey] }))
                                }
                              >
                                {expanded ? 'read less' : 'read more'}
                              </button>
                            )}
                      </div>
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

            {/* ===== Keyword Cloud Section ===== */}
            <KeywordCloud
              terms={keywords}
              className="cld-detail-body-align"
              style={{ marginTop: 24 }}
            />

            {/* ===== Glossary strip — aligned to video/related column (Figma 361:1569) ===== */}
            <div className="cld-detail-body-align cld-glossary-align">
              <GlossaryStrip rows={[GLOSSARY_TERMS_LINE_1, GLOSSARY_TERMS_LINE_2]} />
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Glossary and Notes are now inline fixed overlays — no portal needed */}
    </div>
  );
}
