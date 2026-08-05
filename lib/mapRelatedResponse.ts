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
    people?: number;
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
  const title = String(
    it.Songtitle_transliteration ||
      it.english_transliteration ||
      it.couplet_transliteration ||
      it.word_transliteration ||
      it.meta_title ||
      it.title ||
      it.original_title ||
      it.person_name ||
      it.person_name_english ||
      ''
  ).trim();

  const subtitleCandidates = [
    it.songTitle,
    it.english_translation,
    it.couplet_translation,
    it.songtitletraan,
    it.word_translation,
    it.film_subtitle,
    it.subtitle,
  ];
  const titleNorm = title.replace(/\s+/g, ' ').trim().toLowerCase();
  let subtitle = '';
  for (const candidate of subtitleCandidates) {
    const value = String(candidate || '').trim();
    if (!value) continue;
    // CMS often repeats transliteration in songtitletraan — keep translation only.
    if (titleNorm && value.replace(/\s+/g, ' ').trim().toLowerCase() === titleNorm) {
      continue;
    }
    subtitle = value;
    break;
  }

  return {
    id: String(it.id || it.song_id || it.poem_id || it.reflection_id || ''),
    title,
    subtitle,
    about: it.about || it.description || '',
    meta_description: it.meta_description || '',
    thumbnail_excerpt: it.thumbnail_excerpt || it.thumbnailexcerpt || '',
    thumbnailexcerpt: it.thumbnailexcerpt || it.thumbnail_excerpt || '',
    original_title: it.original_title || '',
    couplet_transliteration: it.couplet_transliteration || '',
    couplet_translation: it.couplet_translation || '',
    description: it.description || '',
    format: it.format || it.reflection_type || '',
    reflection_excerpt: it.reflection_excerpt || '',
    songTitle: it.songTitle || '',
    english_translation: it.english_translation || '',
    english_transliteration: it.english_transliteration || '',
    meta_title: it.meta_title || '',
    thumbnailUrl: resolveThumb(it.thumbnail_url || it.thumbnailUrl),
    Songtitle_transliteration: it.Songtitle_transliteration,
    songtitletraan: it.songtitletraan,
    person_name: it.person_name,
    person_name_english: it.person_name_english,
    category_name: it.category_name,
    director_name: it.director_name,
    year_of_production: it.year_of_production,
    film_id: it.film_id,
    admin_related: isAdminRelatedItem(it),
  };
}

/** Keep nested songs/poems/reflections for Explore theme filtering. */
function mapRelatedKeyword(it: any) {
  const transliteration = String(
    it.word_transliteration || it.title || it.term || it.word || ''
  ).trim();
  const translation = String(
    it.word_translation || it.subtitle || it.meaning || it.translation || ''
  ).trim();

  return {
    id: String(it.id ?? ''),
    word_transliteration: transliteration,
    word_translation: translation,
    title: transliteration,
    subtitle: translation,
    meta_title: it.meta_title ?? null,
    meta_description: it.meta_description ?? null,
    songs: Array.isArray(it.songs)
      ? sortRelatedByAdminFirst(it.songs.map(mapRelatedItem))
      : [],
    poems: Array.isArray(it.poems)
      ? sortRelatedByAdminFirst(it.poems.map(mapRelatedItem))
      : [],
    reflections: Array.isArray(it.reflections)
      ? sortRelatedByAdminFirst(it.reflections.map(mapRelatedItem))
      : [],
    admin_related: isAdminRelatedItem(it),
  };
}

function poemNeedsEnrichment(item: any): boolean {
  return !(
    item?.meta_description ||
    item?.thumbnail_excerpt ||
    item?.thumbnailexcerpt
  ) || !String(item?.couplet_transliteration || '').trim();
}

function enrichPoemRow(p: any, byId: Map<string, any>): any {
  const full = byId.get(String(p.id));
  const couplet_transliteration =
    p.couplet_transliteration || full?.couplet_transliteration || '';
  const couplet_translation = p.couplet_translation || full?.couplet_translation || '';
  const meta_title = p.meta_title || full?.meta_title || '';
  const englishTitle =
    couplet_transliteration ||
    meta_title ||
    p.title ||
    full?.original_title ||
    p.original_title ||
    '';

  if (!poemNeedsEnrichment(p) && couplet_transliteration) {
    return {
      ...p,
      couplet_transliteration,
      couplet_translation,
      meta_title,
      title: englishTitle || p.title,
    };
  }
  if (!full && !couplet_transliteration) return p;
  return {
    ...p,
    original_title: p.original_title || full?.original_title || '',
    meta_description: full?.meta_description || p.meta_description || '',
    meta_title,
    thumbnail_excerpt:
      full?.thumbnail_excerpt || full?.thumbnailexcerpt || p.thumbnail_excerpt || '',
    thumbnailexcerpt:
      full?.thumbnailexcerpt || full?.thumbnail_excerpt || p.thumbnailexcerpt || '',
    couplet_transliteration,
    couplet_translation,
    title: englishTitle || p.title,
  };
}

/** Related API omits poem excerpts — merge from the poems listing index. */
export async function enrichRelatedPoems(content: RelatedContent): Promise<RelatedContent> {
  const poems = content.data.poems || [];
  const keywordPoems = (content.data.keywords || []).flatMap((kw) =>
    Array.isArray(kw?.poems) ? kw.poems : []
  );
  const needsWork =
    poems.some(poemNeedsEnrichment) || keywordPoems.some(poemNeedsEnrichment);
  if (!needsWork) return content;

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

    const enrichedPoems = poems.map((p) => enrichPoemRow(p, byId));
    const enrichedKeywords = (content.data.keywords || []).map((kw) => ({
      ...kw,
      poems: Array.isArray(kw?.poems)
        ? kw.poems.map((p: any) => enrichPoemRow(p, byId))
        : kw?.poems,
    }));

    return {
      ...content,
      data: { ...content.data, poems: enrichedPoems, keywords: enrichedKeywords },
    };
  } catch {
    return content;
  }
}

export function normalizeRelatedResponse(json: any): RelatedContent | null {
  if (!json || json.status === false) return null;
  const raw = json.data || {};
  const bucketKeys = ['songs', 'poems', 'reflections', 'other', 'films'] as const;
  const data: Record<string, any[]> = {};

  for (const key of bucketKeys) {
    const arr = raw[key];
    data[key] = Array.isArray(arr)
      ? sortRelatedByAdminFirst(arr.map(mapRelatedItem))
      : [];
  }

  data.keywords = Array.isArray(raw.keywords)
    ? sortRelatedByAdminFirst(raw.keywords.map(mapRelatedKeyword))
    : [];

  if (Array.isArray(raw.people) && raw.people.length) {
    data.other = sortRelatedByAdminFirst([
      ...data.other,
      ...raw.people.map(mapRelatedItem),
    ]);
  } else if (data.other.length) {
    data.other = sortRelatedByAdminFirst(data.other);
  }

  /* Newer related APIs nest content under keywords and omit top-level
     songs/poems/reflections — derive those buckets for legacy Related tabs
     (Films / People) without changing their UI. */
  if (!data.songs.length || !data.poems.length || !data.reflections.length) {
    const seen = {
      songs: new Set(data.songs.map((i) => String(i.id))),
      poems: new Set(data.poems.map((i) => String(i.id))),
      reflections: new Set(data.reflections.map((i) => String(i.id))),
    };
    for (const kw of data.keywords) {
      for (const bucket of ['songs', 'poems', 'reflections'] as const) {
        for (const item of kw[bucket] || []) {
          const id = String(item?.id ?? '');
          if (!id || seen[bucket].has(id)) continue;
          seen[bucket].add(id);
          data[bucket].push(item);
        }
      }
    }
    data.songs = sortRelatedByAdminFirst(data.songs);
    data.poems = sortRelatedByAdminFirst(data.poems);
    data.reflections = sortRelatedByAdminFirst(data.reflections);
  }

  const counts = json.counts || {};
  const songs = counts.songs ?? data.songs.length;
  const poems = counts.poems ?? data.poems.length;
  const reflections = counts.reflections ?? data.reflections.length;
  const films = counts.films ?? data.films?.length ?? 0;
  const people = counts.people ?? (Array.isArray(raw.people) ? raw.people.length : 0);
  /* OTHER tab = people (merged into data.other) + related films + legacy other rows. */
  const other =
    data.other.length + films ||
    counts.other ||
    people + films ||
    0;

  return {
    data,
    counts: {
      all:
        counts.all ||
        json.total_related ||
        songs + poems + reflections + other,
      songs,
      poems,
      reflections,
      other,
      films,
      people,
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
  counts: { all: 0, songs: 0, poems: 0, reflections: 0, other: 0, films: 0, people: 0 },
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
