import { getPublishedFilms } from '@/lib/services/filmsService';
import useSWR from 'swr';

interface ApiFilm {
  id: string;
  main_title?: string;
  second_title?: string;
  thumbnail_Image?: string;
  director_name_english?: string;
  duration?: string;
  year?: string;
  about?: string;
  film_language?: string;
}

interface ApiFilmListResponse {
  status?: boolean;
  data?: ApiFilm[];
}

export interface FilmListItem {
  id: number;
  mainTitle: string;
  secondTitle: string;
  thumbnailUrl: string;
  directorName: string;
  duration: string;
  year: string;
  about: string;
  filmLanguage: string;
}

const useFilms = () => {
  const { data, error, isLoading } = useSWR<ApiFilmListResponse>('published-films', getPublishedFilms, {
    revalidateOnFocus: false,
  });

  const films: FilmListItem[] = (data?.data || []).map((item, index) => ({
    id: Number(item.id) || index + 1,
    mainTitle: item.main_title || '',
    secondTitle: item.second_title || '',
    thumbnailUrl: item.thumbnail_Image || '',
    directorName: item.director_name_english || '',
    duration: item.duration || '',
    year: item.year || '',
    about: item.about || '',
    filmLanguage: item.film_language || '',
  }));

  return {
    films,
    isLoading,
    error,
  };
};

export default useFilms;
