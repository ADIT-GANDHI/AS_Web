'use client';

import Link from 'next/link';
import '@/styles/CustomStyle.css';

export default function ReflectionsCard(item) {
  // API fields
  const title = typeof item.metaTitle === 'object' ? item.metaTitle.englishTranslation || '' : item.metaTitle;
  const verb = item.verb || '';
  const speakerName = typeof item.speaker === 'object' && item.speaker?.name ? item.speaker.name : typeof item.speaker === 'string' ? item.speaker : '';
  const thumbnailExcerpt = item.thumbnailExcerpt || item.thumbnail_excerpt || '';
  const thumbnail = item.thumbnailURL || '';
  const hideFormatTag = item.hideFormatTag || false;

  const formatTag = String(item.contentType || '').trim().toUpperCase();

  return (
    <Link
      href={`/reflections/details/${item.id}`}
      className="bg-white card-rounded-4 shadow-lg reflections-card transition-shadow duration-300"
      style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
    >
      {/* Media Section with format tag */}
      <div className="relative w-full video-custom-width">
        {thumbnail ? (
          <img src={thumbnail} alt={title || 'Reflection image'} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full bg-[#dcdcdc]" />
        )}

        {/* Format Tag — bottom right overlay */}
        {formatTag && !hideFormatTag && (
          <span className="rc-format-tag">{formatTag}</span>
        )}
      </div>

      {/* Card Content Section */}
      <div className="p-5 card-shape-top pt-1 pb-0 flex flex-col items-start">
        <div className="mb-2">
          {title && <h3 className="reflections-card-heading font-semibold mb-1 line-clamp-3">{title}</h3>}
          {(verb || speakerName) && (
            <div className="rc-verb-line">
              {verb && <span className="rc-verb">{verb}</span>}
              {speakerName && <span className="reflections-semi-heading" style={{ margin: 0 }}>{speakerName}</span>}
            </div>
          )}
          {thumbnailExcerpt && (
            <div
              className="text-xs text-gray-600 italic mb-1 line-clamp-4"
              style={{ fontSize: '11px', lineHeight: '1.45', color: '#6F7071' }}
            >
              {thumbnailExcerpt}
            </div>
          )}
        </div>

        <div className="w-full justify-end flex reflections-card-footer">
          <span className="reflections-card-link uppercase">
            {formatTag || 'INTERVIEW'}
          </span>
        </div>
      </div>
    </Link>
  );
}
