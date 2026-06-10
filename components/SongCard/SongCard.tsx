'use client';

import Image from 'next/image';
import Link from 'next/link';
import '../../styles/CustomStyle.css';
import { Song } from './types';

const YOUTUBE_URL = 'https://www.youtube.com/embed';

export default function SongCard(item: Song) {
  const hasMedia = item.youtubeVideoId || item.thumbnailURL;

  return (
    <div
      className={`bg-white card-rounded-4 shadow-lg hover:shadow-xl transition-shadow duration-300 ${
        !hasMedia ? 'no-media-card' : ''
      }`}
    >
      {/* Media */}
      {hasMedia && (
        <div className="relative w-full video-custom-width">
          {item.youtubeVideoId ? (
            <iframe
              src={`${YOUTUBE_URL}/${item.youtubeVideoId}`}
              title={item.metaTitle}
              className="h-full w-full frame-radius"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <Image src={item.thumbnailURL} alt={item.metaTitle} fill className="object-cover" />
          )}
        </div>
      )}

      {/* Card content */}
      <div
        className={`p-5 card-shape-top pt-1 pb-0 ${
          !hasMedia ? 'flex flex-col items-center text-center' : ''
        }`}
      >
        <div className="mb-2">
          <h3 className="card-heading font-semibold mb-1">{item.metaTitle}</h3>
          {item.songTitle.englishTranslation && (
            <p className="text-sm lora-italic mb-2 semi-heading">
              {item.songTitle.englishTranslation}
            </p>
          )}
          {item.poets[0]?.name && (
            <p className="text-xs semi-heading-2 font-medium text-gray-500 uppercase tracking-wide mb-3">
              <span className="lowercase">says</span> {item.poets[0]?.name}
            </p>
          )}
        </div>

        <p className="card-text leading-relaxed mb-4 border-top-pink">{item.metaDescription}</p>

        <div className={`${!hasMedia ? 'justify-center' : 'justify-end'} flex`}>
          <Link
            href={`/${item.id}/${item?.songTitle?.englishTransliteration.replace(' ', '-')}`}
            className="text-sm font-medium pink hover:text-pink-700 transition-colors z-20 uppercase"
          >
            {`EXPLORE REFLECTIONS`}
          </Link>
        </div>
      </div>
    </div>
  );
}
