'use client';

import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import Link from 'next/link';
import {
  extractYouTubeId,
  formatFilmDirector,
  getFilmDescription,
} from './filmFieldUtils';
import { glossaryTermsFromKeywords } from '@/lib/parseKeywords';
import { truncateAtWord, truncateToFitLines } from '@/lib/truncateAtWord';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
import { getRelatedDetailHref } from '@/lib/relatedDetailHref';
import {
  getRelatedCardDescription,
  getRelatedCardSubtitle,
  getRelatedCardTitle,
  relatedDescriptionNeedsClamp,
} from '@/lib/relatedCardText';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import '@/components/Songs/CLSongDetails.css';
import './CLFilms.css';
import './FilmLanguageToggle.css';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import GlossaryStrip from '@/components/shared/GlossaryStrip';
import { FILMS_DETAIL_BG } from '@/lib/pageBackgroundTiles';
import { FilmsNavCountContext } from '@/components/Films/FilmsNavCountContext';

function thumbUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.startsWith('/') ? `${AJAB_API_BASE}${raw}` : `${AJAB_API_BASE}/${raw}`;
}

function normalizeFilmBase(title: string): string {
  return title
    .replace(/^~\s*/, '')
    .replace(/\s*\([^)]+\)\s*$/i, '')
    .trim()
    .toLowerCase();
}

function extractLanguageFromTitle(title?: string): string {
  if (!title) return '';
  const match = title.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : '';
}

/** PDF header shows clean title — language lives in the HINDI | ENGLISH toggle. */
function displayFilmTitle(title: string): string {
  return title.replace(/\s*\([^)]+\)\s*$/i, '').replace(/^~\s*/, '').trim();
}

function resolveLanguageLabel(title: string, languageField?: string, fallback = 'English'): string {
  return extractLanguageFromTitle(title) || String(languageField || '').trim() || fallback;
}

/** PDF uses ENGLISH for the primary film row; CMS often labels it "Original". */
function displayLanguageLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return 'ENGLISH';
  if (trimmed.toLowerCase() === 'original') return 'ENGLISH';
  return trimmed;
}

const LANGUAGE_TAB_ORDER = ['hindi', 'english', 'original', 'kannada'];

function sortLanguageVersions(versions: LanguageVersion[]): LanguageVersion[] {
  return [...versions].sort((a, b) => {
    const rank = (lang: string) => {
      const lower = lang.toLowerCase();
      const idx = LANGUAGE_TAB_ORDER.findIndex((key) => lower.includes(key));
      return idx === -1 ? LANGUAGE_TAB_ORDER.length : idx;
    };
    return rank(a.language) - rank(b.language);
  });
}

export interface LanguageVersion {
  id: string;
  language: string;
  videoId: string;
  description: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
}

interface FilmDetail {
  id: string;
  title: string;
  subtitle: string;
  director: string;
  duration: string;
  year: string;
  languages: string;
  description: string;
  videoId: string;
  thumbnailUrl: string;
}

interface FilmEpisode {
  id: string;
  episodeNumber: number;
  title: string;
  subtitle: string;
  duration: string;
  thumbnailUrl: string;
  videoId: string;
  /** Short blurb for carousel cards (API `description`). */
  description: string;
  /** Full body for selected episode view (`about_text` / profile). */
  body: string;
}

const EPISODE_CAROUSEL_VISIBLE = 3;
const RELATED_INITIAL_COUNT = 3;
const ABOUT_MIN_LINES_CHARS = 220;
const ABOUT_CLAMP_LINES = 3;

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
    ['other', data.other || []],
    ['films', data.films || []],
  ];
  return blocks.flatMap(([bucket, items]) => items.map((item) => ({ bucket, item })));
}

function mapApiItem(it: any): FilmDetail {
  return {
    id: String(it.id || ''),
    title: it.english_transliteration || it.original_title || '',
    subtitle: it.english_translation || '',
    director: formatFilmDirector(it.director_name_english || it.director_names_english),
    duration: it.duration || '',
    year: String(it.year_of_production || it.year || ''),
    languages: it.language || '',
    description: getFilmDescription(it),
    videoId: extractYouTubeId(it.youtube_video_id),
    thumbnailUrl: thumbUrl(it.thumbnail_url),
  };
}

function mapApiEpisode(it: any, index: number): FilmEpisode {
  const parsed = Number(it?.episode_number);
  const episodeNumber = Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1;
  const cardBlurb = typeof it?.description === 'string' ? it.description.trim() : '';
  return {
    id: String(it.id || `ep-${index}`),
    episodeNumber,
    title: it.english_transliteration || it.original_title || '',
    subtitle: it.english_translation || '',
    duration: it.duration || '',
    thumbnailUrl: thumbUrl(it.thumbnail_url),
    videoId: extractYouTubeId(it.youtube_video_id),
    description: cardBlurb,
    body: getFilmDescription(it) || cardBlurb,
  };
}

/** `explore_film` returns `episodes[]` alongside `data` (sorted by CMS episode_number). */
function mapApiEpisodes(raw: unknown): FilmEpisode[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it, index) => mapApiEpisode(it, index))
    .sort((a, b) => a.episodeNumber - b.episodeNumber);
}

function LoadingShell() {
  return <Loader />;
}

export default function CLFilmDetail({ id: idProp }: { id?: string }) {
  const pathname = usePathname();
  const urlId = pathname?.split('/').filter(Boolean).pop();
  const id = (urlId && urlId !== '0') ? urlId : idProp;
  const shellRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<RelatedContent>(EMPTY_RELATED);
  const [episodes, setEpisodes] = useState<FilmEpisode[]>([]);
  const [languageVersions, setLanguageVersions] = useState<LanguageVersion[]>([]);
  const [activeVideoId, setActiveVideoId] = useState('');
  const [activeLang, setActiveLang] = useState('');
  const [activeTab, setActiveTab] =
    useState<'all' | 'songs' | 'poems' | 'reflections' | 'other'>('songs');
  const [activeFilmTab, setActiveFilmTab] = useState<'film' | 'episodes'>('film');
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState(0);
  const [episodeCarouselStart, setEpisodeCarouselStart] = useState(0);
  const [relatedExpanded, setRelatedExpanded] = useState<Record<string, boolean>>({});
  const [relatedListExpanded, setRelatedListExpanded] = useState(false);
  const descClampRef = useRef<HTMLParagraphElement>(null);
  const [clippedDescription, setClippedDescription] = useState('');
  const { setFilmsNavTotal } = useContext(FilmsNavCountContext);

  useEffect(() => {
    fetch(`${AJAB_API_BASE}/Api/film_list`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (typeof json?.total === 'number' && json.total > 0) setFilmsNavTotal(json.total);
      })
      .catch(() => {});
  }, [setFilmsNavTotal]);

  useEffect(() => {
    setDescExpanded(false);
    setRelatedExpanded({});
    setRelatedListExpanded(false);
    setActiveFilmTab('film');
    setSelectedEpisodeIdx(0);
    setEpisodeCarouselStart(0);
  }, [id]);

  useEffect(() => {
    setRelatedExpanded({});
    setRelatedListExpanded(false);
  }, [activeTab]);

  useEffect(() => {
    if (!episodes.length) return;
    setSelectedEpisodeIdx(0);
    setEpisodeCarouselStart(0);
  }, [episodes]);

  useEffect(() => {
    if (!id) {
      setData(null);
      setEpisodes([]);
      setLanguageVersions([]);
      setActiveVideoId('');
      setActiveLang('');
      setLoading(false);
      return;
    }

    const fetchFilm = async () => {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(
          `${AJAB_API_BASE}/Api/explore_film?film_id=${id}`,
          { cache: 'no-store', signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        if (json?.status === false || !json?.data) throw new Error('Film not found');
        const item = json.data;
        const mapped = mapApiItem(item);
        setData(mapped);
        const apiEpisodes = mapApiEpisodes(json.episodes);

        const listRes = await fetch(`${AJAB_API_BASE}/Api/film_list?page=1&limit=400`, {
          cache: 'no-store',
        });
        if (listRes.ok) {
          const listJson = await listRes.json();
          const list = Array.isArray(listJson?.data) ? listJson.data : [];
          const base = normalizeFilmBase(mapped.title);

          /*
           * Language versions = same work, different language
           * (title suffix like "(Hindi)" or CMS language field) → HINDI | ENGLISH under video.
           * Episodes come from explore_film `episodes[]` (not film_list).
           */
          const sameBaseRows = base
            ? list.filter((f: any) => {
                const otherBase = normalizeFilmBase(f.english_transliteration || '');
                return otherBase === base && extractYouTubeId(f.youtube_video_id);
              })
            : [];

          const currentLang = resolveLanguageLabel(
            mapped.title,
            mapped.languages || item?.language,
            'Original'
          );

          const versions: LanguageVersion[] = sameBaseRows.map((f: any) => {
            const title = String(f.english_transliteration || f.original_title || '');
            const isCurrent = String(f.id) === mapped.id;
            return {
              id: String(f.id || ''),
              language: resolveLanguageLabel(
                title,
                f.language,
                isCurrent ? currentLang : 'English'
              ),
              videoId: extractYouTubeId(f.youtube_video_id),
              description: getFilmDescription(f),
              title,
              subtitle: String(f.english_translation || ''),
              thumbnailUrl: thumbUrl(f.thumbnail_url),
            };
          });

          /* Deduplicate by language label, prefer current film's row. */
          const versionsByLang = new Map<string, LanguageVersion>();
          for (const v of versions) {
            const key = v.language.toLowerCase();
            const existing = versionsByLang.get(key);
            if (!existing || v.id === mapped.id) versionsByLang.set(key, v);
          }
          const languageVersionsList = sortLanguageVersions([...versionsByLang.values()]);
          setLanguageVersions(languageVersionsList);
          setEpisodes(apiEpisodes);

          if (mapped.videoId) {
            setActiveVideoId(mapped.videoId);
            setActiveLang(currentLang);
          }
        } else {
          setEpisodes(apiEpisodes);
          setLanguageVersions([]);
        }
      } catch {
        clearTimeout(timeoutId);
        setData(null);
        setEpisodes([]);
        setLanguageVersions([]);
        setActiveVideoId('');
        setActiveLang('');
      } finally {
        setLoading(false);
      }
    };

    fetchFilm();
  }, [id]);

  useEffect(() => {
    if (!id) {
      setRelated(EMPTY_RELATED);
      return;
    }
    let cancelled = false;
    fetchRelatedByParam('film_id', id).then((result) => {
      if (cancelled) return;
      setRelated(result || EMPTY_RELATED);
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

  const visibleEntries = useMemo((): RelatedListEntry[] => {
    const d = related.data as Record<string, any[]>;
    if (activeTab === 'all') {
      return buildAllRelatedEntries(d);
    }
    if (activeTab === 'other') {
      return [
        ...(d.other || []).map((item) => ({ bucket: 'other', item })),
        ...(d.films || []).map((item) => ({ bucket: 'films', item })),
      ];
    }
    return (d[activeTab] || []).map((item) => ({ bucket: activeTab, item }));
  }, [activeTab, related]);

  const selectedEpisode = episodes[selectedEpisodeIdx] || null;
  const activeLanguageVersion =
    languageVersions.find((v) => v.language === activeLang) ||
    languageVersions.find((v) => v.id === data?.id) ||
    null;
  const activeDescription =
    activeFilmTab === 'episodes' && selectedEpisode
      ? selectedEpisode.body || selectedEpisode.description || data?.description || ''
      : activeLanguageVersion?.description || data?.description || '';
  const isLong = activeDescription.length > ABOUT_MIN_LINES_CHARS;
  useLayoutEffect(() => {
    if (!isLong || descExpanded || !activeDescription) return;

    const normalized = activeDescription.replace(/\s+/g, ' ').trim();
    const measure = () => {
      const node = descClampRef.current;
      if (!node) return;
      setClippedDescription(
        truncateToFitLines(node, normalized, ABOUT_CLAMP_LINES, '...more')
      );
    };

    setClippedDescription(truncateAtWord(normalized, ABOUT_MIN_LINES_CHARS));
    measure();

    const node = descClampRef.current;
    if (!node) return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [activeDescription, descExpanded, isLong]);

  const videoId =
    activeFilmTab === 'episodes' && selectedEpisode?.videoId
      ? selectedEpisode.videoId
      : activeVideoId || activeLanguageVersion?.videoId || data?.videoId || '';
  const languagesFromVersions = languageVersions.map((v) => v.language);
  const headerTitle = displayFilmTitle(
    activeFilmTab === 'film' && activeLanguageVersion?.title
      ? activeLanguageVersion.title
      : data?.title || ''
  );
  const headerSubtitle =
    activeFilmTab === 'film' && activeLanguageVersion?.subtitle
      ? activeLanguageVersion.subtitle
      : data?.subtitle || '';
  const hasEpisodeSeries = episodes.length > 1;
  const carouselEpisodes = episodes.slice(
    episodeCarouselStart,
    episodeCarouselStart + EPISODE_CAROUSEL_VISIBLE
  );
  const canCarouselPrev = episodeCarouselStart > 0;
  const canCarouselNext =
    episodeCarouselStart + EPISODE_CAROUSEL_VISIBLE < episodes.length;
  const displayedRelated = useMemo(() => {
    if (relatedListExpanded || visibleEntries.length <= RELATED_INITIAL_COUNT) {
      return visibleEntries;
    }
    return visibleEntries.slice(0, RELATED_INITIAL_COUNT);
  }, [visibleEntries, relatedListExpanded]);
  const hasMoreRelated = visibleEntries.length > RELATED_INITIAL_COUNT;

  const glossaryTerms = useMemo(
    () => glossaryTermsFromKeywords((related.data.keywords || []) as unknown[]),
    [related.data.keywords]
  );

  const relatedHref = (bucket: string, item: any) => getRelatedDetailHref(bucket, item);

  if (loading) return <LoadingShell />;

  if (!data) {
    return (
      <div className="cl-songs-page-root cl-songs-page-root--listing">
        <div className="cl-songs-page-shell" ref={shellRef}>
          <RepeatingPageBackground containerRef={shellRef} tile={FILMS_DETAIL_BG} />
          <Header />
          <main className="relative z-10">
            <div className="clfd-page">
              <div className="clfd-content" style={{ paddingTop: 48, textAlign: 'center' }}>
                <p>Film not found.</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const renderVideo = (title: string, posterUrl?: string) => (
    <div className="clfd-media-stage">
      <div className="clfd-video-wrap">
        {videoId ? (
          <YouTubeEmbedFrame key={videoId} videoId={videoId} title={title} />
        ) : posterUrl ? (
          <img src={posterUrl} alt={title} />
        ) : (
          <div className="clfd-video-placeholder">Video not available</div>
        )}
      </div>
    </div>
  );

  const renderDescription = () =>
    activeDescription ? (
      <div className="clfd-about-popup">
        <div className="clfd-about-text-wrap">
          <p
            ref={descClampRef}
            className={`clfd-about-text${!descExpanded && isLong ? ' clamped' : ''}`}
          >
            {!descExpanded && isLong ? clippedDescription : activeDescription}
            {!descExpanded && isLong ? ' ' : ''}
            {!descExpanded && isLong && (
              <button
                type="button"
                className="clfd-description-more"
                onClick={() => setDescExpanded(true)}
              >
                {'...more'}
              </button>
            )}
          </p>
        </div>
      </div>
    ) : null;

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={FILMS_DETAIL_BG} />
        <Header />
        <main className="relative z-10">
          <div
            className={`clfd-page${activeFilmTab === 'episodes' ? ' clfd-page--episodes' : ''}`}
          >
            {/* PDF: "Film | Episodes" is page-centred (artboard centre), not content-column centre */}
            {hasEpisodeSeries && (
              <div className="clfd-mode-row">
                <button
                  type="button"
                  className={`clfd-mode-tab${activeFilmTab === 'film' ? ' active' : ''}`}
                  onClick={() => {
                    setActiveFilmTab('film');
                    setDescExpanded(false);
                  }}
                >
                  Film
                </button>
                <span className="clfd-mode-sep">|</span>
                <button
                  type="button"
                  className={`clfd-mode-tab${activeFilmTab === 'episodes' ? ' active' : ''}`}
                  onClick={() => {
                    setActiveFilmTab('episodes');
                    setDescExpanded(false);
                  }}
                >
                  Episodes
                </button>
              </div>
            )}

            <div className="clfd-content">
              <div className="clfd-header">
                <div className="clfd-header-titlerow">
                  <span className="clfd-header-title">{headerTitle}</span>
                  {headerSubtitle && (
                    <span className="clfd-header-subtitle">{headerSubtitle}</span>
                  )}
                </div>
                {(data.director || data.year) && (
                  <div className="clfd-header-meta-row">
                    {data.director && (
                      <div className="clfd-header-byline">
                        Film by <span className="caps">{data.director}</span>
                      </div>
                    )}
                    {data.year && <div className="clfd-header-year">{data.year}</div>}
                  </div>
                )}
              </div>

              {activeFilmTab === 'film' ? (
                <>
                  {renderVideo(
                    headerTitle,
                    activeLanguageVersion?.thumbnailUrl || data.thumbnailUrl
                  )}

                  {languagesFromVersions.length > 1 && (
                    <div className="film-lang-toggle clfd-lang-toggle">
                      {languageVersions.map((version, index) => (
                        <span key={version.id} className="film-lang-toggle-item-wrap">
                          {index > 0 && <span className="film-lang-sep">|</span>}
                          <button
                            type="button"
                            className={`film-lang-btn${activeLang === version.language ? ' active' : ''}`}
                            onClick={() => {
                              setActiveVideoId(version.videoId);
                              setActiveLang(version.language);
                              setDescExpanded(false);
                            }}
                            disabled={activeLang === version.language}
                          >
                            {displayLanguageLabel(version.language)}
                          </button>
                        </span>
                      ))}
            </div>
                  )}

                  {renderDescription()}
                </>
              ) : (
                <div className="clfd-episodes-panel">
                  <div className="clfd-episode-carousel">
                    <button
                      type="button"
                      className="clfd-episode-nav clfd-episode-nav--prev"
                      aria-label="Previous episodes"
                      disabled={!canCarouselPrev}
                      onClick={() =>
                        setEpisodeCarouselStart((s) => Math.max(0, s - 1))
                      }
                    >
                      <span aria-hidden>‹</span>
                    </button>

                    <div className="clfd-episode-cards">
                      {carouselEpisodes.map((ep, i) => {
                        const absoluteIdx = episodeCarouselStart + i;
                        const isSelected = absoluteIdx === selectedEpisodeIdx;
                        return (
                          <button
                            key={ep.id}
                            type="button"
                            className={`clfd-episode-card${isSelected ? ' is-selected' : ''}`}
                            onClick={() => {
                              setSelectedEpisodeIdx(absoluteIdx);
                              setDescExpanded(false);
                            }}
                          >
                            <div className="clfd-episode-card-thumb">
                              {ep.thumbnailUrl ? (
                                <img src={ep.thumbnailUrl} alt={ep.title} />
                              ) : null}
                            </div>
                            <div className="clfd-episode-card-title">{ep.title}</div>
                            <div className="clfd-episode-card-label">
                              Episode {ep.episodeNumber}
                            </div>
                            {ep.description && (
                              <p className="clfd-episode-card-blurb">{ep.description}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      className="clfd-episode-nav clfd-episode-nav--next"
                      aria-label="Next episodes"
                      disabled={!canCarouselNext}
                      onClick={() =>
                        setEpisodeCarouselStart((s) =>
                          Math.min(s + 1, Math.max(0, episodes.length - EPISODE_CAROUSEL_VISIBLE))
                        )
                      }
                    >
                      <span aria-hidden>›</span>
                    </button>
                  </div>

                  {selectedEpisode && (
                    <>
                      <div className="clfd-episode-selected">
                        <div className="clfd-episode-selected-label">
                          EPISODE {String(selectedEpisode.episodeNumber).padStart(2, '0')}
                        </div>
                        <h2 className="clfd-episode-selected-title">
                          {selectedEpisode.title}
                        </h2>
                      </div>
                      {renderVideo(selectedEpisode.title, selectedEpisode.thumbnailUrl)}
                      {renderDescription()}
                    </>
                  )}
                </div>
              )}

              <section className="cld-related clfd-related">
                <h2 className="cld-related-title">Related</h2>
                <div className="cld-related-tabs">
                  {tabs.map((t, i) => (
                    <span
                      key={t.key}
                      className="clfd-related-tab-wrap"
                    >
                      <button
                        type="button"
                        className={`cld-related-tab${activeTab === t.key ? ' active' : ''}`}
                        onClick={() => {
                          setActiveTab(t.key);
                          setRelatedListExpanded(false);
                        }}
                      >
                        {t.label}
                        <span className="cld-related-tab-count">({t.count})</span>
                      </button>
                      {i < tabs.length - 1 && (
                        <span className="cld-related-tab-sep">|</span>
                      )}
                    </span>
                  ))}
                </div>
                <div className="cld-related-list">
                  {displayedRelated.length ? (
                    displayedRelated.map((entry, idx) => {
                      const { bucket, item } = entry;
                      const relKey = relatedEntryKey(bucket, item, idx);
                      const itemTitle = getRelatedCardTitle(item, bucket) || 'Untitled';
                      const itemSubtitle = getRelatedCardSubtitle(item);
                      const descPlain = getRelatedCardDescription(item, bucket);
                      const expanded = !!relatedExpanded[relKey];
                      const needsClamp = relatedDescriptionNeedsClamp(descPlain, bucket);
                      const href = relatedHref(bucket, item);
                      const body = (
                        <>
                          <div className="cld-related-thumb">
                            {item.thumbnailUrl && (
                              <img src={item.thumbnailUrl} alt={itemTitle} />
                            )}
                          </div>
                          <div className="cld-related-body">
                            <div className="cld-related-titlerow">
                              <span className="cld-related-itemtitle">{itemTitle}</span>
                              {itemSubtitle && (
                                <span className="cld-related-itemsubtitle">
                                  {itemSubtitle}
                                </span>
                              )}
                            </div>
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
                                    setRelatedExpanded((prev) => ({
                                      ...prev,
                                      [relKey]: !expanded,
                                    }));
                                  }}
                                >
                                  {expanded ? ' read less' : '...more'}
                                </button>
                              )}
                            </p>
                          </div>
                        </>
                      );
                      return href ? (
                        <Link
                          key={relKey}
                          href={href}
                          className="cld-related-item cld-related-item--link"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div key={relKey} className="cld-related-item">
                          {body}
                        </div>
                      );
                    })
                  ) : (
                    <div className="clfd-related-empty">No related items.</div>
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
                <div className="clfd-glossary-align">
                  <GlossaryStrip terms={glossaryTerms} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
