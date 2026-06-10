import { AJAB_API_BASE } from '@/lib/ajabEnv';

type SearchCategory = 'songs' | 'poems' | 'reflections' | 'people' | 'films';

export interface SearchApiResponse {
  status: boolean;
  query: string;
  total: number;
  counts: Record<SearchCategory, number>;
  results: Record<SearchCategory, Record<string, any>[]>;
}

export const SEARCH_ENDPOINT = `${AJAB_API_BASE}/Api/nitesh`;

const toArray = (value: unknown): Record<string, any>[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => item && typeof item === 'object') as Record<string, any>[];
  }
  return [];
};

export const createEmptySearchResponse = (query = ''): SearchApiResponse => ({
  status: true,
  query,
  total: 0,
  counts: {
    songs: 0,
    poems: 0,
    reflections: 0,
    people: 0,
    films: 0,
  },
  results: {
    songs: [],
    poems: [],
    reflections: [],
    people: [],
    films: [],
  },
});

export const emptySearchResponse: SearchApiResponse = createEmptySearchResponse('');

export const normalizeSearchPayload = (payload: any, query: string): SearchApiResponse => {
  const fallback = createEmptySearchResponse(query);

  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const results = payload.results && typeof payload.results === 'object' ? payload.results : {};

  const songs = toArray(results.songs);
  const poems = toArray(results.poems);
  const reflections = toArray(results.reflections);
  const people = toArray(results.people);
  const films = toArray(results.films);

  const counts = {
    songs: typeof payload?.counts?.songs === 'number' ? payload.counts.songs : songs.length,
    poems: typeof payload?.counts?.poems === 'number' ? payload.counts.poems : poems.length,
    reflections:
      typeof payload?.counts?.reflections === 'number'
        ? payload.counts.reflections
        : reflections.length,
    people: typeof payload?.counts?.people === 'number' ? payload.counts.people : people.length,
    films: typeof payload?.counts?.films === 'number' ? payload.counts.films : films.length,
  };

  const total =
    typeof payload?.total === 'number'
      ? payload.total
      : counts.songs + counts.poems + counts.reflections + counts.people + counts.films;

  return {
    status: typeof payload.status === 'boolean' ? payload.status : true,
    query: typeof payload.query === 'string' && payload.query.trim() ? payload.query : query,
    total,
    counts,
    results: {
      songs,
      poems,
      reflections,
      people,
      films,
    },
  };
};
