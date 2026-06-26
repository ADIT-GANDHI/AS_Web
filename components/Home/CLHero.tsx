'use client';

import { useEffect, useRef, useState } from 'react';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import ContentSliderModal, { NewsPopupSlide } from '@/components/CLContentSliderModal';
import type {
  HomeFilmCard,
  HomePeopleCard,
  HomePoemCard,
  HomeReflectionCard,
  HomeSongCard,
} from '@/lib/homeApiMapper';
import {
  MOCK_HOME_FILM,
  MOCK_HOME_PEOPLE,
  MOCK_HOME_POEM,
  MOCK_HOME_REFLECTION,
  MOCK_HOME_SONG,
} from './CLHomeMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLHome.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { mapNewsToHomePopupSlides } from '@/lib/mapNewsPopupSlides';
import { mapHomeLatest } from '@/lib/homeApiMapper';
import { isHomeApiOnlyMode } from '@/lib/homePageConfig';
import {
  shouldAutoOpenAjabNewsPopup,
  snoozeAjabNewsPopup,
} from '@/lib/ajabNewsPopup';
import HomeCardImage from './HomeCardImage';
import HomeCardShell from './HomeCardShell';

const NEWS_ASSET_BASE = `${AJAB_API_BASE}/`;

const toImageUrl = (value?: string) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${NEWS_ASSET_BASE}${value.replace(/^\/+/, '')}`;
};

function SongCard({ data, imageFallback }: { data: HomeSongCard; imageFallback: string }) {
  return (
    <HomeCardShell
      className="clh-song-card"
      href={`/songs/details/${data.id}`}
      media={
        <HomeCardImage src={data.image} fallbackSrc={imageFallback} alt={data.title || 'Song'} />
      }
    >
      <div className="clh-card-title">{data.title}</div>
      {data.subtitle && <div className="clh-card-subtitle">{data.subtitle}</div>}
      {data.singer && (
        <div className="clh-card-meta">
          <span className="clh-card-meta-label">sing </span>
          <span className="clh-card-meta-name">{data.singer}</span>
        </div>
      )}
      {data.poet && (
        <div className="clh-card-meta">
          <span className="clh-card-meta-label">poet </span>
          <span className="clh-card-meta-name">{data.poet}</span>
        </div>
      )}
      <div className="clh-card-divider" />
      <p className="clh-card-desc">{data.description}</p>
      <div className="clh-card-footer">
        <span className="clh-card-cta">EXPLORE SONG</span>
      </div>
    </HomeCardShell>
  );
}

function PoemCard({ data }: { data: HomePoemCard }) {
  return (
    <HomeCardShell className="clh-poem-card" href={`/poems/details/${data.id}`}>
      {data.transliteration && <div className="clh-poem-text">{data.transliteration}</div>}
      {data.translation && <div className="clh-poem-translation">{data.translation}</div>}
      <div className="clh-poem-spacer" />
      <div className="clh-poem-divider" />
      <div className="clh-poem-poet">
        <span className="clh-poem-poet-label">poet </span>
        <span className="clh-poem-poet-name">{data.poet}</span>
      </div>
      <span className="clh-card-cta">EXPLORE POEM</span>
    </HomeCardShell>
  );
}

function ReflectionCard({
  data,
  imageFallback,
}: {
  data: HomeReflectionCard;
  imageFallback: string;
}) {
  return (
    <HomeCardShell
      className="clh-reflection-card"
      href={`/reflections/details/${data.id}`}
      media={
        <HomeCardImage
          src={data.image}
          fallbackSrc={imageFallback}
          alt={data.title || 'Reflection'}
        />
      }
    >
      <div className="clh-card-title">{data.title}</div>
      {data.saysBy && (
        <div className="clh-card-meta">
          <span className="clh-card-meta-label">says </span>
          <span className="clh-card-meta-name">{data.saysBy}</span>
        </div>
      )}
      <div className="clh-card-divider" />
      <p className="clh-card-desc">{data.description}</p>
      <div className="clh-card-footer">
        <span className="clh-card-cta">EXPLORE REFLECTION</span>
      </div>
    </HomeCardShell>
  );
}

function PeopleCard({ data, imageFallback }: { data: HomePeopleCard; imageFallback: string }) {
  return (
    <HomeCardShell
      className="clh-people-card"
      href={`/people/${data.id}`}
      media={
        <HomeCardImage src={data.image} fallbackSrc={imageFallback} alt={data.title || 'Person'} />
      }
    >
      <div className="clh-card-title">{data.title}</div>
      {data.subtitle && <div className="clh-card-subtitle">{data.subtitle}</div>}
      {data.introBy && (
        <div className="clh-card-meta">
          <span className="clh-card-meta-label">by </span>
          <span className="clh-card-meta-name">{data.introBy}</span>
        </div>
      )}
      <div className="clh-card-divider" />
      <p className="clh-card-desc">{data.description}</p>
      <div className="clh-card-footer">
        <span className="clh-card-cta">EXPLORE PEOPLE</span>
      </div>
    </HomeCardShell>
  );
}

function FilmCard({ data, imageFallback }: { data: HomeFilmCard; imageFallback: string }) {
  return (
    <HomeCardShell
      className="clh-film-card"
      href={`/films/details/${data.id}`}
      media={
        <HomeCardImage src={data.image} fallbackSrc={imageFallback} alt={data.title || 'Film'} />
      }
    >
      <div className="clh-card-title">{data.title}</div>
      {data.subtitle && <div className="clh-card-subtitle">{data.subtitle}</div>}
      {data.filmBy && (
        <div className="clh-card-meta">
          <span className="clh-card-meta-label">a film by </span>
          <span className="clh-card-meta-name">{data.filmBy}</span>
        </div>
      )}
      <div className="clh-card-divider" />
      <p className="clh-card-desc">{data.description}</p>
      <div className="clh-card-footer">
        <span className="clh-card-cta">EXPLORE FILM</span>
      </div>
    </HomeCardShell>
  );
}

export default function CLHero() {
  const homeApiOnly = isHomeApiOnlyMode();

  const [homeLoading, setHomeLoading] = useState(homeApiOnly);

  const [song, setSong] = useState<HomeSongCard | null>(homeApiOnly ? null : MOCK_HOME_SONG);
  const [poem, setPoem] = useState<HomePoemCard | null>(homeApiOnly ? null : MOCK_HOME_POEM);
  const [reflection, setReflection] = useState<HomeReflectionCard | null>(
    homeApiOnly ? null : MOCK_HOME_REFLECTION
  );
  const [people, setPeople] = useState<HomePeopleCard | null>(homeApiOnly ? null : MOCK_HOME_PEOPLE);
  const [film, setFilm] = useState<HomeFilmCard | null>(homeApiOnly ? null : MOCK_HOME_FILM);

  const [showAjabNews, setShowAjabNews] = useState(false);
  const [popupSlides, setPopupSlides] = useState<NewsPopupSlide[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/home`, { cache: 'no-store' });
        if (res.ok) {
          const payload = await res.json();
          if (payload?.status && payload?.latest) {
            const mapped = mapHomeLatest(payload.latest, homeApiOnly);
            setSong(mapped.song);
            setPoem(mapped.poem);
            setReflection(mapped.reflection);
            setPeople(mapped.people);
            setFilm(mapped.film);
          }
        }
      } catch {
        /* Mock cards remain when API is unavailable (default mode). */
      }

      try {
        const newsResponse = await fetch(`${AJAB_API_BASE}/Api/news`, { cache: 'no-store' });
        if (newsResponse.ok) {
          const newsPayload = await newsResponse.json();
          const newsItems: any[] = Array.isArray(newsPayload?.data) ? newsPayload.data : [];
          const slides = mapNewsToHomePopupSlides(newsItems, toImageUrl);
          if (slides.length) {
            setPopupSlides(slides);
            if (shouldAutoOpenAjabNewsPopup()) {
              setShowAjabNews(true);
            }
          }
        }
      } catch {
        /* No mock popup — only show carousel when `/Api/news` returns slides */
      } finally {
        setHomeLoading(false);
      }
    };

    loadData();
  }, [homeApiOnly]);

  useEffect(() => {
    const handleOpen = () => setShowAjabNews(true);
    window.addEventListener('open-ajab-news', handleOpen);
    return () => window.removeEventListener('open-ajab-news', handleOpen);
  }, []);

  // Auto-open once per snooze window; footer can still open via `open-ajab-news`.

  const handleCloseAjabNews = () => {
    setShowAjabNews(false);
    snoozeAjabNewsPopup();
  };

  if (homeLoading) {
    return <Loader />;
  }

  return (
    <div className="cl-home-page-root">
      <div className="cl-home-layout">
        <Header />
        <main className="relative z-10 flex-1">
          <div className="clh-page">
            <div className="clh-marble-stage">
              <div className="clh-cards">
                {(homeApiOnly ? song : song ?? MOCK_HOME_SONG) && (
                  <div className="clh-card-row clh-card-row--song">
                    <SongCard
                      data={(homeApiOnly ? song : song ?? MOCK_HOME_SONG)!}
                      imageFallback={MOCK_HOME_SONG.image}
                    />
                  </div>
                )}
                {(homeApiOnly ? poem : poem ?? MOCK_HOME_POEM) && (
                  <div className="clh-card-row clh-card-row--poem">
                    <PoemCard data={(homeApiOnly ? poem : poem ?? MOCK_HOME_POEM)!} />
                  </div>
                )}
                {(homeApiOnly ? reflection : reflection ?? MOCK_HOME_REFLECTION) && (
                  <div className="clh-card-row clh-card-row--reflection">
                    <ReflectionCard
                      data={(homeApiOnly ? reflection : reflection ?? MOCK_HOME_REFLECTION)!}
                      imageFallback={MOCK_HOME_REFLECTION.image}
                    />
                  </div>
                )}
                {(homeApiOnly ? people : people ?? MOCK_HOME_PEOPLE) && (
                  <div className="clh-card-row clh-card-row--people">
                    <PeopleCard
                      data={(homeApiOnly ? people : people ?? MOCK_HOME_PEOPLE)!}
                      imageFallback={MOCK_HOME_PEOPLE.image}
                    />
                  </div>
                )}
                {(homeApiOnly ? film : film ?? MOCK_HOME_FILM) && (
                  <div className="clh-card-row clh-card-row--film">
                    <FilmCard
                      data={(homeApiOnly ? film : film ?? MOCK_HOME_FILM)!}
                      imageFallback={MOCK_HOME_FILM.image}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <ContentSliderModal
          items={popupSlides}
          isOpen={showAjabNews}
          onClose={handleCloseAjabNews}
        />
      </div>
    </div>
  );
}
