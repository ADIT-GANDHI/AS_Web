/** Extract a YouTube video id from a watch URL, youtu.be link, or bare id. */
export function extractYouTubeId(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  const fromQuery = trimmed.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
  if (fromQuery?.[1]) return fromQuery[1];
  if (/^[A-Za-z0-9_-]{6,}$/.test(trimmed)) return trimmed;
  return '';
}
