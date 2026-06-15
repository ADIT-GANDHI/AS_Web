'use client';

import { useEffect, useRef, useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import ContentSliderModal, { NewsPopupSlide } from '@/components/CLContentSliderModal';
import {
  MOCK_HOME_SONG,
  MOCK_HOME_POEM,
  MOCK_HOME_REFLECTION,
  MOCK_HOME_PEOPLE,
  MOCK_HOME_FILM,
} from './CLHomeMocks';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLHome.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { isCmsPublished, isPopupForHome, isRenderableNewsPopupCategory } from '@/lib/cmsNews';
import { extractYouTubeId } from '@/lib/youtube';
import { resolveCmsAssetUrl, CMS_IMAGE_PLACEHOLDER } from '@/lib/resolveCmsAssetUrl';
import { mapHomeLatest } from '@/lib/homeApiMapper';
import HomeCardImage from './HomeCardImage';
import HomeCardShell from './HomeCardShell';

const NEWS_ASSET_BASE = `${AJAB_API_BASE}/`;

const toImageUrl = (value?: string) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${NEWS_ASSET_BASE}${value.replace(/^\/+/, '')}`;
};

function SongCard({ data }: { data: typeof MOCK_HOME_SONG }) {
  return (
    <HomeCardShell
      className="clh-song-card"
      href={`/songs/details/${data.id}`}
      media={
        <HomeCardImage src={data.image} fallbackSrc={MOCK_HOME_SONG.image} alt={data.title} />
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
      <span className="clh-card-cta">EXPLORE SONG</span>
    </HomeCardShell>
  );
}

function PoemCard({ data }: { data: typeof MOCK_HOME_POEM }) {
  const lines = (data.text || '').split('\n');
  const splitIdx = lines.findIndex((l) => l.trim() === '');
  const original = splitIdx >= 0 ? lines.slice(0, splitIdx).join('\n') : data.text;
  const translation = splitIdx >= 0 ? lines.slice(splitIdx + 1).join('\n') : '';

  return (
    <HomeCardShell className="clh-poem-card" href={`/poems/details/${data.id}`}>
      <div className="clh-poem-text">{original}</div>
      {translation && <div className="clh-poem-translation">{translation}</div>}
      <div className="clh-poem-spacer" />
      <div className="clh-poem-divider" />
      <div className="clh-poem-poet">
        poet <span className="pink">{data.poet}</span>
      </div>
      <span className="clh-card-cta">EXPLORE POEM</span>
    </HomeCardShell>
  );
}

function ReflectionCard({ data }: { data: typeof MOCK_HOME_REFLECTION }) {
  return (
    <HomeCardShell
      className="clh-reflection-card"
      href={`/reflections/details/${data.id}`}
      media={
        <HomeCardImage src={data.image} fallbackSrc={MOCK_HOME_REFLECTION.image} alt={data.title} />
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
      <span className="clh-card-cta">EXPLORE REFLECTION</span>
    </HomeCardShell>
  );
}

function PeopleCard({ data }: { data: typeof MOCK_HOME_PEOPLE }) {
  return (
    <HomeCardShell
      className="clh-people-card"
      href={`/people/${data.id}`}
      media={
        <HomeCardImage src={data.image} fallbackSrc={MOCK_HOME_PEOPLE.image} alt={data.title} />
      }
    >
      <div className="clh-card-title">{data.title}</div>
      {data.subtitle && <div className="clh-card-subtitle">{data.subtitle}</div>}
      {data.introBy && (
        <div className="clh-card-meta">
          <span className="clh-card-meta-label">intro by </span>
          <span className="clh-card-meta-name">{data.introBy}</span>
        </div>
      )}
      <div className="clh-card-divider" />
      <p className="clh-card-desc">{data.description}</p>
      <span className="clh-card-cta">EXPLORE PEOPLE</span>
    </HomeCardShell>
  );
}

function FilmCard({ data }: { data: typeof MOCK_HOME_FILM }) {
  return (
    <HomeCardShell
      className="clh-film-card"
      href={`/films/details/${data.id}`}
      media={
        <HomeCardImage src={data.image} fallbackSrc={MOCK_HOME_FILM.image} alt={data.title} />
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
      <span className="clh-card-cta">EXPLORE FILM</span>
    </HomeCardShell>
  );
}

export default function CLHero() {
  const [song, setSong] = useState(MOCK_HOME_SONG);
  const [poem, setPoem] = useState(MOCK_HOME_POEM);
  const [reflection, setReflection] = useState(MOCK_HOME_REFLECTION);
  const [people, setPeople] = useState(MOCK_HOME_PEOPLE);
  const [film, setFilm] = useState(MOCK_HOME_FILM);

  const [showAjabNews, setShowAjabNews] = useState(false);
  const [popupSlides, setPopupSlides] = useState<NewsPopupSlide[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch(`${AJAB_API_BASE}/Api/home`, { cache: 'no-store' });
        if (res.ok) {
          const payload = await res.json();
          if (payload?.status && payload?.latest) {
            const mapped = mapHomeLatest(payload.latest);
            setSong(mapped.song);
            setPoem(mapped.poem);
            setReflection(mapped.reflection);
            setPeople(mapped.people);
            setFilm(mapped.film);
          }
        }
      } catch {
        // mocks already in state
      }

      try {
        const newsResponse = await fetch(`${AJAB_API_BASE}/Api/news`, { cache: 'no-store' });
        if (newsResponse.ok) {
          const newsPayload = await newsResponse.json();
          const newsItems: any[] = Array.isArray(newsPayload?.data) ? newsPayload.data : [];
          const slides: NewsPopupSlide[] = newsItems.flatMap((newsItem) => {
            const popupItems = Array.isArray(newsItem?.popup_items) ? newsItem.popup_items : [];
            return popupItems
              .filter(
                (p: any) =>
                  isCmsPublished(p?.published) &&
                  isPopupForHome(p?.show_on_home) &&
                  isRenderableNewsPopupCategory(p?.category)
              )
              .map((p: any, i: number) => {
                if (p.category === 'video') {
                  const videoId = extractYouTubeId(p.video_url);
                  return {
                    slideId: `${newsItem?.id ?? 'n'}-${i}`,
                    newsId: String(newsItem?.id ?? ''),
                    category: 'video' as const,
                    title: p.title || '',
                    secondTitle: p.second_title || '',
                    content: p.content || '',
                    images: videoId ? [] : [CMS_IMAGE_PLACEHOLDER],
                    videoId: videoId || undefined,
                    sequenceOrder: Number(p.sequence_order) || 99,
                  } as NewsPopupSlide;
                }
                const images =
                  p.category === 'single'
                    ? [toImageUrl(p.image)].filter(Boolean)
                    : Array.isArray(p.images)
                      ? p.images.map((e: any) => toImageUrl(e)).filter(Boolean)
                      : [];
                const resolved = images.map((u) => resolveCmsAssetUrl(u));
                return {
                  slideId: `${newsItem?.id ?? 'n'}-${i}`,
                  newsId: String(newsItem?.id ?? ''),
                  category: p.category,
                  title: p.title || '',
                  secondTitle: p.second_title || '',
                  content: p.content || '',
                  images: resolved.length ? resolved : [CMS_IMAGE_PLACEHOLDER],
                  sequenceOrder: Number(p.sequence_order) || 99,
                } as NewsPopupSlide;
              });
          });
          slides.sort(
            (a, b) => (a.sequenceOrder ?? 99) - (b.sequenceOrder ?? 99)
          );
          if (slides.length) {
            setPopupSlides(slides);
            setShowAjabNews(true);
          }
        }
      } catch {
        const fallbackSlides: NewsPopupSlide[] = [
          {
            slideId: 'fallback-0',
            newsId: 'fallback',
            category: 'single',
            title: 'Gulshan-e-Armaan',
            secondTitle: 'by KABIR PROJECT',
            content:
              'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
            images: [CMS_IMAGE_PLACEHOLDER],
          },
        ];
        setPopupSlides(fallbackSlides);
        setShowAjabNews(true);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleOpen = () => setShowAjabNews(true);
    window.addEventListener('open-ajab-news', handleOpen);
    return () => window.removeEventListener('open-ajab-news', handleOpen);
  }, []);

  // Popup auto-opens on first visit when news slides exist; footer can re-open via `open-ajab-news`.

  return (
    <div className="cl-home-page-root">
      <div className="cl-home-layout">
        <Header />
        <main className="relative z-10 flex-1">
          <div className="clh-page">
            <div className="clh-marble-stage">
              <div className="clh-cards">
                <div className="clh-card-row clh-card-row--song">
                  <SongCard data={song} />
                </div>
                <div className="clh-card-row clh-card-row--poem">
                  <PoemCard data={poem} />
                </div>
                <div className="clh-card-row clh-card-row--reflection">
                  <ReflectionCard data={reflection} />
                </div>
                <div className="clh-card-row clh-card-row--people">
                  <PeopleCard data={people} />
                </div>
                <div className="clh-card-row clh-card-row--film">
                  <FilmCard data={film} />
                </div>
              </div>
            </div>
          </div>
        </main>

        <ContentSliderModal
          items={popupSlides}
          isOpen={showAjabNews}
          onClose={() => setShowAjabNews(false)}
        />

        <Footer
          newsHeading="Ajab News"
          newsSubtext={
            <>
              To receive news, inspirations
              <br />
              and more from us...
            </>
          }
        />
      </div>
    </div>
  );
}
