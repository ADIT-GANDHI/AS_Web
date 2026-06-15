'use client';

import Image from 'next/image';
import Link from 'next/link';
import '../../../styles/CustomStyle.css';
import './Poem.css';

export default function Poem({ data }) {
  if (!data) return null;


  console.log('poem  data : ',data);
  const stripHtml = (s: string = '') =>
    s.replace(/<br\s*\/?>/gi, '\n')
     .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
     .replace(/<[^>]+>/g, '')
     .trim();

  const rawHeading = data.english_transliteration_text || data.couplet_transliteration || '';
  const heading = stripHtml(rawHeading);

  const metaDescription = stripHtml(data.english_translation_text || data.couplet_translation || '');

  const poets = data.poet_id_raw || '';

console.log('meta description ',metaDescription);
console.log('meta description ',heading);
console.log('meta description ',poets);




  
  // Data from the screenshot
//   const poemData = {
//     id: 'amir-khusro-maati-kahe',
//     poets: [
//       {
//         name: 'AMIR KHUSRO',
//       },
//     ],
//     heading: 'The potter tells the earth - Thus and thus I pound you...',
//     metaDescription: `Maati kahe kumhaar se 
// tu kya roondat moye? Ik din aisa aayega, main rondungi toyev The potter tells the earth`,
//   };

  const hasMedia = false;

  return (
    <div className="full-width">
      <div
        className="bg-white poem-card-box-wrapper card-rounded-4 shadow-lg hover:shadow-xl transition-shadow duration-300 home-card-hover"
        style={{ width: "482.42px", height: "400.99px", opacity: 1, borderWidth: "1px" }}
      >
        {/* Card content */}
        <div
          className={`p-5 card-shape-top pt-1 pb-0 ${
            !hasMedia ? 'flex flex-col items-center text-center' : ''
          }`}
          style={{ height: '397.88px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
        {/* Poem text */}
          <p
            className="mb-4 whitespace-pre-line overflow-hidden text-ellipsis"
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '24px',
              lineHeight: '35px',
              letterSpacing: '0%',
              color: '#6D6E71',
              width: '300px',
              minHeight: '31px',
              marginTop: '20px',
              marginBottom: '32px',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {heading}
          </p>
          <div
            className="whitespace-pre-line overflow-hidden text-ellipsis"
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 500,
              fontStyle: 'italic',
              fontSize: '24px',
              lineHeight: '35px',
              letterSpacing: '0%',
              color: '#333333',
              opacity: 1,
              width: '340px',
              marginBottom: '20px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {metaDescription}
          </div>

          {/* Poet name with border */}
          <div className="mb-2 border-top-pink">
            {poets && (
              <p className="poet-line uppercase mb-3">
                <span className="lowercase">poet</span> {poets}
              </p>
            )}
          </div>

          {/* Explore poem link */}
          <div className="justify-self-stretch justify-end" style={{ position: 'absolute', bottom: '-6px', right: '20px' }}>
            <Link
              href={`/poems`}
              className="explore-link pink hover:text-pink-700 transition-colors z-20 uppercase"
            >
              {`EXPLORE POEM`}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
