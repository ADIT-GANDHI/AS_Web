// components/Films/index.tsx
'use client';

import Loader from '@/components/Loader';
import useFilms, { FilmListItem } from '@/hooks/use-films';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FILMS_CONSTANTS } from './constants';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import './Films.css';

const resolveFilmImageUrl = (thumbnailUrl?: string) => {
  if (!thumbnailUrl) return '';
  if (/^https?:\/\//i.test(thumbnailUrl)) return thumbnailUrl;
  if (thumbnailUrl.startsWith('/')) return `${AJAB_API_BASE}${thumbnailUrl}`;
  return `${AJAB_API_BASE}/${thumbnailUrl}`;
};
  
const PAGE_SIZE = 10;

const Films = () => {
  const { films = [], isLoading } = useFilms();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const visibleFilms = films.slice(0, visibleCount);
  const hasMore = visibleCount < films.length;

  useEffect(() => {
    if (!hasMore) return;
    const node = loaderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visibleFilms.length]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="mt-8">
          {/* Main Content */}
          <div className="max-w-[1200px] mx-auto px-4 pb-8">
            {/* Films Count */}
            <div className="text-left mb-2">
              <h1 className="films-heading-text">{films?.length || 0} films</h1>
            </div>

            {/* Film Introduction */}
            <div className="sub-heading-intro">{FILMS_CONSTANTS.FILMS_INTRO}</div>
            <div className="text-center films-about">{FILMS_CONSTANTS.FILMS_DESCRIPTION}</div>

            {/* Results */}
            <div className="people-inner-card-container">
              {films.length
                ? visibleFilms.map((item: FilmListItem, index) => (
                    <Link key={item.id} href={`/films/details/${item.id}`} className="block">
                      {/* Result Item */}
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image */}
                        <div className="flex-shrink-0 w-full md:w-[422px] h-[220px] people-banner-shadow">
                          <div className="bg-gray-200 overflow-hidden h-[203px] relative">
                            {item?.thumbnailUrl ? (
                              <Image
                                src={resolveFilmImageUrl(item.thumbnailUrl)}
                                alt={item?.mainTitle || 'Film image'}
                                fill
                                sizes="(max-width: 768px) 100vw, 442px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center relative">
                                <span className="text-gray-500">No Image</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <h2 className="films-page-heading">
                            {item?.mainTitle}
                            {item?.secondTitle && (
                              <span className="films-second-title">{item.secondTitle}</span>
                            )}
                          </h2>

                          {item?.directorName && (
                            <p className="films-directed-title">
                              by <span className="films-director-name">{item.directorName}</span>
                            </p>
                          )}

                          <p className="films-date">
                            {item?.duration && <span>{item.duration} mins</span>}
                            {item?.year && `, ${item.year}`}
                            {item?.filmLanguage && `, available in ${item.filmLanguage}`}
                          </p>

                          <hr className="my-3 films-separator" />

                          {item?.about && (
                            <div
                              className="film-card-text mb-3 line-clamp-3"
                              dangerouslySetInnerHTML={{ __html: item.about }}
                            />
                          )}

                          <div className="text-pink films-trailer">
                            trailer <span>|</span> film &amp; more
                          </div>
                        </div>
                      </div>
                      {/* Hide separator for last item */}
                      <div className="card-separator"></div>
                    </Link>
                  ))
                : !isLoading && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">No films found</p>
                    </div>
                  )}
              {hasMore && (
                <div ref={loaderRef} className="text-center mt-6 py-4">
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Films;
