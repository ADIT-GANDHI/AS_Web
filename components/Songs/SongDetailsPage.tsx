'use client';

import Header from '@/components/Header';
import Loader from '@/components/Loader';
import NoteGlossaryPopup from '@/components/NoteGlossaryPopup';
import FullBackground from '@/components/fullBackground';
import SongCard from '@/components/Songs/SongCard';
import { toEnglishPoet } from './poetTransliteration';
import RelatedSection from '@/components/RelatedSection/RelatedSection';
import { ChevronLeft, ChevronRight, Languages } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { withAppBasePath } from '@/lib/resolveCmsAssetUrl';
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

import './Songs.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

type SongLanguage = 'hindi' | 'english';

function extractYouTubeId(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const regExp = /(?:v=|youtu\.be\/|embed\/)([^&?]+)/;
  const match = url.match(regExp);
  if (match) return match[1];
  // If no URL pattern matched, treat as plain video ID (no slashes, no spaces)
  if (/^[A-Za-z0-9_-]+$/.test(url.trim())) return url.trim();
  return '';
}

function getText(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value.englishTranslation || value.englishTransliteration || value.hindi || '';
  }
  return '';
}

const SongDetails = ({
  data,
  language,
  onLanguageChange,
  songVersions = [],
  related = null,
}: {
  data: any;
  language: SongLanguage;
  onLanguageChange: (language: SongLanguage) => void;
  songVersions?: any[];
  related?: any;
}) => {
  const versionsSliderRef = useRef<HTMLDivElement | null>(null);
  // relatedTab state removed — now handled by RelatedSection component

  const scrollVersions = (direction: 'left' | 'right') => {
    if (!versionsSliderRef.current) return;
    const scrollAmount = 351.99;
    versionsSliderRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!data) return <Loader />;

  const title = getText(data.umbrellaTitle) || getText(data.song_title) || getText(data.songTitle) || 'Untitled';
  const titleTransliteration = getText(data.songTitleTransliteration) || getText(data.song_title_transliteration) || '';
  const singer_name = getText(data.singer_name) || getText(data.singer) || '';
  const year = getText(data.year) || getText(data.song_year) || '';
  const location = getText(data.location) || getText(data.song_location) || '';
  const interview_about = getText(data.interview_about) || '';
  const thumbnail = data.thumbnail_url || data.thumbnailUrl || '';
  const videoUrl = data.youtube_video_id || data.youtubeVideoId || '';
  const metaDescription = getText(data.metaDescription) || '';
  const poet = toEnglishPoet(getText(data.poet)) || '';
  const songnotes = data.songnotes || data.song_notes || '';
  const songLyricsTranslated = data.songLyricsTranslated || data.songLyricsNotes || '';
  const metaKeyword = getText(data.metaKeyword) || '';

  const versionCards = songVersions.map((item) => ({
    id: item?.id,
    umbrellaTitle:
      getText(item?.umbrellaTitleText) ||
      getText(item?.Songtitle_transliteration) ||
      getText(item?.umbrellaTitle) ||
      'Untitled',
    songTitle: getText(item?.songTitle) || getText(item?.songtitletraan) || '',
    singer: getText(item?.singer) || getText(item?.singer_display) || '',
    poet: toEnglishPoet(getText(item?.poet)) || '',
    image: item?.thumbnailUrl || item?.thumbnail_url || '',
    year: getText(item?.year) || getText(item?.song_year) || '',
  }));

  const videoId = extractYouTubeId(videoUrl);
  const bgImageUrl = '/song-bg-full.svg';
  const relatedData = related?.data || {};
  const relatedCounts = related?.counts || {};

  const normalizeImageUrl = (value?: string) => {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('http')) return value;
    if (value.startsWith('/')) return `${AJAB_API_BASE}${value}`;
    if (value.includes('.') || value.includes('/')) return `${AJAB_API_BASE}/${value}`;
    return '';
  };

  const relatedItems = useMemo(() => {
    const songs = (relatedData?.songs || []).map((item: any) => ({
      id: `song-${item?.id}`,
      type: 'songs',
      title: getText(item?.Songtitle_transliteration) || getText(item?.songTitleTransliteration) || getText(item?.song_title_transliteration) || getText(item?.umbrellaTitle) || getText(item?.songTitle) || 'Untitled Song',
      titleSecondary: getText(item?.songtitletraan) || '',
      subtitle: '',
      description: getText(item?.about) || '',
      image:
        normalizeImageUrl(item?.thumbnailUrl || item?.thumbnail_url) ||
        '/TN-About-Basavalingaiah-Hiremath.jpg',
    }));

    const poems = (relatedData?.poems || []).map((item: any) => ({
      id: `poem-${item?.id}`,
      type: 'poems',
      title: getText(item?.original_title) || 'Untitled Poem',
      titleSecondary: '',
      subtitle: getText(item?.attributed_poet) || getText(item?.poet_name) || '',
      description: getText(item?.thumbnail_excerpt) || getText(item?.meta_description) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl),
    }));

    const reflections = (relatedData?.reflections || []).map((item: any) => ({
      id: `reflection-${item?.id}`,
      type: 'reflections',
      title: getText(item?.title) || 'Untitled Reflection',
      titleSecondary: '',
      subtitle: getText(item?.person_name_english) || '',
      description: getText(item?.thumbnail_excerpt) || getText(item?.meta_description) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.person_thumbnail_url || item?.thumbnailUrl),
    }));

    const people = (relatedData?.people || []).map((item: any) => ({
      id: `people-${item?.id}`,
      type: 'other',
      title: getText(item?.person_name) || 'Untitled Person',
      titleSecondary: '',
      subtitle: getText(item?.category_name) || '',
      description: '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl),
    }));

    const films = (relatedData?.films || []).map((item: any) => ({
      id: `film-${item?.id}`,
      type: 'other',
      title: getText(item?.english_translation) || getText(item?.english_transliteration) || 'Untitled Film',
      titleSecondary: getText(item?.english_transliteration) || '',
      subtitle: getText(item?.director_name) || '',
      description: getText(item?.year_of_production) || '',
      image: normalizeImageUrl(item?.thumbnail_url || item?.thumbnailUrl),
    }));

    return { songs, poems, reflections, other: [...people, ...films] };
  }, [relatedData]);

  const allRelatedItems = useMemo(() => [
    ...relatedItems.songs,
    ...relatedItems.poems,
    ...relatedItems.reflections,
    ...relatedItems.other,
  ], [relatedItems]);

  const relatedTabs = useMemo(() => [
    { key: 'all', label: 'ALL', count: related?.total_related || 0 },
    { key: 'songs', label: 'SONGS', count: relatedCounts?.songs || 0 },
    { key: 'poems', label: 'POEMS', count: relatedCounts?.poems || 0 },
    { key: 'reflections', label: 'REFLECTIONS', count: relatedCounts?.reflections || 0 },
    { key: 'other', label: 'OTHER', count: (relatedCounts?.people || 0) + (relatedCounts?.films || 0) },
  ], [related, relatedCounts]);

  const [showNote, setShowNote] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);

  // Language script selection state
  const [script, setScript] = useState<'devanagari' | 'bar' | 'latin'>('bar');

  return (
    <FullBackground background={bgImageUrl || '/default-background.jpg'}>
      <div className="min-h-screen">
        <Header />
        <div
          style={{
            backgroundSize: '100% auto',
            padding: '4.5rem 0 7rem',
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
              <div className="song-details-content">
                <div className="max-w-6xl mx-auto px-4 pb-8">
                  {!!versionCards.length && (
                    <>
                      <p className="song-versions-count">{versionCards.length} Song Versions</p>
                      <div className="song-versions-slider-wrap">
                        {versionCards.length > 1 && (
                          <button
                            type="button"
                            className="song-slider-nav left"
                            aria-label="Previous versions"
                            onClick={() => scrollVersions('left')}
                          >
                            <ChevronLeft width={25.76} height={44.09} strokeWidth={2.4} />
                          </button>
                        )}
                        <div
                          ref={versionsSliderRef}
                          className={`song-dummy-cards ${versionCards.length > 1 ? 'is-slider' : 'single-card'}`}
                        >
                          {versionCards.map((card) => {
                            const thumb = normalizeImageUrl(card.image) || '/TN-About-Basavalingaiah-Hiremath.jpg';
                            return (
                            <div key={card.id} className="song-card-landing-p version-slide-card">
                              <a href={withAppBasePath(`/songs/details/${card.id}`)} className="version-card">
                                <div className="version-card-thumb">
                                  <img src={thumb} alt={card.umbrellaTitle} />
                                </div>
                                <div className="version-card-body">
                                  <div className="version-card-title">
                                    {card.umbrellaTitle}
                                    {card.year && <span className="version-card-year"> ({card.year})</span>}
                                  </div>
                                  {card.songTitle && (
                                    <div className="version-card-subtitle">{card.songTitle}</div>
                                  )}
                                  {card.singer && (
                                    <div className="version-card-meta">
                                      <span className="version-card-meta-label">sings </span>
                                      <span className="version-card-meta-name">{card.singer.toUpperCase()}</span>
                                    </div>
                                  )}
                                  {card.poet && (
                                    <div className="version-card-meta">
                                      <span className="version-card-meta-label">poet </span>
                                      <span className="version-card-meta-name">{card.poet.toUpperCase()}</span>
                                    </div>
                                  )}
                                </div>
                              </a>
                            </div>
                            );
                          })}
                        </div>
                        {versionCards.length > 1 && (
                          <button
                            type="button"
                            className="song-slider-nav right"
                            aria-label="Next versions"
                            onClick={() => scrollVersions('right')}
                          >
                            <ChevronRight width={25.76} height={44.09} strokeWidth={2.4} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {/* ================= SONG DETAILS CUSTOM LAYOUT ================= */}
                  <div className="songs-about" style={{ marginTop: 80 }}>
                    <div className="song-main-media-wrap">
                      {/* TOP ROW: Title, Singer, Location, Year */}
                      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'end', flexWrap: 'wrap', marginBottom: 6, width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <h1 className="song-title-line" style={{ fontFamily: 'Inter, sans-serif', fontSize: '28px', fontWeight: 400, fontStyle: 'normal', lineHeight: '100%', letterSpacing: 0, color: '#4F4F4F' }}>{getText(data.Songtitle_transliteration) || getText(data.songTitleTransliteration) || getText(data.song_title_transliteration) || title}</h1>
                          <span style={{ fontSize: '18px', color: '#828282' }}>sings</span>
                          {singer_name && <span className="song-singer" style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 400, fontStyle: 'normal', lineHeight: '100%', letterSpacing: 0, color: '#E31E79' }}>{singer_name}</span>}
                        </div>
                        <div className="song-location-year" style={{ marginLeft: 'auto' }}>
                          {location && <span>{location}</span>}
                          {year && <span>{year}</span>}
                        </div>
                      </div>

                      {/* MEDIA: Image or Video */}
                      {thumbnail && !videoId && (
                        <div className="song-main-media">
                          <img
                            src={normalizeImageUrl(thumbnail)}
                            alt={title}
                            className="song-main-media-img rounded-lg shadow-lg"
                          />
                        </div>
                      )}
                      {videoId && (
                        <div className="song-main-media">
                          <div className="song-main-video">
                            <LiteYouTubeEmbed
                              id={videoId}
                              title={title}
                              poster="maxresdefault"
                              noCookie
                            />
                          </div>
                        </div>
                      )}
                      {/* about below video */}
                      {data.about && (
                        <AboutClamp html={data.about} />
                      )}
                    </div>

                    {/* Script Switcher will only appear once below lyrics */}
                    {/* MEDIA: Image or Video */}
                    {/* {thumbnail && !videoId && (
                      <div className="flex justify-center my-6 border-top-pink">
                        <img
                          style={{ width: '100%' }}
                          src={`${AJAB_API_BASE}/${thumbnail}`}
                          alt={title}
                          className="rounded-lg shadow-lg w-80"
                        />
                      </div>
                    )}
                    {videoId && (
                      <div className="w-full max-w-4xl mx-auto my-6 border-top-pink">
                        <div className="aspect-video w-full">
                          <LiteYouTubeEmbed
                            id={videoId}
                            title={title}
                            poster="maxresdefault"
                            noCookie
                          />
                        </div>
                      </div>
                    )} */}
                    {/* INTERVIEW ABOUT */}
                    {/* {interview_about && (
                      <div className="song-interview-about" style={{ margin: '16px 0', fontStyle: 'italic', color: '#6d6e71', textAlign: 'center' }}>
                        {interview_about}
                      </div>
                    )} */}
                    {/* META DESCRIPTION */}
                    {/* <div
                      className="text-lg leading-relaxed text-center song-meta-description"
                      dangerouslySetInnerHTML={{
                        __html: metaDescription || '',
                      }}
                    /> */}
                  </div>
                  {/* ================= SONG LYRICS AND POPUPS ================= */}
                  <div className="mt-6">
                    {/* Script Switcher - Only once below lyrics */}
                    {/* <h2 className="text-xl font-semibold mb-2 text-center">Translated Lyrics:</h2> */}
                    <div className="song-lyrics-notes-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: 64, margin: '120px 0 0 0', justifyContent: 'center', width: '100%' }}>
                                              <div style={{ display: 'flex', gap: 64, justifyContent: 'center', width: '100%', marginBottom: 36 }}>
                                              <button
                                                className={script === 'devanagari' ? 'script-btn active' : 'script-btn'}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d8d8d8', borderRadius: '50%', width: 54, height: 54, background: '#fff', color: script === 'devanagari' ? '#ed1e79' : '#6d6e71', fontSize: 32, fontWeight: 400, cursor: 'pointer', padding: 0 }}
                                                onClick={() => setScript('devanagari')}
                                                aria-label="Devanagari"
                                              >
                                                <span style={{ width: '100%', textAlign: 'center', lineHeight: 1 }}>अ</span>
                                              </button>
                                              <button
                                                className={script === 'bar' ? 'script-btn active' : 'script-btn'}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d8d8d8', borderRadius: '50%', width: 54, height: 54, background: '#fff', color: script === 'bar' ? '#ed1e79' : '#6d6e71', fontSize: 32, fontWeight: 400, cursor: 'pointer', padding: 0 }}
                                                onClick={() => setScript('bar')}
                                                aria-label="Bar"
                                              >
                                                <span style={{ width: '100%', textAlign: 'center', lineHeight: 1 }}>ā</span>
                                              </button>
                                              <button
                                                className={script === 'latin' ? 'script-btn active' : 'script-btn'}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d8d8d8', borderRadius: '50%', width: 54, height: 54, background: '#fff', color: script === 'latin' ? '#ed1e79' : '#6d6e71', fontSize: 32, fontWeight: 400, cursor: 'pointer', padding: 0 }}
                                                onClick={() => setScript('latin')}
                                                aria-label="Latin"
                                              >
                                                <span style={{ width: '100%', textAlign: 'center', lineHeight: 1 }}>a</span>
                                              </button>
                                              </div>
                                            </div>
                      <div className="song-lyrics-column" style={{ maxWidth: 700, width: '100%' }}>
                        <h2 className="song-lyrics-title" style={{ fontFamily: 'Inter, sans-serif', fontSize: '36px', fontWeight: 400, fontStyle: 'normal', lineHeight: '100%', letterSpacing: 0, color: '#4F4F4F', marginBottom: '24px' }}>{getText(data.Songtitle_transliteration) || getText(data.songTitleTransliteration) || getText(data.song_title_transliteration) || title}</h2>
                        {poet && (
                          <p className="song-lyrics-poet song-singer" style={{ color: '#6F6F72', marginBottom: '40px' }}>
                            <span className="song-lyrics-poet-label" style={{ color: '#6F6F72', marginRight: '4px' }}>poet</span>
                            <span className="song-lyrics-poet-name" style={{ color: '#E31E79' }}>{poet}</span>
                          </p>
                        )}
                        <div
                          className="text-lg leading-relaxed text-center song-lyrics"
                          style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontStyle: 'normal',
                            fontSize: '20px',
                            lineHeight: '36px',
                            letterSpacing: '0%',
                            color: '#6F6F72',
                          }}
                          dangerouslySetInnerHTML={{
                            __html:
                              script === 'bar'
                                ? data.songLyricsOriginal || ''
                                : script === 'devanagari'
                                ? data.songLyricsTranslated || ''
                                : data.songLyricsNotes || '',
                          }}
                        />
                        {/* Notes & Glossary — only show if data exists */}
                        {(!!songnotes || !!data.songglossary) && (
                          <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center' }}>
                            {!!songnotes && (
                              <button
                                className="song-note-btn"
                                style={{
                                  color: showNote ? '#ed1e79' : '#828282',
                                  fontWeight: 500,
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={() => { setShowNote(true); setShowGlossary(false); }}
                              >
                                NOTES
                              </button>
                            )}
                            {!!data.songglossary && (
                              <button
                                className="song-glossary-btn"
                                style={{
                                  color: showGlossary ? '#ed1e79' : '#828282',
                                  fontWeight: 500,
                                  border: 'none',
                                  background: 'none',
                                  cursor: 'pointer',
                                }}
                                onClick={() => { setShowGlossary(true); setShowNote(false); }}
                              >
                                GLOSSARY
                              </button>
                            )}
                          </div>
                        )}
                        {showNote && !!songnotes && (
                          <NoteGlossaryPopup
                            title="Song Notes"
                            content={songnotes}
                            fallbackText="No notes available."
                            side="left"
                            onClose={() => setShowNote(false)}
                            isHtml
                          />
                        )}
                        {showGlossary && !!data.songglossary && (
                          <NoteGlossaryPopup
                            title="Glossary"
                            content={data.songglossary}
                            fallbackText="No glossary available."
                            side="right"
                            onClose={() => setShowGlossary(false)}
                            isHtml
                          />
                        )}
                      </div>
                    </div>
                    {!!(related?.total_related || 0) && (
                      <RelatedSection
                        items={allRelatedItems}
                        tabs={relatedTabs}
                        initialLimit={3}
                      />
                    )}
                    {metaKeyword && (
                      <div
                        className="song-meta-keyword"
                        dangerouslySetInnerHTML={{ __html: metaKeyword }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </FullBackground>
  );
};

export default SongDetails;

function AboutClamp({ html }: { html: string }) {
  const [expanded, setExpanded] = useState(false);
  const fontSize = 20;
  const lineHeight = 30;
  const maxHeight = lineHeight * 3;

  const baseStyle: React.CSSProperties = {
    textAlign: 'left',
    margin: '60px 0 0',
    color: '#4F4F4F',
    width: '100%',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontWeight: 300,
    fontStyle: 'normal',
    fontSize: `${fontSize}px`,
    lineHeight: `${lineHeight}px`,
    letterSpacing: '0%',
  };
  const clampedStyle: React.CSSProperties = expanded
    ? baseStyle
    : {
        ...baseStyle,
        maxHeight: `${maxHeight}px`,
        overflow: 'hidden',
      };

  return (
    <div style={{ width: '100%' }}>
      <div style={clampedStyle} dangerouslySetInnerHTML={{ __html: html }} />
      {!expanded && (
        <div style={{ marginTop: 4 }}>
          <button
            onClick={() => setExpanded(true)}
            style={{
              color: '#E31E79',
              fontFamily: "'Merriweather Sans', sans-serif",
              fontWeight: 300,
              fontStyle: 'normal',
              fontSize: '20px',
              lineHeight: '100%',
              letterSpacing: '0%',
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
            }}
          >
            ...more
          </button>
        </div>
      )}
    </div>
  );
}
