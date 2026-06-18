'use client';

import CLSongDetails from '@/components/Songs/CLSongDetailsPage';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Loader from '@/components/Loader';
import '@/components/Songs/CLSongs.css';
import '@/styles/CustomStyle.css';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { parseCatalogTotal } from '@/lib/parseCatalogTotal';
import { MOCK_DETAIL, MOCK_VERSIONS, MOCK_RELATED } from '@/components/Songs/CLdetailMocks';
import { SongsNavCountContext } from '@/components/Songs/SongsNavCountContext';

function SongsLoadingShell() {
  return <Loader />;
}

export default function CLSongDetailsClient({ id: idProp }: { id: string }) {
  const params = useParams();
  const id = (params?.id as string) || idProp;
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
        const res = await fetch(songUrl, { cache: 'no-store' });
        if (cancelled) return;

        const songData = res.ok ? await res.json() : null;
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

        setSong(songDetails);
        setSongVersions([songDetails]);
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
          const relatedRes = await fetch(
            `${AJAB_API_BASE}/Api/related?song_id=${encodeURIComponent(id)}`,
            { cache: 'no-store' }
          );
          if (cancelled) return;

          const relatedData = relatedRes.ok ? await relatedRes.json() : null;
          if (!cancelled) {
            setRelated(
              relatedData?.status === false || !relatedData ? MOCK_RELATED : relatedData
            );
          }
        } catch {
          if (!cancelled) setRelated(MOCK_RELATED);
        }
      } catch {
        if (cancelled) return;
        setSong(MOCK_DETAIL);
        setSongVersions(MOCK_VERSIONS);
        setRelated(MOCK_RELATED);
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
          <Footer />
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
