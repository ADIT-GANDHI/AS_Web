'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Repeat2 } from 'lucide-react';
import Header from '@/components/Header';
import CLFilterPanel from '@/components/Fillter/CLFilterPanel';
import {
  FILTER_PANEL_SHAPE,
  RADIO_PLAYER_CONTROLS,
  RADIO_THUMB_SAMPLE,
} from '@/lib/resolveCmsAssetUrl';
import '@/styles/CustomStyle.css';
import '@/components/Songs/CLSongs.css';
import './CLRadio.css';

type RadioView = 'radio' | 'playlists';
type FilterType = 'Singer' | 'Poet' | 'Theme';

const MOCK_PLAYLISTS = [
  { title: 'Kabir in Pakistan', artist: 'SHAFI FAKIR & FARID AYAZ', tracks: 12 },
  { title: 'Kabir in Rajasthan', artist: 'SHAFI FAKIR & FARID AYAZ', tracks: 12 },
  { title: 'Kabir in Malwa', artist: 'SHAFI FAKIR & FARID AYAZ', tracks: 12 },
  { title: 'Kabir in Thumri', artist: 'VIDYA RAO', tracks: 12 },
  { title: 'Ghat Ghat', artist: 'PARVATHY BAUL', tracks: 12 },
  { title: 'Had Anhad', artist: 'SHAFI FAKIR & FARID AYAZ', tracks: 12 },
  { title: 'Bhakti Voices', artist: 'VARIOUS ARTISTS', tracks: 8 },
  { title: 'Sufi Nights', artist: 'VARIOUS ARTISTS', tracks: 15 },
  { title: 'Baul Journeys', artist: 'PARVATHY BAUL', tracks: 10 },
  { title: 'Rajasthan Vaani', artist: 'OMPRAKASH NAYAK', tracks: 9 },
  { title: 'Kabir & Meera', artist: 'VARIOUS ARTISTS', tracks: 11 },
  { title: 'Gorakhnath Songs', artist: 'VARIOUS ARTISTS', tracks: 7 },
  { title: 'Folk from Malwa', artist: 'VARIOUS ARTISTS', tracks: 13 },
  { title: 'Morning Ragas', artist: 'VARIOUS ARTISTS', tracks: 6 },
  { title: 'Evening Reflections', artist: 'VARIOUS ARTISTS', tracks: 9 },
  { title: 'Festival Favourites', artist: 'VARIOUS ARTISTS', tracks: 14 },
  { title: 'Malwa Voices', artist: 'PRAHLAD SINGH TIPANYA', tracks: 11 },
  { title: 'Pakistan Sessions', artist: 'SHAFI FAKIR & FARID AYAZ', tracks: 10 },
  { title: 'Meera Bhajans', artist: 'VIDYA RAO', tracks: 8 },
  { title: 'Baul at Dawn', artist: 'PARVATHY BAUL', tracks: 9 },
  { title: 'Desert Songs', artist: 'OMPRAKASH NAYAK', tracks: 7 },
];

const FILTER_SINGERS = [
  'Prahlad Singh Tipanya',
  'Parvathy Baul',
  'Omprakash Nayak',
  'Hans Raj Hans',
  'Vidya Rao',
];

const FILTER_CURATED = ['Curated'];

const MOCK_QUEUE = [
  { name: 'Mukhtiya Ali', time: '00:38', thumb: RADIO_THUMB_SAMPLE },
  { name: 'Abu Mohammed', time: '00:45', thumb: RADIO_THUMB_SAMPLE },
  { name: 'Vidya Rao', time: '00:52', thumb: RADIO_THUMB_SAMPLE },
  { name: 'Parvathy Baul', time: '01:00', thumb: RADIO_THUMB_SAMPLE },
];

export default function CLRadio() {
  const searchParams = useSearchParams();
  const initialView: RadioView = searchParams?.get('view') === 'playlists' ? 'playlists' : 'radio';

  const [view, setView] = useState<RadioView>(initialView);
  const [activePlaylist, setActivePlaylist] = useState(0);
  const [selectedSingers, setSelectedSingers] = useState<string[]>([]);
  const [selectedCurated, setSelectedCurated] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    const param = searchParams?.get('view');
    if (param === 'playlists') setView('playlists');
    else if (param === 'radio') setView('radio');
  }, [searchParams]);

  const hasActiveFilters = selectedSingers.length > 0 || selectedCurated.length > 0;

  const handleFilterSelect = (type: FilterType, value: string) => {
    if (type === 'Singer') {
      setSelectedSingers((prev) =>
        prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
      );
    }
    if (type === 'Poet') {
      setSelectedCurated((prev) =>
        prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]
      );
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

  return (
    <div className={`cl-songs-page-root radio-page-root-wrap radio-page-root-wrap--${view}`}>
      <div className={`radio-page-root radio-page-root--${view}`}>
        <div className="radio-header-wrap">
          <Header />
        </div>

        <main className="radio-page cl-songs-page" aria-label="Ajab Radio">
          <div className="radio-layout">
            <div className={`radio-stage${view === 'playlists' ? ' radio-stage--playlists' : ''}`}>
              {view === 'playlists' && (
                <div className="radio-panel radio-panel--sidebar">
                  <div className="radio-playlist-sidebar-shape" aria-hidden="true">
                    <img
                      src={FILTER_PANEL_SHAPE}
                      alt=""
                      aria-hidden="true"
                      className="radio-playlist-sidebar-shape-svg"
                    />
                  </div>
                  <div className="radio-playlist-sidebar-inner">
                  <div className="cl-songs-count-row">
                    <h2 className="cl-songs-count">{MOCK_PLAYLISTS.length} Playlists</h2>
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
                      <button type="button" className="radio-playlist-clear-all" onClick={clearAllFilters}>
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
                      maxFilters={5}
                    />
                  </div>

                  <ul className="radio-playlists-list">
                    {MOCK_PLAYLISTS.map((pl, i) => (
                      <li key={pl.title}>
                        <button
                          type="button"
                          className={`radio-playlist-item${activePlaylist === i ? ' is-active' : ''}`}
                          onClick={() => setActivePlaylist(i)}
                        >
                          <span className="radio-playlist-title">{pl.title}</span>
                          <span className="radio-playlist-artist">{pl.artist}</span>
                          <span className="radio-playlist-tracks">{pl.tracks} Tracks</span>
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
                  <h2 className="radio-artist-name">Omprakash Nayak</h2>
                  <p className="radio-artist-bio">
                    is a singer from Bikaner who belongs to the Vaani tradition of singing songs of
                    Kabir, Meera, Gorakhnath, Ladhunath, Achal Ram and other local saints-poets of
                    Rajasthan.
                  </p>
                  <Link href="/songs" className="radio-explore-link">
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
                        aria-valuenow={20}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="radio-player-progress-fill" />
                      </div>
                      <span className="radio-player-time">1:30</span>
                    </div>
                    <div className="radio-queue-controls">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={RADIO_PLAYER_CONTROLS}
                        alt=""
                        className="radio-player-controls radio-queue-controls-svg"
                        width={240}
                        height={24}
                      />
                    </div>
                  </div>

                  <ul className="radio-queue-list">
                    {MOCK_QUEUE.map((item, i) => (
                      <li key={item.name} className={`radio-queue-item${i === 0 ? ' is-active' : ''}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumb}
                          alt=""
                          className="radio-queue-thumb"
                          width={40}
                          height={40}
                        />
                        <span className="radio-queue-name">{item.name}</span>
                        <span className="radio-queue-time">{item.time}</span>
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
                  src={RADIO_THUMB_SAMPLE}
                  alt=""
                  width={78}
                  height={78}
                  className="radio-player-thumb"
                />
                <div className="radio-player-meta">
                  <p className="radio-player-title">Mukhtiya Ali</p>
                  <p className="radio-player-sub">Trivandrum, 2009</p>
                </div>
              </div>

              <div className="radio-player-timeline">
                <span className="radio-player-time">0:00</span>
                <div
                  className="radio-player-progress"
                  role="progressbar"
                  aria-valuenow={20}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="radio-player-progress-fill" />
                </div>
                <span className="radio-player-time">1:30</span>
              </div>

              <div className="radio-player-controls-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={RADIO_PLAYER_CONTROLS}
                  alt=""
                  className="radio-player-controls"
                  width={351}
                  height={24}
                />
              </div>

              <button type="button" className="radio-player-repeat" aria-label="Repeat">
                <Repeat2 size={22} strokeWidth={1.5} />
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
