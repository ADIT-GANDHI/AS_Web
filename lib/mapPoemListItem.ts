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
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
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

function extraTranslationText(it: Record<string, unknown>): string {
  const rows = it.extra_translation_rows;
  if (!Array.isArray(rows)) return '';
  return rows
    .map((row) => {
      if (typeof row === 'string') return htmlToPlainText(row);
      if (row && typeof row === 'object') {
        return htmlToPlainText(String((row as { text?: unknown }).text || ''));
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');
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
      extraTranslationText(it) ||
      String(it.couplet_translation || '').trim(),
    poet,
    poetId: poetId || undefined,
    translator:
      String(it.translator || it.translated_by || it.translation_by || it.translator_name || '')
        .trim() || undefined,
    title: String(it.couplet_transliteration || it.original_title || '').trim() || undefined,
    translationTitle: String(it.couplet_translation || '').trim() || undefined,
    keywordIds: splitIds(it.related_keywords ?? it.keywords),
    thumbnailUrl: it.thumbnail_url ? `${AJAB_API_BASE}${it.thumbnail_url}` : '',
    noteText: htmlToPlainText(
      String(it.note_text || it.notes || it.note || it.poem_notes || '')
    ),
    glossary: htmlToPlainText(
      String(it.glossary || it.glossary_text || it.poem_glossary || '')
    ),
    audioUrl:
      String(
        it.soundCloud_iD || it.soundcloud_url || it.song_url || it.soundCloud_track_url || ''
      ).trim() || undefined,
  };
}
