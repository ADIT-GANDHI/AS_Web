'use client';

import Link from 'next/link';
import { resolveCmsAssetUrl } from '@/lib/resolveCmsAssetUrl';
import WavyCard from '@/components/shared/WavyCard';
import { toEnglishPoet } from './poetTransliteration';
import './CLSongs.css';

// Songs listing card — wraps the shared WavyCard and supplies Song-specific
// title / subtitle / meta classes. The whole card is wrapped in `next/link`
// so navigation works reliably (no invisible overlays blocking div onClick).

export default function CLSongCard(item: any) {
  const thumbnail = resolveCmsAssetUrl(item.thumbnailUrl || item.thumbnail_url);

  // Standard fallback chain for singer data from different CMS structures
  const rawSinger = item.singer_display || item.singer || (Array.isArray(item.singer_names) ? item.singer_names[0] : item.singer_names) || '';
  const singerDisplay = rawSinger ? String(rawSinger).toUpperCase() : '';
  const poetDisplay = item.poet ? toEnglishPoet(item.poet).toUpperCase() : '';

  const inner = (
    <WavyCard
      imageSrc={thumbnail}
      imageAlt={item.Songtitle_transliteration || 'Song thumbnail'}
      insetThumb
      className="cl-song-card"
      bodyClassName="cl-song-card-body"
    >
      <div className="cl-song-card-title">
        {item.Songtitle_transliteration || '\u00A0'}
      </div>

      <div className="cl-song-card-subtitle">{item.songtitletraan || ''}</div>

      {singerDisplay && (
        <div className="cl-song-card-meta" title={singerDisplay}>
          <span className="cl-song-card-meta-label">sings </span>
          <span className="cl-song-card-meta-value">{singerDisplay}</span>
        </div>
      )}

      {poetDisplay && (
        <div className="cl-song-card-meta" title={poetDisplay}>
          <span className="cl-song-card-meta-label">poet </span>
          <span className="cl-song-card-meta-value">{poetDisplay}</span>
        </div>
      )}
    </WavyCard>
  );

  if (item.id == null || item.id === '') {
    return inner;
  }

  return (
    <Link href={`/songs/details/${item.id}`} prefetch={false} className="cl-song-card-link">
      {inner}
    </Link>
  );
}
