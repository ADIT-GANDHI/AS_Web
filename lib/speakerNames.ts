// [Claude] these changes have been recommended by claude —
// The reflection APIs (reflection_list / explore_reflection) only return a numeric
// speaker_id; person_name_english on those payloads is the *attributed poet*
// (e.g. "Kabir"), not the speaker. The PDF shows the real speaker ("says KRISHNA
// NATH", "says KAPIL TIWARI"), so we resolve speaker_id against Api/person_list
// (183 people, full person_name_english) and cache the map for the session.

import { AJAB_API_BASE } from '@/lib/ajabEnv';

let speakerMapPromise: Promise<Record<string, string>> | null = null;

export function getSpeakerNameMap(): Promise<Record<string, string>> {
  if (!speakerMapPromise) {
    speakerMapPromise = fetch(`${AJAB_API_BASE}/Api/person_list?page=1&limit=500`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const map: Record<string, string> = {};
        const rows = Array.isArray(json?.data) ? json.data : [];
        for (const row of rows) {
          const id = String(row?.id || '').trim();
          const name = String(row?.person_name_english || row?.person_name || '').trim();
          if (id && name) map[id] = name;
        }
        return map;
      })
      .catch(() => {
        // Allow a retry on the next call instead of caching the failure forever
        speakerMapPromise = null;
        return {};
      });
  }
  return speakerMapPromise;
}

export async function resolveSpeakerName(speakerId: unknown): Promise<string> {
  const id = String(speakerId || '').trim();
  if (!id) return '';
  const map = await getSpeakerNameMap();
  return map[id] || '';
}
