'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronFirst,
  ChevronLast,
  Pause,
  Play,
  Repeat2,
  Volume2,
} from 'lucide-react';
import Header from '@/components/Header';
import CLFilterPanel from '@/components/Fillter/CLFilterPanel';
import {
  FILTER_PANEL_SHAPE,
  RADIO_THUMB_SAMPLE,
} from '@/lib/resolveCmsAssetUrl';
import {
  fetchRadioTracks,
  soundcloudEmbedSrc,
  type RadioPlaylist,
  type RadioTrack,
} from '@/lib/radioAudio';
import { selectSingleFilterId } from '@/lib/listingFilterSelection';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLRadio.css';

type RadioView = 'radio' | 'playlists';
type FilterType = 'Singer' | 'Poet' | 'Theme';

const MOCK_TRACKS: RadioTrack[] = [
  {
    id: 'm1',
    name: 'Mukhtiyar Ali',
    subtitle: 'Trivandrum, 2009',
    duration: '00:38',
    thumb: RADIO_THUMB_SAMPLE,
    about:
      'is a singer from Bikaner who belongs to the Vaani tradition of singing songs of Kabir, Meera, Gorakhnath, Ladhunath, Achal Ram and other local saints-poets of Rajasthan.',
    songHref: '/songs',
  },
  {
    id: 'm2',
    name: 'Abu Mohammed',
    subtitle: 'Karachi session',
    duration: '00:45',
    thumb: RADIO_THUMB_SAMPLE,
    songHref: '/songs',
  },
  {
    id: 'm3',
    name: 'Vidya Rao',
    subtitle: 'Thumri evening',
    duration: '00:52',
    thumb: RADIO_THUMB_SAMPLE,
    songHref: '/songs',
  },
  {
    id: 'm4',
    name: 'Parvathy Baul',
    subtitle: 'Baul journey',
    duration: '01:00',
    thumb: RADIO_THUMB_SAMPLE,
    songHref: '/songs',
  },
];

const MOCK_PLAYLISTS: RadioPlaylist[] = [
  {
    id: 'p1',
    title: 'Kabir in Pakistan',
    artist: 'SHAFI FAKIR & FARID AYAZ',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p2',
    title: 'Kabir in Rajasthan',
    artist: 'OMPRAKASH NAYAK',
    tracks: [...MOCK_TRACKS].reverse(),
  },
  {
    id: 'p3',
    title: 'Kabir in Malwa',
    artist: 'PRAHLAD SINGH TIPANYA',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p4',
    title: 'Kabir in Thumri',
    artist: 'VIDYA RAO',
    tracks: MOCK_TRACKS.slice(0, 3),
  },
  {
    id: 'p5',
    title: 'Ghat Ghat',
    artist: 'PARVATHY BAUL',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p6',
    title: 'Had Anhad',
    artist: 'SHAFI FAKIR & FARID AYAZ',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p7',
    title: 'Bhakti Voices',
    artist: 'VARIOUS ARTISTS',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p8',
    title: 'Sufi Nights',
    artist: 'VARIOUS ARTISTS',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p9',
    title: 'Baul Journeys',
    artist: 'PARVATHY BAUL',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p10',
    title: 'Rajasthan Vaani',
    artist: 'OMPRAKASH NAYAK',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p11',
    title: 'Kabir & Meera',
    artist: 'VARIOUS ARTISTS',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p12',
    title: 'Gorakhnath Songs',
    artist: 'VARIOUS ARTISTS',
    tracks: MOCK_TRACKS.slice(0, 2),
  },
  {
    id: 'p13',
    title: 'Folk from Malwa',
    artist: 'PRAHLAD SINGH TIPANYA',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p14',
    title: 'Morning Ragas',
    artist: 'VARIOUS ARTISTS',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p15',
    title: 'Evening Reflections',
    artist: 'VIDYA RAO',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p16',
    title: 'Festival Favourites',
    artist: 'VARIOUS ARTISTS',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p17',
    title: 'Malwa Voices',
    artist: 'PRAHLAD SINGH TIPANYA',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p18',
    title: 'Pakistan Sessions',
    artist: 'SHAFI FAKIR & FARID AYAZ',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p19',
    title: 'Meera Bhajans',
    artist: 'VIDYA RAO',
    tracks: MOCK_TRACKS.slice(0, 3),
  },
  {
    id: 'p20',
    title: 'Baul at Dawn',
    artist: 'PARVATHY BAUL',
    tracks: MOCK_TRACKS,
  },
  {
    id: 'p21',
    title: 'Desert Songs',
    artist: 'OMPRAKASH NAYAK',
    tracks: MOCK_TRACKS,
  },
];

const FILTER_SINGERS = [
  'Prahlad Singh Tipanya',
  'Parvathy Baul',
  'Omprakash Nayak',
  'Hans Raj Hans',
  'Vidya Rao',
];

const FILTER_CURATED = ['Curated'];

const DEFAULT_BIO =
  'is a singer from Bikaner who belongs to the Vaani tradition of singing songs of Kabir, Meera, Gorakhnath, Ladhunath, Achal Ram and other local saints-poets of Rajasthan.';

function PlayerTransport({
  isPlaying,
  onToggle,
  onPrev,
  onNext,
  onRepeat,
}: {
  isPlaying: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRepeat?: () => void;
}) {
  return (
    <div className="radio-transport" role="group" aria-label="Playback controls">
      <button type="button" className="radio-transport-btn" onClick={onPrev} aria-label="Previous">
        <ChevronFirst size={22} strokeWidth={1.6} />
      </button>
      <button
        type="button"
        className={`radio-transport-btn radio-transport-btn--play${isPlaying ? ' is-playing' : ''}`}
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={22} strokeWidth={1.6} fill="currentColor" /> : <Play size={22} strokeWidth={1.6} fill="currentColor" />}
      </button>
      <button type="button" className="radio-transport-btn" onClick={onNext} aria-label="Next">
        <ChevronLast size={22} strokeWidth={1.6} />
      </button>
      <button type="button" className="radio-transport-btn" onClick={onRepeat} aria-label="Repeat">
        <Repeat2 size={20} strokeWidth={1.6} />
      </button>
      <button type="button" className="radio-transport-btn" aria-label="Volume">
        <Volume2 size={20} strokeWidth={1.6} />
      </button>
    </div>
  );
}

export default function CLRadio() {
  const searchParams = useSearchParams();
  const initialView: RadioView = searchParams?.get('view') === 'playlists' ? 'playlists' : 'radio';

  const [view, setView] = useState<RadioView>(initialView);
  const [playlists, setPlaylists] = useState<RadioPlaylist[]>(MOCK_PLAYLISTS);
  const [activePlaylist, setActivePlaylist] = useState(0);
  const [queue, setQueue] = useState<RadioTrack[]>(MOCK_TRACKS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSingers, setSelectedSingers] = useState<string[]>([]);
  const [selectedCurated, setSelectedCurated] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const param = searchParams?.get('view');
    if (param === 'playlists') setView('playlists');
    else if (param === 'radio') setView('radio');
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetchRadioTracks(12).then((tracks) => {
      if (cancelled || !tracks.length) return;
      setQueue(tracks);
      // Keep curated playlist titles/artists from design; attach live track slices
      setPlaylists((prev) =>
        prev.map((pl, i) => {
          const start = (i * 3) % tracks.length;
          const slice: RadioTrack[] = [];
          for (let k = 0; k < Math.min(4, tracks.length); k++) {
            slice.push(tracks[(start + k) % tracks.length]);
          }
          return { ...pl, tracks: slice.length ? slice : pl.tracks };
        })
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = queue[activeIdx] || queue[0] || MOCK_TRACKS[0];
  const endLabel = current?.duration?.replace(/^0(?=\d:)/, '') || '1:30';
  const progressPct = isPlaying ? 28 : 8;
  const hasSoundcloud = Boolean(current?.audioUrl);

  const filteredPlaylists = useMemo(() => {
    if (!selectedSingers.length && !selectedCurated.length) return playlists;
    return playlists.filter((pl) => {
      const hay = `${pl.title} ${pl.artist}`.toLowerCase();
      const singerOk =
        !selectedSingers.length ||
        selectedSingers.some((s) => hay.includes(s.toLowerCase()) || pl.artist.toLowerCase().includes(s.toLowerCase()));
      const curatedOk = !selectedCurated.length || selectedCurated.includes('Curated');
      return singerOk && curatedOk;
    });
  }, [playlists, selectedSingers, selectedCurated]);

  const hasActiveFilters = selectedSingers.length > 0 || selectedCurated.length > 0;

  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type === 'Singer') {
      setSelectedSingers((prev) => selectSingleFilterId(prev, value));
    }
    if (type === 'Poet') {
      setSelectedCurated((prev) => selectSingleFilterId(prev, value));
    }
  };

  const handleRemoveFilter = (type: FilterType, value: string) => {
    if (type === 'Singer') setSelectedSingers((prev) => prev.filter((x) => x !== value));
    if (type === 'Poet') setSelectedCurated((prev) => prev.filter((x) => x !== value));
  };

  const clearAllFilters = () => {
    setSelectedSingers([]);
    setSelectedCurated([]);
  };

  const switchView = (next: RadioView) => {
    setView(next);
    const url = new URL(window.location.href);
    if (next === 'playlists') url.searchParams.set('view', 'playlists');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const selectPlaylist = useCallback(
    (index: number) => {
      const pl = filteredPlaylists[index] || playlists[index];
      if (!pl) return;
      setActivePlaylist(index);
      if (pl.tracks?.length) {
        setQueue(pl.tracks);
        setActiveIdx(0);
      }
    },
    [filteredPlaylists, playlists]
  );

  const togglePlay = () => setIsPlaying((p) => !p);
  const skipPrev = () => {
    setActiveIdx((i) => (i === 0 ? queue.length - 1 : i - 1));
    setIsPlaying(true);
  };
  const skipNext = () => {
    setActiveIdx((i) => (i + 1) % Math.max(queue.length, 1));
    setIsPlaying(true);
  };

  const artistName = current?.name || 'Omprakash Nayak';
  const artistBio = current?.about || DEFAULT_BIO;
  const exploreHref = current?.songHref || '/songs';

  return (
    <div className={`cl-songs-page-root radio-page-root-wrap radio-page-root-wrap--${view}`}>
      <div className={`radio-page-root radio-page-root--${view}`}>
        <div className="radio-header-wrap">
          <Header />
        </div>

        {/* Hidden SoundCloud widget — audio only */}
        {hasSoundcloud && isPlaying ? (
          <iframe
            key={`${current.audioUrl}-${activeIdx}-play`}
            title={`SoundCloud — ${current.name}`}
            allow="autoplay"
            src={soundcloudEmbedSrc(current.audioUrl!, true)}
            className="radio-soundcloud-hidden"
            tabIndex={-1}
            aria-hidden
          />
        ) : null}

        <main className="radio-page cl-songs-page" aria-label="Ajab Radio">
          <div className="radio-layout">
            <div className={`radio-stage${view === 'playlists' ? ' radio-stage--playlists' : ''}`}>
              {view === 'playlists' && (
                <div className="radio-panel radio-panel--sidebar">
                  <div className="radio-playlist-sidebar-shape" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={FILTER_PANEL_SHAPE}
                      alt=""
                      aria-hidden="true"
                      className="radio-playlist-sidebar-shape-svg"
                    />
                  </div>
                  <div className="radio-playlist-sidebar-inner">
                    <div className="cl-songs-count-row">
                      <h2 className="cl-songs-count">{filteredPlaylists.length} Playlists</h2>
                    </div>

                    <div className="radio-playlist-filter">
                      <div className="radio-playlist-filter-main">
                        <button
                          type="button"
                          className="radio-playlist-filter-trigger"
                          onClick={() => setFilterOpen(true)}
                        >
                          Filter by Singer <span className="radio-playlist-filter-sep">|</span>{' '}
                          <span className="radio-playlist-filter-curated">Curated</span>
                        </button>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            className="radio-playlist-filter-x"
                            onClick={clearAllFilters}
                            aria-label="Clear filters"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="radio-playlist-clear-all"
                          onClick={clearAllFilters}
                        >
                          CLEAR ALL
                        </button>
                      )}
                      <CLFilterPanel
                        hideTrigger
                        open={filterOpen}
                        onOpenChange={setFilterOpen}
                        onFilterSelect={handleFilterSelect}
                        onRemoveFilter={handleRemoveFilter}
                        onClearAll={clearAllFilters}
                        selectedSingers={selectedSingers}
                        selectedPoets={selectedCurated}
                        selectedThemes={[]}
                        availableSingers={FILTER_SINGERS}
                        availablePoets={FILTER_CURATED}
                        availableThemes={[]}
                        categoryLabels={{ Singer: 'Singer', Poet: 'Curated', Theme: 'Theme' }}
                      />
                    </div>

                    <ul className="radio-playlists-list">
                      {filteredPlaylists.map((pl, i) => (
                        <li key={pl.id || pl.title}>
                          <button
                            type="button"
                            className={`radio-playlist-item${activePlaylist === i ? ' is-active' : ''}`}
                            onClick={() => selectPlaylist(i)}
                          >
                            <span className="radio-playlist-title">{pl.title}</span>
                            <span className="radio-playlist-artist">{pl.artist}</span>
                            <span className="radio-playlist-tracks">
                              {pl.tracks?.length || 0} Tracks
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="radio-panel radio-panel--intro">
                <p className="radio-intro-text">
                  <span className="radio-intro-bold">Ajab Radio </span>
                  plays a random selection of some of our finest songs!
                </p>
                <p className="radio-tabs">
                  <button
                    type="button"
                    className={`radio-tab${view === 'radio' ? ' is-active' : ''}`}
                    onClick={() => switchView('radio')}
                  >
                    RADIO
                  </button>
                  <span className="radio-tab-sep" aria-hidden>
                    {' '}
                    |{' '}
                  </span>
                  <button
                    type="button"
                    className={`radio-tab${view === 'playlists' ? ' is-active' : ''}`}
                    onClick={() => switchView('playlists')}
                  >
                    PLAYLISTS
                  </button>
                </p>
              </div>

              {view === 'radio' ? (
                <div className="radio-panel radio-panel--artist">
                  <h2 className="radio-artist-name">{artistName}</h2>
                  <p className="radio-artist-bio">{artistBio}</p>
                  <Link href={exploreHref} className="radio-explore-link">
                    EXPLORE SONG
                  </Link>
                </div>
              ) : (
                <div className="radio-panel radio-panel--queue">
                  <div className="radio-queue-player">
                    <div className="radio-queue-timeline">
                      <span className="radio-player-time">0:00</span>
                      <div
                        className="radio-player-progress"
                        role="progressbar"
                        aria-valuenow={progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="radio-player-progress-fill"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="radio-player-time">{endLabel}</span>
                    </div>
                    <PlayerTransport
                      isPlaying={isPlaying}
                      onToggle={togglePlay}
                      onPrev={skipPrev}
                      onNext={skipNext}
                    />
                  </div>

                  <ul className="radio-queue-list">
                    {queue.map((item, i) => (
                      <li
                        key={`${item.id}-${i}`}
                        className={`radio-queue-item${i === activeIdx ? ' is-active' : ''}`}
                      >
                        <button
                          type="button"
                          className="radio-queue-item-btn"
                          onClick={() => {
                            setActiveIdx(i);
                            setIsPlaying(true);
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.thumb || RADIO_THUMB_SAMPLE}
                            alt=""
                            className="radio-queue-thumb"
                            width={40}
                            height={40}
                          />
                          <span className="radio-queue-name">{item.name}</span>
                          <span className="radio-queue-time">{item.duration || ' '}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </main>

        {view === 'radio' && (
          <section className="radio-player" aria-label="Now playing">
            <div className="radio-player-inner">
              <div className="radio-player-track">
                <Image
                  src={current?.thumb || RADIO_THUMB_SAMPLE}
                  alt=""
                  width={78}
                  height={78}
                  className="radio-player-thumb"
                />
                <div className="radio-player-meta">
                  <p className="radio-player-title">{current?.name || '—'}</p>
                  <p className="radio-player-sub">{current?.subtitle || ' '}</p>
                </div>
              </div>

              <div className="radio-player-timeline">
                <span className="radio-player-time">0:00</span>
                <div
                  className="radio-player-progress"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="radio-player-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="radio-player-time">{endLabel}</span>
              </div>

              <div className="radio-player-controls-wrap">
                <PlayerTransport
                  isPlaying={isPlaying}
                  onToggle={togglePlay}
                  onPrev={skipPrev}
                  onNext={skipNext}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
