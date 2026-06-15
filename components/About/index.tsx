'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import logoAjab from '../../public/logo.svg';
import logoKabir from '../../public/k_logo.svg';
import { formatAboutMenuLabel } from '@/lib/aboutMenus';
import {
  useAbout,
  isPlaceholderAboutHtml,
  shouldShowAboutTypeLabel,
  resolveAboutMenuImageUrl,
} from '@/hooks/use-about';
import './About.css';

interface AboutProps {
  forcedTab?: 'ajab' | 'kabir';
  forcedMenu?: string;
}

export default function About({ forcedTab, forcedMenu }: AboutProps) {
  const {
    loading,
    error,
    activeTab,
    setActiveTab,
    setActiveMenu,
    activeMenu,
    activeMenuKeys,
    activeEntries,
  } = useAbout();

  useEffect(() => {
    if (forcedTab && forcedTab !== activeTab) {
      setActiveTab(forcedTab);
    }
  }, [forcedTab, activeTab, setActiveTab]);

  useEffect(() => {
    if (!forcedMenu) return;
    const key = forcedMenu.toLowerCase();
    if (activeMenuKeys.map((k) => k.toLowerCase()).includes(key)) {
      const match = activeMenuKeys.find((k) => k.toLowerCase() === key);
      if (match) setActiveMenu(match);
    }
  }, [forcedMenu, activeMenuKeys, setActiveMenu]);

  const logoSrc = activeTab === 'ajab' ? logoAjab : logoKabir;
  const logoAlt = activeTab === 'ajab' ? 'Ajab Shahar' : 'Kabir Project';

  const displayEntries = activeEntries
    .map((entry) => {
      const menuImageUrl = resolveAboutMenuImageUrl(entry.menu_image);
      const showMenuImage = !!menuImageUrl;
      const showVisual =
        !!entry.visual_content && !isPlaceholderAboutHtml(entry.visual_content);

      if (!showMenuImage && !showVisual) return null;

      return { entry, menuImageUrl, showMenuImage, showVisual };
    })
    .filter((row): row is NonNullable<typeof row> => row != null);

  return (
    <section className="about-container" data-brand={activeTab}>
      {/* Logo */}
      <div className="about-logo-wrap">
        <Image src={logoSrc} alt={logoAlt} className="about-logo" />
      </div>

      {/* Section tabs */}
      {!loading && !error && !!activeMenuKeys.length ? (
        <div className="about-toggle-wrap">
          {activeMenuKeys.map((menu) => (
            <button
              type="button"
              key={`${activeTab}-${menu}`}
              onClick={() => setActiveMenu(menu)}
              className={`about-toggle-btn ${activeMenu === menu ? 'active' : ''}`}
            >
              {formatAboutMenuLabel(menu)}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? <p className="about-state">Loading...</p> : null}
      {error ? <p className="about-state">Error: {error}</p> : null}

      {!loading && !error && !displayEntries.length ? (
        <p className="about-state">No content available</p>
      ) : null}

      {!loading && !error && !!displayEntries.length ? (
        <div className="about-content-list">
          {displayEntries.map(({ entry, menuImageUrl, showMenuImage, showVisual }, index) => (
            <article className="about-content-item" key={entry.id || `${activeTab}-${index}`}>
              {shouldShowAboutTypeLabel(entry.type_label, activeMenu) ? (
                <p className="about-section-label">{entry.type_label}</p>
              ) : null}
              {showMenuImage && menuImageUrl ? (
                <figure className="about-menu-image-wrap">
                  <img
                    src={menuImageUrl}
                    alt=""
                    className="about-menu-image"
                    loading="lazy"
                    decoding="async"
                  />
                </figure>
              ) : null}
              {showVisual ? (
                <div
                  className="about-visual-content"
                  dangerouslySetInnerHTML={{ __html: entry.visual_content || '' }}
                />
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
