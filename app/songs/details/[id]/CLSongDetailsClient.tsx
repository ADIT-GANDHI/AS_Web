'use client';

import CLSongDetails from '@/components/Songs/CLSongDetailsPage';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import '@/components/Songs/CLSongs.css';
import '@/styles/CustomStyle.css';
import { useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { MOCK_DETAIL, MOCK_VERSIONS, MOCK_RELATED } from '@/components/Songs/CLdetailMocks';
import { SongsNavCountContext } from '@/components/Songs/SongsNavCountContext';
import {
  asRelatedContent,
  fetchRelatedByParam,
} from '@/lib/mapRelatedResponse';

function SongsLoadingShell() {
  return <Loader />;
}

async function readJson(res: Response) {
  if (!res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function parseSongVersionsPayload(payload: unknown): any[] {
  if (!payload || typeof payload !== 'object') return [];
  const json = payload as { status?: boolean; data?: unknown };
  if (json.status === false) return [];
  return Array.isArray(json.data) ? json.data : [];
}

/** Ensure the viewed song appears in the versions strip when CMS omits it. */
function resolveSongVersions(songDetails: any, fromApi: any[]): any[] {
  if (!fromApi.length) return [songDetails];
  const hasCurrent = fromApi.some((item) => String(item?.id) === String(songDetails?.id));
  if (hasCurrent) return fromApi;
  return [songDetails, ...fromApi];
}

export default function CLSongDetailsClient({ id: idProp }: { id: string }) {
  const pathname = usePathname();
  // Read the real ID from the browser URL — useParams() returns the static '0' in a static export.
  const urlId = pathname?.split('/').filter(Boolean).pop();
  const id = (urlId && urlId !== '0') ? urlId : idProp;
  const { setSongsNavTotal } = useContext(SongsNavCountContext);
  const [song, setSong] = useState<any>(null);
  const [songVersions, setSongVersions] = useState<any[]>([]);
  const [related, setRelated] = useState<any>(null);
  const [songReady, setSongReady] = useState(false);
  // [Claude] these changes have been recommended by claude —
  // true when the API answered but the song id does not exist ("Song not found").
  const [notFound, setNotFound] = useState(false);
  // Catalog total for header SONGS (N) — independent of song payload timing.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          `${AJAB_API_BASE}/Api/list?page=1&limit=1&search=&singer=&poet=`,
          { cache: 'no-store' }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const navTotal = parseCatalogTotal(data?.total);
        if (!cancelled && navTotal !== null) {
          setSongsNavTotal(navTotal);
        }
      } catch {
        /* Header keeps its own hover fetch fallback — never force 201 here */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSongsNavTotal]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setSongReady(false);
    setSong(null);
    setSongVersions([]);
    setRelated(null);
    setNotFound(false);

    void (async () => {
      try {
        const songUrl = `${AJAB_API_BASE}/Api/explore_songs?song_id=${encodeURIComponent(id)}&language=hindi`;
        const versionsUrl = `${AJAB_API_BASE}/Api/song_versions?song_id=${encodeURIComponent(id)}`;

        const [songRes, versionsRes] = await Promise.all([
          fetch(songUrl, { cache: 'no-store' }),
          fetch(versionsUrl, { cache: 'no-store' }),
        ]);
        if (cancelled) return;

        const songData = await readJson(songRes);
        const versionsData = await readJson(versionsRes);
        const songDetails =
          songData?.status === false || !songData?.data ? null : songData.data;

        if (!songDetails) {
          /* [Claude] these changes have been recommended by claude —
             The API answered but this song id doesn't exist. Show a real
             "Song not found" state instead of silently rendering mock content
             (which displayed a different song's versions and fake related items). */
          setNotFound(true);
          setSongReady(true);
          return;
        }

        const versions = resolveSongVersions(
          songDetails,
          parseSongVersionsPayload(versionsData)
        );

        setSong(songDetails);
        setSongVersions(versions);
        setSongReady(true);

        // Merge English translation fields in the background — no loader / no page flash.
        void (async () => {
          try {
            const enRes = await fetch(
              `${AJAB_API_BASE}/Api/explore_songs?song_id=${encodeURIComponent(id)}&language=english`,
              { cache: 'no-store' }
            );
            if (cancelled || !enRes.ok) return;
            const enData = await enRes.json();
            const enSong =
              enData?.status === false || !enData?.data ? null : enData.data;
            if (!enSong || cancelled) return;

            setSong((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                songLyricsTranslated:
                  enSong.songLyricsTranslated ?? prev.songLyricsTranslated,
                song_lyrics_translated:
                  enSong.song_lyrics_translated ?? prev.song_lyrics_translated,
                songTitle: enSong.songTitle ?? prev.songTitle,
                songtitletraan: enSong.songtitletraan ?? prev.songtitletraan,
                english_translation:
                  enSong.english_translation ?? prev.english_translation,
              };
            });
          } catch {
            /* Hindi payload is enough for first paint */
          }
        })();

        try {
          const normalized = await fetchRelatedByParam('song_id', id);
          if (!cancelled) {
            setRelated(normalized || asRelatedContent(MOCK_RELATED));
          }
        } catch {
          if (!cancelled) setRelated(asRelatedContent(MOCK_RELATED));
        }
      } catch {
        if (cancelled) return;
        setSong(MOCK_DETAIL);
        setSongVersions(MOCK_VERSIONS);
        setRelated(asRelatedContent(MOCK_RELATED));
        setSongReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!songReady) {
    return <SongsLoadingShell />;
  }

  /* [Claude] these changes have been recommended by claude —
     not-found state, same pattern as the poems detail page */
  if (notFound || !song) {
    return (
      <div className="cl-songs-page-root">
        <div className="min-h-screen">
          <Header />
          <main className="relative z-10">
            <div
              style={{
                padding: '120px 24px',
                textAlign: 'center',
                fontFamily: 'var(--ajab-font-serif)',
                color: 'var(--ajab-ink-500)',
              }}
            >
              <p>Song not found.</p>
              <a
                href="/songs"
                style={{ color: 'var(--ajab-pink-primary)', marginTop: 16, display: 'inline-block' }}
              >
                ← Back to Songs
              </a>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <CLSongDetails
      data={song}
      songVersions={songVersions}
      related={related}
    />
  );
}
