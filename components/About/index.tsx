'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import logoAjab from '../../public/logo.svg';
import logoKabir from '../../public/k_logo.svg';
import { useAbout } from '@/hooks/use-about';
import './About.css';

/* [Claude] these changes have been recommended by claude —
   - Accepts onSwitchBrand / switchTarget so toggle can live below the logo (per Figma).
   - Toggle text no longer prefixed with "ABOUT" — just shows the target brand name.
   - Removed the meta-count paragraph (was "3 menus"). */

interface AboutProps {
  forcedTab?: 'ajab' | 'kabir';
  forcedMenu?: string;
  onSwitchBrand?: () => void;
  switchTarget?: string;
}

export default function About({ forcedTab, forcedMenu, onSwitchBrand, switchTarget }: AboutProps) {
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

  const formatMenuLabel = (menu: string) => menu.toUpperCase();

  const logoSrc = activeTab === 'ajab' ? logoAjab : logoKabir;
  const logoAlt = activeTab === 'ajab' ? 'Ajab Shahar' : 'Kabir Project';

  return (
    <section className="about-container" data-brand={activeTab}>
      {/* Logo */}
      <div className="about-logo-wrap">
        <Image src={logoSrc} alt={logoAlt} className="about-logo" />
      </div>

      {/* Brand switch link — below logo, right-aligned (Figma: "Kabir Project" at x=1044, y=496) */}
      {onSwitchBrand && switchTarget && (
        <div className="about-brand-switch-wrap">
          <button type="button" className="about-brand-switch" onClick={onSwitchBrand}>
            {switchTarget}
          </button>
        </div>
      )}

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
              {formatMenuLabel(menu)}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? <p className="about-state">Loading...</p> : null}
      {error ? <p className="about-state">Error: {error}</p> : null}

      {!loading && !error && !activeEntries.length ? (
        <p className="about-state">No content available</p>
      ) : null}

      {!loading && !error && !!activeEntries.length ? (
        <div className="about-content-list">
          {activeEntries.map((entry, index) => (
            <article className="about-content-item" key={entry.id || `${activeTab}-${index}`}>
              {entry.type_label ? (
                <p className="about-section-label">{entry.type_label}</p>
              ) : null}
              <div
                className="about-visual-content"
                dangerouslySetInnerHTML={{ __html: entry.visual_content || '' }}
              />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
