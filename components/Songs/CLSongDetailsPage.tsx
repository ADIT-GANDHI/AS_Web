'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import { CLGlossaryPopup } from '../Poems/CLPoemPopups';
import ExploreSection from '@/components/shared/ExploreSection';
import WavyCard from '@/components/shared/WavyCard';
import WavyPaperPopup from '@/components/shared/WavyPaperPopup';
import './CLSongs.css'; // for the root marble bg + floating button overrides
import './CLSongDetails.css';
import SongDetailBackground from '@/components/Songs/SongDetailBackground';
import { truncateAtWord, truncateToFitLines } from '@/lib/truncateAtWord';
import { resolveCmsAssetUrl, withAppBasePath } from '@/lib/resolveCmsAssetUrl';

type Script = 'devanagari' | 'transliteration' | 'english';

function firstExploreSongsText(data: Record<string, unknown> | undefined, keys: string[]): string {
  if (!data) return '';
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    const text = getText(value);
    if (text.trim()) return text.trim();
  }
  return '';
}

function exploreSongsPanelText(
  data: Record<string, unknown> | undefined,
  keys: string[]
): string {
  const raw = firstExploreSongsText(data, keys);
  return raw ? htmlToPlainText(raw) : '';
}

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

const SONG_ABOUT_LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

/** Preserve CMS HTML for about / song_description; lorem when both are empty. */
function getAboutHtml(data: any): string {
  for (const field of [data?.about, data?.song_description]) {
    if (typeof field === 'string' && field.trim()) return field.trim();
    const t = getText(field);
    if (t.trim()) return t.trim();
  }
  return SONG_ABOUT_LOREM;
}

/** PDF/Figma: 3 lines when collapsed; "...more" inline right after the last word. */
const ABOUT_MIN_LINES_CHARS = 220;
const ABOUT_CLAMP_LINES = 3;
/** PDF: side chevrons only when the carousel can actually scroll (4+ cards). */
const VERSIONS_NAV_MIN = 4;

function SongAboutClamp({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const plain = useMemo(() => htmlToPlainText(html).replace(/\s+/g, ' ').trim(), [html]);
  const clampRef = useRef<HTMLParagraphElement>(null);
  const [clipped, setClipped] = useState(() => truncateAtWord(plain, ABOUT_MIN_LINES_CHARS));

  const isLong = plain.length > ABOUT_MIN_LINES_CHARS;

  useLayoutEffect(() => {
    if (expanded || !isLong) return;

    const measure = () => {
      const node = clampRef.current;
      if (!node) return;
      setClipped(truncateToFitLines(node, plain, ABOUT_CLAMP_LINES, '...more'));
    };

    measure();
    const node = clampRef.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [plain, expanded, isLong]);

  if (!html.trim()) return null;

  if (expanded) {
    return (
      <div className="cld-description">
        <div className="cld-description-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }

  if (!isLong) {
    return (
      <div className="cld-description">
        <p className="cld-description-body">{plain}</p>
      </div>
    );
  }

  return (
    <div className="cld-description">
      <p ref={clampRef} className="cld-description-body cld-description-body--clamped">
        {clipped}
        {' '}
        <button
          type="button"
          className="cld-description-more"
          onClick={() => setExpanded(true)}
        >
          ...more
        </button>
      </p>
    </div>
  );
}

/** Strip blank CMS paragraphs and convert them into stanza-break markers. */
function cleanLyricsHtml(html: string): string {
  if (!html) return html;
  return html
    // blank <p> = only whitespace / &nbsp; / <br> variants → stanza break marker
    .replace(/<p[^>]*>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '<div class="cld-lyric-sep"></div>')
    // collapse consecutive separators into one
    .replace(/(<div class="cld-lyric-sep"><\/div>\s*){2,}/gi, '<div class="cld-lyric-sep"></div>');
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

type CLSongDetailsPageProps = {
  data: any;
  songVersions?: any[];
  related?: any;
};

export default function CLSongDetailsPage({
  data,
  songVersions = [],
  related = null,
}: CLSongDetailsPageProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [script, setScript] = useState<Script>('transliteration');
  const [showNotes, setShowNotes] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

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
  const notesText = exploreSongsPanelText(data, ['notes']);
  const glossaryText = exploreSongsPanelText(data, [
    'glossary',
    'songglossary',
    'song_glossary',
    'songGlossary',
  ]);
  const hasNotes = notesText.trim().length > 0;
  const hasGlossary = glossaryText.trim().length > 0;
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

  const showVersionsNav = versionCards.length >= VERSIONS_NAV_MIN;

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

  const relatedData =
    (related?.data as Record<string, unknown> | undefined) ||
    (related as Record<string, unknown> | null) ||
    {};

  const pageShellRef = useRef<HTMLDivElement>(null);

  return (
    <div className="cl-songs-page-root">
      <SongDetailBackground containerRef={pageShellRef} />
      <div ref={pageShellRef} className="min-h-screen">
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
                {/* Always render nav buttons so first card edge aligns with video below.
                    Hide them visually until 4+ versions (carousel actually scrolls). */}
                <button
                  type="button"
                  className="cld-slider-nav"
                  onClick={() => scrollVersions('left')}
                  aria-label="Previous song version"
                  style={{ visibility: showVersionsNav ? 'visible' : 'hidden' }}
                >
                  <ChevronLeft size={36} strokeWidth={2.8} />
                </button>
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
                <button
                  type="button"
                  className="cld-slider-nav"
                  onClick={() => scrollVersions('right')}
                  aria-label="Next song version"
                  style={{ visibility: showVersionsNav ? 'visible' : 'hidden' }}
                >
                  <ChevronRight size={36} strokeWidth={2.8} />
                </button>
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
                <YouTubeEmbedFrame videoId={videoId} title={title} />
              ) : (
                <div className="cld-video-placeholder">Video unavailable (API offline)</div>
              )}
            </div>

              {/* ===== Description — Figma 361:1473 ===== */}
              <SongAboutClamp html={aboutHtml} />
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

            {/* ===== Lyrics column: title + poem + notes/glossary (PDF) ===== */}
            <div className="cld-lyrics-notes-wrap">
            <div className="cld-lyrics-stage">
              <div className="cld-song-title-block">
                <h1 className="cld-song-title">{title}</h1>
                {poet && (
                  <div>
                    <span className="cld-song-poet-label cld-song-poet">poet </span>
                    <span className="cld-song-poet">{poet}</span>
                  </div>
                )}
              </div>

              <WavyPaperPopup
                variant="inline"
                isOpen={showNotes && hasNotes}
                onClose={() => setShowNotes(false)}
                title="Song Notes"
                className="cld-notes-panel"
              >
                {notesText}
              </WavyPaperPopup>

              <WavyPaperPopup
                variant="inline"
                isOpen={showGlossary && hasGlossary}
                onClose={() => setShowGlossary(false)}
                title="Glossary"
                className="cld-glossary-panel"
              >
                {glossaryText}
              </WavyPaperPopup>

              {lyricsHtml ? (
                <div
                  className="cld-lyrics cld-lyrics--html"
                  dangerouslySetInnerHTML={{ __html: cleanLyricsHtml(lyricsHtml) }}
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
            </div>

            {/* ===== NOTES | GLOSSARY links ===== */}
            {(hasNotes || hasGlossary) && (
            <div className="cld-notes-glossary-row">
              {hasNotes && (
              <button
                type="button"
                className={`cld-notes-link${showNotes ? ' is-active' : ''}`}
                onClick={() => {
                  setShowGlossary(false);
                  setShowNotes((v) => !v);
                }}
              >
                NOTES
              </button>
              )}
              {hasNotes && hasGlossary && (
              <span className="cld-notes-glossary-sep">|</span>
              )}
              {hasGlossary && (
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
              )}
            </div>
            )}
            </div>

            {/* ===== Explore section — theme strip + mixed list ===== */}
            <div className="cld-detail-body-align">
              <ExploreSection data={relatedData} className="cld-related" />
            </div>
          </div>
        </main>
      </div>

      {/* Glossary and Notes are now inline fixed overlays — no portal needed */}
    </div>
  );
}
