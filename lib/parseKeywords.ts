/** Parse comma/ampersand-separated keyword strings (e.g. glossary word lists). Not for SEO meta_keywords. */
export function parseMetaKeywords(raw: unknown): string[] {
  if (!raw || typeof raw !== 'string') return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[&,]/)) {
    const term = part.replace(/\s+/g, ' ').trim();
    const key = term.toLowerCase();
    if (term.length > 1 && !seen.has(key)) {
      seen.add(key);
      out.push(term);
    }
  }
  return out;
}

export function mergeKeywordTerms(...sources: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of sources) {
    for (const term of parseMetaKeywords(src)) {
      const key = term.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(term);
      }
    }
  }
  return out;
}

export function keywordSearchHref(term: string): string {
  return `/searche?search=${encodeURIComponent(term)}`;
}

/** Drop obvious CMS test/junk glossary entries (e.g. "Saudaagir asdasdasd"). */
function isLikelyTestKeyword(term: string): boolean {
  const lower = term.toLowerCase();
  if (/asdasd|test|dgfdgf|lorem|zzzz|xxx/.test(lower)) return true;
  if (term.length < 3) return true;
  return false;
}

/** Related API keywords bucket → plain search terms. */
export function keywordsFromRelatedBucket(keywords: unknown[]): string[] {
  if (!Array.isArray(keywords)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of keywords) {
    const term = String(
      (k as Record<string, unknown>)?.word_transliteration ||
        (k as Record<string, unknown>)?.title ||
        (k as Record<string, unknown>)?.term ||
        (k as Record<string, unknown>)?.word ||
        ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const key = term.toLowerCase();
    if (term.length > 1 && !seen.has(key) && !isLikelyTestKeyword(term)) {
      seen.add(key);
      out.push(term);
    }
  }
  return out;
}

/** Related API keywords bucket → { term, meaning } pairs for GlossaryStrip.
 *  Reads word_transliteration as the display term and word_translation as
 *  the English meaning. Shows all entries that have both fields populated. */
export function glossaryTermsFromKeywords(
  keywords: unknown[]
): Array<{ term: string; meaning: string }> {
  if (!Array.isArray(keywords)) return [];
  const seen = new Set<string>();
  const out: Array<{ term: string; meaning: string }> = [];
  for (const k of keywords) {
    const term = String(
      (k as Record<string, unknown>)?.word_transliteration || ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const meaning = String(
      (k as Record<string, unknown>)?.word_translation || ''
    )
      .replace(/\s+/g, ' ')
      .trim();
    const key = term.toLowerCase();
    if (term.length > 1 && meaning.length > 0 && !seen.has(key)) {
      seen.add(key);
      out.push({ term, meaning });
    }
  }
  return out;
}
