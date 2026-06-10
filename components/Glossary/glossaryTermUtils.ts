/** Split CMS term line into display word + script/transliteration parens. */
export function parseGlossaryTermLine(raw: string): { word: string; script: string } {
  const trimmed = (raw || '').trim();
  const match = trimmed.match(/^(.+?)\s*(\([^)]+\))\s*$/);
  if (match) {
    return { word: match[1].trim(), script: match[2].trim() };
  }
  return { word: trimmed, script: '' };
}
