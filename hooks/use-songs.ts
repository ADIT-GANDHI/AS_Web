import { Song } from '@/components/Home/SongCard/types';
import { SONGS_FILTER } from '@/components/Songs/constants';
import { getPublishedSongs } from '@/lib/services/songsService';
import useSWR from 'swr';

interface SongsResponse {
  songs: Song[];
}

interface IProps {
  activeFilter?: string;
}

const useSongs = ({ activeFilter = SONGS_FILTER[0] }: IProps = {}) => {
  const { data, error, isLoading } = useSWR<SongsResponse>('published-songs', getPublishedSongs, {
    revalidateOnFocus: false,
  });

  // Shuffle and slice only when data is available
  const shuffledSongs = data?.songs
    ?.slice() // create copy to avoid mutating original
    .sort(() => Math.random() - 0.5);

  const visibleSongs = shuffledSongs?.slice(0, 5);

  // Filter results based on active filter
  const filteredSongs =
    activeFilter === 'ALL'
      ? data?.songs
      : data?.songs.filter(
          (item) =>
            item?.metaTitle?.toLowerCase().startsWith(activeFilter) ||
            item?.songTitle?.englishTransliteration.toLowerCase().startsWith(activeFilter)
        );

  return {
    // publishedSongs: filteredSongs,
    publishedSongs: filteredSongs?.slice(0, 9), //temp
    totalSongs: data?.songs?.length,
    shuffledSongs,
    visibleSongs,
    isLoading,
    error,
  };
};

export default useSongs;
