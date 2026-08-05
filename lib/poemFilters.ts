import { AJAB_API_BASE } from '@/lib/ajabEnv';
import type { ListingFilterOption } from '@/components/shared/listingFilterTypes';

/** Prefetch poet/theme option lists for the Poems filter parda. */
export async function fetchPoemFilterOptions(): Promise<{
  poets: ListingFilterOption[];
  themes: ListingFilterOption[];
}> {
  try {
    const res = await fetch(`${AJAB_API_BASE}/Api/poem_filters`, { cache: 'no-store' });
    if (!res.ok) return { poets: [], themes: [] };
    const json = await res.json();
    const data = json?.data || {};
    const poets: ListingFilterOption[] = (data.poets || [])
      .map((p: { id?: string; poet_name?: string }) => ({
        id: String(p.id || ''),
        label: String(p.poet_name || '')
          .replace(/\s+/g, ' ')
          .trim(),
      }))
      .filter((p: ListingFilterOption) => p.id && p.label);
    const themes: ListingFilterOption[] = (data.themes || [])
      .map((t: { id?: string; word_transliteration?: string }) => ({
        id: String(t.id || ''),
        label: String(t.word_transliteration || '').trim(),
      }))
      .filter((t: ListingFilterOption) => t.id && t.label);
    return { poets, themes };
  } catch {
    return { poets: [], themes: [] };
  }
}
