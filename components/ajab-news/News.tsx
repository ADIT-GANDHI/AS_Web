'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import './News.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

type PopupCategory = 'single' | 'multiple';

interface ApiPopupItem {
  category?: PopupCategory;
  title?: string;
  second_title?: string;
  content?: string;
  image?: string;
  images?: string[];
}

interface ApiNewsItem {
  id: string;
  news_title?: string | null;
  news_second_title?: string | null;
  ajab_news_content?: string | null;
  popup_items?: ApiPopupItem[];
}

const NEWS_ASSET_BASE = `${AJAB_API_BASE}/`;

// Offline fallback derived from Figma artwork 367:11361 — section intros are
// emitted as standalone entries (no popup_items) so the layout shows
// "Section header + intro" cards followed by "Item title + description" cards.
const MOCK_NEWS: ApiNewsItem[] = [
  {
    id: 'films-intro',
    news_title: 'Films',
    news_second_title: '',
    ajab_news_content:
      'The Kabir Project consists of many journeys inspired by Bhakti, Sufi, and Baul poems and songs as they flow in the rural folk traditions. Spanning over two decades, our inspirations in the wisdom of these poems has taken the shape of several FILMS, BOOKS, the AJAB SHAHAR web archive, an innovative schools curriculum called ESHTIHAL & MORE. Inspired by the call of Kabir, the 15th century North Indian mystic poet, a journey explores the spiritual and socio-political resonance of mystic poetry.',
  },
  {
    id: 'journeys-intro',
    news_title: 'Journeys with Kabir',
    news_second_title: '',
    ajab_news_content:
      'The Kabir Project consists of many journeys inspired by Bhakti, Sufi, and Baul poems and songs as they flow in the rural folk traditions. Spanning over two decades, our inspirations in the wisdom of these poems has taken the shape of several FILMS, BOOKS, the AJAB SHAHAR web archive, an innovative schools curriculum called ESHTIHAL & MORE.',
  },
  {
    id: 'item-1',
    news_title: 'Had Anhad',
    news_second_title: "I Lost My Heart To Nizam's Glance",
    ajab_news_content:
      'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
  },
  {
    id: 'item-2',
    news_title: 'Had Anhad',
    news_second_title: "I Lost My Heart To Nizam's Glance",
    ajab_news_content:
      'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
  },
  {
    id: 'item-3',
    news_title: 'Had Anhad',
    news_second_title: "I Lost My Heart To Nizam's Glance",
    ajab_news_content:
      'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
  },
  {
    id: 'mulakatein-intro',
    news_title: 'Ajab Mulakatein',
    news_second_title: '',
    ajab_news_content:
      'Ajab Mulakatein was an offering by the Kabir Project during the lockdown to meet with friends in a wondrous way as despite the walls. Speaking through virtual roadtrips, breathing booklets, and creating new digital ritmadalas over Zoom, we connected with friends, folk singers and musicians from across the globe in deep conversation about the poetry of Shah Latif, Akundas and others.',
  },
  {
    id: 'item-4',
    news_title: 'Had Anhad',
    news_second_title: "I Lost My Heart To Nizam's Glance",
    ajab_news_content:
      'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
  },
  {
    id: 'item-5',
    news_title: 'Had Anhad',
    news_second_title: "I Lost My Heart To Nizam's Glance",
    ajab_news_content:
      'The story highlights the gulshan-e-na-afreeda (the Uncreated Garden) that Shah Inayat spoke of, to evoke his utopian vision of a world in which the human spirit was not driven by fear, mistrust, oppression and exploitation, but rather was guided by a non-egoic spirit of connection and love.',
  },
];

const stripHtml = (value?: string | null) => {
  if (!value) {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toImageUrl = (value?: string) => {
  if (!value) {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  return `${NEWS_ASSET_BASE}${value.replace(/^\/+/, '')}`;
};

// 🔹 ToggleText Component
function ToggleText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  const isLongText = text.length > 220;

  return (
    <div className="news-text-wrap">
      <p className={`leading-relaxed news-line-content ${expanded ? 'expanded' : 'collapsed'}`}>{text}</p>
      {isLongText && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="pink-text cursor-pointer news-toggle-btn"
        >
          {expanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
}

// 🔹 Image Slider Component
function ImageSlider({ images }: { images: string[] }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageHeight, setImageHeight] = useState('auto');
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Function to update window width
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    // Set initial width
    updateWindowWidth();

    // Add event listener
    window.addEventListener('resize', updateWindowWidth);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateWindowWidth);
    };
  }, []);

  useEffect(() => {
    // Set image height based on window width
    if (windowWidth === 0) return;

    if (windowWidth < 1580) {
      setImageHeight('400px');
    } else {
      setImageHeight('auto');
    }
  }, [windowWidth]);

  if (images.length === 0) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="relative mb-6 news-card-slider-row">
        {/* Main Image */}
        <div className="relative mb-2 rounded-lg w-full max-w-[853px] h-auto mx-auto news-banner-shadow overflow-hidden news-image-wrap">
          <img
            src={images[currentImageIndex]}
            alt="News image"
            className="w-full"
            style={{
              height: imageHeight,
              maxHeight: imageHeight === 'auto' ? 'none' : imageHeight,
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="51"
                viewBox="0 0 26 51"
                fill="none"
              >
                <path
                  d="M22.8301 0.359375C22.1201 0.619375 21.6001 1.16939 21.0901 1.74939C14.6701 8.90939 8.2401 16.0694 1.8101 23.2294C0.910101 24.2294 0.720112 25.3994 1.29011 26.4794C1.42011 26.7294 1.6001 26.9494 1.7801 27.1594C8.3601 34.4894 14.9401 41.8194 21.5301 49.1494C22.7801 50.5394 24.6001 50.2894 25.3101 48.6194C25.6801 47.7394 25.6001 46.8894 25.1001 46.0994C24.9601 45.8794 24.7801 45.6794 24.6101 45.4894C18.6801 38.8794 12.7401 32.2694 6.80009 25.6594C6.68009 25.5294 6.5101 25.4393 6.3701 25.3293C6.3701 25.2593 6.3701 25.1794 6.3701 25.1094C6.5101 24.9994 6.68009 24.9094 6.80009 24.7794C12.7701 18.1394 18.7301 11.4994 24.7001 4.84937C25.6101 3.82937 25.7901 2.63945 25.1901 1.55945C24.8501 0.929448 24.3001 0.619385 23.7101 0.369385H22.8401L22.8301 0.359375Z"
                  fill="#B3B3B3"
                />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="51"
                viewBox="0 0 26 51"
                fill="none"
              >
                <path
                  d="M3.21029 0.359375C3.92029 0.619375 4.44028 1.16939 4.95028 1.74939C11.3703 8.90939 17.8003 16.0694 24.2303 23.2294C25.1303 24.2294 25.3203 25.3994 24.7503 26.4794C24.6203 26.7294 24.4403 26.9494 24.2603 27.1594C17.6803 34.4894 11.1003 41.8194 4.51034 49.1494C3.26034 50.5394 1.44031 50.2894 0.73031 48.6194C0.36031 47.7394 0.440271 46.8894 0.940271 46.0994C1.08027 45.8794 1.26038 45.6794 1.43038 45.4894C7.36038 38.8794 13.3003 32.2694 19.2403 25.6594C19.3603 25.5294 19.5304 25.4393 19.6704 25.3293C19.6704 25.2593 19.6704 25.1794 19.6704 25.1094C19.5304 24.9994 19.3603 24.9094 19.2403 24.7794C13.2703 18.1394 7.3103 11.4994 1.3403 4.84937C0.430295 3.82937 0.250305 2.63945 0.850305 1.55945C1.19031 0.929448 1.74029 0.619385 2.33029 0.369385H3.20028L3.21029 0.359375Z"
                  fill="#B3B3B3"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </>
  );
}

// 🔹 Main News Component
export default function Ajabnews() {
  const searchParams = useSearchParams();
  const newsId = (searchParams.get('news_id') || '').trim();

  const [newsData, setNewsData] = useState<ApiNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadNews = async () => {
      setLoading(true);
      setErrorText('');

      try {
        const endpoint =
          newsId
            ? `${AJAB_API_BASE}/Api/news?news_id=${encodeURIComponent(newsId)}`
            : `${AJAB_API_BASE}/Api/news`;
        const response = await fetch(endpoint, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Unable to fetch Ajab News.');
        }

        const payload = await response.json();
        const normalizedData = Array.isArray(payload?.data)
          ? payload.data
          : payload?.data && typeof payload.data === 'object'
            ? [payload.data]
            : [];

        if (!isCancelled) {
          setNewsData(normalizedData);
        }
      } catch (error: any) {
        if (!isCancelled) {
          // API offline → fall back to mock content so the Figma layout still renders
          setNewsData(MOCK_NEWS);
          setErrorText('');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadNews();

    return () => {
      isCancelled = true;
    };
  }, [newsId]);

  if (loading) {
    return <div className="custom-inner-container mx-auto text-[#6d6e71]">Loading Ajab News...</div>;
  }

  if (errorText) {
    return <div className="custom-inner-container mx-auto text-[#6d6e71]">{errorText}</div>;
  }

  if (!newsData.length) {
    return <div className="custom-inner-container mx-auto text-[#6d6e71]">No Ajab News found.</div>;
  }

  const normalizedSections = newsData.flatMap((news, newsIndex) => {
    const popupItems = Array.isArray(news.popup_items) ? news.popup_items : [];
    const validPopupItems = popupItems.filter(
      (popupItem) => popupItem?.category === 'single' || popupItem?.category === 'multiple'
    );

    if (validPopupItems.length > 0) {
      return validPopupItems.map((popupItem, popupIndex) => {
        const images =
          popupItem.category === 'single'
            ? [toImageUrl(popupItem.image)].filter(Boolean)
            : Array.isArray(popupItem.images)
              ? popupItem.images.map((entry) => toImageUrl(entry)).filter(Boolean)
              : [];

        return {
          uniqueId: `${news.id}-${popupIndex}`,
          title: popupItem.title || news.news_title || 'Untitled',
          secondTitle: popupItem.second_title || news.news_second_title || '',
          content: popupItem.content || stripHtml(news.ajab_news_content) || '',
          category: popupItem.category,
          images,
          showDivider: !(newsIndex === newsData.length - 1 && popupIndex === validPopupItems.length - 1),
        };
      });
    }

    return [
      {
        uniqueId: `${news.id}-default`,
        title: news.news_title || 'Untitled',
        secondTitle: news.news_second_title || '',
        content: stripHtml(news.ajab_news_content) || '',
        category: 'single' as PopupCategory,
        images: [],
        showDivider: newsIndex < newsData.length - 1,
      },
    ];
  });

  return (
    <div className="custom-inner-container mx-auto">
      {normalizedSections.map((section) => (
        <article key={section.uniqueId} className="bg-white">
          {/* Image Slider */}
          <ImageSlider images={section.images} />

          {/* Content Sections */}
          <div className="news-detals-row">
            <h2 className="mb-4 custom-heading-font">
              {section.title}
              {!!section.secondTitle && <span className="ml-1 text-[#6d6e71]">{section.secondTitle}</span>}
            </h2>

            {!!section.content && <ToggleText text={section.content} />}
            {!section.content && <p className="leading-relaxed">No content available.</p>}
          </div>

          {/* Divider - Show only between articles */}
          {section.showDivider && <div className="mt-7 border-dotted-seprator"></div>}
        </article>
      ))}
    </div>
  );
}
