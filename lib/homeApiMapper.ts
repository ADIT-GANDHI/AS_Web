import {
  MOCK_HOME_FILM,
  MOCK_HOME_PEOPLE,
  MOCK_HOME_POEM,
  MOCK_HOME_REFLECTION,
  MOCK_HOME_SONG,
} from '@/components/Home/CLHomeMocks';
import { formatFilmDirector } from '@/components/Films/filmFieldUtils';
import { extractYouTubeId } from '@/lib/youtube';

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

/** Strip CMS underscores from role lines — each segment (e.g. "_Singers, _Writers"). */
function stripLeadingRoleUnderscore(raw: string): string {
  return raw
    .split(',')
    .map((part) => part.replace(/^_+/, '').trim())
    .filter(Boolean)
    .join(', ');
}

function mapHomePersonSubtitle(
  record: Record<string, unknown>,
  mockSubtitle: string,
  apiOnly: boolean
): string {
  const raw = firstString(
    record.occupation_text,
    record.occupation,
    record.occupation_names,
    record.second_title
  );
  if (!raw) return apiOnly ? '' : mockSubtitle;
  return stripLeadingRoleUnderscore(raw);
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

/** Visible placeholder when CMS `thumbnail_excerpt` is empty — keeps home card layout intact. */
const HOME_THUMBNAIL_EXCERPT_PLACEHOLDER =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

/** CMS `thumbnail_excerpt` only — skips junk placeholders (e.g. `"t"`, `"test"`). */
function pickThumbnailExcerptField(record: Record<string, unknown>): string {
  const raw = record.thumbnail_excerpt;
  if (typeof raw !== 'string' || !raw.trim()) return '';
  const text = raw.includes('<') ? htmlToPlainText(raw) : raw.trim();
  if (text.length <= 10) return '';
  return text;
}

function resolveHomeCardDescription(
  record: Record<string, unknown>,
  mockDescription: string,
  apiOnly: boolean,
  maxLen = 280
): string {
  const excerpt = pickThumbnailExcerptField(record);
  if (excerpt) return truncate(excerpt, maxLen);
  if (apiOnly || hasRecordId(record)) return HOME_THUMBNAIL_EXCERPT_PLACEHOLDER;
  return mockDescription;
}

function mapSong(raw: unknown, mock: HomeSongCard, apiOnly: boolean): HomeSongCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  const description = resolveHomeCardDescription(record, mock.description, apiOnly, 220);

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
    description,
    image: pickImage(record.thumbnail_url ?? record.thumbnailUrl, apiOnly ? undefined : mock.image),
    youtubeVideoId:
      extractYouTubeId(firstString(record.youtube_video_id, record.youtubeVideoId)) ||
      (!apiOnly ? mock.youtubeVideoId : ''),
    soundCloudUrl:
      firstString(
        record.soundCloudTrackUrl,
        record.soundcloud_track_id,
        record.soundCloud_track_url
      ) || (!apiOnly ? mock.soundCloudUrl : ''),
    downloadUrl:
      firstString(record.download_url, record.downloadUrl) || (!apiOnly ? mock.downloadUrl : ''),
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

  const description = resolveHomeCardDescription(record, mock.description, apiOnly, 140);

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
    description,
    image: pickImage(record.thumbnail_url ?? record.thumbnailUrl, apiOnly ? undefined : mock.image),
    youtubeVideoId:
      extractYouTubeId(
        firstString(record.youtube_video_id, record.interview_video, record.youtubeVideoId)
      ) || (!apiOnly ? mock.youtubeVideoId : ''),
    soundCloudUrl:
      firstString(
        record.soundcloud_track_id,
        record.soundCloudTrackUrl,
        record.interview_audio
      ) || (!apiOnly ? mock.soundCloudUrl : ''),
    downloadUrl:
      firstString(record.download_url, record.downloadUrl) || (!apiOnly ? mock.downloadUrl : ''),
  };
}

function mapPeople(raw: unknown, mock: HomePeopleCard, apiOnly: boolean): HomePeopleCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  const description = resolveHomeCardDescription(record, mock.description, apiOnly, 220);

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
    subtitle: mapHomePersonSubtitle(record, mock.subtitle, apiOnly),
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

  const description = resolveHomeCardDescription(record, mock.description, apiOnly, 280);
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
    subtitle: firstString(record.second_title) || (!apiOnly ? mock.subtitle : ''),
    filmBy: filmBy.toUpperCase() || (!apiOnly ? mock.filmBy : ''),
    description,
    image: pickImage(record.thumbnail_url ?? record.thumbnailUrl, apiOnly ? undefined : mock.image),
    youtubeVideoId:
      extractYouTubeId(
        firstString(
          record.youtube_video_id,
          record.youtubeVideoId,
          record.film_youtube_id
        )
      ) || (!apiOnly ? mock.youtubeVideoId : ''),
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
