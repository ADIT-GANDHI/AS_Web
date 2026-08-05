import { AJAB_API_BASE } from '@/lib/ajabEnv';
import type { PoemData } from '@/components/Poems/CLPoemMocks';

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

function splitIds(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  return String(raw)
    .split(/[,|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function mapPoemListItem(
  it: Record<string, unknown>,
  poetNameById?: Map<string, string>
): PoemData {
  const poetId = String(it.poet_id || '').trim();
  const attributed = String(it.attributed_poet || it.poet || '').trim();
  const fromMap = poetId && poetNameById ? poetNameById.get(poetId) : '';
  const poet = (fromMap || attributed || '').replace(/\s+/g, ' ').trim();

  return {
    id: String(it.id || ''),
    text:
      htmlToPlainText(String(it.english_transliteration_text || '')) ||
      String(it.couplet_transliteration || it.original_title || ''),
    hindi: htmlToPlainText(String(it.original_text || '')),
    english:
      htmlToPlainText(String(it.english_translation_text || '')) ||
      String(it.couplet_translation || '').trim(),
    poet,
    poetId: poetId || undefined,
    translator: String(it.translator || '').trim() || undefined,
    title: String(it.couplet_transliteration || it.original_title || '').trim() || undefined,
    translationTitle: String(it.couplet_translation || '').trim() || undefined,
    keywordIds: splitIds(it.related_keywords ?? it.keywords),
    thumbnailUrl: it.thumbnail_url ? `${AJAB_API_BASE}${it.thumbnail_url}` : '',
    noteText: htmlToPlainText(String(it.note_text || '')),
    glossary: htmlToPlainText(String(it.glossary || '')),
    audioUrl:
      String(it.soundCloud_iD || it.soundcloud_url || it.soundCloud_track_url || '').trim() ||
      undefined,
  };
}
