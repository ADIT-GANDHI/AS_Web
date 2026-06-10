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

export function mapPoemListItem(it: Record<string, unknown>): PoemData {
  return {
    id: String(it.id || ''),
    text:
      htmlToPlainText(String(it.english_transliteration_text || '')) ||
      String(it.couplet_transliteration || it.original_title || ''),
    hindi: htmlToPlainText(String(it.original_text || '')),
    english:
      htmlToPlainText(String(it.english_translation_text || '')) ||
      String(it.couplet_translation || '').trim(),
    poet: String(it.attributed_poet || it.poet || ''),
    meta_keywords:
      (typeof it.meta_keywords === 'string' ? it.meta_keywords : '') ||
      (typeof it.metaKeyword === 'string' ? it.metaKeyword : '') ||
      '',
    thumbnailUrl: it.thumbnail_url ? `${AJAB_API_BASE}${it.thumbnail_url}` : '',
    noteText: htmlToPlainText(String(it.note_text || '')),
    glossary: htmlToPlainText(String(it.glossary || '')),
  };
}
