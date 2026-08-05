import { AJAB_API_BASE } from '@/lib/ajabEnv';
import type { AudioVersion } from '@/components/Poems/CLPoemPopups';

export type PoemAudioTrack = {
  id: string;
  soundcloudId: string;
  singer: string;
  songUrl?: string;
  profileUrl?: string;
  thumbnailUrl?: string;
};

const FALLBACK_THUMBS = [
  '/poems-listen-1.png',
  '/poems-listen-2.png',
  '/poems-listen-3.png',
];

function asTrack(raw: Record<string, unknown>, index = 0): PoemAudioTrack | null {
  const soundcloudId = String(raw.soundcloud_url || raw.soundCloud_iD || '').trim();
  if (!soundcloudId) return null;
  const singer = String(raw.singer_name || raw.song_name || 'Unknown').trim() || 'Unknown';
  const thumbRaw = String(raw.upload_singer_image || '').trim();
  const thumbnailUrl = thumbRaw
    ? thumbRaw.startsWith('http')
      ? thumbRaw
      : `${AJAB_API_BASE}${thumbRaw.startsWith('/') ? thumbRaw : `/${thumbRaw}`}`
    : FALLBACK_THUMBS[index % FALLBACK_THUMBS.length];

  return {
    id: String(raw.id || soundcloudId),
    soundcloudId,
    singer,
    songUrl: String(raw.song_url || '').trim() || undefined,
    profileUrl: String(raw.profile_url || '').trim() || undefined,
    thumbnailUrl,
  };
}

/** Listen clips for Poems — CMS `/api/poem/getPublished`. */
export async function fetchPublishedPoemAudio(limit = 12): Promise<PoemAudioTrack[]> {
  try {
    const res = await fetch(
      `${AJAB_API_BASE}/api/poem/getPublished?page=1&limit=${limit}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json?.data)) return [];
    return json.data
      .map((row: Record<string, unknown>, i: number) => asTrack(row, i))
      .filter(Boolean) as PoemAudioTrack[];
  } catch {
    return [];
  }
}

/** Single listen clip — CMS `/api/poem/getById/:id`. */
export async function fetchPoemAudioById(id: string): Promise<PoemAudioTrack | null> {
  if (!id) return null;
  try {
    const res = await fetch(`${AJAB_API_BASE}/api/poem/getById/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json?.data;
    if (!data || typeof data !== 'object') return null;
    return asTrack(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function toAudioVersions(tracks: PoemAudioTrack[]): AudioVersion[] {
  return tracks.map((t) => ({
    id: t.id,
    singer: t.singer,
    duration: '',
    thumbnailUrl: t.thumbnailUrl,
    audioUrl: t.soundcloudId,
  }));
}

export function soundcloudEmbedUrl(trackIdOrUrl: string): string {
  const raw = trackIdOrUrl.trim();
  const trackUrl = /^https?:\/\//i.test(raw)
    ? raw
    : `https://api.soundcloud.com/tracks/${encodeURIComponent(raw)}`;
  const params = new URLSearchParams({
    url: trackUrl,
    color: '#E31E79',
    auto_play: 'true',
    hide_related: 'true',
    show_comments: 'false',
    show_user: 'false',
    show_reposts: 'false',
    show_teaser: 'false',
    visual: 'false',
  });
  return `https://w.soundcloud.com/player/?${params.toString()}`;
}
