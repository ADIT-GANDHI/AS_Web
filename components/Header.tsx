'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { navigationItems } from '@/lib/data';
import Image from 'next/image';
import logo from '../public/logo.svg';
import searchIcon from '../public/songs-assets/search_icon.png';
import radioIcon from '../public/songs-assets/radio.png';
import radioPinkIcon from '../public/songs-assets/radio-pink.png';
import headerCurve from '../public/songs-assets/Header.png';
import '../styles/Header.css';
import { AJAB_API_BASE } from '@/lib/ajabEnv';
import { SEARCH_ENDPOINT, emptySearchResponse, normalizeSearchPayload, type SearchApiResponse } from '@/lib/utils/search';
import { SongsNavCountContext } from '@/components/Songs/SongsNavCountContext';
import { ReflectionsNavCountContext } from '@/components/Reflections/ReflectionsNavCountContext';
import { PoemsNavCountContext } from '@/components/Poems/PoemsNavCountContext';
import { useState as useDropdownState } from 'react';

type SearchCategory = 'songs' | 'poems' | 'reflections' | 'people' | 'films';

const SEARCH_SECTION_ORDER: SearchCategory[] = ['songs', 'poems', 'reflections', 'people', 'films'];

const getSearchItemTitle = (item: Record<string, any>, section: SearchCategory) => {
  if (section === 'people') {
    return (
      item.person_name_english ||
      item.person_name ||
      item.person_name_hindi ||
      item.name ||
      'Untitled'
    );
  }
  if (section === 'songs') {
    return (
      item.umbrellaTitleText ||
      item.Songtitle_transliteration ||
      item.song_title_english ||
      item.songTitle ||
      item.english_transliteration ||
      item.english_translation ||
      item.meta_title ||
      item.metaTitle ||
      'Untitled'
    );
  }
  if (section === 'poems') {
    return (
      item.original_title ||
      item.poem_title_english ||
      item.poem_title ||
      item.couplet_transliteration ||
      item.title ||
      item.english_translation ||
      'Untitled'
    );
  }
  if (section === 'reflections') {
    return item.title || item.reflection_title_english || item.reflection_title || 'Untitled';
  }
  if (section === 'films') {
    return (
      item.film_title_english ||
      item.english_transliteration ||
      item.english_translation ||
      item.title ||
      'Untitled'
    );
  }
  return item.title || item.name || 'Untitled';
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchData, setSearchData] = useState<SearchApiResponse>(emptySearchResponse);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showAboutDropdown, setShowAboutDropdown] = useDropdownState(false);
  const pathname = usePathname(); // ✅ Get current path
  const router = useRouter();
  const isRadioPage = pathname?.includes('/radio');
  const { total: songsNavTotal } = useContext(SongsNavCountContext);
  const { total: reflectionsNavTotal } = useContext(ReflectionsNavCountContext);
  const { total: poemsNavTotal } = useContext(PoemsNavCountContext);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchData(emptySearchResponse);
      setIsSearchLoading(false);
      return;
    }

    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearchLoading(true);
        const response = await fetch(`${SEARCH_ENDPOINT}?search=${encodeURIComponent(normalizedQuery)}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const apiResponse = await response.json();
        if (!isCancelled) {
          setSearchData(normalizeSearchPayload(apiResponse, normalizedQuery));
        }
      } catch {
        if (!isCancelled) {
          setSearchData(emptySearchResponse);
        }
      } finally {
        if (!isCancelled) {
          setIsSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isSearchOpen, searchQuery]);

  const sections = useMemo(
    () =>
      SEARCH_SECTION_ORDER.filter((section) => (searchData.counts[section] || 0) > 0).map((section) => ({
        key: section,
        label: section.toUpperCase(),
        items: (searchData.results[section] || []).slice(0, 3),
      })),
    [searchData]
  );

  const handleSubmitSearch = (customQuery?: string) => {
    const queryToSearch = (customQuery || searchQuery).trim();
    if (!queryToSearch) {
      return;
    }

    setIsSearchOpen(false);
    router.push(`/searche?search=${encodeURIComponent(queryToSearch)}`);
  };

  // [Claude] these changes have been recommended by claude — maps each search category to its detail page URL
  const getItemHref = (item: Record<string, any>, section: SearchCategory): string => {
    const id = item.id;
    if (!id) return '#';
    switch (section) {
      case 'songs':        return `/songs/details/${id}`;
      case 'poems':        return `/poems/${id}`;
      case 'reflections':  return `/reflections/details/${id}`;
      case 'people':       return `/people/${id}`;
      case 'films':        return `/films/details/${id}`;
      default:             return '#';
    }
  };

  return (
    <div className="gradient-bg">
      <header className="sticky top-0 z-[100000]">
        <div className="mx-auto header-inner-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="flex justify-between items-center flex-nowrap">
            {/* Logo Section */}
            <div className="flex items-center gap-10 flex-nowrap">
              <Link href="/" className="flex items-center">
                <Image
                  className="logo"
                  src={logo}
                  alt="Ajab Shahar"
                  width={160}
                  height={165}
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-12">
                {navigationItems.map((item) => {
                  const isSongs = item.name === 'SONGS';
                  const isPoems = item.name === 'POEMS';
                  const isReflections = item.name === 'REFLECTIONS';
                  /* [Claude] these changes have been recommended by claude —
                     startsWith covers listing + detail pages.
                     Poems count uses context (same pattern as Songs/Reflections). */
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`nav-link nav-link--${item.name.toLowerCase()} ${isActive ? 'active' : ''}`}
                    >
                      {item.name}
                      {isSongs && songsNavTotal != null && songsNavTotal > 0 && (
                        <span className="nav-link-songs-count" aria-hidden="true">
                          ({songsNavTotal})
                        </span>
                      )}
                      {isPoems && poemsNavTotal != null && poemsNavTotal > 0 && (
                        <span className="nav-link-poems-count" aria-hidden="true">
                          ({poemsNavTotal})
                        </span>
                      )}
                      {isReflections && reflectionsNavTotal != null && (
                        <span className="nav-link-reflections-count" aria-hidden="true">
                          ({reflectionsNavTotal})
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-6 footer-right">
              {/* ABOUT Dropdown Toggle — `md:flex items-center` keeps ABOUT
                   vertically centred in the flex row, same as nav links. */}
              <div className="relative hidden md:flex md:items-center">
                <button
                  className={`about-text transition-colors ${pathname.startsWith('/about') ? 'active' : ''}`}
                  onClick={() => setShowAboutDropdown((prev) => !prev)}
                  onBlur={() => setTimeout(() => setShowAboutDropdown(false), 150)}
                >
                  ABOUT
                </button>
                {showAboutDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Link
                      href="/about?tab=ajab"
                      className={`block px-4 py-2 hover:bg-gray-100${pathname === '/about' && (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') !== 'kabir' : true) ? ' text-pink-600 font-semibold' : ''}`}
                      style={{ color: pathname === '/about' && (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') !== 'kabir' : true) ? '#ed1e79' : '#222' }}
                      onClick={() => setShowAboutDropdown(false)}
                    >
                      AJAB SHAHAR
                    </Link>
                    <Link
                      href="/about?tab=kabir"
                      className={`block px-4 py-2 hover:bg-gray-100${pathname === '/about' && (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') === 'kabir' : false) ? ' text-pink-600 font-semibold' : ''}`}
                      style={{ color: pathname === '/about' && (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') === 'kabir' : false) ? '#ed1e79' : '#222' }}
                      onClick={() => setShowAboutDropdown(false)}
                    >
                      KABIR PROJECT
                    </Link>
                  </div>
                )}
              </div>
              {/* Remove old ABOUT link */}
              {/*
              <Link
                href="/about"
                className={`about-text tracking-wide uppercase transition-colors ${
                  pathname === '/about' ? 'active' : ''
                }`}
              >
                ABOUT
              </Link>
              */}
              <button
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className={`transition-colors cursor-pointer ${isSearchOpen ? 'text-pink-500' : 'text-gray-700 hover:text-gray-900'
                  }`}
                aria-label="Toggle search"
              >
                {/* Figma-exported search icon */}
                <img
                  src={searchIcon.src}
                  alt=""
                  width={32}
                  height={32}
                  style={{ display: 'block' }}
                  fetchPriority="high"
                  decoding="async"
                />
                {/* OLD lucide glyph: <Search className="w-8 h-8" /> */}
              </button>

              {/* [Claude] these changes have been recommended by claude — wrap radio icon in Link so clicking navigates to /radio from every page */}
              <Link href="/radio" className="radio-logo flex items-center justify-center mr-0" aria-label="Ajab Radio">
                <img
                  src={(isRadioPage ? radioPinkIcon : radioIcon).src}
                  alt="Ajab Shahar Radio"
                  width={isRadioPage ? 71 : 50}
                  height={isRadioPage ? 78 : 56}
                  style={{ display: 'block', maxWidth: '50px', width: '100%', height: 'auto' }}
                  fetchPriority="high"
                  decoding="async"
                />
              </Link>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 pl-0 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="fixed inset-0 top-[80px] bg-white z-40 md:hidden">
              <nav className="flex flex-col space-y-6 p-6">
                {navigationItems.map((item) => {
                  const isSongs = item.name === 'SONGS';
                  const isReflections = item.name === 'REFLECTIONS';
                  /* [Claude] these changes have been recommended by claude —
                     startsWith covers both listing (/songs) and detail (/songs/details/1)
                     pages so the correct nav item stays highlighted on detail views. */
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`nav-link nav-link--${item.name.toLowerCase()} text-lg font-medium ${isActive ? 'active' : ''}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                      {isSongs && songsNavTotal != null && songsNavTotal > 0 && (
                        <span className="nav-link-songs-count" aria-hidden="true">
                          ({songsNavTotal})
                        </span>
                      )}
                      {isReflections && reflectionsNavTotal != null && (
                        <span className="nav-link-reflections-count" aria-hidden="true">
                          ({reflectionsNavTotal})
                        </span>
                      )}
                    </Link>
                  );
                })}
                {/* ABOUT Dropdown for mobile */}
                <div className="mt-2">
                  <Link href="/about?tab=ajab" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                    AJAB SHAHAR
                  </Link>
                  <Link href="/about?tab=kabir" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
                    KABIR PROJECT
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
        {/* Figma-exported header curve (no fading white tail) */}
        <img src={headerCurve.src} alt="" aria-hidden="true" className="header-curve" fetchPriority="high" decoding="async" />
        {/* OLD custom curve: <img src="/header-curve.png" ... /> */}
      </header>

      {/* [Claude] these changes have been recommended by claude — single unified card: search input at top + results below, per PDF spec p.5 */}
      {isSearchOpen && (
        <div className="header-search-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="header-search-panel" onClick={(e) => e.stopPropagation()}>

            {/* ONE card containing the input row + results */}
            <div className="header-search-card">

              {/* Input row — top of the card */}
              <div className="header-search-input-row">
                <img
                  src={searchIcon.src}
                  alt=""
                  className="header-search-input-icon"
                  decoding="async"
                />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSubmitSearch();
                    }
                  }}
                  className="header-search-input"
                  autoFocus
                />
              </div>

              {/* Results — only shown when there is a query, scrollable */}
              {!!searchQuery.trim() && (
                <div className="header-search-results">

                  {/* ALL RESULTS section */}
                  <div className="header-search-section">
                    <span className="header-search-section-label">ALL RESULTS</span>
                    <button
                      type="button"
                      className="header-search-item"
                      onClick={() => handleSubmitSearch(searchQuery)}
                    >
                      {searchQuery.trim()}
                    </button>
                  </div>

                  {isSearchLoading && <p className="header-search-loading">Loading...</p>}

                  {!isSearchLoading && sections.map((section) => (
                    <div key={section.key} className="header-search-section">
                      <span className="header-search-section-label">{section.label}</span>
                      {section.items.map((item, index) => (
                        <Link
                          key={item.id || index}
                          href={getItemHref(item, section.key)}
                          className="header-search-item"
                          onClick={() => setIsSearchOpen(false)}
                        >
                          {getSearchItemTitle(item, section.key)}
                        </Link>
                      ))}
                    </div>
                  ))}

                  {!isSearchLoading && sections.length === 0 && (
                    <div className="header-search-empty">No Search Results Found!</div>
                  )}

                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
