'use client';
import { Song } from '@/components/Home/SongCard/types';
import { getPublishedSongsById } from '@/lib/services/songsService';
import useSWR from 'swr';

const useSongById = (id?: string, title?: string) => {
  const shouldFetch = !!id;

  const { data, error, isLoading } = useSWR<Song>(
    shouldFetch ? ['published-song-by-id', id] : null,
    () => getPublishedSongsById(id!),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    song: data as Song,
    error,
    isLoading,
  };
};

export default useSongById;
