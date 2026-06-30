/** Truncate plain text at a word boundary (for inline “…more” clamps). */
export function truncateAtWord(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '');
}
