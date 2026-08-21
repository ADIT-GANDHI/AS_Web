import { htmlToPlainText } from '@/lib/mapPoemListItem';

const LOREM_SUBTITLE = 'Lorem ipsum dolor sit amet';
const LOREM_DESC =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export type ExploreKeyword = {
  id: string;
  transliteration: string;
  translation: string;
};

export type ExploreListEntry = {
  bucket: 'songs' | 'poems' | 'reflections';
  item: any;
  formatTag: string;
};

function isAdminRelatedItem(item: unknown): boolean {
  const v = (item as { admin_related?: unknown } | null)?.admin_related;
  return v === true || v === 1 || v === '1' || v === 'true';
}

function sortRelatedByAdminFirst<T>(items: T[]): T[] {
  const admin: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    if (isAdminRelatedItem(item)) admin.push(item);
    else rest.push(item);
  }
  return [...admin, ...rest];
}

function norm(value: unknown): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sameText(a: string, b: string): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

/** Theme chips for the Explore strip (transliteration + translation). */
export function getExploreKeywords(data: Record<string, unknown> | null | undefined): ExploreKeyword[] {
  const raw = asArray(data?.keywords);
  const seen = new Set<string>();
  const out: ExploreKeyword[] = [];
  for (const k of raw) {
    const id = norm(k?.id);
    const transliteration = norm(
      k?.word_transliteration || k?.title || k?.term || k?.word
    );
    const translation = norm(
      k?.word_translation || k?.subtitle || k?.meaning || k?.translation
    );
    if (!id || !transliteration || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, transliteration, translation });
  }
  return out;
}

function inferBucket(item: any): ExploreListEntry['bucket'] | null {
  if (!item || typeof item !== 'object') return null;
  if (
    item.Songtitle_transliteration != null ||
    item.umbrellaTitle != null ||
    item.songTitle != null ||
    item.youtube_video_id != null ||
    item.youtubeVideoId != null
  ) {
    return 'songs';
  }
  if (
    item.original_title != null ||
    item.couplet_transliteration != null ||
    item.couplet_translation != null
  ) {
    return 'poems';
  }
  if (
    item.format != null ||
    item.speaker_id != null ||
    item.reflection_excerpt != null ||
    item.verb != null ||
    (item.title != null && (item.interview_video != null || item.essay_content != null))
  ) {
    return 'reflections';
  }
  if (item.title != null && item.meta_description != null && !item.person_name) {
    return 'reflections';
  }
  return null;
}

function formatTagFor(bucket: ExploreListEntry['bucket'], item: any): string {
  if (bucket === 'songs') return 'SONG';
  if (bucket === 'poems') return 'POEM';
  const format = norm(item?.format || item?.reflection_type);
  if (format) return `REFLECTION ${format}`;
  return 'REFLECTION Essay';
}

function pushBucketItems(
  out: ExploreListEntry[],
  seen: Set<string>,
  bucket: ExploreListEntry['bucket'],
  items: any[]
) {
  for (const item of sortRelatedByAdminFirst(items)) {
    const id = item?.id != null && item?.id !== '' ? String(item.id) : '';
    const key = `${bucket}:${id || JSON.stringify(item).slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      bucket,
      item: { ...item, admin_related: isAdminRelatedItem(item) },
      formatTag: formatTagFor(bucket, item),
    });
  }
}

function entriesFromNestedKeyword(kw: any): ExploreListEntry[] {
  const out: ExploreListEntry[] = [];
  const seen = new Set<string>();
  pushBucketItems(out, seen, 'songs', asArray(kw?.songs));
  pushBucketItems(out, seen, 'poems', asArray(kw?.poems));
  pushBucketItems(out, seen, 'reflections', asArray(kw?.reflections));
  return out;
}

function entriesFromTopLevel(data: Record<string, unknown>): ExploreListEntry[] {
  const out: ExploreListEntry[] = [];
  const seen = new Set<string>();
  pushBucketItems(out, seen, 'songs', asArray(data.songs));
  pushBucketItems(out, seen, 'poems', asArray(data.poems));
  pushBucketItems(out, seen, 'reflections', asArray(data.reflections));
  return out;
}

function keywordsHaveNestedContent(keywords: any[]): boolean {
  return keywords.some(
    (kw) =>
      asArray(kw?.songs).length > 0 ||
      asArray(kw?.poems).length > 0 ||
      asArray(kw?.reflections).length > 0
  );
}

/**
 * Mixed Explore list.
 * - All: merge nested songs/poems/reflections across keywords (deduped),
 *   else fall back to top-level buckets.
 * - Keyword: that keyword's nested arrays only.
 */
export function buildExploreEntries(
  data: Record<string, unknown> | null | undefined,
  activeKeywordId: 'all' | string
): ExploreListEntry[] {
  if (!data) return [];
  const keywords = asArray(data.keywords);

  if (activeKeywordId !== 'all') {
    const kw = keywords.find((k) => String(k?.id) === String(activeKeywordId));
    if (!kw) return [];
    const nested = entriesFromNestedKeyword(kw);
    if (nested.length) return nested;
    return [];
  }

  if (keywordsHaveNestedContent(keywords)) {
    const out: ExploreListEntry[] = [];
    const seen = new Set<string>();
    for (const kw of keywords) {
      for (const entry of entriesFromNestedKeyword(kw)) {
        const id =
          entry.item?.id != null && entry.item?.id !== ''
            ? String(entry.item.id)
            : '';
        const key = `${entry.bucket}:${id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(entry);
      }
    }
    // Keep curator-picked rows first across the merged list.
    const admin = out.filter((e) => isAdminRelatedItem(e.item));
    const rest = out.filter((e) => !isAdminRelatedItem(e.item));
    return [...admin, ...rest];
  }

  return entriesFromTopLevel(data);
}

export function getExploreItemTitle(item: any, bucket: ExploreListEntry['bucket']): string {
  if (bucket === 'poems') {
    for (const field of [
      item?.english_transliteration,
      item?.couplet_transliteration,
      item?.meta_title,
      item?.title,
      item?.original_title,
    ]) {
      const t = norm(field);
      if (t) return t;
    }
    return 'Untitled';
  }
  for (const field of [
    item?.Songtitle_transliteration,
    item?.song_title_transliteration,
    item?.english_transliteration,
    item?.umbrellaTitleText,
    item?.umbrellaTitle,
    item?.title,
    item?.original_title,
  ]) {
    const t = norm(field);
    if (t) return t;
  }
  return 'Untitled';
}

/**
 * Italic line beside the title = English translation of the title.
 * Poems: `english_translation`. Songs: `english_translation` / `songtitletraan`.
 * Duplicate of the transliteration title (common CMS bug) is skipped.
 */
export function getExploreItemSubtitle(item: any, bucket: ExploreListEntry['bucket'], title: string): string {
  const candidates =
    bucket === 'poems'
      ? [item?.english_translation, item?.couplet_translation, item?.subtitle]
      : bucket === 'songs'
        ? [
            item?.english_translation,
            item?.songTitle,
            item?.songtitletraan,
            item?.subtitle,
          ]
        : [item?.subtitle, item?.word_translation];

  const titleN = norm(title);
  for (const c of candidates) {
    const value = norm(c);
    if (!value) continue;
    if (sameText(value, titleN)) continue;
    return value;
  }
  return LOREM_SUBTITLE;
}

function normalizeExplorePlain(raw: string): string {
  return htmlToPlainText(String(raw || ''))
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getExploreItemDescription(item: any, bucket: ExploreListEntry['bucket']): string {
  if (bucket === 'poems') {
    const raw =
      item?.thumbnail_excerpt ||
      item?.thumbnailexcerpt ||
      item?.meta_description ||
      item?.couplet_transliteration ||
      '';
    return normalizeExplorePlain(String(raw)) || LOREM_DESC;
  }

  const raw =
    item?.about ||
    item?.description ||
    item?.meta_description ||
    item?.metaDescription ||
    item?.thumbnail_excerpt ||
    item?.thumbnailexcerpt ||
    item?.reflection_excerpt ||
    '';
  return normalizeExplorePlain(String(raw)) || LOREM_DESC;
}

/** Infer bucket for raw (unmapped) related rows — used by song detail raw API. */
export function inferExploreBucket(item: any): ExploreListEntry['bucket'] | null {
  return inferBucket(item);
}
