'use client';

import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { getRelatedByPoemId } from '@/lib/services/poemsService';
import RelatedSection from '@/components/RelatedSection/RelatedSection';
import './PoemsRelatedItem.css';

function stripHtml(input) {
  if (!input) return '';
  return String(input)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function createRelatedItem(type, item, index) {
  const title =
    stripHtml(item?.original_title) ||
    stripHtml(item?.meta_title) ||
    stripHtml(item?.title) ||
    stripHtml(item?.name) ||
    stripHtml(item?.word_transliteration) ||
    'Untitled';

  const subtitle =
    stripHtml(item?.attributed_poet) ||
    stripHtml(item?.poet_name) ||
    stripHtml(item?.translator) ||
    '';

  const description =
    stripHtml(item?.thumbnail_excerpt) ||
    stripHtml(item?.meta_description) ||
    stripHtml(item?.english_translation_text) ||
    stripHtml(item?.description) ||
    '';

  const image = item?.thumbnail_image_upload || item?.thumbnail_url || item?.image || '';

  return {
    id: String(item?.id || `${type}-${index}`),
    type,
    title,
    subtitle,
    description,
    image,
  };
}

export default function PoemsRelatedItem({ poemId }) {
  const shouldFetch = Boolean(poemId);
  const { data, isLoading } = useSWR(
    shouldFetch ? ['poem-related', poemId] : null,
    () => getRelatedByPoemId(poemId),
    { revalidateOnFocus: false }
  );

  const relatedData = data?.data || {};
  const songs = (relatedData.songs || []).map((item, index) => createRelatedItem('songs', item, index));
  const poems = (relatedData.poems || []).map((item, index) => createRelatedItem('poems', item, index));
  const reflections = (relatedData.reflections || []).map((item, index) =>
    createRelatedItem('reflections', item, index)
  );
  const people = (relatedData.people || []).map((item, index) => createRelatedItem('other', item, index));
  const films = (relatedData.films || []).map((item, index) => createRelatedItem('other', item, index));

  const allResults = useMemo(
    () => [...songs, ...poems, ...reflections, ...films, ...people],
    [films, people, poems, reflections, songs]
  );

  const tabs = useMemo(() => [
    { key: 'all', label: 'ALL', count: allResults.length },
    { key: 'songs', label: 'SONGS', count: Number(data?.counts?.songs ?? songs.length) },
    { key: 'poems', label: 'POEMS', count: Number(data?.counts?.poems ?? poems.length) },
    { key: 'reflections', label: 'REFLECTIONS', count: Number(data?.counts?.reflections ?? reflections.length) },
    { key: 'other', label: 'OTHER', count: Number(data?.counts?.films ?? films.length) + Number(data?.counts?.people ?? people.length) },
  ], [allResults, data, songs, poems, reflections, films, people]);

  if (isLoading) {
    return <div className="mt-8"><p className="search-result-text px-4">Loading related items...</p></div>;
  }

  if (!poemId) {
    return <div className="mt-8"><p className="search-result-text px-4">Select a poem to see related items.</p></div>;
  }

  if (allResults.length === 0) {
    return <div className="mt-8"><p className="search-result-text px-4">No related items found for this poem.</p></div>;
  }

  return (
    <div className="poems-related-inner-container mx-auto px-4 pb-6">
      <RelatedSection
        items={allResults}
        tabs={tabs}
        initialLimit={3}
      />
    </div>
  );
}
