'use client';

import { useRouter } from 'next/navigation';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import '../../styles/CustomStyle.css';
import { toEnglishPoet } from './poetTransliteration';

export default function SongCard(item: any) {

  const router = useRouter();


  // If thumbnailUrl is a full URL, use it directly; otherwise, prepend base URL
  let thumbnail = item.thumbnailUrl || '/TN-About-Basavalingaiah-Hiremath.jpg';
  if (thumbnail && !/^https?:\/\//i.test(thumbnail)) {
    thumbnail = thumbnail.startsWith('/')
      ? `${AJAB_API_BASE}${thumbnail}`
      : `${AJAB_API_BASE}/${thumbnail.replace(/^\/+/, '')}`;
  }

  const description = item.about
    ? item.about.replace(/<[^>]+>/g, "")
    : "";
console.log("SongCard Description:",item);

  // ⭐ Click Handler
  const handleClick = () => {
    if (!item.id) {
      console.error("Song ID not found");
      return;
    }
    router.push(`/songs/details/${item.id}`);
  };

  return (
    <div
      className="bg-white song-card-list shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div
        className="video-custom-width"
        style={{
          width: '280px',
          height: '156.17px',
          maxWidth: '280px',
          padding: 0,
          overflow: 'hidden',
          opacity: 1,
          boxSizing: 'border-box',
        }}
      >
        <img
          src={thumbnail}
          alt={item.song_title || "Song thumbnail"}
          className="object-cover"
          style={{ width: '280px', height: '156.17px', objectFit: 'cover', display: 'block' }}
        />
      </div>
      {/* Content styled as per reference image */}
      <div className="px-3 pt-2 pb-2 card-shape-top">
        <div className="mb-1">
          {/* Songtitle_transliteration (Pink, Bold, Large) */}
          {item.Songtitle_transliteration && (
            <div
              style={{
                color: '#E31E79',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '24px',
                lineHeight: '1.2',
                letterSpacing: '0%',
                width: '240px',
                wordBreak: 'break-word',
                marginBottom: 8,
              }}
            >
              {item.Songtitle_transliteration}
            </div>
          )}
          {/* songtitletraan (Gray, Italic Lora) */}
          {item.songtitletraan && (
            <div
              style={{
                color: '#828282',
                fontFamily: "'Inter', sans-serif",
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '20px',
                lineHeight: '100%',
                letterSpacing: '0%',
                marginBottom: 12,
              }}
            >
              {item.songtitletraan}
            </div>
          )}
          {/* Sings and Singer */}
          <div style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '16px', lineHeight: '100%', letterSpacing: '0%', color: '#4F4F4F', fontWeight: 300, fontStyle: 'normal', marginBottom: 6}}>
            <span>sings </span>
            <span>{item.singer || ''}</span>
          </div>
          {/* Poet */}
          <div style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '16px', lineHeight: '100%', letterSpacing: '0%', color: '#4F4F4F', fontWeight: 300, fontStyle: 'normal' }}>
            <span>poet </span>
            <span>{item.poet ? toEnglishPoet(item.poet) : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


// 'use client';

// import Image from 'next/image';
// import '../../styles/CustomStyle.css';
// import { Song } from '../Home/SongCard/types';

// export default function SongCard(item: Song) {
//   // Local image data (can be replaced later with dynamic array)
//   const searchData = {
//     results: [
//       {
//         id: 1,
//         image: '/TN-About-Basavalingaiah-Hiremath.jpg', // image from /public folder
//       },
//     ],
//   };

//   // ✅ Always use image from array
//   const thumbnail = searchData.results[0].image;

//   return (
//     <div className="bg-white song-card-list shadow-lg hover:shadow-xl transition-shadow duration-300">
//       {/* Always show an image */}
//       <div className="relative w-full h-[156px] video-custom-width">
//         <Image
//           src={thumbnail}
//           alt={item.metaTitle || 'Song thumbnail'}
//           width={400}
//           height={136}
//           className="object-cover  w-full h-full"
//           priority
//         />
//       </div>

//       {/* Card content */}
//       <div className="p-5 card-shape-top pt-1 pb-0">
//         <div className="mb-2">
//           <h3 className="song-card-heading line-clamp-2 overflow-hidden text-ellipsis">
//             {item.metaTitle}
//           </h3>

//           {item.poets?.[0]?.name && (
//             <p className="song-semi-heading line-clamp-1 overflow-hidden text-ellipsis">
//               {item.poets[0].name}
//             </p>
//           )}
//         </div>

//         <p className="son-card-text line-clamp-2 overflow-hidden text-ellipsis">
//           {item.metaDescription}
//         </p>
//       </div>
//     </div>
//   );
// }
