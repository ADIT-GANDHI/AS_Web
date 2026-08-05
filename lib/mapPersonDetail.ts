import { AJAB_API_BASE } from './ajabEnv';

export function resolvePersonImageUrl(raw: unknown): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http')) return trimmed;
  return `${AJAB_API_BASE}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/** Role line beside name — strip CMS leading underscores; show singular labels. */
export function mapPersonRole(it: Record<string, unknown>): string {
  const raw =
    it.occupation_text ||
    it.occupation_names ||
    it.category_name ||
    it.occupation ||
    '';
  const normalized = String(raw)
    .replace(/^_+/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  if (!normalized || normalized === '—') return '';
  return singularizeOccupationLabel(normalized);
}

/** CMS stores plural occupations (SINGERS, POETS, LEGENDARY FIGURES). */
export function singularizeOccupationLabel(label: string): string {
  return label
    .split(',')
    .map((part) => {
      const token = part.trim();
      if (!token) return token;
      if (/FIGURES$/i.test(token)) return token.replace(/FIGURES$/i, 'FIGURE');
      if (/IES$/i.test(token)) return token.replace(/IES$/i, 'Y');
      if (/S$/i.test(token) && !/(SS|US|IS)$/i.test(token)) {
        return token.replace(/S$/i, '');
      }
      return token;
    })
    .filter(Boolean)
    .join(', ');
}

/** Up to 3 unique gallery URLs (thumbnail + optional CMS gallery arrays). */
export function extractPersonGallery(it: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const push = (candidate: unknown) => {
    const url = resolvePersonImageUrl(candidate);
    if (url && !urls.includes(url)) urls.push(url);
  };

  const arrayFields = [
    it.gallery_images,
    it.gallery,
    it.images,
    it.person_images,
    it.additional_images,
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(field)) continue;
    for (const entry of field) {
      if (typeof entry === 'string') push(entry);
      else if (entry && typeof entry === 'object') {
        const row = entry as Record<string, unknown>;
        push(row.url ?? row.image_url ?? row.thumbnail_url ?? row.thumbnailUrl);
      }
    }
  }

  push(it.thumbnail_url ?? it.thumbnailUrl ?? it.thumbnail_image_upload);
  return urls.slice(0, 3);
}

export function buildPersonDisplayName(it: Record<string, unknown>): string {
  return (
    String(it.person_name_english || '') ||
    String(it.person_name || '') ||
    [it.first_name, it.middle_name, it.last_name].filter(Boolean).join(' ').trim()
  );
}
