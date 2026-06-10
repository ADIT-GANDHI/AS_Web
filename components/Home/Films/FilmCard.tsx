'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

export default function FilmCard({ data }) {
  if (!data) return null;

  // ✔ Thumbnail full URL
  const thumbnail = data.thumbnail_url
    ? data.thumbnail_url.startsWith('/')
      ? `${AJAB_API_BASE}${data.thumbnail_url}`
      : `${AJAB_API_BASE}/${data.thumbnail_url}`
    : null;

  const title = data.english_transliteration;
  const director = data.directors;
  const meta_description = data.thumbnail_excerpt;
  const description = data.description;
  const secondTitle = data.second_title;
  const youtubeId = data.youtube_video_id;

  console.log("FilmCard data:", data);

  return (
    <div
      className="bg-white card-rounded-4 shadow-lg hover:shadow-xl transition-shadow duration-300 home-card-hover"
      id={data.id}
      style={{ width: "445.95px", opacity: 1 }}
    >

      {/* Video or Thumbnail */}
      <div className="relative vide-custom-width" style={{ width: '438px', height: '229.73px' }}>
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title={title}
            className="rounded-t-lg"
            style={{ width: '100%', height: '100%', border: 0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover rounded-t-lg"
          />
        ) : (
          <div className="h-full w-full bg-gray-200 flex items-center justify-center rounded-t-lg">
            <span>No Thumbnail</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 card-shape-top pt-1 pb-0" style={{ position: 'relative' }}>
        <div className="mb-2">
          <h3
            className="font-semibold mb-1"
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 400,
              fontStyle: 'normal',
              fontSize: '32px',
              lineHeight: '38.4px',
              letterSpacing: '0%',
              color: '#E31E79',
              height: '39px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </h3>

          <p
            className="mb-3"
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '24px',
              lineHeight: '28.8px',
              letterSpacing: '0%',
              color: '#6D6E71',
              marginTop: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            {secondTitle}
          </p>

          {director && (
            <p className="text-xs semi-heading-2 font-medium text-gray-500 uppercase tracking-wide mb-3 line-clamp-1">
              A film by {director}
            </p>
          )}
        </div>

        <p
          className="leading-relaxed mb-4 border-top-pink line-clamp-4"
          style={{
            color: '#6D6E71',
            width: '399px',
            height: '152px',
            fontSize: '18px',
          }}
        >
          <span dangerouslySetInnerHTML={{ __html: meta_description }} />
        </p>

        <div className="justify-end flex" style={{ position: 'absolute', bottom: '-2px', right: '20px', zIndex: 50 }}>
          <Link
            href={`/films/details/${data.id}`}
            className="explore-link pink hover:text-pink-700 transition-colors z-20 uppercase relative"
          >
            EXPLORE FILM
          </Link>
        </div>
      </div>
    </div>
  );
}
