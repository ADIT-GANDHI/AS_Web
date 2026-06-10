'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import '../../../styles/CustomStyle.css';

const YOUTUBE_URL = 'https://www.youtube.com/embed';

export default function SongCard({
  id,
  umbrellaTitle,
  songTitle,
  songtitletraan,
  Songtitle_transliteration,
  singer,
  poet,
  thumbnailUrl,
  metaDescription,
  youtubeVideoId,

  // if API sends later
}) {
  // Check if media exists
  const hasMedia = youtubeVideoId || thumbnailUrl;
  console.log('Thumbnail URL:', thumbnailUrl ? `${AJAB_API_BASE}/${String(thumbnailUrl).replace(/^\/+/, '')}` : '');

  return (
    <div id={id}
      className={`bg-white card-rounded-4 shadow-lg hover:shadow-xl transition-shadow duration-300 home-card-hover ${
        !hasMedia ? 'no-media-card' : ''
      }`}
      style={{
        width: hasMedia ? "445.95px" : "fit-content",
        marginLeft: hasMedia ? "200px" : "auto",
        opacity: 1,
      }}
    >
      {/* Media (Video OR Thumbnail) */}
      {hasMedia && (
        <div className="relative vide-custom-width" style={{ width: '438px', height: '229.73px' }}>
          <Image
            src={
              thumbnailUrl && /^https?:\/\//i.test(thumbnailUrl)
                ? thumbnailUrl
                : thumbnailUrl
                ? `${AJAB_API_BASE}/${thumbnailUrl.replace(/^\/+/, '')}`
                : '/placeholder.svg'
            }
            alt={umbrellaTitle}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
      )}
       

      {/* Content */}
      <div
        className={`p-5 card-shape-top pt-1 pb-0 ${
          !hasMedia ? 'flex flex-col items-center text-center' : ''
        }`}
        style={{ position: 'relative' }}
      >
        <div className="mb-2">

          {/* Title */}
          <h3
            className="card-heading home-song-title mb-1"
            style={{
              marginTop: '-8px',
              color: '#e31e79',
              fontFamily: "Lora",
              fontSize: '32px',
              fontWeight: 400,
              fontStyle: 'normal',
              lineHeight: '38.4px',
              letterSpacing: '0',
            }}
          >
            {Songtitle_transliteration}
          </h3>
            
          {/* Singer */}
          <p
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '24px',
              lineHeight: '28.8px',
              letterSpacing: '0px',
              color: '#6D6E71',
              marginTop: '-2px',
              marginBottom: '10px',
            }}
          >
            {songTitle}
          </p>
          {songtitletraan && (
            <p
              style={{
                fontFamily: "'Lora', serif",
                fontWeight: 400,
                fontStyle: 'italic',
                fontSize: '24px',
                lineHeight: '28.8px',
                letterSpacing: '0px',
                color: '#6D6E71',
                marginTop: '-6px',
                marginBottom: '10px',
              }}
            >
              {songtitletraan}
            </p>
          )}
          <p
            className="uppercase tracking-wide mb-0"
            style={{
              fontFamily: "'Merriweather Sans', sans-serif",
              fontWeight: 300,
              fontStyle: 'normal',
              fontSize: '18px',
              lineHeight: '100%',
              letterSpacing: '0%',
              color: '#6D6E71',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              paddingTop: '0px',
              paddingBottom: '0px',
              marginTop: '-4px',
            }}
          >
            <span className="lowercase">sing</span> {singer || ''}
          </p>
        </div>
            {/* {poet} */}
            <p
              className="uppercase tracking-wide mb-3"
              style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontWeight: 300,
                fontStyle: 'normal',
                fontSize: '18px',
                lineHeight: '100%',
                letterSpacing: '0%',
                color: '#6D6E71',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingTop: '2px',
                paddingBottom: '0px',
              }}
            >
              <span className="lowercase">poet</span> {poet || ''}
            </p>
        {/* Description (HTML allowed) */}
        <p
          className="card-text leading-relaxed mb-4 border-top-pink line-clamp-5 overflow-hidden text-ellipsis"
          style={{
            width: '405px',
            borderTop: '1px solid #E31E79',
            opacity: 1,
            fontFamily: "'Merriweather Sans', sans-serif",
            fontWeight: 300,
            fontStyle: 'normal',
            fontSize: '18px',
            lineHeight: '25.2px',
            letterSpacing: '0%',
            color: '#6D6E71',
          }}
          dangerouslySetInnerHTML={{ __html: metaDescription }}
        >
        </p>

        <div className={`${!hasMedia ? 'justify-center' : 'justify-end'} flex`} style={{ position: 'absolute', bottom: '-6px', right: '20px' }}>
          <Link
            href={`/songs/details/${id}`}
            className="explore-link pink hover:text-pink-700 transition-colors z-20 uppercase"
            style={{
              fontFamily: "'Merriweather Sans', sans-serif",
              fontWeight: 300,
              fontStyle: 'normal',
              fontSize: '16px',
              lineHeight: '100%',
              letterSpacing: '5%',
              color: '#E31E79',
            }}
          >
            EXPLORE SONG
          </Link>
        </div>
      </div>
    </div>
  );
}
