import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { resolveCmsAssetUrl } from '@/lib/resolveCmsAssetUrl';

export type RadioTrack = {
  id: string;
  name: string;
  subtitle?: string;
  duration: string;
  thumb: string;
  /** SoundCloud track id or full track/URL */
  audioUrl?: string;
  songHref?: string;
  about?: string;
};

export type RadioPlaylist = {
  id: string;
  title: string;
  artist: string;
  tracks: RadioTrack[];
};

const FALLBACK_THUMBS = [
  '/radio-thumb-sample.png',
  '/poems-listen-1.png',
  '/poems-listen-2.png',
  '/poems-listen-3.png',
];

function firstString(...vals: unknown[]): string {
  for (const v of vals) {
    const s = String(v ?? '').trim();
    if (s) return s;
  }
  return '';
}

function soundcloudFromRow(row: Record<string, unknown>): string {
  return firstString(
    row.soundCloud_iD,
    row.soundcloud_url,
    row.soundCloud_track_url,
    row.soundCloudTrackUrl,
    row.soundcloud_track_id,
    row.soundCloud_track_id
  );
}

function mapSongRow(row: Record<string, unknown>, index: number): RadioTrack | null {
  const audioUrl = soundcloudFromRow(row);
  const rawSinger = firstString(
    row.singer_display,
    row.singer,
    row.singer_names,
    row.english_transliteration,
    row.title,
    `Track ${index + 1}`
  ).replace(/\s+/g, ' ');
  // Prefer a single performer name for the radio queue (PDF shows one name per row)
  const name = rawSinger.split(/\s*[&,/]\s*/)[0]?.trim() || rawSinger;
  if (!name) return null;
  const thumbRaw = firstString(row.thumbnail_url, row.thumbnailUrl, row.upload_singer_image);
  const thumb = thumbRaw
    ? resolveCmsAssetUrl(thumbRaw) || FALLBACK_THUMBS[index % FALLBACK_THUMBS.length]
    : FALLBACK_THUMBS[index % FALLBACK_THUMBS.length];
  const id = firstString(row.id, audioUrl, name) || `track-${index}`;
  const title = firstString(row.english_transliteration, row.title).replace(/\s+/g, ' ');
  return {
    id,
    name,
    subtitle: title && title.toLowerCase() !== name.toLowerCase()
      ? title
      : firstString(row.place, row.year, row.recording_year),
    duration: firstString(row.duration, row.track_duration) || '',
    thumb,
    audioUrl: audioUrl || undefined,
    songHref: row.id ? `/songs/details/${encodeURIComponent(String(row.id))}` : '/songs',
    about: firstString(row.about, row.description, row.meta_description),
  };
}

/** Prefer songs with SoundCloud ids; pad with other songs if needed. */
export async function fetchRadioTracks(limit = 8): Promise<RadioTrack[]> {
  try {
    const res = await fetch(
      `${AJAB_API_BASE}/Api/list?page=1&limit=${Math.max(limit * 4, 40)}&search=&singer=&poet=`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json?.data)) return [];
    const mapped = json.data
      .map((row: Record<string, unknown>, i: number) => mapSongRow(row, i))
      .filter(Boolean) as RadioTrack[];

    const withAudio: RadioTrack[] = [];
    const without: RadioTrack[] = [];
    const seen = new Set<string>();
    for (const track of mapped) {
      const key = track.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (track.audioUrl) withAudio.push(track);
      else without.push(track);
    }
    const merged = [...withAudio, ...without].slice(0, limit);
    return merged;
  } catch {
    return [];
  }
}

/** Build mock-ish playlists from a flat track pool when CMS has no radio API. */
export function buildPlaylistsFromTracks(tracks: RadioTrack[]): RadioPlaylist[] {
  if (!tracks.length) return [];
  const chunks: RadioPlaylist[] = [];
  const size = 4;
  for (let i = 0; i < tracks.length; i += size) {
    const slice = tracks.slice(i, i + size);
    const head = slice[0];
    chunks.push({
      id: `pl-${head.id}-${i}`,
      title: head.subtitle || `Set ${chunks.length + 1}`,
      artist: slice.map((t) => t.name).join(' & ').toUpperCase().slice(0, 42),
      tracks: slice,
    });
  }
  return chunks;
}

export function soundcloudEmbedSrc(trackIdOrUrl: string, autoPlay: boolean): string {
  const raw = trackIdOrUrl.trim();
  const trackUrl = /^https?:\/\//i.test(raw)
    ? raw
    : `https://api.soundcloud.com/tracks/${encodeURIComponent(raw)}`;
  const params = new URLSearchParams({
    url: trackUrl,
    color: '#E31E79',
    auto_play: autoPlay ? 'true' : 'false',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'false',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}
