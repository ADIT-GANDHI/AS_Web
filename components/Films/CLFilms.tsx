'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import { MOCK_FILM_SERIES, FilmEntry, FilmSeries, TOTAL_FILMS } from './CLFilmsMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLFilms.css';
import RepeatingPageBackground from '@/components/shared/RepeatingPageBackground';
import { FILMS_LISTING_BG } from '@/lib/pageBackgroundTiles';
import { getFilmListingBlurb, formatFilmDirector } from './filmFieldUtils';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

// [Claude] Normalize thumbnail URL — API returns either /images/... or uploads/...
function thumbUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.startsWith('/') ? `${AJAB_API_BASE}${raw}` : `${AJAB_API_BASE}/${raw}`;
}

// [Claude] Map flat film_list item to FilmEntry
function mapFilmItem(it: any): FilmEntry {
  return {
    id: String(it.id || ''),
    title: it.english_transliteration || it.original_title || '',
    subtitle: it.english_translation || '',
    director: formatFilmDirector(it.director_name_english || it.director_names_english),
    duration: it.duration || '',
    year: String(it.year_of_production || it.year || ''),
    languages: it.language || '',
    description: getFilmListingBlurb(it),
    thumbnailUrl: thumbUrl(it.thumbnail_url),
  };
}

export default function CLFilms() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [series, setSeries] = useState<FilmSeries[]>([]);
  const [totalFilms, setTotalFilms] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // [Claude] fetch film_list — API returns films without series grouping, so we
  // keep the mock series structure but replace the film entries with live data
  useEffect(() => {
    const fetchFilms = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/film_list`, { 
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data?.data) && data.data.length) {
          const films: FilmEntry[] = data.data.map(mapFilmItem);
          if (typeof data.total === 'number' && data.total > 0) setTotalFilms(data.total);
          // Group by series_title — fall back to a single "Journeys with Kabir" bucket
          const seriesMap = new Map<string, { films: FilmEntry[]; intro: string }>();
          films.forEach((f, idx) => {
            const rawItem = data.data[idx];
            const key = (rawItem?.series_title || '').trim() || 'Journeys with Kabir';
            if (!seriesMap.has(key)) {
              seriesMap.set(key, {
                films: [],
                intro:
                  (rawItem?.series_description || '').trim() ||
                  'The Kabir Project consists of many journeys inspired by Bhakti, Sufi, and Baul poems and songs.',
              });
            }
            seriesMap.get(key)!.films.push(f);
          });
          const liveSeriesList: FilmSeries[] = Array.from(seriesMap.entries()).map(
            ([title, bucket], i) => ({
              id: `s${i}`,
              title,
              intro: bucket.intro,
              films: bucket.films,
            })
          );
          /* [Claude] these changes have been recommended by claude —
             PDF page 1 order: "Journeys with Kabir" section first, then
             "Ajab Mulakatein". API insertion order had them reversed. */
          const SERIES_ORDER = ['Journeys with Kabir', 'Ajab Mulakatein'];
          liveSeriesList.sort((a, b) => {
            const ai = SERIES_ORDER.indexOf(a.title);
            const bi = SERIES_ORDER.indexOf(b.title);
            return (ai === -1 ? SERIES_ORDER.length : ai) - (bi === -1 ? SERIES_ORDER.length : bi);
          });
          if (liveSeriesList.length) setSeries(liveSeriesList);
        }
      } catch {
        clearTimeout(timeoutId);
        setSeries(MOCK_FILM_SERIES);
        setTotalFilms(TOTAL_FILMS);
      } finally {
        setLoading(false);
      }
    };
    fetchFilms();
  }, []);

  // [Claude] these changes have been recommended by claude — hoist count to :root so Header can see it
  useEffect(() => {
    if (totalFilms > 0) document.documentElement.style.setProperty('--clf-nav-count', String(totalFilms));
    return () => { document.documentElement.style.removeProperty('--clf-nav-count'); };
  }, [totalFilms]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="cl-songs-page-root cl-songs-page-root--listing">
      <div className="cl-songs-page-shell" ref={shellRef}>
        <RepeatingPageBackground containerRef={shellRef} tile={FILMS_LISTING_BG} />
        <Header />
        <main className="relative z-10">
          <div
            className="clf-page cl-songs-page"
            style={{ '--clf-nav-count': String(totalFilms) } as React.CSSProperties}
          >
            <div className="clf-count-row">
              <h1 className="clf-count">{totalFilms} Films</h1>
            </div>

            {/* Series sections */}
            {series.map((s) => (
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
                          /* [Claude] these changes have been recommended by claude —
                             some CMS thumbnail URLs 404; swap broken images for a
                             quiet cream placeholder instead of the broken-image icon */
                          <img
                            src={f.thumbnailUrl}
                            alt={f.title}
                            onError={(e) => {
                              const t = e.currentTarget;
                              t.onerror = null;
                              t.style.objectFit = 'contain';
                              t.style.background = '#f0ece5';
                              t.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='158' viewBox='0 0 280 158'%3E%3Crect width='280' height='158' fill='%23f0ece5'/%3E%3Ccircle cx='140' cy='74' r='22' fill='none' stroke='%23E31E79' stroke-width='1.5' opacity='0.5'/%3E%3Cpath d='M132 74 L132 65 L150 74 L132 83 Z' fill='%23E31E79' opacity='0.5'/%3E%3C/svg%3E";
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
          </div>
        </main>
      </div>
    </div>
  );
}
