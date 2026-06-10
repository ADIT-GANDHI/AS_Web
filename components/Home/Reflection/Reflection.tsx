'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import '../../../styles/CustomStyle.css';

export default function Reflection({ data }) {
  if (!data) return null;

  const title = data.title;
  const description = data.meta_description;
  const speaker_id = data.speaker_id;
  const person_name = data.person_name ; 

  // ✅ Only change here — prepend base URL
  const thumbnail = data.thumbnail_url
    ? data.thumbnail_url.startsWith('/')
      ? `${AJAB_API_BASE}${data.thumbnail_url}`
      : `${AJAB_API_BASE}/${data.thumbnail_url}`
    : null;

  const youtubeVideoId = data.youtube_video_id || null;

  console.log("Thumbnail URL:", thumbnail);

  return (
    <div
      className="bg-white card-rounded-4 shadow-lg hover:shadow-xl transition-shadow duration-300 home-card-hover"
      style={{ width: "445.95px", opacity: 1, position: 'relative' }}
    >

      {/* Media */}
      <div className="relative vide-custom-width" style={{ width: '438px', height: '229.73px' }}>
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover rounded-t-lg"
          />
        ) : youtubeVideoId ? (
          <Image
            src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
            alt={title}
            fill
            className="object-cover rounded-t-lg"
          />
        ) : null}
      </div>

      {/* Content */}
      <div className="p-5 card-shape-top pt-1 pb-0">
        <div className="mb-2">
          <h3
            className="card-heading mb-1 line-clamp-2"
            style={{
              color: '#e31e79',
              fontFamily: "'Lora', sans-serif",
              fontSize: '32px',
              fontWeight: 400,
              fontStyle: 'normal',
              lineHeight: '38.4px',
              letterSpacing: '0',
            }}
          >
            {title}
          </h3>

          {speaker_id && (
            <p className="text-xs semi-heading-2 font-medium text-gray-500 mb-3 line-clamp-1">
              says {speaker_id}
            </p>
           
          )}
         
          <div>
          {person_name && (
            <p className="text-xs semi-heading-2 font-medium text-gray-500 mb-3 line-clamp-1">
              about {person_name}
            </p>
          )}
        </div>

        </div>

        
           
        <p className="card-text leading-relaxed mb-4 border-top-pink line-clamp-5">
          {description}
        </p>

        <div className="justify-end flex" style={{ position: 'absolute', bottom: '-8px', right: '20px', zIndex: 50 }}>
          <Link
            href={`/reflections/details/${data.id}`}
            className="explore-link pink hover:text-pink-700 transition-colors uppercase"
          >
            EXPLORE REFLECTION
          </Link>
        </div>
      </div>
    </div>
  );
}
