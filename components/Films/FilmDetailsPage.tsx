'use client';

import Header from '@/components/Header';
import Loader from '@/components/Loader';
import FullBackground from '@/components/fullBackground';
import RelatedSection from '@/components/RelatedSection/RelatedSection';
import Link from 'next/link';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import '@/components/Songs/Songs.css';
import './FilmLanguageToggle.css';
import { useEffect, useMemo, useState } from 'react';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

function getText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return value.englishTranslation || value.englishTransliteration || value.hindi || '';
  }
  return '';
}

function normalizeImageUrl(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return `${AJAB_API_BASE}${value}`;
  if (value.includes('.') || value.includes('/')) return `${AJAB_API_BASE}/${value}`;
  return '';
}

function extractYouTubeId(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  if (!value.includes('http')) return value.trim();
  const regExp = /(?:v=|youtu\.be\/|embed\/)([^&?]+)/;
  const match = value.match(regExp);
  return match ? match[1] : '';
}

export interface LanguageVersion {
  id: string;
  language: string;
  videoId: string;
}

export default function FilmDetailsPage({
  data,
  isLoading,
  relatedFilms = [],
  languageVersions = [],
}: {
  data: any;
  isLoading: boolean;
  relatedFilms?: any[];
  languageVersions?: LanguageVersion[];
}) {
  const defaultVideoId = extractYouTubeId(getText(data?.youtube_video_id));
  const [activeVideoId, setActiveVideoId] = useState('');
  const [activeLang, setActiveLang] = useState('');

  // Set defaults once data loads
  useEffect(() => {
    if (defaultVideoId && !activeVideoId) {
      setActiveVideoId(defaultVideoId);
      const currentVersion = languageVersions.find((v) => v.videoId === defaultVideoId);
      setActiveLang(currentVersion?.language || (languageVersions.length > 0 ? 'Original' : ''));
    }
  }, [defaultVideoId, languageVersions, activeVideoId]);

  const normalizedRelatedFilms = useMemo(
    () =>
      (Array.isArray(relatedFilms) ? relatedFilms : []).map((item: any) => ({
        id: String(item?.id || ''),
        title: getText(item?.main_title) || getText(item?.english_transliteration) || 'Untitled Film',
        subtitle: getText(item?.second_title),
        director: getText(item?.director_name_english),
        description: [getText(item?.duration), getText(item?.year)].filter(Boolean).join(', '),
        image: normalizeImageUrl(item?.thumbnail_Image || item?.thumbnail_url),
      })),
    [relatedFilms]
  );

  if (isLoading) return <Loader />;
  if (!data) return <p className="text-center mt-20">No film found</p>;

  const title = getText(data?.english_transliteration) || getText(data?.english_translation) || 'Untitled Film';
  const subtitle = getText(data?.english_translation);
  const director = getText(data?.director_name_english);
  const duration = getText(data?.duration);
  const year = getText(data?.year_of_production);
  const image = normalizeImageUrl(data?.thumbnail_url);
  const aboutHtml = getText(data?.about_text) || getText(data?.profile_text) || getText(data?.description) || '';

  const videoId = activeVideoId || defaultVideoId;

  const handleLanguageSwitch = (version: LanguageVersion) => {
    setActiveVideoId(version.videoId);
    setActiveLang(version.language);
  };

  const filmRelatedItems = normalizedRelatedFilms.map((item) => ({
    ...item,
    type: 'films',
    titleSecondary: item.subtitle,
  }));

  const filmRelatedTabs = [
    { key: 'all', label: 'ALL', count: filmRelatedItems.length },
    { key: 'films', label: 'FILMS', count: filmRelatedItems.length },
  ];

  return (
    <FullBackground background="/film-page-bg.svg">
      <div className="min-h-screen">
        <Header />

        <div className="people-inner-container">
          <main className="relative z-10">
            <div className="mx-auto z-11">
              <div className="mt-8">
                <div className="max-w-6xl mx-auto px-4 pb-8">
                  <section className="songs-about max-w-4xl mx-auto">
                    <h1 className="song-title-line mb-4">
                      <span className="song-title">{title}</span>
                      {!!subtitle && <span className="song-sings"> - {subtitle}</span>}
                    </h1>

                    {director && (
                      <p className="text-xl mb-2"  style={{ color: '#6F6F72' }}>
                        Film by <span className="text-pink">{director}</span>
                      </p>
                    )}

                    {/* {(duration || year) && (
                      <p className="films-date">
                        {duration ? `${duration}` : ''}
                        {duration && year ? ' , ' : ''}
                        {year ? `${year}` : ''}
                      </p>
                    )} */}

                    {(videoId || image) && (
                      <div className="w-full my-6 border-top-pink">
                        {videoId ? (
                          <div className="aspect-video w-full" key={videoId}>
                            <LiteYouTubeEmbed id={videoId} title={title} poster="maxresdefault" noCookie />
                          </div>
                        ) : (
                          <img src={image} alt={title} className="rounded-lg shadow-lg w-full" />
                        )}

                        {/* Language Toggle */}
                        {languageVersions.length > 1 && (
                          <div className="film-lang-toggle">
                            {languageVersions.map((version, index) => (
                              <span key={version.id} className="film-lang-toggle-item-wrap">
                                {index > 0 && <span className="film-lang-sep">|</span>}
                                <button
                                  type="button"
                                  className={`film-lang-btn ${activeLang === version.language ? 'active' : ''}`}
                                  onClick={() => handleLanguageSwitch(version)}
                                  disabled={activeLang === version.language}
                                >
                                  {version.language}
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className="text-lg leading-relaxed text-left song-meta-description"
                      dangerouslySetInnerHTML={{ __html: aboutHtml }}
                    />

                    {!!filmRelatedItems.length && (
                      <RelatedSection
                        items={filmRelatedItems}
                        tabs={filmRelatedTabs}
                        initialLimit={3}
                      />
                    )}
                  </section>
                </div>
              </div>
            </div>
          </main>
        </div>

      </div>
    </FullBackground>
  );
}
