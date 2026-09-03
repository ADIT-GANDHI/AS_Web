import {
  MOCK_HOME_FILM,
  MOCK_HOME_PEOPLE,
  MOCK_HOME_POEM,
  MOCK_HOME_REFLECTION,
  MOCK_HOME_SONG,
} from '@/components/Home/CLHomeMocks';
import { formatFilmDirector } from '@/components/Films/filmFieldUtils';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { mapPersonProfileTags } from '@/lib/mapPersonDetail';
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

function decodeBasicHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*10;/g, '\n')
    .replace(/&#0*13;/g, '\n')
    /* U+2028 line separator often appears as &#8232; in poem HTML */
    .replace(/&#8232;|&#x2028;/gi, '\n')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : '';
    });
}

function htmlToPlainText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return decodeBasicHtmlEntities(
    raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\u2028|\u2029/g, '\n')
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

/** Flatten CMS name fields that may be a string, array, or `{ name }` object. Skip numeric ids. */
function firstDisplayName(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t && t !== '—' && !/^\d+$/.test(t)) return t;
      continue;
    }
    if (Array.isArray(v)) {
      const joined = v
        .map((entry) => firstDisplayName(entry))
        .filter(Boolean)
        .join(', ');
      if (joined) return joined;
      continue;
    }
    if (v && typeof v === 'object') {
      const row = v as Record<string, unknown>;
      const nested = firstDisplayName(row.name, row.title, row.english, row.hindi);
      if (nested) return nested;
    }
  }
  return '';
}

function mapHomePersonSubtitle(
  record: Record<string, unknown>,
  mockSubtitle: string,
  apiOnly: boolean
): string {
  const tags = mapPersonProfileTags(record);
  if (tags) return tags;
  return apiOnly ? '' : mockSubtitle;
}

/** `/Api/home` person omits `profile_tags_list` — fill it from `person_list`. */
export async function withHomePersonProfileTags(
  people: HomePeopleCard | null
): Promise<HomePeopleCard | null> {
  if (!people?.id) return people;
  try {
    const res = await fetch(
      `${AJAB_API_BASE}/Api/person_list?person_id=${encodeURIComponent(String(people.id))}&limit=1`,
      { cache: 'no-store' }
    );
    if (!res.ok) return people;
    const json = await res.json();
    const row = Array.isArray(json?.data) ? json.data[0] : json?.data;
    if (!row || typeof row !== 'object') return people;
    if (String((row as { id?: unknown }).id ?? '') !== String(people.id)) return people;
    return {
      ...people,
      subtitle: mapPersonProfileTags(row as Record<string, unknown>),
    };
  } catch {
    return people;
  }
}

function hasRecordId(raw: Record<string, unknown>): boolean {
  const id = raw.id;
  return id != null && id !== '';
}

function pickImage(apiPath: unknown, mockPath?: string): string {
  if (typeof apiPath === 'string' && apiPath.trim()) return apiPath.trim();
  return mockPath ?? '';
}

/** First non-empty CMS thumb. `??` is not enough — `thumbnail_url: ""` must not hide `thumbnailUrl`. */
function pickRecordImage(record: Record<string, unknown>, mockPath?: string): string {
  return pickImage(
    firstString(
      record.thumbnailUrl,
      record.thumbnail_url,
      record.thumbnail_Image,
      record.thumbnail_image,
      record.thumbnail_image_upload
    ),
    mockPath
  );
}

/** Truncate at the last whole word (never mid-word). */
function truncate(text: string, max = 320): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > Math.floor(max * 0.5) ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

function sameCardText(a: string, b: string): boolean {
  return a.replace(/\s+/g, ' ').trim().toLowerCase() === b.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** 1 singer → "sings"; 2+ → "sing". Prefer singer_ids; else parse names for & / and. */
function resolveSongSingsLabel(record: Record<string, unknown>, singerDisplay: string): 'sing' | 'sings' {
  if (Array.isArray(record.singer_ids) && record.singer_ids.length > 0) {
    return record.singer_ids.length === 1 ? 'sings' : 'sing';
  }

  const labels: string[] = [];
  if (Array.isArray(record.singer_names) && record.singer_names.length > 0) {
    for (const entry of record.singer_names) {
      const label = firstDisplayName(entry);
      if (label) labels.push(label);
    }
  } else if (singerDisplay) {
    labels.push(singerDisplay);
  }

  const count = labels
    .join(' & ')
    .split(/\s*(?:&|,|\/|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean).length;

  return count <= 1 ? 'sings' : 'sing';
}

/** CMS ⊙ Translated title — skip when it merely repeats the transliteration. */
function resolveSongTitleTranslation(record: Record<string, unknown>, title: string): string {
  const candidates = [
    record.songtitletraan,
    record.song_title_translation,
    record.songTitleTranslation,
    record.song_title_english,
    record.songTitle,
    record.english_translation,
  ];
  for (const candidate of candidates) {
    const value = firstString(candidate);
    if (!value) continue;
    if (title && sameCardText(value, title)) continue;
    return value;
  }
  return '';
}

/** Visible placeholder when CMS `thumbnail_excerpt` is empty — keeps home card layout intact. */
const HOME_THUMBNAIL_EXCERPT_PLACEHOLDER =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

/**
 * Card body under home thumbs — CMS may send `thumbnailexcerpt` and/or
 * `thumbnail_excerpt`. Reflections also use `reflection_excerpt`.
 * People cards prefer `profile`. Skips junk placeholders (e.g. `"t"`, `"test"`).
 */
function pickCardExcerptField(
  record: Record<string, unknown>,
  keys: string[] = ['thumbnailexcerpt', 'thumbnail_excerpt']
): string {
  for (const key of keys) {
    const raw = record[key];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    const text = raw.includes('<') ? htmlToPlainText(raw) : raw.trim();
    if (text.length <= 10) continue;
    return text;
  }
  return '';
}

function resolveHomeCardDescription(
  record: Record<string, unknown>,
  mockDescription: string,
  apiOnly: boolean,
  maxLen = 280,
  excerptKeys: string[] = ['thumbnailexcerpt', 'thumbnail_excerpt']
): string {
  const excerpt = pickCardExcerptField(record, excerptKeys);
  if (excerpt) return truncate(excerpt, maxLen);
  if (apiOnly || hasRecordId(record)) return HOME_THUMBNAIL_EXCERPT_PLACEHOLDER;
  return mockDescription;
}

function mapSong(raw: unknown, mock: HomeSongCard, apiOnly: boolean): HomeSongCard | null {
  if (!raw || typeof raw !== 'object') return apiOnly ? null : mock;
  const record = raw as Record<string, unknown>;
  if (apiOnly && !hasRecordId(record)) return null;

  /* Home song blurb — English thumbnail excerpt only (not about / meta). */
  const description = resolveHomeCardDescription(
    record,
    mock.description,
    apiOnly,
    220,
    ['thumbnailexcerpt', 'thumbnail_excerpt']
  );

  const title =
    firstString(
      record.Songtitle_transliteration,
      record.song_title_transliteration,
      record.songTitleTransliteration,
      record.umbrellaTitleText,
      record.umbrellaTitle
    ) || (!apiOnly ? mock.title : '');

  const subtitle =
    resolveSongTitleTranslation(record, title) || (!apiOnly && !hasRecordId(record) ? mock.subtitle : '');

  const singer =
    firstDisplayName(
      record.singer_names,
      record.singer_display,
      record.singer,
      record.singer_name
    ).toUpperCase() || (!apiOnly ? mock.singer : '');

  return {
    id: (record.id ?? mock.id) as HomeSongCard['id'],
    title,
    subtitle,
    singsLabel: singer ? resolveSongSingsLabel(record, singer) : mock.singsLabel,
    singer,
    poet:
      firstDisplayName(record.poet_names, record.poet_display, record.poet, record.poet_name).toUpperCase() ||
      (!apiOnly ? mock.poet : ''),
    description,
    image: pickRecordImage(record, apiOnly ? undefined : mock.image),
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

  /* Keep CMS paragraph / <br> line breaks; do not collapse verses. */
  let translation = joinVerseLines(htmlToVerseLines(translationHtml));
  let transliteration = joinVerseLines(htmlToVerseLines(transliterationHtml));

  // Legacy CMS fields — Hindi original only when no English verse is available.
  if (!transliteration) {
    const legacy = htmlToVerseLines(
      firstString(record.original_text, record.couplet_hindi, record.hindi_text)
    );
    transliteration = joinVerseLines(legacy);
  }

  if (!transliteration && !apiOnly) transliteration = mock.transliteration;
  if (!translation && !apiOnly) translation = mock.translation;

  const poet =
    firstDisplayName(
      record.attributed_poet,
      record.poet_names,
      record.poet_name,
      record.poet,
      record.poet_id_raw
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

  /* Reflection home card — English thumbnail excerpt; media is always the thumb (not YT). */
  const description = resolveHomeCardDescription(
    record,
    mock.description,
    apiOnly,
    140,
    ['thumbnailexcerpt', 'thumbnail_excerpt']
  );

  return {
    id: (record.id ?? mock.id) as HomeReflectionCard['id'],
    title:
      firstString(record.title, record.audio_story_title) ||
      (!apiOnly ? mock.title : ''),
    saysBy:
      firstDisplayName(
        record.speaker_names,
        record.speaker_name,
        record.speaker,
        record.author,
        record.author_name
      ).toUpperCase() || (!apiOnly ? mock.saysBy : ''),
    description,
    image: pickRecordImage(record, apiOnly ? undefined : mock.image),
    youtubeVideoId: '',
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

  /* People home card body — prefer CMS `profile` (API often omits thumbnail_excerpt). */
  const description = resolveHomeCardDescription(
    record,
    mock.description,
    apiOnly,
    220,
    ['profile', 'about', 'thumbnailexcerpt', 'thumbnail_excerpt', 'meta_description']
  );

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
    image: pickRecordImage(record, apiOnly ? undefined : mock.image),
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
    image: pickRecordImage(record, apiOnly ? undefined : mock.image),
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
