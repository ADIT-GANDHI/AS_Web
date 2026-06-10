'use client';

import { useEffect, useState } from "react";
import { AJAB_API_BASE } from '@/lib/ajabEnv';

import SongCard from "./Home/SongCard/SongCard";
import Poem from "./Home/Poem/Poem";
import FilmCard from "./Home/Films/FilmCard";
import People from "./Home/PeopleView/People";
import Reflection from "./Home/Reflection/Reflection";
import ContentSliderModal, { NewsPopupSlide } from "./ContentSliderModal";

interface ApiPopupItem {
  category?: string;
  title?: string;
  second_title?: string;
  content?: string;
  image?: string;
  images?: string[];
}

interface ApiNewsItem {
  id: string;
  popup_items?: ApiPopupItem[];
}

const NEWS_ASSET_BASE = `${AJAB_API_BASE}/`;

const toImageUrl = (value?: string) => {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `${NEWS_ASSET_BASE}${value.replace(/^\/+/, '')}`;
};

export default function Hero() {

  // ====== API STATES ======
  const [song, setSong] = useState(null);
  const [reflection, setReflection] = useState(null);
  const [person, setPerson] = useState(null);
  const [film, setFilm] = useState(null);
  const [poem, setPoem] = useState(null);

  const [loading, setLoading] = useState(true);
  const [showAjabNews, setShowAjabNews] = useState(false);
  const [popupSlides, setPopupSlides] = useState<NewsPopupSlide[]>([]);

  // ====== API FETCH ======
  useEffect(() => {
    async function loadData() {
      try {
        try {
          const res = await fetch(`${AJAB_API_BASE}/Api/home`);
          if (res.ok) {
            const data = await res.json();
            console.log("API Data:", data);
            if (data?.status && data?.latest) {
              setSong(data.latest.song);
              setReflection(data.latest.reflection);
              setPerson(data.latest.person);
              setFilm(data.latest.film);
              setPoem(data.latest.poem);
            }
          } else {
            console.warn("Home API returned status:", res.status);
          }
        } catch (homeErr) {
          console.warn("Home API fetch failed:", homeErr);
        }

        let newsItems: ApiNewsItem[] = [];
        try {
          const newsResponse = await fetch(`${AJAB_API_BASE}/Api/news`, { cache: 'no-store' });
          if (newsResponse.ok) {
            const newsPayload = await newsResponse.json();
            newsItems = Array.isArray(newsPayload?.data) ? newsPayload.data : [];
          }
        } catch (newsErr) {
          console.warn("News API fetch failed:", newsErr);
        }

        const slides: NewsPopupSlide[] = newsItems.flatMap((newsItem) => {
          const popupItems = Array.isArray(newsItem?.popup_items) ? newsItem.popup_items : [];

          return popupItems
            .filter((popupItem) => popupItem?.category === 'single' || popupItem?.category === 'multiple')
            .map((popupItem, index) => {
              const images =
                popupItem.category === 'single'
                  ? [toImageUrl(popupItem.image)].filter(Boolean)
                  : Array.isArray(popupItem.images)
                    ? popupItem.images.map((entry) => toImageUrl(entry)).filter(Boolean)
                    : [];

              return {
                slideId: `${newsItem.id}-${popupItem.category}-${index}`,
                newsId: String(newsItem.id),
                category: popupItem.category as 'single' | 'multiple',
                title: popupItem.title || 'Ajab news',
                secondTitle: popupItem.second_title || '',
                content: popupItem.content || '',
                images,
              };
            });
        });

        setPopupSlides(slides);
        setShowAjabNews(slides.length > 0);
      } catch (err) {
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="full-background-home-page">
      <section className="relative min-h-screen">
        <div className="relative z-10 home-hero-container">

          {/* ================= SONG CARD ================= */}
          {!loading && song && (
            <div className="columns-1 pt-8">
              <div className="product-card mb-6">
                <SongCard {...song} />
              </div>
            </div>
          )}

          {/* ================= POEM ================ */}
          <div className="poem-card-container">
          <Poem data={{...poem}} />

          </div>

          {/* ================= REFLECTION ================ */}
          {!loading && reflection && (
          <div className="reflection-card-container">
            <Reflection data={{...reflection}} />
          </div>
          )}

          {/* ================= PEOPLE ================ */}
          <div className="people-card-container">
            <People data={{...person} }/>
          </div>

          {/* ================= FILM ================ */}
          <div className="film-card-container">
            <FilmCard data={{...film}} />
          </div>

          {/* Ajab News Popup */}
          <ContentSliderModal
            items={popupSlides}
            isOpen={showAjabNews}
            onClose={() => setShowAjabNews(false)}
          />
        </div>
      </section>
    </div>
  );
}

