import {
  MOCK_HOME_FILM,
  MOCK_HOME_PEOPLE,
  MOCK_HOME_POEM,
  MOCK_HOME_REFLECTION,
  MOCK_HOME_SONG,
} from '@/components/Home/CLHomeMocks';

export type HomeSongCard = typeof MOCK_HOME_SONG;
export type HomePoemCard = typeof MOCK_HOME_POEM;
export type HomeReflectionCard = typeof MOCK_HOME_REFLECTION;
export type HomePeopleCard = typeof MOCK_HOME_PEOPLE;
export type HomeFilmCard = typeof MOCK_HOME_FILM;

export type HomeLatestPayload = {
  song: HomeSongCard;
  poem: HomePoemCard;
  reflection: HomeReflectionCard;
  people: HomePeopleCard;
  film: HomeFilmCard;
};

function htmlToPlainText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

/** Prefer CMS thumb when present; otherwise keep mock/local placeholder art. */
function pickImage(apiPath: unknown, mockPath: string): string {
  if (typeof apiPath === 'string' && apiPath.trim()) return apiPath.trim();
  return mockPath;
}

function truncate(text: string, max = 320): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function mapSong(raw: any, mock: HomeSongCard): HomeSongCard {
  if (!raw || typeof raw !== 'object') return mock;
  const about = htmlToPlainText(
    firstString(raw.meta_description, raw.about, raw.metaDescription) || mock.description
  );
  return {
    id: raw.id ?? mock.id,
    title: firstString(
      raw.Songtitle_transliteration,
      raw.song_title_transliteration,
      raw.umbrellaTitleText,
      raw.songTitle
    ) || mock.title,
    subtitle: firstString(raw.songtitletraan, raw.songTitleTransliteration, raw.english_translation) || mock.subtitle,
    singer: firstString(raw.singer, raw.singer_name, raw.singer_display)?.toUpperCase() || mock.singer,
    poet: firstString(raw.poet, raw.poet_name)?.toUpperCase() || mock.poet,
    description: about ? truncate(about, 220) : mock.description,
    image: pickImage(raw.thumbnail_url ?? raw.thumbnailUrl, mock.image),
  };
}

function mapPoem(raw: any, mock: HomePoemCard): HomePoemCard {
  if (!raw || typeof raw !== 'object') return mock;
  const originalHtml = firstString(raw.original_text, raw.couplet_hindi, raw.hindi_text);
  const transliteration = firstString(raw.couplet_transliteration, raw.english_transliteration_text);
  const translation = firstString(raw.couplet_translation, raw.english_translation_text);

  let text = '';
  if (originalHtml) {
    text = htmlToPlainText(originalHtml);
  } else if (transliteration || translation) {
    text = [transliteration, translation].filter(Boolean).join('\n\n');
  }

  const poet = firstString(raw.poet_names, raw.attributed_poet, raw.poet_name)?.toUpperCase() || mock.poet;

  return {
    id: raw.id ?? mock.id,
    text: text ? truncate(text, 180) : mock.text,
    poet,
  };
}

function mapReflection(raw: any, mock: HomeReflectionCard): HomeReflectionCard {
  if (!raw || typeof raw !== 'object') return mock;
  const about = htmlToPlainText(
    firstString(raw.meta_description, raw.about, raw.excerpt) || mock.description
  );
  return {
    id: raw.id ?? mock.id,
    title: firstString(raw.title, raw.second_title, raw.audio_story_title) || mock.title,
    saysBy: firstString(raw.speaker_names, raw.speaker_name, raw.speaker)?.toUpperCase() || mock.saysBy,
    description: about ? truncate(about, 140) : mock.description,
    image: pickImage(raw.thumbnail_url ?? raw.thumbnailUrl, mock.image),
  };
}

function mapPeople(raw: any, mock: HomePeopleCard): HomePeopleCard {
  if (!raw || typeof raw !== 'object') return mock;
  const about = htmlToPlainText(
    firstString(raw.thumbnail_excerpt, raw.about, raw.meta_description) || mock.description
  );
  const title = firstString(
    raw.person_name_english,
    [raw.first_name, raw.middle_name, raw.last_name].filter(Boolean).join(' '),
    raw.first_name
  ) || mock.title;
  return {
    id: raw.id ?? mock.id,
    title,
    subtitle: firstString(raw.primary_occupation, raw.occupation) || mock.subtitle,
    introBy: firstString(raw.intro_by, raw.introducer)?.toUpperCase() || mock.introBy,
    description: about ? truncate(about, 280) : mock.description,
    image: pickImage(
      raw.thumbnail_url ?? raw.thumbnailUrl ?? raw.thumbnail_image_upload,
      mock.image
    ),
  };
}

function mapFilm(raw: any, mock: HomeFilmCard): HomeFilmCard {
  if (!raw || typeof raw !== 'object') return mock;
  const about = htmlToPlainText(firstString(raw.about, raw.meta_description) || mock.description);
  let filmBy = firstString(raw.directors, raw.director, raw.film_by, raw.filmBy);
  if (Array.isArray(raw.directors) && raw.directors.length) {
    filmBy = raw.directors.map((d: any) => (typeof d === 'string' ? d : d?.name)).filter(Boolean).join(', ');
  }
  return {
    id: raw.id ?? mock.id,
    title: firstString(raw.original_title, raw.english_translation, raw.english_transliteration) || mock.title,
    subtitle: firstString(raw.english_translation, raw.english_transliteration) || mock.subtitle,
    filmBy: filmBy?.toUpperCase() || mock.filmBy,
    description: about ? truncate(about, 280) : mock.description,
    image: pickImage(raw.thumbnail_url ?? raw.thumbnailUrl, mock.image),
  };
}

/** Map `/Api/home` `latest` object onto card props, merging with local mock fallbacks. */
export function mapHomeLatest(latest: any): HomeLatestPayload {
  return {
    song: mapSong(latest?.song, MOCK_HOME_SONG),
    poem: mapPoem(latest?.poem, MOCK_HOME_POEM),
    reflection: mapReflection(latest?.reflection, MOCK_HOME_REFLECTION),
    people: mapPeople(latest?.person ?? latest?.people, MOCK_HOME_PEOPLE),
    film: mapFilm(latest?.film, MOCK_HOME_FILM),
  };
}
