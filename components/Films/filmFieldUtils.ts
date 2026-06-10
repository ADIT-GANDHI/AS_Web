/** Shared CMS → UI field helpers for Films listing + detail. */

export function formatFilmDirector(
  raw?: string | string[] | null
): string {
  if (Array.isArray(raw)) return raw.filter(Boolean).join(', ').trim();
  return typeof raw === 'string' ? raw.trim() : '';
}

export function htmlToPlainText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractYouTubeId(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!trimmed.includes('http')) return trimmed;
  const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
  return match ? match[1] : '';
}

function isBlankCmsHtml(raw?: string | null): boolean {
  if (!raw || typeof raw !== 'string') return true;
  return htmlToPlainText(raw).length <= 10;
}

/** First segment before CMS `~` / `*` block markers (credits, bios, etc.). */
export function firstFilmBodySegment(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  const parts = raw.split(/<p[^>]*>\s*~+\s*<\/p>|<p[^>]*>\s*\*+\s*<\/p>/i);
  const first = (parts[0] || '').trim();
  return isBlankCmsHtml(first) ? '' : first;
}

/**
 * Short body copy for film detail (PDF: one paragraph + …more).
 * profile_text → first block of about_text → description.
 * meta_description is SEO/campaign metadata only — not used here.
 */
export function getFilmDescription(item: any): string {
  const profile = firstFilmBodySegment(item?.profile_text);
  if (profile) return htmlToPlainText(profile);

  const about = firstFilmBodySegment(item?.about_text);
  if (about) return htmlToPlainText(about);

  const desc = typeof item?.description === 'string' ? item.description.trim() : '';
  if (desc.length > 10) return desc;

  return '';
}

/** Listing card blurb — never the junk single-char thumbnail_excerpt. */
export function getFilmListingBlurb(item: any, maxLen = 280): string {
  const excerpt = typeof item?.thumbnail_excerpt === 'string' ? item.thumbnail_excerpt.trim() : '';
  if (excerpt.length > 10) return excerpt;

  const desc = typeof item?.description === 'string' ? item.description.trim() : '';
  if (desc.length > 10) return desc.length > maxLen ? `${desc.slice(0, maxLen).trim()}…` : desc;

  const body = getFilmDescription(item);
  if (body) return body.length > maxLen ? `${body.slice(0, maxLen).trim()}…` : body;

  return '';
}
