/**
 * "sings" (one performer) vs "sing" (two or more).
 *
 * CMS quirk: duos like Farid Ayaz & Abu Muhammad are often one `singer_ids`
 * row with "&" inside `singer_display` / `singer_names[0]`. Counting IDs alone
 * wrongly yields "sings"; we also split display names on & / and / commas.
 */

function displayLabel(entry: unknown): string {
  if (entry == null) return '';
  if (typeof entry === 'string' || typeof entry === 'number') {
    return String(entry).trim();
  }
  if (Array.isArray(entry)) {
    return entry.map(displayLabel).filter(Boolean).join(' & ');
  }
  if (typeof entry === 'object') {
    const row = entry as Record<string, unknown>;
    const nested = [row.name, row.title, row.english, row.hindi, row.label]
      .map(displayLabel)
      .find(Boolean);
    return nested || '';
  }
  return '';
}

function peopleCountFromText(text: string): number {
  if (!text.trim()) return 0;
  return text
    .split(/\s*(?:&|,|\/|\band\b)\s*/i)
    .map((p) => p.trim())
    .filter(Boolean).length;
}

export type SongSingsLabel = 'sing' | 'sings';

/** Prefer max(id count, name-part count) so compound duo names → "sing". */
export function resolveSongSingsLabel(
  record: {
    singer_ids?: unknown;
    singer_names?: unknown;
    singer_display?: unknown;
    singer?: unknown;
    singer_name?: unknown;
  },
  singerDisplayFallback = ''
): SongSingsLabel {
  const idCount = Array.isArray(record.singer_ids) ? record.singer_ids.length : 0;

  const labels: string[] = [];
  if (Array.isArray(record.singer_names) && record.singer_names.length > 0) {
    for (const entry of record.singer_names) {
      const label = displayLabel(entry);
      if (label) labels.push(label);
    }
  } else {
    const fallback =
      displayLabel(record.singer_display) ||
      displayLabel(record.singer) ||
      displayLabel(record.singer_name) ||
      singerDisplayFallback.trim();
    if (fallback) labels.push(fallback);
  }

  const nameCount = peopleCountFromText(labels.join(' & '));
  const count = Math.max(idCount, nameCount);

  return count <= 1 ? 'sings' : 'sing';
}
