'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';
import './SearchResults.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { SEARCH_ENDPOINT, emptySearchResponse, normalizeSearchPayload, type SearchApiResponse } from '@/lib/utils/search';

type SearchCategory = 'songs' | 'poems' | 'reflections' | 'people' | 'films';
type FilterKey = 'ALL' | Uppercase<SearchCategory>;

// [Claude] these changes have been recommended by claude — removed OTHER (always 0, no backing data)
const FILTER_ORDER: FilterKey[] = ['ALL', 'SONGS', 'POEMS', 'REFLECTIONS', 'PEOPLE', 'FILMS'];
const CATEGORY_ORDER: SearchCategory[] = ['songs', 'poems', 'reflections', 'people', 'films'];
const ASSET_BASE_URL = `${AJAB_API_BASE}/uploads`;

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\\n/g, ' ')       // literal \n sequences from API
    .replace(/\r?\n/g, ' ')     // actual newlines
    .replace(/\s+/g, ' ')
    .trim();

const getPrimaryText = (item: Record<string, any>, category: SearchCategory) => {
  if (category === 'people') {
    return (
      item.person_name_english ||
      item.person_name ||
      item.person_name_hindi ||
      item.name ||
      'Untitled'
    );
  }
  if (category === 'songs') {
    return (
      item.umbrellaTitleText ||
      item.Songtitle_transliteration ||
      item.song_title_english ||
      item.songTitle ||
      item.english_transliteration ||
      item.english_translation ||
      item.meta_title ||
      item.metaTitle ||
      'Untitled'
    );
  }
  if (category === 'poems') {
    return (
      item.original_title ||
      item.poem_title_english ||
      item.poem_title ||
      item.couplet_transliteration ||
      item.title ||
      item.english_translation ||
      'Untitled'
    );
  }
  if (category === 'reflections') {
    return item.title || item.reflection_title_english || item.reflection_title || 'Untitled';
  }
  if (category === 'films') {
    return (
      item.film_title_english ||
      item.english_transliteration ||
      item.english_translation ||
      item.title ||
      'Untitled'
    );
  }
  return item.title || item.name || 'Untitled';
};

const getSecondaryText = (item: Record<string, any>) => {
  return (
    item.subtitle ||
    item.poet ||
    item.director_name_english ||
    item.singer ||
    item.song_title_hindi ||
    item.poem_title_hindi ||
    item.reflection_title_hindi ||
    item.film_title_hindi ||
    ''
  );
};

const getDescriptionText = (item: Record<string, any>) => {
  const description =
    item.description ||
    item.about_text ||
    item.about ||
    item.couplet_translation ||
    item.couplet_transliteration ||
    item.metaDescription ||
    item.short_description ||
    item.meta_description ||
    item.person_name_english ||
    item.profile ||
    item.summary;

  if (description) {
    return stripHtml(String(description));
  }

  // [Claude] these changes have been recommended by claude — fixed typo: was `sing ${item.singer}`
  if (item.singer) {
    return `Singer: ${item.singer}`;
  }

  return '';
};

const getImageUrl = (item: Record<string, any>) => {
  const source =
    item.thumbnail_image_upload ||
    item.thumbnail_url ||
    item.thumbnailUrl ||
    item.thumbnailURL ||
    item.thumbnail ||
    item.image ||
    item.profile_image ||
    item.cover_image ||
    '';

  if (source) {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return source;
    }
    // Paths like "/images/..." are relative to the API base (not /uploads/)
    if (source.startsWith('/')) {
      return `${AJAB_API_BASE}${source}`;
    }
    return `${ASSET_BASE_URL}/${source}`;
  }

  // Songs fallback: derive thumbnail from YouTube video ID
  if (item.youtube_video_id || item.youtubeVideoId) {
    const ytId = item.youtube_video_id || item.youtubeVideoId;
    return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
  }

  return '';
};

// [Claude] these changes have been recommended by claude — maps each search category to its detail page URL
const getItemHref = (item: Record<string, any>, category: SearchCategory): string => {
  const id = item.id;
  if (!id) return '#';
  switch (category) {
    case 'songs':        return `/songs/details/${id}`;
    case 'poems':        return `/poems/${id}`;
    case 'reflections':  return `/reflections/details/${id}`;
    case 'people':       return `/people/${id}`;
    case 'films':        return `/films/details/${id}`;
    default:             return '#';
  }
};

export default function SearchResults() {
  const searchParams = useSearchParams();
  const rawQuery = (searchParams.get('search') || searchParams.get('q') || '').trim();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<SearchApiResponse>(emptySearchResponse);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const DESCRIPTION_PREVIEW_LIMIT = 240;

  const getPreviewText = (text: string) => {
    if (text.length <= DESCRIPTION_PREVIEW_LIMIT) {
      return text;
    }

    return `${text.slice(0, DESCRIPTION_PREVIEW_LIMIT)}...`;
  };

  useEffect(() => {
    setActiveFilter('ALL');
    setExpandedDescriptions({});
  }, [rawQuery]);

  useEffect(() => {
    if (!rawQuery) {
      setData(emptySearchResponse);
      setErrorText('');
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadSearchResults = async () => {
      setIsLoading(true);
      setErrorText('');

      try {
        const response = await fetch(`${SEARCH_ENDPOINT}?search=${encodeURIComponent(rawQuery)}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to fetch search results.');
        }

        const apiResponse = await response.json();

        if (!isCancelled) {
          setData(normalizeSearchPayload(apiResponse, rawQuery));
        }
      } catch (error: any) {
        if (!isCancelled) {
          setData(emptySearchResponse);
          setErrorText(error?.message || 'Search failed. Please try again.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSearchResults();

    return () => {
      isCancelled = true;
    };
  }, [rawQuery]);

  // [Claude] these changes have been recommended by claude — removed OTHER which was always 0
  const filterCounts: Record<FilterKey, number> = {
    ALL: data.total || 0,
    SONGS: data.counts.songs || 0,
    POEMS: data.counts.poems || 0,
    REFLECTIONS: data.counts.reflections || 0,
    PEOPLE: data.counts.people || 0,
    FILMS: data.counts.films || 0,
  };

  const filteredResults = useMemo(() => {
    if (activeFilter === 'ALL') {
      return CATEGORY_ORDER.flatMap((category) =>
        (data.results[category] || []).map((item) => ({
          item,
          category,
        }))
      );
    }

    const category = activeFilter.toLowerCase() as SearchCategory;
    return (data.results[category] || []).map((item) => ({
      item,
      category,
    }));
  }, [activeFilter, data.results]);

  const hasNoResults = !isLoading && (data.total || 0) === 0;

  if (isLoading && rawQuery) {
    return <Loader />;
  }

  return (
    <div className="mt-8" >
      <div className="custom-inner-container mx-auto pb-8">
        <div className="text-center mb-2">
          <h1 className="serch-result-heading mb-0 mt-0 text-left">
            You searched for '{rawQuery || data.query || ''}', {data.total || 0} results found
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-10 border-t pt-3 pb-4">
          {FILTER_ORDER.map((filter, index) => (
            <div key={filter} className="flex items-center">
              <button
                onClick={() => setActiveFilter(filter)}
                className={`border-0 button-font cursor-pointer transition-colors ${
                  activeFilter === filter ? 'search-filter-active' : ''
                }`}
              >
                {filter} ({filterCounts[filter]})
              </button>

              {index < FILTER_ORDER.length - 1 && <span className="mx-3 separator-border">|</span>}
            </div>
          ))}
        </div>

        {!!errorText && <p className="search-error-text mb-10">{errorText}</p>}

        {hasNoResults ? (
          <div className="search-no-results-wrapper">
            <h2 className="search-no-results-title">No Search Results Found!</h2>
            <div className="search-no-results-star">*</div>
            <p className="search-no-results-line search-no-results-line-primary italic">
              Moko kahaan dhoondhhe re bande?
            </p>
            <p className="search-no-results-line search-no-results-line-primary italic">Main to tere paas mein</p>
            <p className="search-no-results-line search-no-results-line-muted mt-4 italic">
              Where are you searching for me, oh friend?
            </p>
            <p className="search-no-results-line search-no-results-line-muted italic">
              I&apos;m as near as near can be
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredResults.map(({ item, category }, index) => {
              const title = getPrimaryText(item, category);
              const subtitle = getSecondaryText(item);
              const description = getDescriptionText(item);
              const imageUrl = getImageUrl(item);
              // [Claude] these changes have been recommended by claude — derive direct navigation href per category
              const href = getItemHref(item, category);
              const resultKey = `${category}-${item.id || index}`;
              const isExpanded = Boolean(expandedDescriptions[resultKey]);
              const hasLongDescription = description.length > DESCRIPTION_PREVIEW_LIMIT;
              const visibleDescription = isExpanded ? description : getPreviewText(description);

              return (
                <div key={resultKey} className="search-result-card">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* [Claude] these changes have been recommended by claude — thumbnail links directly to item detail page */}
                    <div className="flex-shrink-0">
                      <Link href={href}>
                        {imageUrl ? (
                          <div className="flex-shrink-0 w-full md:w-44 h-24 md:h-28 bg-gray-200 overflow-hidden rounded-md news-banner-shadow">
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-full md:w-44 h-24 md:h-28 search-image-placeholder rounded-md" />
                        )}
                      </Link>
                    </div>

                    <div className="flex-1">
                      {/* [Claude] these changes have been recommended by claude — title links directly to item detail page */}
                      <h2 className="search-result-page-heading mb-2">
                        <Link href={href} className="hover:text-pink-600 transition-colors">
                          {title}
                        </Link>
                        {subtitle && <span className="mb-3 italic">{subtitle}</span>}
                      </h2>

                      {!!description && (
                        <>
                          <p className="search-result-text mb-2">{visibleDescription}</p>
                          {hasLongDescription && (
                            <button
                              type="button"
                              className="text-pink text-sm cursor-pointer"
                              onClick={() =>
                                setExpandedDescriptions((prev) => ({
                                  ...prev,
                                  [resultKey]: !prev[resultKey],
                                }))
                              }
                            >
                              {isExpanded ? 'Read less' : 'Read more'}
                            </button>
                          )}
                        </>
                      )}
                      {!description && (
                        <p className="search-result-type-label mb-4">{category.toUpperCase()}</p>
                      )}
                    </div>
                  </div>

                  {index < filteredResults.length - 1 && <div className="border-dotted-seprator"></div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
