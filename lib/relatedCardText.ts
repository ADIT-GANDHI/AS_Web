import { htmlToPlainText } from '@/lib/mapPoemListItem';

function unescapeNewlines(raw: string): string {
  return raw.replace(/\\n/g, '\n');
}

function stripPoemListingFootnote(text: string): string {
  const foot = text.search(/\n+For this /i);
  if (foot >= 0) return text.slice(0, foot).trim();
  return text;
}

function poemVerseExcerpt(text: string): string {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 2) return lines.join('\n');
  return lines.slice(0, 2).join('\n');
}

/** Card title for a related row — bucket-aware (poems use Devanagari original_title). */
export function getRelatedCardTitle(item: any, bucket: string): string {
  if (bucket === 'poems') {
    const t = item?.original_title || item?.title || '';
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  for (const field of [
    item?.Songtitle_transliteration,
    item?.title,
    item?.english_transliteration,
    item?.original_title,
    item?.person_name,
    item?.person_name_english,
    item?.word_transliteration,
  ]) {
    if (typeof field === 'string' && field.trim()) return field.trim();
  }
  return '';
}

/** Italic subtitle beside the title (songs, films). */
export function getRelatedCardSubtitle(item: any): string {
  if (item?.category_name && typeof item.category_name === 'string') {
    return item.category_name.trim();
  }
  if (item?.word_translation && typeof item.word_translation === 'string') {
    return item.word_translation.trim();
  }
  const sub =
    item?.subtitle ||
    item?.film_subtitle ||
    item?.songtitletraan ||
    item?.english_translation;
  return typeof sub === 'string' ? sub.trim() : '';
}

/**
 * Related-card body copy — matches PDF intent per bucket:
 * poems → verse excerpt (2 lines, pre-line); songs/films → synopsis (`about`).
 */
export function getRelatedCardDescription(item: any, bucket: string): string {
  if (bucket === 'poems') {
    const raw =
      item?.thumbnail_excerpt ||
      item?.thumbnailexcerpt ||
      item?.meta_description ||
      '';
    if (!raw) return '';
    let text = unescapeNewlines(htmlToPlainText(String(raw)));
    text = stripPoemListingFootnote(text);
    return poemVerseExcerpt(text);
  }

  const raw =
    bucket === 'films' || bucket === 'songs'
      ? item?.about ||
        item?.description ||
        item?.meta_description ||
        item?.thumbnail_excerpt ||
        item?.thumbnailexcerpt ||
        ''
      : item?.thumbnail_excerpt ||
        item?.thumbnailexcerpt ||
        item?.meta_description ||
        item?.about ||
        item?.description ||
        '';

  return htmlToPlainText(String(raw)).trim();
}

/** Whether the description should clamp with CSS line-clamp + ...more. */
export function relatedDescriptionNeedsClamp(descPlain: string, bucket: string): boolean {
  if (!descPlain) return false;
  if (bucket === 'poems') return false;
  return descPlain.length > 200;
}
