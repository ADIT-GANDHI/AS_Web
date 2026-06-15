'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import '../../../styles/CustomStyle.css';

const YOUTUBE_URL = 'https://www.youtube.com/embed';

export default function People({ data }) {
  if (!data) return null;

  // ✅ Fetch data (As per your requirement)
  const thumbnail_url = data.thumbnail_url
    ? data.thumbnail_url.startsWith('/')
      ? `${AJAB_API_BASE}${data.thumbnail_url}`
      : `${AJAB_API_BASE}/${data.thumbnail_url}`
    : null;

  const title = data.meta_title;
  const description = data.meta_description;

  const personName =
    data.person_name_english || data.person_name_hindi || "Unknown Person";

  const subtitle = data.category_type || "Oral Tradition";

  console.log("People data:", data);

  return (
    <div
      className="bg-white card-rounded-4 shadow-lg hover:shadow-xl transition-shadow duration-300 home-card-hover"
      style={{ width: "445.95px", opacity: 1 }}
    >
      
      {/* Media */}
      <div className="relative vide-custom-width" style={{ width: '438px', height: '229.73px' }}>
        {thumbnail_url ? (
          <Image
            src={thumbnail_url}
            alt={title || personName}
            fill
            className="object-cover rounded-t-lg"
          />
        ) : (
          <div className="h-full w-full bg-gray-300 flex items-center justify-center">
            {/* <span>No Thumbnail</span> */}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 card-shape-top pt-1 pb-0">

        <div className="mb-2">
          <h3
            className="card-heading mb-1 line-clamp-1 overflow-hidden text-ellipsis"
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

          {subtitle && (
            <p className="text-sm lora-italic mb-2 semi-heading line-clamp-1 overflow-hidden text-ellipsis">
              {subtitle}
            </p>
          )}
        </div>

        <p className="card-text leading-relaxed mb-4 border-top-pink line-clamp-5 overflow-hidden text-ellipsis">
          {description}
        </p>

        <div className="justify-end flex" style={{ position: 'absolute', bottom: '-2px', right: '20px', zIndex: 50 }}>
          <Link
            href={`/people/${data.id}`}
            className="explore-link pink hover:text-pink-700 transition-colors z-20 uppercase"
          >
            EXPLORE PEOPLE
          </Link>
        </div>

      </div>
    </div>
  );
}
