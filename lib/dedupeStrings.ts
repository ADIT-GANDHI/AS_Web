/** Drop empties; keep first occurrence order (CMS filter APIs often repeat labels). */
export function dedupeOrderedStrings(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const value = String(raw ?? '').trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}
