'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Loader from '@/components/Loader';
import logoAjab from '../../public/logo.svg';
import logoKabir from '../../public/k_logo.svg';
import { formatAboutMenuLabel } from '@/lib/aboutMenus';
import {
  useAbout,
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
  const otherBrandHref = activeTab === 'ajab' ? '/about?tab=kabir' : '/about?tab=ajab';
  const otherBrandLabel =
    activeTab === 'ajab' ? 'KABIR PROJECT' : 'AJAB SHAHAR';

  if (loading) {
    return <Loader />;
  }

  return (
    <section
      className="about-container"
      data-brand={activeTab}
      data-menu={activeMenu || undefined}
    >
      <div className="about-logo-wrap">
        <Image src={logoSrc} alt={logoAlt} className="about-logo" />
      </div>

      {!!activeMenuKeys.length ? (
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

      {error ? <p className="about-state">Error: {error}</p> : null}

      {!error && !activeEntries.length ? (
        <p className="about-state">No content available</p>
      ) : null}

      {!!activeEntries.length ? (
        <div className="about-content-list">
          {activeEntries.map((entry, index) => {
            const menuImageUrl = resolveAboutMenuImageUrl(entry.menu_image);
            const html = entry.visual_content || '';

            return (
              <article
                className="about-content-item"
                key={entry.id || `${activeTab}-${index}`}
              >
                {shouldShowAboutTypeLabel(entry.type_label, activeMenu) ? (
                  <h2 className="about-section-label">{entry.type_label}</h2>
                ) : null}
                {menuImageUrl ? (
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
                {html ? (
                  <div
                    className="about-visual-content"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}

      {/* PDF: bottom brand switch — ABOUT KABIR PROJECT / ABOUT AJAB SHAHAR */}
      <div className="about-brand-switch-footer">
        <Link href={otherBrandHref} className="about-brand-switch">
          <span className="about-brand-switch-prefix">ABOUT </span>
          <span className="about-brand-switch-name">{otherBrandLabel}</span>
        </Link>
      </div>
    </section>
  );
}
