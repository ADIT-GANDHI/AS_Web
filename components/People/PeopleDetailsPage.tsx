'use client';

import Header from '@/components/Header';
import Loader from '@/components/Loader';
import FullBackground from '@/components/fullBackground';
import RelatedSection from '@/components/RelatedSection/RelatedSection';
import { useMemo, useState } from 'react';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import '@/components/Songs/Songs.css';
import '@/components/People/People.css';

// RelatedTab type removed — now handled by RelatedSection component

function getText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
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

export default function PeopleDetailsPage({
  data,
  related,
  isLoading,
}: {
  data: any;
  related: any;
  isLoading: boolean;
}) {
  // relatedTab state removed — now handled by RelatedSection component

  const personData = data?.data || data || {};

  const name =
    getText(personData?.person_name_english) ||
    getText(personData?.name) ||
    [getText(personData?.first_name), getText(personData?.middle_name), getText(personData?.last_name)]
      .filter(Boolean)
      .join(' ') ||
    'Untitled Person';

  const subtitle = getText(personData?.category_name) || getText(personData?.category_type);
  // Use about column for about section
  const rawAboutHtml = personData?.about || personData?.profile || '';
  const aboutHtml = rawAboutHtml.replace(/<p[^>]*>[\s]*(?:Contact:|Know more:)[\s\S]*?<\/p>/gi, '');
  const image = personData?.thumbnail_image_upload
    ? `${AJAB_API_BASE}/Uploads/${personData.thumbnail_image_upload}`
    : personData?.thumbnail_url
      ? normalizeImageUrl(personData.thumbnail_url)
      : '';

  const relatedData = related?.data || related || {};

  const relatedItems = useMemo(() => {
    const songs = (Array.isArray(relatedData?.songs) ? relatedData.songs : []).map((item: any) => ({
      id: `song-${item?.id}`,
      type: 'songs',
      title:
        getText(item?.umbrellaTitle) ||
        getText(item?.umbrella_title) ||
        getText(item?.songTitle) ||
        getText(item?.song_title) ||
        getText(item?.meta_title) ||
        'Untitled Song',
      subtitle: getText(item?.singer) || getText(item?.singer_name) || '',
      description: getText(item?.metaDescription) || getText(item?.meta_description) || '',
      image: normalizeImageUrl(item?.thumbnailUrl || item?.thumbnail_url || item?.thumbnail),
    }));

    const poems = (Array.isArray(relatedData?.poems) ? relatedData.poems : []).map((item: any) => ({
      id: `poem-${item?.id}`,
      type: 'poems',
      title: getText(item?.original_title) || getText(item?.title) || getText(item?.meta_title) || 'Untitled Poem',
      subtitle: getText(item?.poet) || getText(item?.poet_name) || '',
      description: getText(item?.meta_description) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl || item?.thumbnail),
    }));

    const films = (Array.isArray(relatedData?.films) ? relatedData.films : []).map((item: any) => ({
      id: `film-${item?.id}`,
      type: 'films',
      title: getText(item?.english_translation) || getText(item?.english_transliteration) || 'Untitled Film',
      subtitle: getText(item?.director_name) || '',
      description: getText(item?.year_of_production) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl || item?.thumbnail),
    }));

    const people = (Array.isArray(relatedData?.people) ? relatedData.people : []).map((item: any) => ({
      id: `people-${item?.id}`,
      type: 'people',
      title: getText(item?.person_name) || getText(item?.name) || 'Untitled Person',
      subtitle: getText(item?.category_name) || '',
      description: '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl || item?.thumbnail),
      link: `/people/${item?.id}`,
    }));

    const reflections = (Array.isArray(relatedData?.reflections) ? relatedData.reflections : []).map((item: any) => ({
      id: `reflection-${item?.id}`,
      type: 'reflections',
      title: getText(item?.title) || getText(item?.meta_title) || 'Untitled Reflection',
      subtitle: getText(item?.speaker_name) || '',
      description: getText(item?.meta_description) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl || item?.thumbnail),
    }));

    return { songs, poems, films, people, reflections };
  }, [relatedData]);

  const allRelatedItems = useMemo(() => [
    ...relatedItems.songs, ...relatedItems.poems, ...relatedItems.films, ...relatedItems.people, ...relatedItems.reflections,
  ], [relatedItems]);

  const songsCount = relatedItems.songs.length;
  const poemsCount = relatedItems.poems.length;
  const filmsCount = relatedItems.films.length;
  const peopleCount = relatedItems.people.length;
  const reflectionsCount = relatedItems.reflections.length;
  const totalRelated = songsCount + poemsCount + filmsCount + peopleCount + reflectionsCount;

  const relatedTabs = useMemo(() => [
    { key: 'all', label: 'ALL', count: totalRelated },
    { key: 'songs', label: 'SONGS', count: songsCount },
    { key: 'poems', label: 'POEMS', count: poemsCount },
    { key: 'films', label: 'FILMS', count: filmsCount },
  ], [totalRelated, songsCount, poemsCount, filmsCount]);

  if (isLoading) return <Loader />;
  if (!personData || (!name && !aboutHtml)) return <p className="text-center mt-20">No person found</p>;

  return (
    <FullBackground background="/people-bg.webp">
      <div className="min-h-screen">
        <Header />

        <div className="inner-container-people">

          <main className="relative z-10">
            <div className="mx-auto z-11">
              <div className="mt-8">
                <div className="mx-auto pb-8" style={{ maxWidth: '1180px', background: '#fff', padding: '50px 60px', marginTop: '20px', marginBottom: '160px' }}>
                  <section className="songs-about">
                    <div className="w-full mb-6">
                      <span style={{ color: '#4F4F4F', fontSize: '24px', fontFamily: "'Lora', serif", fontWeight: 400 }}>
                        {name}
                      </span>
                      {subtitle && (
                        <span style={{ color: '#9a9a9a', fontSize: '11px', fontFamily: "'Merriweather Sans', sans-serif", letterSpacing: '0.8px', textTransform: 'uppercase', marginLeft: '10px' }}>
                          {subtitle}
                        </span>
                      )}
                    </div>
                    <div>
                      {image && (
                        <img
                          src={image}
                          alt={name}
                          style={{ float: 'left', width: '380px', height: '260px', objectFit: 'cover', marginRight: '30px', marginBottom: '10px' }}
                        />
                      )}
                      <div
                        className="people-detail-about"
                        style={{ color: '#6d6e71', fontSize: '15px', lineHeight: '1.8', fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 300 }}
                        dangerouslySetInnerHTML={{ __html: aboutHtml }}
                      />
                      <div style={{ clear: 'both' }} />
                    </div>
                  </section>

                  {!!totalRelated && (
                    <RelatedSection
                      items={allRelatedItems}
                      tabs={relatedTabs}
                      initialLimit={3}
                    />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>

      </div>
    </FullBackground>
  );
}
