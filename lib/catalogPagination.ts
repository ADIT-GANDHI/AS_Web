/** Merge catalog pages by `id` without duplicates. */
export function mergeCatalogById<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const seen = new Set(prev.map((item) => item.id));
  const merged = [...prev];
  for (const item of next) {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

/**
 * Whether the listing should still show “Load more”:
 * - more filtered rows already fetched but not yet visible, or
 * - more rows available from the API.
 */
export function catalogHasMore(
  loadedCount: number,
  visibleCount: number,
  filteredCount: number,
  total: number | null
): boolean {
  if (visibleCount < filteredCount) return true;
  if (total != null && loadedCount < total) return true;
  return false;
}
