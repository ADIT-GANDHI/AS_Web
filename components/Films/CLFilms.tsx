'use client';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import { FilmEntry, FilmSeries } from './CLFilmsMocks';
import FilmPopupModal, { type FilmPopupData } from './FilmPopupModal';
import { FILMS_CONSTANTS } from './constants';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLFilms.css';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { FILMS_LISTING_BG } from '@/lib/pageBackgroundTiles';
import { getFilmListingBlurb, formatFilmDirector } from './filmFieldUtils';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { extractYouTubeId } from '@/lib/youtube';
import { FilmsNavCountContext } from '@/components/Films/FilmsNavCountContext';
import {
  DEFAULT_FILM_SERIES_TITLE,
  mergeFilmListSeries,
  normalizeFilmListSeries,
  parseFilmPriority,
  type NormalizedFilmSeries,
} from '@/lib/filmListApi';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';

/** Matches CMS page size in the series-mixed film_list contract. */
const FILMS_API_PAGE_SIZE = 10;
/** PDF-length placeholder when CMS has no listing blurb. */
const FILM_LISTING_BLURB_FALLBACK =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
const SERIES_INTRO_FALLBACK =
  'Here you will find the films that have been the seed of this archive, inquiring into mystic poetry and music through the medium of documentary, travelogue and animation.';

type MappedFilm = FilmEntry & { youtubeVideoId: string; priority: number };

function thumbUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.startsWith('/') ? `${AJAB_API_BASE}${raw}` : `${AJAB_API_BASE}/${raw}`;
}

/** Listing media: YouTube poster first, then CMS thumbnail, else blank. */
function listingThumbUrl(it: Record<string, unknown>): string {
  const videoId = extractYouTubeId(
    String(it.youtube_video_id || it.film_youtube_id || '')
  );
  if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return thumbUrl(it.thumbnail_url as string | undefined);
}

function mapFilmItem(it: Record<string, unknown>): MappedFilm {
  const youtubeVideoId =
    extractYouTubeId(String(it.youtube_video_id || it.film_youtube_id || '')) || '';
  return {
    id: String(it.id || ''),
    title: String(it.english_transliteration || it.original_title || ''),
    subtitle: String(it.english_translation || ''),
    director: formatFilmDirector(it.director_name_english || it.director_names_english),
    duration: String(it.duration || ''),
    year: String(it.year_of_production || it.year || ''),
    languages: String(it.language || it.film_language || '').trim(),
    description: getFilmListingBlurb(it) || FILM_LISTING_BLURB_FALLBACK,
    thumbnailUrl: listingThumbUrl(it),
    youtubeVideoId,
    priority: parseFilmPriority(it.priority),
  };
}

function formatListingDuration(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/min/i.test(t)) return t;
  return `${t} mins`;
}

/** AI listing meta: `by NAME | duration mins, year | languages` */
function formatListingMeta(f: MappedFilm): string {
  const parts: string[] = [];
  if (f.director) parts.push(`by ${f.director.toUpperCase()}`);
  const durYear = [formatListingDuration(f.duration), f.year].filter(Boolean).join(', ');
  if (durYear) parts.push(durYear);
  if (f.languages) parts.push(f.languages);
  return parts.join(' | ');
}

function toUiSeries(normalized: NormalizedFilmSeries[]): FilmSeries[] {
  return normalized.map((s, i) => ({
    id: `s${i}-${s.title}`,
    title: s.title,
    intro: s.intro,
    films: s.films.map(mapFilmItem),
  }));
}

export default function CLFilms() {
  const shellRef = useRef<HTMLDivElement>(null);
  const { setFilmsNavTotal } = useContext(FilmsNavCountContext);
  const [rawSeries, setRawSeries] = useState<NormalizedFilmSeries[]>([]);
  const [apiTotal, setApiTotal] = useState(0);
  const [apiPage, setApiPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Temporarily unused while TRAILER | FILM & MORE is hidden.
  const [filmPopup, setFilmPopup] = useState<FilmPopupData | null>(null);
  const [filmPopupOpen, setFilmPopupOpen] = useState(false);
  const router = useRouter();

  const series = useMemo(() => toUiSeries(rawSeries), [rawSeries]);

  const fetchFilmsPage = useCallback(async (page: number, reset: boolean) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(
        `${AJAB_API_BASE}/Api/film_list?page=${page}&limit=${FILMS_API_PAGE_SIZE}`,
        { cache: 'no-store', signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!res.ok) return;

      const data = await res.json();
      const pageSeries = normalizeFilmListSeries(
        data?.data,
        SERIES_INTRO_FALLBACK,
        DEFAULT_FILM_SERIES_TITLE
      );

      setRawSeries((prev) => (reset ? pageSeries : mergeFilmListSeries(prev, pageSeries)));

      const total = parseCatalogTotal(data?.total);
      if (total != null) setApiTotal(total);

      const pages = Number(data?.total_pages);
      if (Number.isFinite(pages) && pages > 0) setTotalPages(pages);

      setApiPage(page);
    } catch {
      clearTimeout(timeoutId);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchFilmsPage(1, true);
  }, [fetchFilmsPage]);

  useEffect(() => {
    if (apiTotal > 0) setFilmsNavTotal(apiTotal);
  }, [apiTotal, setFilmsNavTotal]);

  const closeFilmPopup = useCallback(() => {
    setFilmPopupOpen(false);
  }, []);

  const openFilmTrailer = useCallback((film: MappedFilm | FilmEntry) => {
    const videoId =
      ('youtubeVideoId' in film && typeof film.youtubeVideoId === 'string'
        ? film.youtubeVideoId
        : '') || '';
    if (!videoId) return;
    setFilmPopup({
      id: film.id,
      videoId,
      title: film.title,
      thumbnailUrl: film.thumbnailUrl || '',
    });
    setFilmPopupOpen(true);
  }, []);

  const loadedFilmSlots = useMemo(
    () => series.reduce((n, s) => n + s.films.length, 0),
    [series]
  );

  const hasMore = apiPage < totalPages;

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    void fetchFilmsPage(apiPage + 1, false);
  };

  const goToDetail = (filmId: string) => {
    router.push(`/films/details/${filmId}`);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={FILMS_LISTING_BG} />
        <Header />
        <main className="relative z-10">
          <div className="clf-page cl-songs-page">
            <p className="clf-page-intro">{FILMS_CONSTANTS.FILMS_DESCRIPTION.trim()}</p>

            <div className="clf-count-row">
              <h1 className="clf-count">
                {apiTotal > 0 ? apiTotal : loadedFilmSlots} Films
              </h1>
            </div>

            {series.map((s) => (
              <section key={s.id} className="clf-series">
                <h2 className="clf-series-title">
                  <span className="clf-series-title-text">{s.title}</span>
                  <span className="clf-series-title-label">FILM SERIES</span>
                </h2>
                <p className="clf-series-intro">{s.intro}</p>

                <div className="clf-list">
                  {(s.films as MappedFilm[]).map((f) => {
                    const metaLine = formatListingMeta(f);
                    return (
                    <div key={`${s.id}-${f.id}`} className="clf-entry">
                      <button
                        type="button"
                        className="clf-entry-thumb"
                        aria-label={f.title}
                        onClick={() => goToDetail(f.id)}
                      >
                        {f.thumbnailUrl ? (
                          <img
                            src={f.thumbnailUrl}
                            alt=""
                            onError={(e) => {
                              const t = e.currentTarget;
                              t.onerror = null;
                              t.removeAttribute('src');
                              t.style.display = 'none';
                            }}
                          />
                        ) : null}
                      </button>
                      <div className="clf-entry-body">
                        <button
                          type="button"
                          className="clf-entry-titlerow"
                          onClick={() => goToDetail(f.id)}
                        >
                          <span className="clf-entry-title">{f.title}</span>
                          {f.subtitle && (
                            <span className="clf-entry-subtitle">{f.subtitle}</span>
                          )}
                        </button>
                        {metaLine && <div className="clf-entry-meta">{metaLine}</div>}
                        {f.description && (
                          <p className="clf-entry-desc">{f.description}</p>
                        )}
                        <div className="clf-entry-links">
                          <button
                            type="button"
                            className={`clf-entry-link${f.youtubeVideoId ? '' : ' clf-entry-link--muted'}`}
                            onClick={() => openFilmTrailer(f)}
                            disabled={!f.youtubeVideoId}
                          >
                            TRAILER
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {hasMore && (
              <LoadMoreButton
                onClick={handleLoadMore}
                ariaLabel="Load more films"
                disabled={loadingMore}
              />
            )}
          </div>
        </main>
      </div>

      <FilmPopupModal open={filmPopupOpen} data={filmPopup} onClose={closeFilmPopup} />
    </div>
  );
}
