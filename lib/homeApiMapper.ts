import {
  MOCK_HOME_FILM,
  MOCK_HOME_PEOPLE,
  MOCK_HOME_POEM,
  MOCK_HOME_REFLECTION,
  MOCK_HOME_SONG,
} from '@/components/Home/CLHomeMocks';
import { formatFilmDirector, getFilmListingBlurb } from '@/components/Films/filmFieldUtils';

export type HomeSongCard = typeof MOCK_HOME_SONG;
export type HomePoemCard = typeof MOCK_HOME_POEM;
export type HomeReflectionCard = typeof MOCK_HOME_REFLECTION;
export type HomePeopleCard = typeof MOCK_HOME_PEOPLE;
export type HomeFilmCard = typeof MOCK_HOME_FILM;

export type HomeLatestPayload = {
  song: HomeSongCard | null;
  poem: HomePoemCard | null;
  reflection: HomeReflectionCard | null;
  people: HomePeopleCard | null;
  film: HomeFilmCard | null;
};

function htmlToPlainText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Split CMS HTML into non-empty verse lines (skips blank paragraphs). */
function htmlToVerseLines(raw: string, maxLines?: number): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const lines = htmlToPlainText(raw)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return maxLines != null ? lines.slice(0, maxLines) : lines;
}

function joinVerseLines(lines: string[]): string {
  return lines.join('\n');
}

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function hasRecordId(raw: Record<string, unknown>): boolean {
  const id = raw.id;
  return id != null && id !== '';
}

function pickImage(apiPath: unknown, mockPath?: string): string {
  if (typeof apiPath === 'string' && apiPath.trim()) return apiPath.trim();
  return mockPath ?? '';
}

function truncate(text: string, max = 320): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

const HTML_EXCERPT_KEYS = new Set([
  'about',
  'body',
  'profile',
  'profile_text',
  'about_text',
  'text_editor_content',
]);

/** CMS thumbnail / body copy — skips junk placeholders (e.g. `"t"`, `"test"`). */
function pickHomeThumbnailExcerpt(
  record: Record<string, unknown>,
  options?: { maxLen?: number; profileFallback?: boolean }
): string {
  const maxLen = options?.maxLen ?? 280;
  // Never use meta_* keys — those are SEO metadata, not UI copy.
  const keys = [
    'thumbnail_excerpt',
    'thumbnailExcerpt',
    'reflection_excerpt',
    'body',
    'about',
    'description',
    'excerpt',
    'about_text',
    'profile_text',
  ];

  for (const key of keys) {
    const raw = record[key];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const text = HTML_EXCERPT_KEYS.has(key) || raw.includes('<') ? htmlToPlainText(raw) : raw.trim();
    if (text.length <= 10) continue;
    return truncate(text, maxLen);
  }

  if (options?.profileFallback && typeof record.profile === 'string' && record.profile.trim()) {
    const plain = htmlToPlainText(record.profile);
    if (plain.length > 10) return truncate(plain, maxLen);
  }

  return '';
}

function mapSong(raw: unknown, mock: HomeSongCard, apiOnly: boolean): HomeSongCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  const excerpt =
    pickHomeThumbnailExcerpt(record, { maxLen: 220 }) || (!apiOnly ? mock.description : '');

  return {
    id: (record.id ?? mock.id) as HomeSongCard['id'],
    title:
      firstString(
        record.Songtitle_transliteration,
        record.song_title_transliteration,
        record.songTitleTransliteration
      ) || (!apiOnly ? mock.title : ''),
    subtitle:
      firstString(
        record.songtitletraan,
        record.song_title_translation,
        record.songTitleTranslation,
        record.english_translation
      ) || (!apiOnly ? mock.subtitle : ''),
    singer:
      firstString(record.singer, record.singer_name, record.singer_display).toUpperCase() ||
      (!apiOnly ? mock.singer : ''),
    poet:
      firstString(record.poet, record.poet_name, record.poet_display).toUpperCase() ||
      (!apiOnly ? mock.poet : ''),
    description: excerpt,
    image: pickImage(record.thumbnail_url ?? record.thumbnailUrl, apiOnly ? undefined : mock.image),
  };
}

function mapPoem(raw: unknown, mock: HomePoemCard, apiOnly: boolean): HomePoemCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  const transliterationHtml = firstString(
    record.english_transliteration_text,
    record.couplet_transliteration
  );
  const translationHtml = firstString(
    record.english_translation_text,
    record.couplet_translation
  );

  let transliteration = joinVerseLines(htmlToVerseLines(transliterationHtml, 4));
  let translation = joinVerseLines(htmlToVerseLines(translationHtml, 2));

  // Legacy CMS fields — Hindi original only when no English verse is available.
  if (!transliteration) {
    const legacy = htmlToVerseLines(
      firstString(record.original_text, record.couplet_hindi, record.hindi_text),
      4
    );
    transliteration = joinVerseLines(legacy);
  }

  if (!transliteration && !apiOnly) transliteration = mock.transliteration;
  if (!translation && !apiOnly) translation = mock.translation;

  const poet =
    firstString(
      record.poet_names,
      record.poet_id_raw,
      record.attributed_poet,
      record.poet_name,
      record.poet
    ).toUpperCase() || (!apiOnly ? mock.poet : '');

  return {
    id: (record.id ?? mock.id) as HomePoemCard['id'],
    transliteration,
    translation,
    poet,
  };
}

function mapReflection(
  raw: unknown,
  mock: HomeReflectionCard,
  apiOnly: boolean
): HomeReflectionCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  const excerpt =
    pickHomeThumbnailExcerpt(record, { maxLen: 140 }) || (!apiOnly ? mock.description : '');

  return {
    id: (record.id ?? mock.id) as HomeReflectionCard['id'],
    title:
      firstString(record.title, record.audio_story_title) ||
      (!apiOnly ? mock.title : ''),
    saysBy:
      firstString(
        record.speaker_names,
        record.speaker_name,
        record.speaker,
        record.author,
        record.author_name
      ).toUpperCase() || (!apiOnly ? mock.saysBy : ''),
    description: excerpt,
    image: pickImage(record.thumbnail_url ?? record.thumbnailUrl, apiOnly ? undefined : mock.image),
  };
}

function mapPeople(raw: unknown, mock: HomePeopleCard, apiOnly: boolean): HomePeopleCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  const aboutRaw = firstString(record.about);
  const aboutPlain = aboutRaw ? htmlToPlainText(aboutRaw) : '';
  const description =
    aboutPlain.length > 10 ? truncate(aboutPlain, 280) : !apiOnly ? mock.description : '';

  const title =
    firstString(
      record.person_name,
      record.person_name_english,
      [record.first_name, record.middle_name, record.last_name].filter(Boolean).join(' '),
      record.first_name
    ) || (!apiOnly ? mock.title : '');

  return {
    id: (record.id ?? mock.id) as HomePeopleCard['id'],
    title,
    subtitle: firstString(record.second_title) || (!apiOnly ? mock.subtitle : ''),
    introBy:
      firstString(
        record.intro_by,
        record.introducer,
        record.author,
        record.speaker_names,
        record.speaker_name
      ).toUpperCase() || (!apiOnly ? mock.introBy : ''),
    description,
    image: pickImage(
      record.thumbnail_url ?? record.thumbnailUrl ?? record.thumbnail_image_upload,
      apiOnly ? undefined : mock.image
    ),
  };
}

function mapFilm(raw: unknown, mock: HomeFilmCard, apiOnly: boolean): HomeFilmCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  const excerpt = getFilmListingBlurb(record, 280) || (!apiOnly ? mock.description : '');
  const filmBy = formatFilmDirector(
    (record.directors ?? record.director ?? record.film_by ?? record.filmBy) as
      | string
      | string[]
      | null
      | undefined
  );

  return {
    id: (record.id ?? mock.id) as HomeFilmCard['id'],
    title:
      firstString(record.main_title, record.english_transliteration, record.original_title) ||
      (!apiOnly ? mock.title : ''),
    subtitle:
      firstString(record.second_title, record.series_title, record.english_translation) ||
      (!apiOnly ? mock.subtitle : ''),
    filmBy: filmBy.toUpperCase() || (!apiOnly ? mock.filmBy : ''),
    description: excerpt,
    image: pickImage(record.thumbnail_url ?? record.thumbnailUrl, apiOnly ? undefined : mock.image),
  };
}

/** Map `/Api/home` `latest` onto card props. */
export function mapHomeLatest(latest: unknown, apiOnly = false): HomeLatestPayload {
  const root = latest && typeof latest === 'object' ? (latest as Record<string, unknown>) : null;

  return {
    song: mapSong(root?.song, MOCK_HOME_SONG, apiOnly),
    poem: mapPoem(root?.poem, MOCK_HOME_POEM, apiOnly),
    reflection: mapReflection(root?.reflection, MOCK_HOME_REFLECTION, apiOnly),
    people: mapPeople(root?.person ?? root?.people, MOCK_HOME_PEOPLE, apiOnly),
    film: mapFilm(root?.film, MOCK_HOME_FILM, apiOnly),
  };
}
