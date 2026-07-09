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

/** CMS flag — curator-picked related rows surface first in detail lists. */
export function isAdminRelatedItem(item: unknown): boolean {
  const v = (item as { admin_related?: unknown } | null)?.admin_related;
  return v === true || v === 1 || v === '1' || v === 'true';
}

/** Keep API order within each group; `admin_related` rows precede the rest. */
export function sortRelatedByAdminFirst<T>(items: T[]): T[] {
  const admin: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    if (isAdminRelatedItem(item)) admin.push(item);
    else rest.push(item);
  }
  return [...admin, ...rest];
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
    subtitle:
      it.songtitletraan ||
      it.subtitle ||
      it.film_subtitle ||
      it.english_translation ||
      it.word_translation ||
      '',
    about: it.about || it.description || '',
    meta_description: it.meta_description || '',
    thumbnail_excerpt: it.thumbnail_excerpt || it.thumbnailexcerpt || '',
    thumbnailexcerpt: it.thumbnailexcerpt || it.thumbnail_excerpt || '',
    original_title: it.original_title || '',
    description: it.description || '',
    thumbnailUrl: resolveThumb(it.thumbnail_url || it.thumbnailUrl),
    Songtitle_transliteration: it.Songtitle_transliteration,
    songtitletraan: it.songtitletraan,
    admin_related: isAdminRelatedItem(it),
  };
}

function poemNeedsEnrichment(item: any): boolean {
  return !(
    item?.meta_description ||
    item?.thumbnail_excerpt ||
    item?.thumbnailexcerpt
  );
}

/** Related API omits poem excerpts — merge from the poems listing index. */
export async function enrichRelatedPoems(content: RelatedContent): Promise<RelatedContent> {
  const poems = content.data.poems || [];
  if (!poems.length || !poems.some(poemNeedsEnrichment)) return content;

  try {
    const res = await fetch(`${AJAB_API_BASE}/Api/poems?page=1&limit=300`, {
      cache: 'no-store',
    });
    if (!res.ok) return content;
    const json = await res.json();
    const byId = new Map<string, any>();
    for (const row of json.data || []) {
      if (row?.id != null) byId.set(String(row.id), row);
    }

    const enrichedPoems = poems.map((p) => {
      if (!poemNeedsEnrichment(p)) return p;
      const full = byId.get(String(p.id));
      if (!full) return p;
      return {
        ...p,
        original_title: p.original_title || full.original_title || '',
        meta_description: full.meta_description || p.meta_description || '',
        thumbnail_excerpt:
          full.thumbnail_excerpt || full.thumbnailexcerpt || p.thumbnail_excerpt || '',
        thumbnailexcerpt:
          full.thumbnailexcerpt || full.thumbnail_excerpt || p.thumbnailexcerpt || '',
        title: p.title || full.original_title || p.title,
      };
    });

    return { ...content, data: { ...content.data, poems: enrichedPoems } };
  } catch {
    return content;
  }
}

export function normalizeRelatedResponse(json: any): RelatedContent | null {
  if (!json || json.status === false) return null;
  const raw = json.data || {};
  const bucketKeys = ['songs', 'poems', 'reflections', 'other', 'films', 'keywords'] as const;
  const data: Record<string, any[]> = {};

  for (const key of bucketKeys) {
    const arr = raw[key];
    data[key] = Array.isArray(arr)
      ? sortRelatedByAdminFirst(arr.map(mapRelatedItem))
      : [];
  }

  if (Array.isArray(raw.people) && raw.people.length) {
    data.other = sortRelatedByAdminFirst([
      ...data.other,
      ...raw.people.map(mapRelatedItem),
    ]);
  } else if (data.other.length) {
    data.other = sortRelatedByAdminFirst(data.other);
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
    const normalized = normalizeRelatedResponse(json);
    if (!normalized) return null;
    return enrichRelatedPoems(normalized);
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
