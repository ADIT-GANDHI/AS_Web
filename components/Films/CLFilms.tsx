'use client';

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import LoadMoreButton from '@/components/shared/LoadMoreButton';
import { FilmEntry, FilmSeries } from './CLFilmsMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLFilms.css';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { FILMS_LISTING_BG } from '@/lib/pageBackgroundTiles';
import { getFilmListingBlurb, formatFilmDirector } from './filmFieldUtils';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { FilmsNavCountContext } from '@/components/Films/FilmsNavCountContext';
import { catalogHasMore, mergeCatalogById } from '@/lib/catalogPagination';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';

const FILMS_API_PAGE_SIZE = 10;
const FILMS_VISIBLE_STEP = 10;
const SERIES_ORDER = ['Journeys with Kabir', 'Ajab Mulakatein'];

type FilmRow = { entry: FilmEntry; raw: Record<string, unknown> };

function thumbUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.startsWith('/') ? `${AJAB_API_BASE}${raw}` : `${AJAB_API_BASE}/${raw}`;
}

function mapFilmItem(it: Record<string, unknown>): FilmEntry {
  return {
    id: String(it.id || ''),
    title: String(it.english_transliteration || it.original_title || ''),
    subtitle: String(it.english_translation || ''),
    director: formatFilmDirector(it.director_name_english || it.director_names_english),
    duration: String(it.duration || ''),
    year: String(it.year_of_production || it.year || ''),
    languages: String(it.language || ''),
    description: getFilmListingBlurb(it),
    thumbnailUrl: thumbUrl(it.thumbnail_url as string | undefined),
  };
}

function mergeFilmRows(prev: FilmRow[], next: FilmRow[]): FilmRow[] {
  const merged = mergeCatalogById(
    prev.map((r) => r.entry),
    next.map((r) => r.entry)
  );
  const rawById = new Map<string, Record<string, unknown>>();
  for (const row of [...prev, ...next]) {
    if (row.entry.id) rawById.set(row.entry.id, row.raw);
  }
  return merged.map((entry) => ({
    entry,
    raw: rawById.get(entry.id) || {},
  }));
}

function buildSeries(rows: FilmRow[]): FilmSeries[] {
  const seriesMap = new Map<string, { films: FilmEntry[]; intro: string }>();
  rows.forEach(({ entry, raw }) => {
    const key = (String(raw.series_title || '').trim() || 'Journeys with Kabir');
    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        films: [],
        intro:
          (String(raw.series_description || '').trim()) ||
          'The Kabir Project consists of many journeys inspired by Bhakti, Sufi, and Baul poems and songs.',
      });
    }
    seriesMap.get(key)!.films.push(entry);
  });

  const list: FilmSeries[] = Array.from(seriesMap.entries()).map(([title, bucket], i) => ({
    id: `s${i}`,
    title,
    intro: bucket.intro,
    films: bucket.films,
  }));

  list.sort((a, b) => {
    const ai = SERIES_ORDER.indexOf(a.title);
    const bi = SERIES_ORDER.indexOf(b.title);
    return (ai === -1 ? SERIES_ORDER.length : ai) - (bi === -1 ? SERIES_ORDER.length : bi);
  });

  return list;
}

export default function CLFilms() {
  const shellRef = useRef<HTMLDivElement>(null);
  const { setFilmsNavTotal } = useContext(FilmsNavCountContext);
  const [rows, setRows] = useState<FilmRow[]>([]);
  const [totalFilms, setTotalFilms] = useState(0);
  const [visibleCount, setVisibleCount] = useState(FILMS_VISIBLE_STEP);
  const [apiPage, setApiPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

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
      if (Array.isArray(data?.data) && data.data.length) {
        const nextRows: FilmRow[] = data.data.map((it: Record<string, unknown>) => ({
          entry: mapFilmItem(it),
          raw: it,
        }));
        setRows((prev) => (reset ? nextRows : mergeFilmRows(prev, nextRows)));
      }

      const apiTotal = parseCatalogTotal(data.total);
      if (apiTotal != null) setTotalFilms(apiTotal);
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
    if (totalFilms > 0) setFilmsNavTotal(totalFilms);
  }, [totalFilms, setFilmsNavTotal]);

  const displayedRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);
  const visibleSeries = useMemo(() => buildSeries(displayedRows), [displayedRows]);

  const hasMore = catalogHasMore(rows.length, visibleCount, rows.length, totalFilms);

  const handleLoadMore = () => {
    if (loadingMore) return;

    if (visibleCount < rows.length) {
      setVisibleCount((prev) => prev + FILMS_VISIBLE_STEP);
      return;
    }

    if (totalFilms > 0 && rows.length < totalFilms) {
      void fetchFilmsPage(apiPage + 1, false).then(() => {
        setVisibleCount((prev) => prev + FILMS_VISIBLE_STEP);
      });
    }
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
            <div className="clf-count-row">
              <h1 className="clf-count">{totalFilms > 0 ? totalFilms : rows.length} Films</h1>
            </div>

            {visibleSeries.map((s) => (
              <section key={s.id} className="clf-series">
                <h2 className="clf-series-title">{s.title}</h2>
                <p className="clf-series-intro">{s.intro}</p>

                <div className="clf-list">
                  {s.films.map((f) => (
                    <div
                      key={f.id}
                      className="clf-entry"
                      onClick={() => router.push(`/films/details/${f.id}`)}
                    >
                      <div className="clf-entry-thumb">
                        {f.thumbnailUrl && (
                          <img
                            src={f.thumbnailUrl}
                            alt={f.title}
                            onError={(e) => {
                              const t = e.currentTarget;
                              t.onerror = null;
                              t.style.objectFit = 'contain';
                              t.style.background = '#f0ece5';
                              t.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='158' viewBox='0 0 280 158'%3E%3Crect width='280' height='158' fill='%23f0ece5'/%3E%3Ccircle cx='140' cy='74' r='22' fill='none' stroke='%23E31E79' stroke-width='1.5' opacity='0.5'/%3E%3Cpath d='M132 74 L132 65 L150 74 L132 83 Z' fill='%23E31E79' opacity='0.5'/%3E%3C/svg%3E";
                            }}
                          />
                        )}
                      </div>
                      <div className="clf-entry-body">
                        <div className="clf-entry-titlerow">
                          <span className="clf-entry-title">{f.title}</span>
                          {f.subtitle && (
                            <span className="clf-entry-subtitle">{f.subtitle}</span>
                          )}
                        </div>
                        {f.director && (
                          <div className="clf-entry-director">
                            <span className="clf-entry-director-label">by </span>
                            <span className="clf-entry-director-name">{f.director}</span>
                          </div>
                        )}
                        {(f.duration || f.year || f.languages) && (
                          <div className="clf-entry-meta">
                            {[f.duration, f.year, f.languages ? `available in ${f.languages}` : '']
                              .filter(Boolean)
                              .join(', ')}
                          </div>
                        )}
                        {f.description && (
                          <p className="clf-entry-desc">{f.description}</p>
                        )}
                        <div className="clf-entry-links">
                          <span className="clf-entry-link clf-entry-link--muted">TRAILER</span>
                          <span className="clf-entry-link-sep">|</span>
                          <span className="clf-entry-link">FILM &amp; MORE</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
