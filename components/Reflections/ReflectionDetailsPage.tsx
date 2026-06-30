'use client';

import Header from '@/components/Header';
import Loader from '@/components/Loader';
import FullBackground from '@/components/fullBackground';
import RelatedSection from '@/components/RelatedSection/RelatedSection';
import { useMemo, useState } from 'react';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import YouTubeEmbedFrame from '@/components/Reusable/YouTubeEmbedFrame';
import '@/components/Songs/Songs.css';

// RelatedTab type removed — now handled by RelatedSection component

function getText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.englishTranslation || value.englishTransliteration || value.hindi || '';
  }
  return '';
}

// [Claude] these changes have been recommended by claude —
// Extended to handle bare 11-char YouTube IDs (what the API returns in youtube_video_id /
// interview_video fields) in addition to full URLs with v=, youtu.be/, embed/ patterns.
function extractYouTubeId(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Full URL patterns
  const regExp = /(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match) return match[1];
  // Bare 11-character video ID (e.g. "UycDQ5HCJ4g")
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return '';
}

function normalizeImageUrl(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  if (value.startsWith('http')) return value;
  if (value.startsWith('/')) return `${AJAB_API_BASE}${value}`;
  if (value.includes('.') || value.includes('/')) return `${AJAB_API_BASE}/${value}`;
  return '';
}

export default function ReflectionDetailsPage({
  data,
  related,
  isLoading,
}: {
  data: any;
  related: any;
  isLoading: boolean;
}) {
  // relatedTab state removed — now handled by RelatedSection component

  const title = getText(data?.meta_title) || getText(data?.title) || 'Untitled Reflection';
  // [Claude] these changes have been recommended by claude —
  // Use person_name_english (the resolved name) instead of speaker_id (which is a numeric FK).
  // Fall back to person_name_hindi if English name is absent.
  const speakerName =
    getText(data?.person_name_english) ||
    getText(data?.person_name_hindi) ||
    '';
  const verb = getText(data?.verb) || 'says';
    // Remove date_of_upload
  const place = getText(data?.interview_place) || '';
  const year = getText(data?.interview_year) || '';
  // Format date_of_upload to show only date (no hour/minute)
  let dateOnly = '';
  if (data?.date_of_upload) {
    const date = new Date(data.date_of_upload);
    dateOnly = date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  const excerpt = getText(data?.thumbnail_excerpt) || getText(data?.meta_description) || '';
  const content =
    getText(data?.interview_text) ||
    getText(data?.essay_content) ||
    getText(data?.visual_story_desc) ||
    getText(data?.interview_about) ||
    getText(data?.meta_description) ||
    '';

  const videoUrl = getText(data?.youtube_video_id) || getText(data?.interview_video) || '';
  const videoId = extractYouTubeId(videoUrl);
  const thumbnail = normalizeImageUrl(data?.thumbnail_url || data?.person_thumbnail_url);

  const relatedData = related?.data || related || {};
  const relatedSongsRaw = Array.isArray(relatedData?.songs) ? relatedData.songs : [];
  const relatedPoemsRaw = Array.isArray(relatedData?.poems) ? relatedData.poems : [];
  const relatedReflectionsRaw = Array.isArray(relatedData?.reflections) ? relatedData.reflections : [];
  const relatedPeopleRaw = Array.isArray(relatedData?.people) ? relatedData.people : [];
  const relatedFilmsRaw = Array.isArray(relatedData?.films) ? relatedData.films : [];

  const relatedItems = useMemo(() => {
    const songs = relatedSongsRaw.map((item: any) => ({
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

    const poems = relatedPoemsRaw.map((item: any) => ({
      id: `poem-${item?.id}`,
      type: 'poems',
      title:
        getText(item?.original_title) ||
        getText(item?.title) ||
        getText(item?.meta_title) ||
        'Untitled Poem',
      subtitle: getText(item?.poet) || getText(item?.poet_name) || '',
      description: getText(item?.meta_description) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl || item?.thumbnail),
    }));

    const reflections = relatedReflectionsRaw.map((item: any) => ({
      id: `reflection-${item?.id}`,
      type: 'reflections',
      title: getText(item?.title) || getText(item?.meta_title) || 'Untitled Reflection',
      subtitle: getText(item?.person_name_english) || getText(item?.speaker_id) || '',
      description: getText(item?.meta_description) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.person_thumbnail_url || item?.thumbnail),
    }));

    const people = relatedPeopleRaw.map((item: any) => ({
      id: `people-${item?.id}`,
      type: 'other',
      title: getText(item?.person_name) || getText(item?.person_name_english) || 'Untitled Person',
      subtitle: getText(item?.category_name) || '',
      description: '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl || item?.thumbnail),
    }));

    const films = relatedFilmsRaw.map((item: any) => ({
      id: `film-${item?.id}`,
      type: 'other',
      title: getText(item?.english_translation) || getText(item?.english_transliteration) || 'Untitled Film',
      subtitle: getText(item?.director_name) || '',
      description: getText(item?.year_of_production) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl || item?.thumbnail),
    }));

    return { songs, poems, reflections, other: [...people, ...films] };
  }, [relatedFilmsRaw, relatedPeopleRaw, relatedPoemsRaw, relatedReflectionsRaw, relatedSongsRaw]);

  const allRelatedItems = useMemo(() => [
    ...relatedItems.songs,
    ...relatedItems.poems,
    ...relatedItems.reflections,
    ...relatedItems.other,
  ], [relatedItems]);

  const songsCount = relatedItems.songs.length;
  const poemsCount = relatedItems.poems.length;
  const reflectionsCount = relatedItems.reflections.length;
  const otherCount = relatedItems.other.length;
  const totalRelated = songsCount + poemsCount + reflectionsCount + otherCount;

  const relatedTabs = useMemo(() => [
    { key: 'all', label: 'ALL', count: totalRelated },
    { key: 'songs', label: 'SONGS', count: songsCount },
    { key: 'poems', label: 'POEMS', count: poemsCount },
    { key: 'reflections', label: 'REFLECTIONS', count: reflectionsCount },
    { key: 'other', label: 'OTHER', count: otherCount },
  ], [totalRelated, songsCount, poemsCount, reflectionsCount, otherCount]);

  if (isLoading) return <Loader />;
  if (!data) return <p className="text-center mt-20">No reflection found</p>;

  return (
    <FullBackground background="/song-bg-full.svg">
      <div className="min-h-screen">
        <Header />

        <div
          style={{
            backgroundSize: '100% auto',
            padding: '6.5rem 0 7rem',
            maxWidth: '1420px',
            width: '100%',
            margin: '-30px auto 0',
            minHeight: '1300px',
            fontWeight: 300,
            zIndex: -100,
          }}
        >
          <main className="relative z-10">
            <div className="mx-auto z-11">
              <div className="mt-8">
                <div className="max-w-6xl mx-auto px-4 pb-8">
                  <div className="songs-about">
                    {/* Title, verb, speaker_id, and date aligned with image top */}
                    <div className="w-full max-w-4xl mx-auto">
                      <div className="reflection-top-bar" style={{ marginBottom: '10px' }}>
                        <div className="reflection-top-title">
                          <span className="reflection-top-name">’{title}’</span>
                          {speakerName && (
                            <>
                              <span className="reflection-top-verb"> {verb} </span>
                              <span className="reflection-top-speaker">{speakerName}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {videoId ? (
                        <div className="aspect-video w-full reflection-video">
                          <YouTubeEmbedFrame videoId={videoId} title={title} />
                        </div>
                      ) : thumbnail ? (
                        <img src={thumbnail} alt={title} className="reflection-video rounded-lg shadow-lg w-full" />
                      ) : null}

                      {(excerpt || getText(data?.interview_about)) && (
                        <div className="reflection-excerpt" style={{ marginTop: '30px' }}>
                          <div className="reflection-excerpt-text">
                            {excerpt || getText(data?.interview_about)}
                          </div>
                          {content && <button type="button" className="reflection-excerpt-more">…more</button>}
                        </div>
                      )}
                    </div>

                    {/* Remove content from above image, show only below if needed */}
                  </div>

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
