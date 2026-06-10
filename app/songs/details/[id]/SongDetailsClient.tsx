'use client';

import SongDetails from '@/components/Songs/SongDetailsPage';
import Loader from '@/components/Loader';
import { useEffect, useState } from 'react';
import { AJAB_API_BASE } from '@/lib/ajabEnv';

type SongLanguage = 'hindi' | 'english';

export default function SongDetailsClient({ id }: { id: string }) {
  const [song, setSong] = useState<any>(null);
  const [songVersions, setSongVersions] = useState<any[]>([]);
  const [related, setRelated] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<SongLanguage>('hindi');

  useEffect(() => {
    if (!id) return;

    const songUrl = `${AJAB_API_BASE}/Api/explore_songs?song_id=${id}&language=${language}`;
    const versionsUrl = `${AJAB_API_BASE}/Api/song_versions?song_id=${id}`;
    const relatedUrl = `${AJAB_API_BASE}/Api/related?song_id=${id}`;

    const readJson = async (res: Response) => {
      if (!res.ok) return null;
      try {
        return await res.json();
      } catch {
        return null;
      }
    };

    const getFallbackVersions = async (songData: any) => {
      const umbrellaId = String(
        songData?.umbrella_title_id || songData?.umbrellaTitle || ''
      ).trim();
      if (!umbrellaId) return [];

      const res = await fetch(
        `${AJAB_API_BASE}/Api/list?search=&page=1&limit=1000&singer=&poet=`
      );
      const payload = await readJson(res);
      const items = Array.isArray(payload?.data) ? payload.data : [];

      return items.filter((item: any) => {
        const itemUmbrellaId = String(item?.umbrella_title_id || item?.umbrellaTitle || '').trim();
        return itemUmbrellaId === umbrellaId && String(item?.id) !== String(songData?.id);
      });
    };

    Promise.allSettled([fetch(songUrl), fetch(versionsUrl), fetch(relatedUrl)])
      .then(async ([songResult, versionsResult, relatedResult]) => {
        const songData =
          songResult.status === 'fulfilled' ? await readJson(songResult.value) : null;
        const versionsData =
          versionsResult.status === 'fulfilled' ? await readJson(versionsResult.value) : null;
        const relatedData =
          relatedResult.status === 'fulfilled' ? await readJson(relatedResult.value) : null;

        const songDetails = songData?.status === false ? null : songData?.data || null;
        let versions =
          versionsData?.status === false ? [] : Array.isArray(versionsData?.data) ? versionsData.data : [];

        if (songDetails && versions.length === 0) {
          versions = await getFallbackVersions(songDetails);
        }

        setSong(songDetails);
        setSongVersions(versions);
        setRelated(relatedData?.status === false ? null : relatedData || null);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id, language]);

  if (loading) return <Loader />;
  if (!song) return <p>No song found</p>;

  return (
    <SongDetails
      data={song}
      language={language}
      onLanguageChange={setLanguage}
      songVersions={songVersions}
      related={related}
    />
  );
}
