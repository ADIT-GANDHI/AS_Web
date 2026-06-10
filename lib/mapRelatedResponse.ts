import { AJAB_API_BASE } from './ajabEnv';

export interface RelatedContent {
  data: Record<string, any[]>;
  counts: {
    all: number;
    songs: number;
    poems: number;
    reflections: number;
    other: number;
    films?: number;
  };
}

function resolveThumb(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  if (raw.startsWith('http')) return raw;
  return `${AJAB_API_BASE}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

function mapRelatedItem(it: any) {
  return {
    id: String(it.id || it.song_id || it.poem_id || it.reflection_id || ''),
    title:
      it.Songtitle_transliteration ||
      it.title ||
      it.english_transliteration ||
      it.original_title ||
      it.person_name_english ||
      it.word_transliteration ||
      '',
    subtitle: it.songtitletraan || it.subtitle || it.english_translation || it.word_translation || '',
    about: it.about || it.description || it.thumbnail_excerpt || it.meta_description || '',
    thumbnailUrl: resolveThumb(it.thumbnail_url || it.thumbnailUrl),
    Songtitle_transliteration: it.Songtitle_transliteration,
    songtitletraan: it.songtitletraan,
  };
}

export function normalizeRelatedResponse(json: any): RelatedContent | null {
  if (!json || json.status === false) return null;
  const raw = json.data || {};
  const bucketKeys = ['songs', 'poems', 'reflections', 'other', 'films', 'keywords'] as const;
  const data: Record<string, any[]> = {};

  for (const key of bucketKeys) {
    const arr = raw[key];
    data[key] = Array.isArray(arr) ? arr.map(mapRelatedItem) : [];
  }

  if (Array.isArray(raw.people) && raw.people.length) {
    data.other = [...data.other, ...raw.people.map(mapRelatedItem)];
  }

  const counts = json.counts || {};
  const songs = counts.songs ?? data.songs.length;
  const poems = counts.poems ?? data.poems.length;
  const reflections = counts.reflections ?? data.reflections.length;
  const other = data.other.length || counts.other || 0;
  const films = counts.films ?? data.films?.length ?? 0;

  return {
    data,
    counts: {
      all: counts.all || songs + poems + reflections + other + films,
      songs,
      poems,
      reflections,
      other,
      films,
    },
  };
}

export async function fetchRelatedByParam(
  param: 'song_id' | 'poem_id' | 'reflection_id' | 'people_id' | 'person_id' | 'film_id',
  id: string
): Promise<RelatedContent | null> {
  if (!id) return null;
  try {
    const res = await fetch(
      `${AJAB_API_BASE}/Api/related?${param}=${encodeURIComponent(id)}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return normalizeRelatedResponse(json);
  } catch {
    return null;
  }
}

export const EMPTY_RELATED: RelatedContent = {
  data: { songs: [], poems: [], reflections: [], other: [], films: [], keywords: [] },
  counts: { all: 0, songs: 0, poems: 0, reflections: 0, other: 0, films: 0 },
};

/** Coerce legacy mock related objects into RelatedContent. */
export function asRelatedContent(mock: any): RelatedContent {
  const counts = mock?.counts || {};
  return {
    data: mock?.data || {},
    counts: {
      all: counts.all ?? 0,
      songs: counts.songs ?? 0,
      poems: counts.poems ?? 0,
      reflections: counts.reflections ?? 0,
      other: counts.other ?? 0,
      films: counts.films ?? 0,
    },
  };
}
