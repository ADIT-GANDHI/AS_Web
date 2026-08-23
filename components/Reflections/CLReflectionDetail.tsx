'use client';

// [Claude] Reflection detail page — fetches live data from Api/explore_reflection
// and renders the title/saysBy header, YouTube embed, description and related section.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useContext } from 'react';
import { usePathname } from 'next/navigation';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import Link from 'next/link';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import { CLGlossaryPopup } from '@/components/Poems/CLPoemPopups';
import ExploreSection from '@/components/shared/ExploreSection';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { REFLECTIONS_DETAIL_BG } from '@/lib/pageBackgroundTiles';
import {
  MOCK_REFLECTION_DETAIL,
  REFLECTIONS_RELATED,
} from './CLReflectionMocks';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import {
  truncateAtWord,
  truncateToFitLinesLive,
  moreButtonOnOwnLine,
  textExceedsLines,
} from '@/lib/truncateAtWord';
import { getSpeakerNameMap } from '@/lib/speakerNames';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { ReflectionsNavCountContext } from '@/components/Reflections/ReflectionsNavCountContext';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Songs/CLSongDetails.css';
import './CLReflections.css';

/** PDF/AI: collapsed about is max 3 lines; "...more" must end line 3 (not wrap alone). */
const DESCRIPTION_CLAMP_LINES = 3;
/** Char gate before live line measurement (about is usually much longer). */
const DESCRIPTION_MIN_CHARS = 160;

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
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** First non-empty CMS about-style field (HTML preserved for expand). */
function pickAboutHtml(it: any): string {
  for (const field of [
    it?.about,
    it?.interview_about,
    it?.visual_story_desc,
    it?.essay_content,
    it?.reflection_excerpt,
    it?.meta_description,
  ]) {
    if (typeof field === 'string' && field.trim()) return field.trim();
  }
  return '';
}

interface ReflectionDetail {
  id: string;
  title: string;
  saysBy: string;
  location: string;
  year: string;
  videoId: string;
  /** Plain text for 3-line clamp */
  description: string;
  /** Raw CMS HTML for expanded about */
  aboutHtml: string;
  format: string;
}

// saysBy resolves speaker_id via person_list (person_name_english on this payload
// is the attributed poet, not the speaker — PDF shows the real speaker name).
function mapApiItem(it: any, speakerNames: Record<string, string>): ReflectionDetail {
  const aboutHtml = pickAboutHtml(it);
  return {
    id: String(it.id || ''),
    title: it.meta_title || it.title || '',
    saysBy: speakerNames[String(it.speaker_id || '').trim()] || '',
    location: it.interview_place || '',
    year: it.interview_year || '',
    videoId: it.youtube_video_id || it.interview_video || '',
    description: htmlToPlainText(aboutHtml),
    aboutHtml,
    format: (it.format || 'Interview'),
  };
}

function ReflectionDescription({ text, html }: { text: string; html: string }) {
  const [expanded, setExpanded] = useState(false);
  const clampRef = useRef<HTMLParagraphElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const normalized = useMemo(() => text.replace(/\s+/g, ' ').trim(), [text]);
  const maybeLong = normalized.length > DESCRIPTION_MIN_CHARS;
  const [needsClamp, setNeedsClamp] = useState(maybeLong);
  const [clipped, setClipped] = useState(() =>
    maybeLong ? truncateAtWord(normalized, DESCRIPTION_MIN_CHARS) : normalized
  );

  useLayoutEffect(() => {
    setExpanded(false);
  }, [normalized]);

  // Decide clamp from real line count (not char guess alone).
  useLayoutEffect(() => {
    if (expanded || !normalized) {
      setNeedsClamp(false);
      return;
    }
    const node = measureRef.current || clampRef.current;
    if (!node || !node.getBoundingClientRect().width) {
      setNeedsClamp(maybeLong);
      return;
    }
    setNeedsClamp(textExceedsLines(node, normalized, DESCRIPTION_CLAMP_LINES));
  }, [normalized, expanded, maybeLong]);

  useLayoutEffect(() => {
    if (expanded || !needsClamp || !normalized) return;

    let cancelled = false;
    const timers: number[] = [];

    const measure = () => {
      const node = clampRef.current;
      if (!node || cancelled || !node.querySelector('button')) return;
      if (!node.getBoundingClientRect().width) return;
      const next = truncateToFitLinesLive(node, normalized, DESCRIPTION_CLAMP_LINES);
      setClipped((prev) => (prev === next ? prev : next));
    };

    const measureSoon = () => {
      measure();
      requestAnimationFrame(() => {
        measure();
        requestAnimationFrame(() => {
          measure();
          const live = clampRef.current;
          if (live && moreButtonOnOwnLine(live)) measure();
        });
      });
    };

    measureSoon();

    void (async () => {
      try {
        if (typeof document !== 'undefined' && document.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      measureSoon();
      [50, 150, 400].forEach((ms) => {
        timers.push(window.setTimeout(measure, ms));
      });
    })();

    const node = clampRef.current;
    const observer = new ResizeObserver(measure);
    if (node) observer.observe(node);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
      observer.disconnect();
    };
  }, [normalized, expanded, needsClamp]);

  if (!normalized) return null;

  if (expanded) {
    return (
      <div className="clrd-description">
        {html.trim() ? (
          <div className="clrd-description-body is-expanded">
            <div dangerouslySetInnerHTML={{ __html: html }} />
            {' '}
            <button
              type="button"
              className="clrd-description-more"
              onClick={() => setExpanded(false)}
            >
              ...less
            </button>
          </div>
        ) : (
          <p className="clrd-description-body is-expanded">
            {normalized}{' '}
            <button
              type="button"
              className="clrd-description-more"
              onClick={() => setExpanded(false)}
            >
              ...less
            </button>
          </p>
        )}
      </div>
    );
  }

  if (!needsClamp) {
    return (
      <div className="clrd-description">
        <p ref={measureRef} className="clrd-description-body">
          {normalized}
        </p>
      </div>
    );
  }

  return (
    <div className="clrd-description">
      <p ref={clampRef} className="clrd-description-body clrd-description-body--clamped">
        {clipped}{' '}
        <button type="button" className="clrd-description-more" onClick={() => setExpanded(true)}>
          ...more
        </button>
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
  const [showGlossary, setShowGlossary] = useState(false);

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
  const aboutHtml = data.aboutHtml || '';
  const speakerName = (data.saysBy || '').trim();
  const speakerHref = speakerName ? `/searche?search=${encodeURIComponent(speakerName)}` : '';

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
                  {speakerName && (
                    <span className="clrd-header-credits">
                      <span className="clrd-header-verb">
                        {data.format === 'Essay' ? 'by' : 'says'}
                      </span>
                      <Link href={speakerHref} className="clrd-header-speaker clrd-header-speaker-link">
                        {speakerName}
                      </Link>
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

            {/* About — API `about` field, 3-line clamp + "...more" at end of line 3 */}
            <ReflectionDescription text={description} html={aboutHtml} />

            {/* Explore — Poems-style (shared clp-related skin) */}
            {/* OLD: default explore styling
            <ExploreSection data={related.data} className="cld-related" />
            */}
            <ExploreSection
              data={related.data}
              className="clp-related"
              initialCount={3}
              seeMoreStep={3}
              descriptionLines={3}
            />
            </div>
          </div>
        </main>
        <CLGlossaryPopup isOpen={showGlossary} onClose={() => setShowGlossary(false)} />
      </div>
    </div>
  );
}
