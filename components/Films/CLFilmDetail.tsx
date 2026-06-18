'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { useRouter, usePathname } from 'next/navigation';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
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

export interface LanguageVersion {
  id: string;
  language: string;
  videoId: string;
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
      }))
    : [{ id: mapped.id, language: 'English', videoId: mapped.videoId }];

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
  const router = useRouter();
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
  const [navCount, setNavCount] = useState(0);

  useEffect(() => {
    fetch(`${AJAB_API_BASE}/Api/film_list`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (typeof json?.total === 'number' && json.total > 0) setNavCount(json.total);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setDescExpanded(false);
  }, [id]);

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

          const siblingEpisodes = list
            .filter((f: any) => {
              const fid = String(f.id || '');
              if (fid === mapped.id) return false;
              if (seriesTitle && (f.series_title || '').trim() === seriesTitle) return true;
              return normalizeFilmBase(f.english_transliteration || '') === base;
            })
            .map(mapListItemToEpisode);

          setEpisodes(siblingEpisodes);

          const currentLang =
            extractLanguageFromTitle(mapped.title) || mapped.languages || 'Original';
          const versions: LanguageVersion[] = mapped.videoId
            ? [{ id: mapped.id, language: currentLang, videoId: mapped.videoId }]
            : [];

          if (base) {
            list.forEach((f: any) => {
              const otherBase = normalizeFilmBase(f.english_transliteration || '');
              const otherLang = extractLanguageFromTitle(f.english_transliteration || '');
              const otherVid = extractYouTubeId(f.youtube_video_id);
              if (
                otherBase === base &&
                otherLang &&
                otherVid &&
                !versions.some((v) => v.videoId === otherVid)
              ) {
                versions.push({
                  id: String(f.id),
                  language: otherLang,
                  videoId: otherVid,
                });
              }
            });
          }

          setLanguageVersions(versions);
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

  const description = data?.description || '';
  const isLong = description.length >= 320;
  const visibleDescription =
    descExpanded || !isLong ? description : description.slice(0, 320) + '...';

  const videoId = activeVideoId || data?.videoId || '';
  const languagesFromVersions = languageVersions.map((v) => v.language);

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
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={FILMS_DETAIL_BG} />
        <Header />
        <main className="relative z-10">
          <div
            className={`clfd-page${activeFilmTab === 'episodes' ? ' clfd-page--episodes' : ''}`}
            style={{ '--clf-nav-count': String(navCount) } as React.CSSProperties}
          >
            <div className="clfd-content">
              {episodes.length > 0 && (
                <div className="clfd-mode-row">
                  <button
                    type="button"
                    className={`clfd-mode-tab${activeFilmTab === 'film' ? ' active' : ''}`}
                    onClick={() => setActiveFilmTab('film')}
                  >
                    Film
                  </button>
                  <span className="clfd-mode-sep">|</span>
                  <button
                    type="button"
                    className={`clfd-mode-tab${activeFilmTab === 'episodes' ? ' active' : ''}`}
                    onClick={() => setActiveFilmTab('episodes')}
                  >
                    Episodes
                  </button>
                </div>
              )}

              <div className="clfd-header">
                <div className="clfd-header-titlerow">
                  <span className="clfd-header-title">{data.title}</span>
                  {data.subtitle && (
                    <span className="clfd-header-subtitle">{data.subtitle}</span>
                  )}
                </div>
                {data.director && (
                  <div className="clfd-header-byline">
                    Film by <span className="caps">{data.director}</span>
                  </div>
                )}
                {(data.duration || data.year) && (
                  <div className="clfd-header-meta">
                    {[data.duration, data.year].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              {/* [Claude] these changes have been recommended by claude —
                  Order fixed to match PDF: video → language pills → description.
                  WavyPaperPopup removed — PDF shows plain text, not a card popup. */}
              {activeFilmTab === 'film' ? (
                <>
                  <div className="clfd-media-stage">
                    <div className="clfd-video-wrap">
                      {videoId ? (
                        <LiteYouTubeEmbed
                          key={videoId}
                          id={videoId}
                          title={data.title}
                          poster="maxresdefault"
                          noCookie
                        />
                      ) : data.thumbnailUrl ? (
                        <img src={data.thumbnailUrl} alt={data.title} />
                      ) : (
                        <div className="clfd-video-placeholder">Video not available</div>
                      )}
                    </div>
                  </div>

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
                            }}
                            disabled={activeLang === version.language}
                          >
                            {version.language}
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {description && (
                    <div className="clfd-about-popup">
                      <p className="clfd-about-text">
                        {visibleDescription}
                        {!descExpanded && isLong && (
                          <button
                            type="button"
                            className="clfd-description-more"
                            onClick={() => setDescExpanded(true)}
                          >
                            {' '}
                            more
                          </button>
                        )}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="clfd-episodes-panel">
                  {episodes.length > 0 ? (
                    <div className="clfd-episodes-list">
                      {episodes.map((ep) => (
                        <div
                          key={ep.id}
                          className="clfd-episode-entry"
                          onClick={() => router.push(`/films/details/${ep.id}`)}
                        >
                          <div className="clfd-episode-thumb">
                            {ep.thumbnailUrl ? (
                              <img src={ep.thumbnailUrl} alt={ep.title} />
                            ) : null}
                          </div>
                          <div className="clfd-episode-body">
                            <div className="clfd-episode-title">{ep.title}</div>
                            {ep.subtitle && (
                              <div className="clfd-episode-subtitle">{ep.subtitle}</div>
                            )}
                            {ep.duration && (
                              <div className="clfd-episode-meta">{ep.duration}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="clfd-episodes-empty">No episodes available for this film.</p>
                  )}
                </div>
              )}

              <section className="cld-related clfd-related">
                <h2 className="cld-related-title">Related</h2>
                <div className="cld-related-tabs">
                  {tabs.map((t, i) => (
                    <span
                      key={t.key}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 16 }}
                    >
                      <button
                        type="button"
                        className={`cld-related-tab${activeTab === t.key ? ' active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
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
                  {visibleItems.length ? (
                    visibleItems.map((item: any) => (
                      <div key={item.id || item.title} className="cld-related-item">
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
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: 16, color: '#828282' }}>No related items.</div>
                  )}
                </div>
                <a className="cld-related-seemore">SEE MORE</a>
              </section>

              <div className="cld-glossary-align clfd-glossary-align">
                <GlossaryStrip terms={FILM_GLOSSARY} />
              </div>

            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
