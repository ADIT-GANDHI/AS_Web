'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import Link from 'next/link';
import {
  MOCK_FILM_DETAIL,
  MOCK_FILM_SERIES,
  FILM_RELATED,
  MOCK_FILM_EPISODES,
  FILM_GLOSSARY,
  type FilmEntry,
} from './CLFilmsMocks';
import {
  extractYouTubeId,
  formatFilmDirector,
  getFilmDescription,
} from './filmFieldUtils';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import {
  EMPTY_RELATED,
  fetchRelatedByParam,
  asRelatedContent,
  type RelatedContent,
} from '@/lib/mapRelatedResponse';
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
  title: string;
  subtitle: string;
  duration: string;
  thumbnailUrl: string;
  videoId: string;
  description: string;
}

const EPISODE_CAROUSEL_VISIBLE = 3;
const RELATED_INITIAL_COUNT = 3;

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

function mapMockEntry(entry: FilmEntry): FilmDetail {
  return {
    id: entry.id,
    title: entry.title,
    subtitle: entry.subtitle,
    director: entry.director,
    duration: entry.duration,
    year: entry.year,
    languages: entry.languages,
    description:
      entry.id === MOCK_FILM_DETAIL.id ? MOCK_FILM_DETAIL.description : entry.description,
    videoId: 'M7lc1UVf-VE',
    thumbnailUrl: entry.thumbnailUrl || '',
  };
}

function mockFilmById(filmId: string): FilmEntry | undefined {
  return MOCK_FILM_SERIES.flatMap((s) => s.films).find((f) => f.id === filmId);
}

function mapListItemToEpisode(it: any): FilmEpisode {
  return {
    id: String(it.id || ''),
    title: it.english_transliteration || it.original_title || '',
    subtitle: it.english_translation || '',
    duration: it.duration || '',
    thumbnailUrl: thumbUrl(it.thumbnail_url),
    videoId: extractYouTubeId(it.youtube_video_id),
    description: getFilmDescription(it),
  };
}

function buildMockDetailState(filmId: string) {
  const entry = mockFilmById(filmId) || MOCK_FILM_SERIES[0].films[0];
  const mapped = mapMockEntry(entry);
  const langs = mapped.languages
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  const languageVersions: LanguageVersion[] = langs.length
    ? langs.map((language, index) => ({
        id: `${mapped.id}-${index}`,
        language,
        videoId: mapped.videoId,
        description: mapped.description,
        title: mapped.title,
        subtitle: mapped.subtitle,
        thumbnailUrl: mapped.thumbnailUrl,
      }))
    : [
        {
          id: mapped.id,
          language: 'English',
          videoId: mapped.videoId,
          description: mapped.description,
          title: mapped.title,
          subtitle: mapped.subtitle,
          thumbnailUrl: mapped.thumbnailUrl,
        },
      ];

  return {
    data: mapped,
    episodes: filmId === 'f1' ? MOCK_FILM_EPISODES : [],
    languageVersions,
    activeVideoId: mapped.videoId,
    activeLang: langs[0] || 'English',
  };
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
  const [relatedExpanded, setRelatedExpanded] = useState(false);
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
    setRelatedExpanded(false);
    setActiveFilmTab('film');
    setSelectedEpisodeIdx(0);
    setEpisodeCarouselStart(0);
  }, [id]);

  useEffect(() => {
    if (!episodes.length || !data) return;
    const idx = episodes.findIndex((ep) => ep.id === data.id);
    const next = idx >= 0 ? idx : 0;
    setSelectedEpisodeIdx(next);
    setEpisodeCarouselStart(
      Math.max(0, Math.min(next, Math.max(0, episodes.length - EPISODE_CAROUSEL_VISIBLE)))
    );
  }, [episodes, data?.id]);

  useEffect(() => {
    if (!id) {
      setData(MOCK_FILM_DETAIL as any);
      setEpisodes(MOCK_FILM_EPISODES);
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

        const listRes = await fetch(`${AJAB_API_BASE}/Api/film_list?page=1&limit=400`, {
          cache: 'no-store',
        });
        if (listRes.ok) {
          const listJson = await listRes.json();
          const list = Array.isArray(listJson?.data) ? listJson.data : [];
          const base = normalizeFilmBase(mapped.title);
          const seriesTitle = (item?.series_title || '').trim();

          /*
           * PDF page 3: language versions = same work, different language
           *   (title suffix like "(Hindi)" or CMS language field) → HINDI | ENGLISH under video.
           * PDF page 4: episodes = films sharing a non-empty series_title (carousel).
           * Do NOT treat language variants as episodes (film 36/32 case).
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
          const languageVersionsList = [...versionsByLang.values()];
          setLanguageVersions(languageVersionsList);

          /* Episodes only from explicit series_title — not from same-title language variants. */
          const seriesRows = seriesTitle
            ? list.filter((f: any) => (f.series_title || '').trim() === seriesTitle)
            : [];
          const seriesEpisodes = seriesRows.map(mapListItemToEpisode);
          const distinctEpisodeBases = new Set(
            seriesEpisodes.map((ep) => normalizeFilmBase(ep.title))
          );
          setEpisodes(
            seriesEpisodes.length > 1 && distinctEpisodeBases.size > 1
              ? seriesEpisodes
              : []
          );

          if (mapped.videoId) {
            setActiveVideoId(mapped.videoId);
            setActiveLang(currentLang);
          }
        } else {
          setEpisodes([]);
        }
      } catch {
        clearTimeout(timeoutId);
        if (mockFilmById(String(id))) {
          const mock = buildMockDetailState(String(id));
          setData(mock.data);
          setEpisodes(mock.episodes);
          setLanguageVersions(mock.languageVersions);
          setActiveVideoId(mock.activeVideoId);
          setActiveLang(mock.activeLang);
        } else {
          setData(null);
          setEpisodes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFilm();
  }, [id]);

  useEffect(() => {
    if (!id) {
      setRelated(asRelatedContent(FILM_RELATED));
      return;
    }
    let cancelled = false;
    fetchRelatedByParam('film_id', id).then((result) => {
      if (cancelled) return;
      setRelated(result || asRelatedContent(FILM_RELATED));
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

  const visibleItems = useMemo(() => {
    const d = related.data as any;
    if (activeTab === 'all') {
      return [
        ...(d.songs || []),
        ...(d.poems || []),
        ...(d.reflections || []),
        ...(d.other || []),
      ];
    }
    return d[activeTab] || [];
  }, [activeTab, related]);

  const selectedEpisode = episodes[selectedEpisodeIdx] || null;
  const activeLanguageVersion =
    languageVersions.find((v) => v.language === activeLang) ||
    languageVersions.find((v) => v.id === data?.id) ||
    null;
  const activeDescription =
    activeFilmTab === 'episodes' && selectedEpisode
      ? selectedEpisode.description || data?.description || ''
      : activeLanguageVersion?.description || data?.description || '';
  const isLong = activeDescription.length >= 320;
  const visibleDescription =
    descExpanded || !isLong ? activeDescription : activeDescription.slice(0, 320) + '...';

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
  const displayedRelated = relatedExpanded
    ? visibleItems
    : visibleItems.slice(0, RELATED_INITIAL_COUNT);
  const hasMoreRelated = visibleItems.length > RELATED_INITIAL_COUNT;

  const relatedHref = (item: any): string | null => {
    const itemId = String(item.id || '').trim();
    if (!itemId) return null;
    const type = String(item.type || item.content_type || '').toLowerCase();
    if (type.includes('song') || activeTab === 'songs') return `/songs/details/${itemId}`;
    if (type.includes('poem') || activeTab === 'poems') return `/poems/${itemId}`;
    if (type.includes('reflection') || activeTab === 'reflections')
      return `/reflections/details/${itemId}`;
    if (type.includes('film')) return `/films/details/${itemId}`;
    if (type.includes('people') || type.includes('person')) return `/people/${itemId}`;
    if (activeTab === 'all') {
      if (item.song_title || item.Songtitle_transliteration) return `/songs/details/${itemId}`;
    }
    return null;
  };

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
        <p className="clfd-about-text">
          {visibleDescription}
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
                {data.director && (
                  <div className="clfd-header-byline">
                    Film by <span className="caps">{data.director}</span>
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
                            {version.language}
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
                              Episode {absoluteIdx + 1}
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
                          EPISODE {String(selectedEpisodeIdx + 1).padStart(2, '0')}
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
                          setRelatedExpanded(false);
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
                    displayedRelated.map((item: any) => {
                      const href = relatedHref(item);
                      const body = (
                        <>
                          <div className="cld-related-thumb">
                            {item.thumbnailUrl && (
                              <img src={item.thumbnailUrl} alt={item.title} />
                            )}
                          </div>
                          <div className="cld-related-body">
                            <div className="cld-related-titlerow">
                              <span className="cld-related-itemtitle">{item.title}</span>
                              {item.subtitle && (
                                <span className="cld-related-itemsubtitle">
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                            <div className="cld-related-itemdesc">{item.about}</div>
                          </div>
                        </>
                      );
                      return href ? (
                        <Link
                          key={item.id || item.title}
                          href={href}
                          className="cld-related-item cld-related-item--link"
                        >
                          {body}
                        </Link>
                      ) : (
                        <div key={item.id || item.title} className="cld-related-item">
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
                    onClick={() => setRelatedExpanded((v) => !v)}
                  >
                    {relatedExpanded ? 'SEE LESS' : 'SEE MORE'}
                  </button>
                )}
              </section>

              <div className="clfd-glossary-align">
                <GlossaryStrip terms={FILM_GLOSSARY} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
